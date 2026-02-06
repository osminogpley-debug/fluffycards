import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  achievementId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏆'
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['study', 'streak', 'test', 'game'],
    default: 'study'
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  reward: {
    type: Number,
    default: 0
  }
}, { _id: false });

const dailyQuestSchema = new mongoose.Schema({
  questId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  reward: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['study_cards', 'pass_test', 'win_game', 'perfect_score'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const weeklyExamSchema = new mongoose.Schema({
  examId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  reward: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['study_cards', 'pass_test', 'win_game', 'perfect_score'],
    required: true
  },
  weekStart: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const streakSchema = new mongoose.Schema({
  current: {
    type: Number,
    default: 0
  },
  longest: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: null
  }
}, { _id: false });

const statsSchema = new mongoose.Schema({
  cardsStudied: {
    type: Number,
    default: 0
  },
  testsPassed: {
    type: Number,
    default: 0
  },
  gamesWon: {
    type: Number,
    default: 0
  },
  perfectScores: {
    type: Number,
    default: 0
  }
}, { _id: false, minimize: false });

const userGamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  totalXp: {
    type: Number,
    default: 0,
    min: 0
  },
  achievements: [achievementSchema],
  dailyQuests: [dailyQuestSchema],
  weeklyExam: {
    type: weeklyExamSchema,
    default: null
  },
  streak: {
    type: streakSchema,
    default: () => ({ current: 0, longest: 0, lastActive: null })
  },
  stats: {
    type: statsSchema,
    default: () => ({ cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 })
  }
}, {
  timestamps: true
});

// Static method to get XP required for next level
userGamificationSchema.statics.getXpForLevel = function(level) {
  if (level <= 10) return 100;
  if (level <= 20) return 200;
  if (level <= 50) return 500;
  return 1000;
};

// Method to add XP and handle level ups
userGamificationSchema.methods.addXp = async function(amount, action) {
  this.xp += amount;
  this.totalXp += amount;
  
  let leveledUp = false;
  let levelsGained = 0;
  
  // Check for level up
  while (this.xp >= this.constructor.getXpForLevel(this.level)) {
    this.xp -= this.constructor.getXpForLevel(this.level);
    this.level += 1;
    leveledUp = true;
    levelsGained += 1;
  }
  
  await this.save();
  
  return {
    leveledUp,
    levelsGained,
    newLevel: this.level,
    currentXp: this.xp,
    xpForNextLevel: this.constructor.getXpForLevel(this.level),
    totalXp: this.totalXp
  };
};

// Method to check and award achievements
userGamificationSchema.methods.checkAchievements = async function() {
  const newAchievements = [];
  const unlockedIds = this.achievements.map(a => a.achievementId);
  
  // Ensure stats and streak exist
  if (!this.stats) {
    this.stats = { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 };
  }
  if (!this.streak) {
    this.streak = { current: 0, longest: 0, lastActive: null };
  }
  
  // Define all achievements with rarity and reward
  const allAchievements = [
    {
      id: 'first_steps',
      name: 'Первые шаги',
      description: 'Study 10 cards',
      icon: '👣',
      category: 'study',
      rarity: 'common',
      reward: 50,
      condition: () => (this.stats?.cardsStudied || 0) >= 10
    },
    {
      id: 'getting_started',
      name: 'Начало пути',
      description: 'Study 50 cards',
      icon: '🚀',
      category: 'study',
      rarity: 'common',
      reward: 100,
      condition: () => (this.stats?.cardsStudied || 0) >= 50
    },
    {
      id: 'card_master',
      name: 'Мастер карточек',
      description: 'Study 100 cards',
      icon: '🃏',
      category: 'study',
      rarity: 'rare',
      reward: 200,
      condition: () => (this.stats?.cardsStudied || 0) >= 100
    },
    {
      id: 'expert',
      name: 'Эксперт',
      description: 'Study 1000 cards',
      icon: '📚',
      category: 'study',
      rarity: 'epic',
      reward: 500,
      condition: () => (this.stats?.cardsStudied || 0) >= 1000
    },
    {
      id: 'week_warrior',
      name: 'Марафонец',
      description: '7 day streak',
      icon: '🔥',
      category: 'streak',
      rarity: 'rare',
      reward: 150,
      condition: () => (this.streak?.current || 0) >= 7
    },
    {
      id: 'month_master',
      name: 'Мастер месяца',
      description: '30 day streak',
      icon: '📅',
      category: 'streak',
      rarity: 'epic',
      reward: 500,
      condition: () => (this.streak?.current || 0) >= 30
    },
    {
      id: 'test_rookie',
      name: 'Новичок тестов',
      description: 'Pass 5 tests',
      icon: '📝',
      category: 'test',
      rarity: 'common',
      reward: 100,
      condition: () => (this.stats?.testsPassed || 0) >= 5
    },
    {
      id: 'test_champion',
      name: 'Чемпион тестов',
      description: 'Pass 50 tests',
      icon: '🏅',
      category: 'test',
      rarity: 'epic',
      reward: 500,
      condition: () => (this.stats?.testsPassed || 0) >= 50
    },
    {
      id: 'game_winner',
      name: 'Победитель',
      description: 'Win 10 games',
      icon: '🎮',
      category: 'game',
      rarity: 'epic',
      reward: 300,
      condition: () => (this.stats?.gamesWon || 0) >= 10
    },
    {
      id: 'perfectionist',
      name: 'Перфекционист',
      description: 'Get 100% on a test',
      icon: '💎',
      category: 'test',
      rarity: 'legendary',
      reward: 1000,
      condition: () => (this.stats?.perfectScores || 0) >= 1
    }
  ];
  
  // Check each achievement
  for (const ach of allAchievements) {
    if (!unlockedIds.includes(ach.id) && ach.condition()) {
      this.achievements.push({
        achievementId: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        rarity: ach.rarity,
        reward: ach.reward,
        unlockedAt: new Date()
      });
      newAchievements.push(ach);
    }
  }
  
  if (newAchievements.length > 0) {
    await this.save();
  }
  
  return newAchievements;
};

// Method to generate daily quests
userGamificationSchema.methods.generateDailyQuests = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if we already have quests for today
  const hasTodayQuests = this.dailyQuests && this.dailyQuests.length > 0 && 
    this.dailyQuests.some(quest => {
      const questDate = new Date(quest.date);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === today.getTime();
    });
  
  // If we already have today's quests, keep them
  if (hasTodayQuests) {
    // Remove any old quests that are not from today
    this.dailyQuests = this.dailyQuests.filter(quest => {
      const questDate = new Date(quest.date);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === today.getTime();
    });
    return this.dailyQuests;
  }
  
  // Reset daily quests with new random ones for today
  const questPool = [
    {
      questId: 'study_10',
      name: '📚 Изучить 10 карточек',
      description: 'Изучите 10 карточек сегодня',
      target: 10,
      reward: 30,
      type: 'study_cards'
    },
    {
      questId: 'study_20',
      name: '📚 Изучить 20 карточек',
      description: 'Изучите 20 карточек сегодня',
      target: 20,
      reward: 50,
      type: 'study_cards'
    },
    {
      questId: 'study_40',
      name: '📚 Изучить 40 карточек',
      description: 'Изучите 40 карточек сегодня',
      target: 40,
      reward: 90,
      type: 'study_cards'
    },
    {
      questId: 'pass_test',
      name: '📝 Пройти тест',
      description: 'Успешно пройдите тест',
      target: 1,
      reward: 100,
      type: 'pass_test'
    },
    {
      questId: 'win_game',
      name: '🎮 Выиграть в игру',
      description: 'Победите в любой игровой режим',
      target: 1,
      reward: 75,
      type: 'win_game'
    },
    {
      questId: 'perfect_score',
      name: '💎 Идеальный результат',
      description: 'Наберите 90% или выше на тесте',
      target: 1,
      reward: 150,
      type: 'perfect_score'
    }
  ];

  const picked = questPool.sort(() => 0.5 - Math.random()).slice(0, 3);
  this.dailyQuests = picked.map(q => ({
    ...q,
    current: 0,
    completed: false,
    date: today
  }));
  
  return this.dailyQuests;
};

// Method to generate weekly exam
userGamificationSchema.methods.generateWeeklyExam = function() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - (day - 1));

  const hasCurrentWeekExam = this.weeklyExam && this.weeklyExam.weekStart &&
    new Date(this.weeklyExam.weekStart).getTime() === weekStart.getTime();

  if (hasCurrentWeekExam) {
    return this.weeklyExam;
  }

  const weeklyPool = [
    {
      examId: 'weekly_tests_3',
      name: '📅 Еженедельный экзамен',
      description: 'Пройдите 3 теста на этой неделе',
      target: 3,
      reward: 300,
      type: 'pass_test'
    },
    {
      examId: 'weekly_cards_100',
      name: '📅 Еженедельный экзамен',
      description: 'Изучите 100 карточек на этой неделе',
      target: 100,
      reward: 350,
      type: 'study_cards'
    },
    {
      examId: 'weekly_perfect_2',
      name: '📅 Еженедельный экзамен',
      description: 'Сделайте 2 идеальных теста (90%+)',
      target: 2,
      reward: 400,
      type: 'perfect_score'
    }
  ];

  const pick = weeklyPool[Math.floor(Math.random() * weeklyPool.length)];

  this.weeklyExam = {
    ...pick,
    current: 0,
    completed: false,
    weekStart
  };

  return this.weeklyExam;
};

// Method to update quest progress
userGamificationSchema.methods.updateQuestProgress = async function(type, amount = 1) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let xpEarned = 0;
  let completedQuests = [];
  
  for (let quest of this.dailyQuests) {
    const questDate = new Date(quest.date);
    questDate.setHours(0, 0, 0, 0);
    
    // Only update quests from today that aren't completed
    if (questDate.getTime() === today.getTime() && !quest.completed && quest.type === type) {
      quest.current = Math.min(quest.current + amount, quest.target);
      
      if (quest.current >= quest.target) {
        quest.completed = true;
        xpEarned += quest.reward;
        completedQuests.push({
          questId: quest.questId,
          name: quest.name,
          reward: quest.reward
        });
      }
    }
  }
  
  await this.save();
  
  return {
    xpEarned,
    completedQuests
  };
};

// Method to update weekly exam progress
userGamificationSchema.methods.updateWeeklyExamProgress = async function(type, amount = 1) {
  if (!this.weeklyExam) return { xpEarned: 0, completedExam: null };

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - (day - 1));

  const examWeekStart = new Date(this.weeklyExam.weekStart);
  examWeekStart.setHours(0, 0, 0, 0);

  if (examWeekStart.getTime() !== weekStart.getTime()) {
    return { xpEarned: 0, completedExam: null };
  }

  if (this.weeklyExam.completed || this.weeklyExam.type !== type) {
    return { xpEarned: 0, completedExam: null };
  }

  this.weeklyExam.current = Math.min(this.weeklyExam.current + amount, this.weeklyExam.target);
  if (this.weeklyExam.current >= this.weeklyExam.target) {
    this.weeklyExam.completed = true;
    return { xpEarned: this.weeklyExam.reward, completedExam: this.weeklyExam };
  }

  return { xpEarned: 0, completedExam: null };
};

// Method to update streak
userGamificationSchema.methods.updateStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = this.streak.lastActive ? new Date(this.streak.lastActive) : null;
  
  if (!lastActive) {
    // First activity ever
    this.streak.current = 1;
    this.streak.longest = 1;
    this.streak.lastActive = today;
  } else {
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Already active today, no change
    } else if (diffDays === 1) {
      // Consecutive day
      this.streak.current += 1;
      this.streak.lastActive = today;
      if (this.streak.current > this.streak.longest) {
        this.streak.longest = this.streak.current;
      }
    } else {
      // Streak broken
      this.streak.current = 1;
      this.streak.lastActive = today;
    }
  }
  
  await this.save();
  return this.streak;
};

// Achievement definitions with rarity and rewards
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_steps',
    name: 'Первые шаги',
    description: 'Study 10 cards',
    icon: '👣',
    category: 'study',
    rarity: 'common',
    reward: 50,
    target: 10
  },
  {
    id: 'getting_started',
    name: 'Начало пути',
    description: 'Study 50 cards',
    icon: '🚀',
    category: 'study',
    rarity: 'common',
    reward: 100,
    target: 50
  },
  {
    id: 'card_master',
    name: 'Мастер карточек',
    description: 'Study 100 cards',
    icon: '🃏',
    category: 'study',
    rarity: 'rare',
    reward: 200,
    target: 100
  },
  {
    id: 'expert',
    name: 'Эксперт',
    description: 'Study 1000 cards',
    icon: '📚',
    category: 'study',
    rarity: 'epic',
    reward: 500,
    target: 1000
  },
  {
    id: 'week_warrior',
    name: 'Марафонец',
    description: '7 day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    reward: 150,
    target: 7
  },
  {
    id: 'month_master',
    name: 'Мастер месяца',
    description: '30 day streak',
    icon: '📅',
    category: 'streak',
    rarity: 'epic',
    reward: 500,
    target: 30
  },
  {
    id: 'test_rookie',
    name: 'Новичок тестов',
    description: 'Pass 5 tests',
    icon: '📝',
    category: 'test',
    rarity: 'common',
    reward: 100,
    target: 5
  },
  {
    id: 'test_champion',
    name: 'Чемпион тестов',
    description: 'Pass 50 tests',
    icon: '🏅',
    category: 'test',
    rarity: 'epic',
    reward: 500,
    target: 50
  },
  {
    id: 'game_winner',
    name: 'Победитель',
    description: 'Win 10 games',
    icon: '🎮',
    category: 'game',
    rarity: 'epic',
    reward: 300,
    target: 10
  },
  {
    id: 'perfectionist',
    name: 'Перфекционист',
    description: 'Get 100% on a test',
    icon: '💎',
    category: 'test',
    rarity: 'legendary',
    reward: 1000,
    target: 1
  }
];

// Method to get progress towards achievements
userGamificationSchema.methods.getAchievementProgress = function() {
  // Ensure stats and streak exist
  if (!this.stats) {
    this.stats = { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 };
  }
  if (!this.streak) {
    this.streak = { current: 0, longest: 0, lastActive: null };
  }
  
  const stats = this.stats;
  const streak = this.streak;
  const userAchievements = this.achievements || [];
  
  const getCurrentProgress = (id) => {
    switch (id) {
      case 'first_steps': return stats.cardsStudied || 0;
      case 'getting_started': return stats.cardsStudied || 0;
      case 'card_master': return stats.cardsStudied || 0;
      case 'expert': return stats.cardsStudied || 0;
      case 'week_warrior': return streak.current || 0;
      case 'month_master': return streak.current || 0;
      case 'test_rookie': return stats.testsPassed || 0;
      case 'test_champion': return stats.testsPassed || 0;
      case 'game_winner': return stats.gamesWon || 0;
      case 'perfectionist': return stats.perfectScores || 0;
      default: return 0;
    }
  };
  
  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const current = getCurrentProgress(def.id);
    const unlockedAchievement = userAchievements.find(a => a.achievementId === def.id);
    
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      category: def.category,
      rarity: def.rarity,
      reward: def.reward,
      target: def.target,
      progress: Math.min(current, def.target),
      current: current,
      unlocked: !!unlockedAchievement,
      unlockedAt: unlockedAchievement?.unlockedAt || null
    };
  });
};

export default mongoose.model('UserGamification', userGamificationSchema);
