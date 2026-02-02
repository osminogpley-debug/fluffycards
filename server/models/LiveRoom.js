import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  teamId: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const liveRoomSchema = new mongoose.Schema({
  pin: {
    type: String,
    unique: true,
    index: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostName: {
    type: String,
    default: 'Unknown'
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  participants: [participantSchema],
  currentQuestion: {
    type: Number,
    default: 0
  },
  questions: [{
    id: Number,
    question: String,
    options: [String],
    correct: Number,
    _id: false
  }],
  messages: [{
    author: String,
    text: String,
    color: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Автоматически удалять через 24 часа
  }
});

// Генерация PIN при создании
liveRoomSchema.pre('save', function(next) {
  if (!this.pin) {
    // Генерируем 6-значный PIN вместо 4 для уменьшения коллизий
    this.pin = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

export default mongoose.model('LiveRoom', liveRoomSchema);
