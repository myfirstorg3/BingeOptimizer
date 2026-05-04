import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

import authRoutes from './routes/authRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Blastoise Backend is running!' });
});

app.get('/', (req, res) => {
  res.send('Blastoise API is running! Access the frontend at http://localhost:3000');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
