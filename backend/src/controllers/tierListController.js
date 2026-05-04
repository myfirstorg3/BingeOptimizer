import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tierlists — all tier lists for the logged-in user
export const getTierLists = async (req, res) => {
  try {
    const tierLists = await prisma.tierList.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        collection: { select: { id: true, name: true } },
        items: { include: { media: true } }
      }
    });
    res.json(tierLists);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/tierlists/:id
export const getTierList = async (req, res) => {
  try {
    const tl = await prisma.tierList.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        collection: { select: { id: true, name: true } },
        items: { include: { media: true }, orderBy: { position: 'asc' } }
      }
    });
    if (!tl) return res.status(404).json({ message: 'Tier list not found' });
    res.json(tl);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/tierlists — create a new tier list (optionally from a collection)
export const createTierList = async (req, res) => {
  try {
    const { title, description, collectionId, isPublic } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const tl = await prisma.tierList.create({
      data: {
        userId: req.user.id,
        title,
        description: description || null,
        collectionId: collectionId || null,
        isPublic: isPublic || false
      }
    });

    // If based on a collection, seed with all items from that collection (in unranked)
    if (collectionId) {
      const coll = await prisma.collection.findFirst({
        where: { id: collectionId, userId: req.user.id },
        include: { items: true }
      });
      if (coll?.items?.length > 0) {
        await prisma.tierListItem.createMany({
          data: coll.items.map((item, idx) => ({
            tierListId: tl.id,
            mediaId: item.mediaId,
            tier: 'unranked',
            position: idx
          }))
        });
      }
    }

    // Fetch the full created tier list
    const full = await prisma.tierList.findUnique({
      where: { id: tl.id },
      include: { collection: { select: { id: true, name: true } }, items: { include: { media: true } } }
    });

    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/tierlists/:id — update title/description
export const updateTierList = async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;
    const tl = await prisma.tierList.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { title, description, isPublic }
    });
    res.json({ updated: tl.count > 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/tierlists/:id
export const deleteTierList = async (req, res) => {
  try {
    await prisma.tierList.deleteMany({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/tierlists/:id/items/add — add a single media item to a tier list
export const addItemToTierList = async (req, res) => {
  try {
    const { mediaId } = req.body;
    const tlId = req.params.id;
    if (!mediaId) return res.status(400).json({ message: 'mediaId is required' });

    const tl = await prisma.tierList.findFirst({ where: { id: tlId, userId: req.user.id } });
    if (!tl) return res.status(404).json({ message: 'Tier list not found' });

    // Get current max position
    const maxPos = await prisma.tierListItem.count({ where: { tierListId: tlId } });

    // Upsert (don't add duplicates)
    const existing = await prisma.tierListItem.findFirst({ where: { tierListId: tlId, mediaId } });
    if (existing) return res.status(200).json({ item: existing, duplicate: true });

    const item = await prisma.tierListItem.create({
      data: { tierListId: tlId, mediaId, tier: 'unranked', position: maxPos },
      include: { media: true }
    });

    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const saveTierItems = async (req, res) => {
  try {
    const { items } = req.body; // [{ mediaId, tier, position }]
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items must be an array' });

    const tlId = req.params.id;

    // Verify ownership
    const tl = await prisma.tierList.findFirst({ where: { id: tlId, userId: req.user.id } });
    if (!tl) return res.status(404).json({ message: 'Tier list not found' });

    // Delete all existing items, then recreate
    await prisma.tierListItem.deleteMany({ where: { tierListId: tlId } });
    await prisma.tierListItem.createMany({
      data: items.map((item, idx) => ({
        tierListId: tlId,
        mediaId: item.mediaId,
        tier: item.tier || 'unranked',
        position: item.position ?? idx
      }))
    });

    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
