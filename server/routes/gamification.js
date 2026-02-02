import express from 'express';
import authMiddleware from '../middleware/auth.js';
import UserGamification from '../models/UserGamification.js';
import User from '../models/User.js';
import { Challenge } from '../models/Social.js';

const router = express.Router();

// Get user's gamification data
router.get('/', authMiddleware, async (req, res) => {
  try {
    let gamification = await UserGamification.findOne({ userId: req.user._id });
    
    if (!gamification) {
      // Create new gamification record for user
      gamification = new UserGamification({
        userId: req.user._id
      });
      await gamification.save();
    }
    
    // Generate daily quests if needed
    gamification.generateDailyQuests();
    await gamification.save();
    
    // Calculate XP needed for next level
    const xpForNextLevel = UserGamification.getXpForLevel(gamification.level);
    
    res.json({
      success: true,
      data: {
        level: gamification.level,
        xp: gamification.xp,
        totalXp: gamification.totalXp,
        xpForNextLevel,
        progress: {
          current: gamification.xp,
          total: xpForNextLevel,
          percentage: Math.round((gamification.xp / xpForNextLevel) * 100)
        },
        achievements: gamification.achievements,
        dailyQuests: gamification.dailyQuests,
        streak: gamification.streak,
        stats: gamification.stats
      }
    });
  } catch (error) {
    console.error('Error fetching gamification data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gamification data'
    });
  }
});

// Add XP to user
router.post('/xp', authMiddleware, async (req, res) => {
  try {
    const { amount, action } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XP amount'
      });
    }
    
    let gamification = await UserGamification.findOne({ userId: req.user._id });
    
    if (!gamification) {
      gamification = new UserGamification({
        userId: req.user._id,
        stats: { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 },
        streak: { current: 0, longest: 0, lastActive: null }
      });
    }
    
    // Ensure stats object exists with defaults
    if (!gamification.stats) {
      gamification.stats = { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 };
    }
    
    // Add XP and handle level ups
    const xpResult = await gamification.addXp(amount, action);
    
    // Check for new achievements after adding XP
    const newAchievements = await gamification.checkAchievements();
    
    res.json({
      success: true,
      data: {
        ...xpResult,
        newAchievements,
        action
      }
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add XP'
    });
  }
});

// Complete a quest
router.post('/quest/:questId/complete', authMiddleware, async (req, res) => {
  try {
    const { questId } = req.params;
    
    let gamification = await UserGamification.findOne({ userId: req.user._id });
    
    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification data not found'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the quest
    const quest = gamification.dailyQuests.find(q => {
      const questDate = new Date(q.date);
      questDate.setHours(0, 0, 0, 0);
      return q.questId === questId && questDate.getTime() === today.getTime();
    });
    
    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found or expired'
      });
    }
    
    if (quest.completed) {
      return res.status(400).json({
        success: false,
        message: 'Quest already completed'
      });
    }
    
    // Mark quest as completed and award XP
    quest.completed = true;
    quest.current = quest.target;
    
    await gamification.save();
    
    // Add XP for completing the quest
    const xpResult = await gamification.addXp(quest.reward, `quest_${questId}`);
    
    res.json({
      success: true,
      data: {
        quest: {
          questId: quest.questId,
          name: quest.name,
          reward: quest.reward
        },
        xpResult
      }
    });
  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quest'
    });
  }
});

// Get global leaderboard (top 50 users by totalXp)
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await UserGamification.find()
      .sort({ totalXp: -1 })
      .limit(50)
      .populate('userId', 'username profileImage');
    
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId._id,
      username: entry.userId.username,
      profileImage: entry.userId.profileImage,
      level: entry.level,
      totalXp: entry.totalXp,
      achievements: entry.achievements.length,
      streak: entry.streak.current
    }));
    
    res.json({
      success: true,
      data: formattedLeaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Get all available achievements with user's progress
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    let gamification = await UserGamification.findOne({ userId: req.user._id });
    
    if (!gamification) {
      gamification = new UserGamification({
        userId: req.user._id
      });
      await gamification.save();
    }
    
    const achievementProgress = gamification.getAchievementProgress();
    
    // Group by category
    const groupedAchievements = {
      study: achievementProgress.filter(a => a.category === 'study'),
      streak: achievementProgress.filter(a => a.category === 'streak'),
      test: achievementProgress.filter(a => a.category === 'test'),
      game: achievementProgress.filter(a => a.category === 'game')
    };
    
    const unlockedAchievements = achievementProgress.filter(a => a.unlocked);
    const totalPoints = unlockedAchievements.reduce((sum, a) => sum + (a.reward || 0), 0);
    
    const stats = {
      total: achievementProgress.length,
      unlocked: unlockedAchievements.length,
      locked: achievementProgress.filter(a => !a.unlocked).length,
      points: totalPoints
    };
    
    res.json({
      success: true,
      data: {
        achievements: achievementProgress,
        grouped: groupedAchievements,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// Update stats and check for achievements
router.post('/stats', authMiddleware, async (req, res) => {
  try {
    const { 
      cardsStudied = 0, 
      testsPassed = 0, 
      gamesWon = 0, 
      perfectScore = false 
    } = req.body;
    
    let gamification = await UserGamification.findOne({ userId: req.user._id });
    
    if (!gamification) {
      gamification = new UserGamification({
        userId: req.user._id,
        stats: { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 },
        streak: { current: 0, longest: 0, lastActive: null }
      });
    }
    
    // Ensure stats object exists with default values
    if (!gamification.stats) {
      gamification.stats = { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 };
    }
    // Ensure individual fields have values
    if (typeof gamification.stats.cardsStudied !== 'number') gamification.stats.cardsStudied = 0;
    if (typeof gamification.stats.testsPassed !== 'number') gamification.stats.testsPassed = 0;
    if (typeof gamification.stats.gamesWon !== 'number') gamification.stats.gamesWon = 0;
    if (typeof gamification.stats.perfectScores !== 'number') gamification.stats.perfectScores = 0;
    
    // Update stats
    gamification.stats.cardsStudied += cardsStudied;
    gamification.stats.testsPassed += testsPassed;
    gamification.stats.gamesWon += gamesWon;
    if (perfectScore) {
      gamification.stats.perfectScores += 1;
    }
    
    // Update streak
    await gamification.updateStreak();
    
    // Check for new achievements
    const newAchievements = await gamification.checkAchievements();
    
    // Update challenge progress for active challenges
    let challengeUpdates = [];
    try {
      const activeChallenges = await Challenge.find({
        'participants.user': req.user._id,
        endDate: { $gte: new Date() }
      });
      
      for (const challenge of activeChallenges) {
        const participant = challenge.participants.find(
          p => p.user.toString() === req.user._id.toString()
        );
        if (!participant) continue;
        
        let progressIncrement = 0;
        switch (challenge.type) {
          case 'cards_studied':
            progressIncrement = cardsStudied;
            break;
          case 'tests_passed':
            progressIncrement = testsPassed;
            break;
          case 'xp_earned':
            progressIncrement = cardsStudied * 5; // Approximate XP per card
            break;
          case 'streak_days':
            progressIncrement = gamification.streak.current;
            break;
        }
        
        if (progressIncrement > 0) {
          participant.progress = Math.min(participant.progress + progressIncrement, challenge.target);
          await challenge.save();
          challengeUpdates.push({
            challengeId: challenge._id,
            title: challenge.title,
            progress: participant.progress,
            target: challenge.target
          });
        }
      }
    } catch (challengeError) {
      console.error('Error updating challenge progress:', challengeError);
    }
    
    // Update quest progress
    let questResults = { xpEarned: 0, completedQuests: [] };
    
    if (cardsStudied > 0) {
      const studyQuestResult = await gamification.updateQuestProgress('study_cards', cardsStudied);
      questResults.xpEarned += studyQuestResult.xpEarned;
      questResults.completedQuests.push(...studyQuestResult.completedQuests);
    }
    
    if (testsPassed > 0) {
      const testQuestResult = await gamification.updateQuestProgress('pass_test', testsPassed);
      questResults.xpEarned += testQuestResult.xpEarned;
      questResults.completedQuests.push(...testQuestResult.completedQuests);
    }
    
    if (gamesWon > 0) {
      const gameQuestResult = await gamification.updateQuestProgress('win_game', gamesWon);
      questResults.xpEarned += gameQuestResult.xpEarned;
      questResults.completedQuests.push(...gameQuestResult.completedQuests);
    }
    
    if (perfectScore) {
      const perfectQuestResult = await gamification.updateQuestProgress('perfect_score', 1);
      questResults.xpEarned += perfectQuestResult.xpEarned;
      questResults.completedQuests.push(...perfectQuestResult.completedQuests);
    }
    
    // Add XP from completed quests
    let xpResult = null;
    if (questResults.xpEarned > 0) {
      xpResult = await gamification.addXp(questResults.xpEarned, 'quest_completion');
    }
    
    await gamification.save();
    
    res.json({
      success: true,
      data: {
        stats: gamification.stats,
        streak: gamification.streak,
        newAchievements,
        questResults,
        xpResult,
        challengeUpdates
      }
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stats'
    });
  }
});

// Reset daily quests (for testing or manual reset)
router.post('/quests/reset', authMiddleware, async (req, res) => {
  try {
    let gamification = await UserGamification.findOne({ userId: req.user._id });
    
    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification data not found'
      });
    }
    
    gamification.generateDailyQuests();
    await gamification.save();
    
    res.json({
      success: true,
      data: {
        dailyQuests: gamification.dailyQuests
      }
    });
  } catch (error) {
    console.error('Error resetting quests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset quests'
    });
  }
});

export default router;
