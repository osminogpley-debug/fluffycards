import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
  FriendRequest, 
  Friendship, 
  Comment, 
  Rating, 
  Challenge, 
  SetShare 
} from '../models/Social.js';
import User from '../models/User.js';
import FlashcardSet from '../models/FlashcardSet.js';
import Message from '../models/Message.js';

const router = express.Router();

// ==================== FRIENDS ====================

// Get friends list
router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      users: req.user._id
    }).populate('users', 'username profileImage level totalXp');
    
    const friends = friendships.map(f => {
      const friend = f.users.find(u => u._id.toString() !== req.user._id.toString());
      return {
        ...friend.toObject(),
        friendshipId: f._id
      };
    });
    
    res.json({ success: true, data: friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch friends' });
  }
});

// Get user by ID
router.get('/users/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username profileImage level totalXp role isProfilePublic');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Get user stats
router.get('/users/:userId/stats', authMiddleware, async (req, res) => {
  try {
    const UserGamification = (await import('../models/UserGamification.js')).default;
    const FlashcardSet = (await import('../models/FlashcardSet.js')).default;
    
    console.log('[Stats] Fetching stats for user:', req.params.userId);
    
    const [gamification, setsCount] = await Promise.all([
      UserGamification.findOne({ userId: req.params.userId }),
      FlashcardSet.countDocuments({ owner: req.params.userId })
    ]);
    
    console.log('[Stats] Gamification:', gamification);
    console.log('[Stats] Sets count:', setsCount);
    
    const result = {
      setsCreated: setsCount || 0,
      cardsStudied: gamification?.stats?.cardsStudied || 0,
      testsPassed: gamification?.stats?.testsPassed || 0,
      streakDays: gamification?.streak?.current || 0
    };
    
    console.log('[Stats] Result:', result);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Search users
router.get('/users/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    console.log(`[Search Users] Query: "${query}" from user: ${req.user._id}`);
    
    if (!query || query.length < 2) {
      console.log('[Search Users] Query too short, returning empty');
      return res.json({ success: true, data: [] });
    }
    
    let searchQuery = {
      _id: { $ne: req.user._id }
    };
    
    // Check if query looks like ObjectId (24 hex chars)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(query);
    
    if (isObjectId) {
      // Search by ID
      searchQuery._id = { $eq: query, $ne: req.user._id };
    } else {
      // Search by username
      searchQuery.username = { $regex: query, $options: 'i' };
    }
    
    const users = await User.find(searchQuery)
      .select('username profileImage level totalXp')
      .limit(10);
    
    console.log(`[Search Users] Found ${users.length} users`);
    
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('[Search Users] Error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Send friend request
router.post('/friends/request', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Check if already friends
    const existingFriendship = await Friendship.findOne({
      users: { $all: [req.user._id, userId] }
    });
    
    if (existingFriendship) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }
    
    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      from: req.user._id,
      to: userId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }
    
    const request = new FriendRequest({
      from: req.user._id,
      to: userId
    });
    
    await request.save();
    
    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to send request' });
  }
});

// Accept/reject friend request
router.put('/friends/request/:requestId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await FriendRequest.findOne({
      _id: req.params.requestId,
      to: req.user._id
    });
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    request.status = status;
    await request.save();
    
    if (status === 'accepted') {
      // Create friendship
      const friendship = new Friendship({
        users: [request.from, request.to]
      });
      await friendship.save();
    }
    
    res.json({ success: true, message: `Request ${status}` });
  } catch (error) {
    console.error('Error handling friend request:', error);
    res.status(500).json({ success: false, message: 'Failed to handle request' });
  }
});

// Get pending friend requests
router.get('/friends/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user._id,
      status: 'pending'
    }).populate('from', 'username profileImage');
    
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// Remove friend
router.delete('/friends/:friendId', authMiddleware, async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      users: { $all: [req.user._id, req.params.friendId] }
    });
    
    await FriendRequest.findOneAndDelete({
      $or: [
        { from: req.user._id, to: req.params.friendId },
        { from: req.params.friendId, to: req.user._id }
      ]
    });
    
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
});

// ==================== NOTIFICATIONS ====================

// Get notification counts (unread messages + pending friend requests)
router.get('/notifications/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const [unreadMessages, pendingRequests] = await Promise.all([
      Message.countDocuments({ to: userId, read: false }),
      FriendRequest.countDocuments({ to: userId, status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        unreadMessages,
        pendingRequests,
        total: unreadMessages + pendingRequests
      }
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ==================== COMMENTS ====================

// Get comments for a set
router.get('/comments/:setId', async (req, res) => {
  try {
    const comments = await Comment.find({ setId: req.params.setId })
      .populate('userId', 'username profileImage')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

// Add comment
router.post('/comments', authMiddleware, async (req, res) => {
  try {
    const { setId, text } = req.body;
    
    const comment = new Comment({
      setId,
      userId: req.user._id,
      text
    });
    
    await comment.save();
    await comment.populate('userId', 'username profileImage');
    
    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
});

// Delete comment
router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    await Comment.findOneAndDelete({
      _id: req.params.commentId,
      userId: req.user._id
    });
    
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

// ==================== RATINGS ====================

// Get rating for a set
router.get('/ratings/:setId', async (req, res) => {
  try {
    const ratings = await Rating.find({ setId: req.params.setId });
    const average = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    res.json({ 
      success: true, 
      data: {
        average: Math.round(average * 10) / 10,
        count: ratings.length,
        userRating: null
      }
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ratings' });
  }
});

// Rate a set
router.post('/ratings', authMiddleware, async (req, res) => {
  try {
    const { setId, rating } = req.body;
    
    const existingRating = await Rating.findOne({
      setId,
      userId: req.user._id
    });
    
    if (existingRating) {
      existingRating.rating = rating;
      await existingRating.save();
    } else {
      const newRating = new Rating({
        setId,
        userId: req.user._id,
        rating
      });
      await newRating.save();
    }
    
    res.json({ success: true, message: 'Rating saved' });
  } catch (error) {
    console.error('Error saving rating:', error);
    res.status(500).json({ success: false, message: 'Failed to save rating' });
  }
});

// ==================== CHALLENGES ====================

// Get challenges
router.get('/challenges', authMiddleware, async (req, res) => {
  try {
    const challenges = await Challenge.find({
      $or: [
        { isPublic: true },
        { creator: req.user._id },
        { 'participants.user': req.user._id }
      ],
      endDate: { $gte: new Date() }
    }).populate('creator', 'username')
      .populate('participants.user', 'username profileImage')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch challenges' });
  }
});

// Create challenge
router.post('/challenges', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, target, endDate, isPublic } = req.body;
    
    const challenge = new Challenge({
      creator: req.user._id,
      title,
      description,
      type,
      target,
      endDate: new Date(endDate),
      isPublic,
      participants: [{ user: req.user._id }]
    });
    
    await challenge.save();
    await challenge.populate('creator', 'username');
    
    res.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ success: false, message: 'Failed to create challenge' });
  }
});

// Join challenge
router.post('/challenges/:challengeId/join', authMiddleware, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    
    const alreadyJoined = challenge.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'Already joined' });
    }
    
    challenge.participants.push({ user: req.user._id });
    await challenge.save();
    
    res.json({ success: true, message: 'Joined challenge' });
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ success: false, message: 'Failed to join challenge' });
  }
});

// Update challenge progress
router.post('/challenges/:challengeId/progress', authMiddleware, async (req, res) => {
  try {
    const { progress } = req.body;
    
    const challenge = await Challenge.findById(req.params.challengeId);
    
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    
    const participant = challenge.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );
    
    if (participant) {
      participant.progress = Math.min(progress, challenge.target);
      await challenge.save();
    }
    
    res.json({ success: true, message: 'Progress updated' });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
});

// ==================== SET SHARING ====================

// Share a set
router.post('/sets/share', authMiddleware, async (req, res) => {
  try {
    const { setId, isPublic } = req.body;
    
    // Check if set exists and belongs to user (owner field!)
    const set = await FlashcardSet.findOne({
      _id: setId,
      owner: req.user._id
    });
    
    if (!set) {
      return res.status(404).json({ success: false, message: 'Set not found' });
    }
    
    let share = await SetShare.findOne({ setId });
    
    if (share) {
      share.isPublic = isPublic;
      await share.save();
    } else {
      share = new SetShare({
        setId,
        sharedBy: req.user._id,
        isPublic
      });
      await share.save();
    }
    
    res.json({ 
      success: true, 
      data: {
        shareLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/sets/shared/${share.shareLink}`,
        isPublic: share.isPublic
      }
    });
  } catch (error) {
    console.error('Error sharing set:', error);
    res.status(500).json({ success: false, message: 'Failed to share set' });
  }
});

// Get shared set by link
router.get('/sets/shared/:shareLink', async (req, res) => {
  try {
    const share = await SetShare.findOne({
      shareLink: req.params.shareLink,
      isPublic: true
    }).populate('setId');
    
    if (!share) {
      return res.status(404).json({ success: false, message: 'Set not found' });
    }
    
    share.views += 1;
    await share.save();
    
    res.json({ success: true, data: share.setId });
  } catch (error) {
    console.error('Error fetching shared set:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch set' });
  }
});

// Copy shared set to user's library
router.post('/sets/shared/:shareLink/copy', authMiddleware, async (req, res) => {
  try {
    const share = await SetShare.findOne({ shareLink: req.params.shareLink });
    
    if (!share) {
      return res.status(404).json({ success: false, message: 'Set not found' });
    }
    
    const originalSet = await FlashcardSet.findById(share.setId);
    
    if (!originalSet) {
      return res.status(404).json({ success: false, message: 'Set not found' });
    }
    
    // Create copy
    const newSet = new FlashcardSet({
      userId: req.user._id,
      title: originalSet.title + ' (копия)',
      description: originalSet.description,
      flashcards: originalSet.flashcards,
      isPublic: false,
      tags: originalSet.tags
    });
    
    await newSet.save();
    
    share.copies += 1;
    await share.save();
    
    res.json({ success: true, data: newSet });
  } catch (error) {
    console.error('Error copying set:', error);
    res.status(500).json({ success: false, message: 'Failed to copy set' });
  }
});

export default router;
