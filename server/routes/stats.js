import express from 'express';
import authMiddleware from '../middleware/auth.js';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// Record study session
router.post('/session', authMiddleware, async (req, res) => {
  try {
    const { mode, cardsCount, correctCount, timeSpent } = req.body;

    const stats = await UserStats.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: {
          setsStudied: 1,
          cardsMastered: correctCount,
        },
        $push: {
          sessionHistory: {
            date: new Date(),
            mode,
            cardsAttempted: cardsCount,
            correctAnswers: correctCount,
            timeSpent
          }
        }
      },
      { upsert: true, new: true }
    );

    // Calculate new accuracy (% correct over total attempts)
    const accuracyUpdate = await UserStats.aggregate([
      { $match: { userId: req.user._id } },
      {
        $project: {
          totalCorrect: { $sum: '$sessionHistory.correctAnswers' },
          totalAttempted: { $sum: '$sessionHistory.cardsAttempted' }
        }
      }
    ]);

    const totals = accuracyUpdate[0] || { totalCorrect: 0, totalAttempted: 0 };
    const accuracy = totals.totalAttempted > 0
      ? (totals.totalCorrect / totals.totalAttempted) * 100
      : 0;

    await UserStats.updateOne(
      { userId: req.user._id },
      { $set: { accuracy } }
    );

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to record session'
    });
  }
});

// Get user dashboard stats
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    console.log('[STATS] Getting dashboard stats for user:', req.user._id);
    
    // Get both UserStats and Gamification data
    const [stats, gamification] = await Promise.all([
      UserStats.findOne({ userId: req.user._id }),
      (await import('../models/UserGamification.js')).default.findOne({ userId: req.user._id })
    ]);

    // Use gamification streak if available
    const streakDays = gamification?.streak?.current || stats?.streakDays || 0;
    
    // Use gamification cards studied if UserStats is empty
    const cardsMastered = stats?.cardsMastered || gamification?.stats?.cardsStudied || 0;
    
    if (!stats) {
      console.log('[STATS] No stats found, returning gamification defaults');
      return res.json({
        setsStudied: 0,
        cardsMastered: cardsMastered,
        streakDays: streakDays,
        accuracy: 0,
        sessionHistory: []
      });
    }

    console.log('[STATS] Found stats:', stats);
    res.json({
      setsStudied: stats.setsStudied || 0,
      cardsMastered: cardsMastered,
      streakDays: streakDays,
      accuracy: Math.round(stats.accuracy || 0),
      sessionHistory: stats.sessionHistory || []
    });
  } catch (error) {
    console.error('[STATS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

export default router;
