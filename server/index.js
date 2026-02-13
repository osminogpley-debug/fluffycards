import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Импортируй ТОЛЬКО существующие роуты
import authRoutes from './routes/auth.js';
import flashcardRoutes from './routes/flashcards.js';
import uploadRoutes from './routes/upload.js';
import statsRoutes from './routes/stats.js';
import aiRoutes from './routes/ai.js';
import folderRoutes from './routes/folders.js';
import gamificationRoutes from './routes/gamification.js';
import socialRoutes from './routes/social.js';
import liveRoutes from './routes/live.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';
import chatRoutes from './routes/chat.js';
import translateRoutes from './routes/translate.js';
import attendanceRoutes from './routes/attendance.js';
import draftRoutes from './routes/drafts.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sets', flashcardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/drafts', draftRoutes);

// Static files
app.use('/uploads', express.static('/var/www/fluffycards/uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fluffycards')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
