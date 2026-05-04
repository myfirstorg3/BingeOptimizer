import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATUS_ORDER = { watching: 0, unwatched: 1, completed: 2 };

function sortItems(items) {
  return [...items].sort((a, b) => {
    const ao = STATUS_ORDER[a.watchStatus ?? 'unwatched'] ?? 1;
    const bo = STATUS_ORDER[b.watchStatus ?? 'unwatched'] ?? 1;
    if (ao !== bo) return ao - bo;
    return new Date(b.addedAt) - new Date(a.addedAt);
  });
}

// GET /api/collections — all user collections with sorted items
export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            media: { include: { reviewSummary: true } }
          },
        }
      }
    });

    // Include watchStatus from UserMediaStatus
    const allMediaIds = collections.flatMap(c => c.items.map(i => i.mediaId));
    const statuses = allMediaIds.length > 0
      ? await prisma.userMediaStatus.findMany({
          where: { userId: req.user.id, mediaId: { in: allMediaIds } },
          select: { mediaId: true, watchStatus: true, personalRating: true }
        })
      : [];
    const statusMap = Object.fromEntries(statuses.map(s => [s.mediaId, s]));

    // Attach status and sort
    const enriched = collections.map(coll => ({
      ...coll,
      items: sortItems(
        coll.items.map(item => ({
          ...item,
          watchStatus: statusMap[item.mediaId]?.watchStatus ?? 'unwatched',
          personalRating: statusMap[item.mediaId]?.personalRating ?? null,
        }))
      )
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/collections/:id
export const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { name, description, isPublic } = req.body;
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: req.user.id }
    });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/collections
export const createCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    if (!name) return res.status(400).json({ message: 'Collection name is required' });
    const collection = await prisma.collection.create({
      data: { userId: req.user.id, name, description, isPublic: isPublic || false }
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/collections/:collId/items
export const addItemToCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { mediaId } = req.body;
    if (!mediaId) return res.status(400).json({ message: 'mediaId is required' });

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: req.user.id }
    });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const item = await prisma.collectionItem.upsert({
      where: { collectionId_mediaId: { collectionId, mediaId } },
      update: {},
      create: { collectionId, mediaId }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/collections/:collId/items/:mediaId/status — update watch status
export const updateItemStatus = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { watchStatus } = req.body;

    const valid = ['unwatched', 'watching', 'completed'];
    if (!valid.includes(watchStatus)) {
      return res.status(400).json({ message: 'Invalid watchStatus' });
    }

    // Upsert into UserMediaStatus
    const status = await prisma.userMediaStatus.upsert({
      where: { userId_mediaId: { userId: req.user.id, mediaId } },
      update: { watchStatus, lastWatchedAt: watchStatus !== 'unwatched' ? new Date() : undefined },
      create: { userId: req.user.id, mediaId, watchStatus }
    });

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/collections/:collId/items/:mediaId
export const removeItemFromCollection = async (req, res) => {
  try {
    const { collectionId, mediaId } = req.params;

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: req.user.id }
    });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    await prisma.collectionItem.deleteMany({
      where: { collectionId, mediaId }
    });
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
