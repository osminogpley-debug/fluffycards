import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  setsStudied: {
    type: Number,
    default: 0
  },
  cardsMastered: {
    type: Number,
    default: 0  
  },
  streakDays: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  sessionHistory: [{
    date: Date,
    mode: String,
    cardsAttempted: Number,
    correctAnswers: Number,
    timeSpent: Number  
  }],
  gameScores: {
    match: Number,
    gravity: Number
  }
}, {
  timestamps: true
});

export default mongoose.model('UserStats', statsSchema);
