import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multer from 'multer';

const prisma = new PrismaClient();

// ─── Avatar Upload Config ────────────────────────────────────────────────────
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, PNG, GIF, WEBP, HEIC)'));
    }
  },
});

// ─── Get Current User Profile ─────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        isPublic: true,
        showOnlineStatus: true,
        createdAt: true,
        avatars: {
          where: { isDefault: true },
          take: 1,
          select: { id: true, mimeType: true }
        },
        preferences: {
          select: { emailNotifications: true, pushNotifications: true }
        },
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { username, email, firstName, lastName, bio, isPublic, showOnlineStatus } = req.body;

    // Check username uniqueness if changing
    if (username && username !== req.user.username) {
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists) return res.status(400).json({ message: 'Username already taken' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username !== undefined && { username }),
        ...(email !== undefined && { email }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(isPublic !== undefined && { isPublic: isPublic === 'true' || isPublic === true }),
        ...(showOnlineStatus !== undefined && { showOnlineStatus: showOnlineStatus === 'true' || showOnlineStatus === true }),
      },
      select: {
        id: true, username: true, email: true, firstName: true,
        lastName: true, bio: true, avatarUrl: true, isPublic: true,
        showOnlineStatus: true
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Upload Avatar ────────────────────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Clear old default avatars
    await prisma.userAvatar.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false }
    });

    // Store new avatar
    const avatar = await prisma.userAvatar.create({
      data: {
        userId: req.user.id,
        avatarData: req.file.buffer,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        isDefault: true,
      }
    });

    // Update user avatarUrl to point to our serve endpoint
    const avatarUrl = `/api/users/avatar/${avatar.id}`;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl }
    });

    res.json({ avatarUrl, avatarId: avatar.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Serve Avatar Image ───────────────────────────────────────────────────────
export const serveAvatar = async (req, res) => {
  try {
    const avatar = await prisma.userAvatar.findUnique({
      where: { id: req.params.avatarId }
    });
    if (!avatar) return res.status(404).json({ message: 'Avatar not found' });
    res.set('Content-Type', avatar.mimeType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(avatar.avatarData);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both fields are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: hashed }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Search Profiles ──────────────────────────────────────────────────────────
export const searchProfiles = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json([]);

    const results = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
        ],
        isPublic: true,
      },
      select: {
        id: true, username: true, firstName: true, lastName: true,
        bio: true, avatarUrl: true, createdAt: true,
        avatars: {
          where: { isDefault: true },
          take: 1,
          select: { id: true }
        }
      },
      take: 20,
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Get User By ID (public profile) ─────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true, username: true, firstName: true, lastName: true,
        bio: true, avatarUrl: true, isPublic: true, createdAt: true,
        avatars: {
          where: { isDefault: true },
          take: 1,
          select: { id: true }
        }
      }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isPublic) return res.status(403).json({ message: 'Profile is private' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Get User Public Collections + TierLists ──────────────────────────────────
export const getUserPublicData = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPublic: true, username: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isPublic) return res.status(403).json({ message: 'Profile is private' });

    const [collections, tierLists] = await Promise.all([
      prisma.collection.findMany({
        where: { userId, isPublic: true },
        orderBy: { createdAt: 'asc' },
        include: {
          items: {
            include: {
              media: { select: { id: true, title: true, posterUrl: true, type: true } }
            },
            take: 8
          }
        }
      }),
      prisma.tierList.findMany({
        where: { userId, isPublic: true },
        orderBy: { createdAt: 'asc' },
        include: {
          items: {
            include: {
              media: { select: { id: true, title: true, posterUrl: true, type: true } }
            },
            orderBy: { position: 'asc' },
            take: 8
          }
        }
      })
    ]);

    res.json({ collections, tierLists });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Friends System ───────────────────────────────────────────────────────────

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (targetUserId === req.user.id)
      return res.status(400).json({ message: 'Cannot friend yourself' });

    // Check if already exists
    const existing = await prisma.userFriendship.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId: targetUserId },
          { userId: targetUserId, friendId: req.user.id }
        ]
      }
    });
    if (existing) {
      return res.status(400).json({ message: 'Friend request already exists', status: existing.status });
    }

    const friendship = await prisma.userFriendship.create({
      data: { userId: req.user.id, friendId: targetUserId, status: 'pending' }
    });
    res.status(201).json(friendship);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Accept / reject friend request
export const respondFriendRequest = async (req, res) => {
  try {
    const { friendshipId, action } = req.body; // action: 'accept' | 'reject'
    const friendship = await prisma.userFriendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) return res.status(404).json({ message: 'Friend request not found' });
    if (friendship.friendId !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    if (action === 'accept') {
      const updated = await prisma.userFriendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' }
      });
      return res.json(updated);
    } else {
      await prisma.userFriendship.delete({ where: { id: friendshipId } });
      return res.json({ message: 'Friend request rejected' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove a friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    await prisma.userFriendship.deleteMany({
      where: {
        OR: [
          { userId: req.user.id, friendId },
          { userId: friendId, friendId: req.user.id }
        ]
      }
    });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get friends list (accepted) + incoming requests
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    // Accepted friendships where user is either side
    const accepted = await prisma.userFriendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ userId }, { friendId: userId }]
      },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true, avatars: { where: { isDefault: true }, take: 1, select: { id: true } } } },
        friend: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true, avatars: { where: { isDefault: true }, take: 1, select: { id: true } } } }
      }
    });

    // Incoming pending requests (user is the receiver)
    const incoming = await prisma.userFriendship.findMany({
      where: { friendId: userId, status: 'pending' },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true, avatars: { where: { isDefault: true }, take: 1, select: { id: true } } } }
      }
    });

    // Outgoing pending requests (user is the sender)
    const outgoing = await prisma.userFriendship.findMany({
      where: { userId, status: 'pending' },
      include: {
        friend: { select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true, avatars: { where: { isDefault: true }, take: 1, select: { id: true } } } }
      }
    });

    // Normalize accepted: return the OTHER user in the friendship
    const friends = accepted.map(f => ({
      friendshipId: f.id,
      since: f.updatedAt,
      user: f.userId === userId ? f.friend : f.user
    }));

    res.json({ friends, incoming, outgoing });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
