import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user collections with full media details
export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            media: true  // include full Media record inside each CollectionItem
          },
          orderBy: { addedAt: 'desc' }
        }
      }
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new collection
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

// Add media item to an existing collection
export const addItemToCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { mediaId } = req.body;
    if (!mediaId) return res.status(400).json({ message: 'mediaId is required' });

    // Ensure user owns collection
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
