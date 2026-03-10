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
  
  if (!this.stats) {
    this.stats = { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 };
  }
  if (!this.streak) {
    this.streak = { current: 0, longest: 0, lastActive: null };
  }
  
  const getProgress = (id) => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === id);
    if (!def) return 0;
    switch (def.category) {
      case 'study': return this.stats?.cardsStudied || 0;
      case 'streak': return this.streak?.current || 0;
      case 'test':
        if (id.startsWith('perfect')) return this.stats?.perfectScores || 0;
        return this.stats?.testsPassed || 0;
      case 'game': return this.stats?.gamesWon || 0;
      default: return 0;
    }
  };
  
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!unlockedIds.includes(def.id) && getProgress(def.id) >= def.target) {
      this.achievements.push({
        achievementId: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        rarity: def.rarity,
        reward: def.reward,
        unlockedAt: new Date()
      });
      newAchievements.push(def);
    }
  }
  
  if (newAchievements.length > 0) {
    await this.save();
  }
  
  return newAchievements;
};

// Method to generate daily quests
userGamificationSchema.methods.generateDailyQuests = function() {
  // Use Moscow time (UTC+3) for daily reset at 00:00 MSK
  const getMSKDate = () => {
    const now = new Date();
    const mskOffset = 3 * 60; // UTC+3 in minutes
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const mskMs = utcMs + mskOffset * 60000;
    const msk = new Date(mskMs);
    msk.setHours(0, 0, 0, 0);
    return msk;
  };
  
  const todayMSK = getMSKDate();
  
  // Check if we already have quests for today (MSK)
  const hasTodayQuests = this.dailyQuests && this.dailyQuests.length > 0 && 
    this.dailyQuests.some(quest => {
      const questDate = new Date(quest.date);
      // Compare using the same MSK logic
      const questMSK = new Date(questDate.getTime() + questDate.getTimezoneOffset() * 60000 + 3 * 60 * 60000);
      questMSK.setHours(0, 0, 0, 0);
      return questMSK.getTime() === todayMSK.getTime();
    });
  
  // If we already have today's quests, keep them
  if (hasTodayQuests) {
    // Remove any old quests that are not from today
    this.dailyQuests = this.dailyQuests.filter(quest => {
      const questDate = new Date(quest.date);
      const questMSK = new Date(questDate.getTime() + questDate.getTimezoneOffset() * 60000 + 3 * 60 * 60000);
      questMSK.setHours(0, 0, 0, 0);
      return questMSK.getTime() === todayMSK.getTime();
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
      questId: 'study_5',
      name: '📖 Изучить 5 карточек',
      description: 'Изучите 5 карточек сегодня',
      target: 5,
      reward: 15,
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
      questId: 'pass_2_tests',
      name: '📝 Пройти 2 теста',
      description: 'Пройдите 2 теста сегодня',
      target: 2,
      reward: 180,
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
      questId: 'win_2_games',
      name: '🎮 Выиграть 2 игры',
      description: 'Победите дважды в любых играх',
      target: 2,
      reward: 130,
      type: 'win_game'
    },
    {
      questId: 'perfect_score',
      name: '💎 Идеальный результат',
      description: 'Наберите 90% или выше на тесте',
      target: 1,
      reward: 150,
      type: 'perfect_score'
    },
    {
      questId: 'create_set',
      name: '✨ Создать набор',
      description: 'Создайте новый набор карточек',
      target: 1,
      reward: 60,
      type: 'create_set'
    },
    {
      questId: 'study_3_sets',
      name: '📚 Изучить 3 набора',
      description: 'Позанимайтесь с 3 разными наборами',
      target: 3,
      reward: 120,
      type: 'study_sets'
    }
  ];

  const picked = questPool.sort(() => 0.5 - Math.random()).slice(0, 3);
  this.dailyQuests = picked.map(q => ({
    ...q,
    current: 0,
    completed: false,
    date: new Date() // Current time, MSK check is done on comparison
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

// Achievement definitions with rarity and rewards — tiered progression
const ACHIEVEMENT_DEFINITIONS = [
  // ═══ STUDY: Cards Studied ═══
  { id: 'study_1', name: 'Любопытный', description: 'Изучить первую карточку', icon: '🌱', category: 'study', rarity: 'common', reward: 10, target: 1 },
  { id: 'first_steps', name: 'Первые шаги', description: 'Изучить 10 карточек', icon: '👣', category: 'study', rarity: 'common', reward: 50, target: 10 },
  { id: 'getting_started', name: 'Начало пути', description: 'Изучить 50 карточек', icon: '🚀', category: 'study', rarity: 'common', reward: 100, target: 50 },
  { id: 'card_master', name: 'Мастер карточек', description: 'Изучить 100 карточек', icon: '🃏', category: 'study', rarity: 'rare', reward: 200, target: 100 },
  { id: 'study_250', name: 'Прилежный ученик', description: 'Изучить 250 карточек', icon: '📖', category: 'study', rarity: 'rare', reward: 300, target: 250 },
  { id: 'study_500', name: 'Знаток', description: 'Изучить 500 карточек', icon: '🧠', category: 'study', rarity: 'epic', reward: 400, target: 500 },
  { id: 'expert', name: 'Эксперт', description: 'Изучить 1000 карточек', icon: '📚', category: 'study', rarity: 'epic', reward: 500, target: 1000 },
  { id: 'study_2500', name: 'Мудрец', description: 'Изучить 2500 карточек', icon: '🦉', category: 'study', rarity: 'epic', reward: 750, target: 2500 },
  { id: 'study_5000', name: 'Энциклопедист', description: 'Изучить 5000 карточек', icon: '📜', category: 'study', rarity: 'legendary', reward: 1000, target: 5000 },
  { id: 'study_10000', name: 'Легенда знаний', description: 'Изучить 10000 карточек', icon: '👑', category: 'study', rarity: 'legendary', reward: 2000, target: 10000 },

  // ═══ STREAK: Days in a Row ═══
  { id: 'streak_3', name: 'Первая серия', description: 'Серия 3 дня подряд', icon: '🔥', category: 'streak', rarity: 'common', reward: 50, target: 3 },
  { id: 'week_warrior', name: 'Марафонец', description: 'Серия 7 дней подряд', icon: '🔥', category: 'streak', rarity: 'rare', reward: 150, target: 7 },
  { id: 'streak_14', name: 'Двухнедельная серия', description: 'Серия 14 дней подряд', icon: '⚡', category: 'streak', rarity: 'rare', reward: 250, target: 14 },
  { id: 'month_master', name: 'Мастер месяца', description: 'Серия 30 дней подряд', icon: '📅', category: 'streak', rarity: 'epic', reward: 500, target: 30 },
  { id: 'streak_60', name: 'Несгибаемый', description: 'Серия 60 дней подряд', icon: '💪', category: 'streak', rarity: 'epic', reward: 800, target: 60 },
  { id: 'streak_100', name: 'Железная воля', description: 'Серия 100 дней подряд', icon: '🏔️', category: 'streak', rarity: 'legendary', reward: 1500, target: 100 },
  { id: 'streak_365', name: 'Год без перерыва', description: 'Серия 365 дней подряд', icon: '🌍', category: 'streak', rarity: 'legendary', reward: 5000, target: 365 },

  // ═══ TESTS: Tests Passed ═══
  { id: 'test_first', name: 'Первый тест', description: 'Пройти первый тест', icon: '✏️', category: 'test', rarity: 'common', reward: 30, target: 1 },
  { id: 'test_rookie', name: 'Новичок тестов', description: 'Пройти 5 тестов', icon: '📝', category: 'test', rarity: 'common', reward: 100, target: 5 },
  { id: 'test_10', name: 'Тестировщик', description: 'Пройти 10 тестов', icon: '📋', category: 'test', rarity: 'rare', reward: 200, target: 10 },
  { id: 'test_25', name: 'Экзаменатор', description: 'Пройти 25 тестов', icon: '🎓', category: 'test', rarity: 'rare', reward: 300, target: 25 },
  { id: 'test_champion', name: 'Чемпион тестов', description: 'Пройти 50 тестов', icon: '🏅', category: 'test', rarity: 'epic', reward: 500, target: 50 },
  { id: 'test_100', name: 'Мастер экзаменов', description: 'Пройти 100 тестов', icon: '🎖️', category: 'test', rarity: 'legendary', reward: 1000, target: 100 },

  // ═══ GAMES: Games Won ═══
  { id: 'game_first', name: 'Первая победа', description: 'Выиграть первую игру', icon: '🎯', category: 'game', rarity: 'common', reward: 30, target: 1 },
  { id: 'game_5', name: 'Игрок', description: 'Выиграть 5 игр', icon: '🕹️', category: 'game', rarity: 'common', reward: 100, target: 5 },
  { id: 'game_winner', name: 'Победитель', description: 'Выиграть 10 игр', icon: '🎮', category: 'game', rarity: 'rare', reward: 300, target: 10 },
  { id: 'game_25', name: 'Геймер', description: 'Выиграть 25 игр', icon: '🏆', category: 'game', rarity: 'rare', reward: 400, target: 25 },
  { id: 'game_50', name: 'Чемпион игр', description: 'Выиграть 50 игр', icon: '👾', category: 'game', rarity: 'epic', reward: 600, target: 50 },
  { id: 'game_100', name: 'Легенда аркад', description: 'Выиграть 100 игр', icon: '🕹️', category: 'game', rarity: 'legendary', reward: 1000, target: 100 },

  // ═══ PERFECT SCORES ═══
  { id: 'perfectionist', name: 'Перфекционист', description: 'Получить 100% на тесте', icon: '💎', category: 'test', rarity: 'rare', reward: 200, target: 1 },
  { id: 'perfect_5', name: 'Безупречный', description: '5 идеальных результатов', icon: '✨', category: 'test', rarity: 'epic', reward: 500, target: 5 },
  { id: 'perfect_10', name: 'Абсолютное совершенство', description: '10 идеальных результатов', icon: '🌟', category: 'test', rarity: 'epic', reward: 800, target: 10 },
  { id: 'perfect_25', name: 'Бриллиантовый ум', description: '25 идеальных результатов', icon: '💠', category: 'test', rarity: 'legendary', reward: 1500, target: 25 },
];

// Method to get progress towards achievements
userGamificationSchema.methods.getAchievementProgress = function() {
  if (!this.stats) {
    this.stats = { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 };
  }
  if (!this.streak) {
    this.streak = { current: 0, longest: 0, lastActive: null };
  }
  
  const stats = this.stats;
  const streak = this.streak;
  const userAchievements = this.achievements || [];
  
  const getCurrentProgress = (def) => {
    switch (def.category) {
      case 'study': return stats.cardsStudied || 0;
      case 'streak': return streak.current || 0;
      case 'test':
        if (def.id.startsWith('perfect')) return stats.perfectScores || 0;
        return stats.testsPassed || 0;
      case 'game': return stats.gamesWon || 0;
      default: return 0;
    }
  };
  
  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const current = getCurrentProgress(def);
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
