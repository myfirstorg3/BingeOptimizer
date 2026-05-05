import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Import routes
import authRoutes from './routes/auth.js';
import mediaRoutes from './routes/media.js';
import collectionsRoutes from './routes/collections.js';
import tierListsRoutes from './routes/tierLists.js';
import userRoutes from './routes/users.js';
import reviewsRoutes from './routes/reviews.js';
import bingeRoutes from './routes/binge.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/tier-lists', tierListsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/binge', bingeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log(`
🚀 Blastoise Backend Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Port: ${config.PORT}
Environment: ${config.NODE_ENV}
Database: ${config.DB_TYPE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
