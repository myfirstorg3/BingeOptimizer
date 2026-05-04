import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user collections
export const getCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.user.id },
      include: { items: true }
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
    
    if (!name) {
      return res.status(400).json({ message: 'Collection name is required' });
    }

    const collection = await prisma.collection.create({
      data: {
        userId: req.user.id,
        name,
        description,
        isPublic: isPublic || false
      }
    });
    
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
