import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import errorHandler from './utils/errorHandler.js';
import authRoutes from './routes/auth.js';
import flashcardRoutes from './routes/flashcards.js';
import statsRoutes from './routes/stats.js';
import aiRoutes from './routes/ai.js';
import folderRoutes from './routes/folders.js';
import gamificationRoutes from './routes/gamification.js';
import socialRoutes from './routes/social.js';
import liveRoutes from './routes/live.js';
import adminRoutes from './routes/admin.js';
import authMiddleware from './middleware/auth.js';

dotenv.config();
const app = express();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fluffy-secret-key';

// Middleware
// CORS - Allow all origins in development for LAN play
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and any origin for LAN play
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sets', flashcardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FluffyCards server is running 🚀' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// JWT helper functions
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://192.168.3.20:${PORT}`);
});

export default app;
