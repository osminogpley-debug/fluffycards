import mongoose from 'mongoose';

// Friend Request Schema
const friendRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Friendship Schema
const friendshipSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Comment Schema for public sets
const commentSchema = new mongoose.Schema({
  setId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardSet',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Rating Schema for public sets
const ratingSchema = new mongoose.Schema({
  setId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardSet',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Challenge Schema
const challengeSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['cards_studied', 'tests_passed', 'streak_days', 'xp_earned'],
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    progress: {
      type: Number,
      default: 0
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Set Share Schema
const setShareSchema = new mongoose.Schema({
  setId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardSet',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shareLink: {
    type: String,
    unique: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  copies: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Follow Schema
const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['friend_request', 'friend_accept', 'follow', 'challenge_join', 'achievement_unlocked', 'quest_completed'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 400
  },
  link: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const activitySchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['follow', 'friend_accept', 'challenge_created', 'challenge_joined', 'achievement_unlocked', 'public_set_created'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 400
  },
  link: {
    type: String,
    default: ''
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'friends'],
    default: 'followers'
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create unique indexes
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
friendshipSchema.index({ users: 1 }, { unique: true });
ratingSchema.index({ setId: 1, userId: 1 }, { unique: true });
setShareSchema.index({ shareLink: 1 });
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ visibility: 1, createdAt: -1 });

// Generate share link
setShareSchema.pre('save', function(next) {
  if (!this.shareLink) {
    this.shareLink = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  }
  next();
});

export const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
export const Friendship = mongoose.model('Friendship', friendshipSchema);
export const Comment = mongoose.model('Comment', commentSchema);
export const Rating = mongoose.model('Rating', ratingSchema);
export const Challenge = mongoose.model('Challenge', challengeSchema);
export const SetShare = mongoose.model('SetShare', setShareSchema);
export const Follow = mongoose.model('Follow', followSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const Activity = mongoose.model('Activity', activitySchema);
