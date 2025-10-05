import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './shared/db.js';
import authRoutes from './routes/authRoutes.js';
import podcastRoutes from './routes/podcastRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/podcast', podcastRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'podcast-backend', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'podcast-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });


