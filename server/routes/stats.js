import express from 'express';
import authMiddleware from '../middleware/auth.js';
import UserStats from '../models/UserStats.js';
import User from '../models/User.js';
import { Friendship } from '../models/Social.js';

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

    const UserGamification = (await import('../models/UserGamification.js')).default;

    // Get both UserStats and Gamification data
    const [stats, gamification] = await Promise.all([
      UserStats.findOne({ userId: req.user._id }),
      UserGamification.findOne({ userId: req.user._id })
    ]);

    // Use gamification streak if available
    const streakDays = gamification?.streak?.current || stats?.streakDays || 0;
    
    // Use gamification cards studied if UserStats is empty
    const cardsMastered = stats?.cardsMastered || gamification?.stats?.cardsStudied || 0;
    
    let students = [];
    if (req.user.role === 'teacher') {
      const friendships = await Friendship.find({ users: req.user._id })
        .populate('users', 'username email role');

      const studentUsers = friendships
        .map(friendship => friendship.users.find(
          user => user._id.toString() !== req.user._id.toString() && user.role === 'student'
        ))
        .filter(Boolean);

      const uniqueStudentMap = new Map();
      studentUsers.forEach((user) => {
        uniqueStudentMap.set(user._id.toString(), user);
      });

      const studentIds = Array.from(uniqueStudentMap.keys());
      if (studentIds.length > 0) {
        const [studentStats, studentGamification] = await Promise.all([
          UserStats.find({ userId: { $in: studentIds } }),
          UserGamification.find({ userId: { $in: studentIds } })
        ]);

        const statsByUserId = new Map(
          studentStats.map((stat) => [stat.userId.toString(), stat])
        );
        const gamByUserId = new Map(
          studentGamification.map((gam) => [gam.userId.toString(), gam])
        );

        students = studentIds.map((id) => {
          const user = uniqueStudentMap.get(id);
          const studentStat = statsByUserId.get(id);
          const studentGam = gamByUserId.get(id);
          const cardsStudied = studentStat?.cardsMastered || studentGam?.stats?.cardsStudied || 0;
          const accuracy = studentStat?.accuracy || 0;
          const streak = studentGam?.streak?.current || studentStat?.streakDays || 0;

          return {
            id: user._id,
            name: user.username,
            email: user.email,
            setsStudied: studentStat?.setsStudied || 0,
            cardsMastered: cardsStudied,
            accuracy: Math.round(accuracy),
            streakDays: streak
          };
        });
      }
    }

    if (!stats) {
      console.log('[STATS] No stats found, returning gamification defaults');
      return res.json({
        setsStudied: 0,
        cardsMastered: cardsMastered,
        streakDays: streakDays,
        accuracy: 0,
        sessionHistory: [],
        ...(req.user.role === 'teacher' ? { students } : {})
      });
    }

    console.log('[STATS] Found stats:', stats);
    res.json({
      setsStudied: stats.setsStudied || 0,
      cardsMastered: cardsMastered,
      streakDays: streakDays,
      accuracy: Math.round(stats.accuracy || 0),
      sessionHistory: stats.sessionHistory || [],
      ...(req.user.role === 'teacher' ? { students } : {})
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
