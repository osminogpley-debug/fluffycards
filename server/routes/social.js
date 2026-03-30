import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
  FriendRequest, 
  Friendship, 
  Comment, 
  Rating, 
  Challenge, 
  SetShare,
  Follow,
  Notification,
  Activity
} from '../models/Social.js';
import User from '../models/User.js';
import FlashcardSet from '../models/FlashcardSet.js';
import Message from '../models/Message.js';

const router = express.Router();

const createNotification = async ({ userId, actorId, type, title, message, link = '', payload = {} }) => {
  if (!userId) return;
  if (actorId && userId.toString() === actorId.toString()) return;

  try {
    await Notification.create({
      user: userId,
      actor: actorId,
      type,
      title,
      message,
      link,
      payload
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const createActivity = async ({ actorId, type, title, message, link = '', visibility = 'followers', payload = {} }) => {
  if (!actorId) return;

  try {
    await Activity.create({
      actor: actorId,
      type,
      title,
      message,
      link,
      visibility,
      payload
    });
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};

// ==================== FRIENDS ====================

// Get friends list
router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      users: req.user._id
    }).populate('users', 'username profileImage level totalXp lastSeen');
    
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

// Search users (must be before /users/:userId to avoid route conflict)
router.get('/users/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    let searchQuery = {
      _id: { $ne: req.user._id }
    };
    
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(query);
    
    if (isObjectId) {
      searchQuery._id = { $eq: query, $ne: req.user._id };
    } else {
      searchQuery.username = { $regex: query, $options: 'i' };
    }
    
    const users = await User.find(searchQuery)
      .select('username profileImage level totalXp')
      .limit(10);
    
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('[Search Users] Error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Get user by ID
router.get('/users/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = await User.findById(userId)
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
    const { userId } = req.params;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const UserGamification = (await import('../models/UserGamification.js')).default;
    
    const [gamification, setsCount] = await Promise.all([
      UserGamification.findOne({ userId }),
      FlashcardSet.countDocuments({ owner: userId })
    ]);
    
    const result = {
      setsCreated: setsCount || 0,
      cardsStudied: gamification?.stats?.cardsStudied || 0,
      testsPassed: gamification?.stats?.testsPassed || 0,
      streakDays: gamification?.streak?.current || 0
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Get user gamification data (public)
router.get('/users/:userId/gamification', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const UserGamification = (await import('../models/UserGamification.js')).default;
    const gam = await UserGamification.findOne({ userId });
    
    if (!gam) {
      return res.json({ success: true, data: { level: 1, xp: 0, totalXp: 0, xpForNextLevel: 100, achievements: [], streak: { current: 0 } } });
    }
    
    res.json({
      success: true,
      data: {
        level: gam.level,
        xp: gam.xp,
        totalXp: gam.totalXp,
        xpForNextLevel: UserGamification.getXpForLevel(gam.level),
        achievements: gam.achievements || [],
        streak: gam.streak || { current: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching user gamification:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gamification' });
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
    await createNotification({
      userId,
      actorId: req.user._id,
      type: 'friend_request',
      title: 'Новая заявка в друзья',
      message: `${req.user.username} отправил(а) вам заявку в друзья`,
      link: '/dashboard',
      payload: { requestId: request._id }
    });
    
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

      await createNotification({
        userId: request.from,
        actorId: req.user._id,
        type: 'friend_accept',
        title: 'Заявка принята',
        message: `${req.user.username} принял(а) вашу заявку в друзья`,
        link: '/dashboard',
        payload: { friendshipId: friendship._id }
      });

      await createActivity({
        actorId: req.user._id,
        type: 'friend_accept',
        title: 'Новая дружба',
        message: `${req.user.username} добавил(а) нового друга`,
        link: `/users/${req.user._id}`,
        visibility: 'friends',
        payload: { friendId: request.from }
      });
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

// Get notification counts (messages + action notifications)
router.get('/notifications/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const [unreadMessages, pendingRequests, unreadNotifications] = await Promise.all([
      Message.countDocuments({ to: userId, read: false }),
      FriendRequest.countDocuments({ to: userId, status: 'pending' }),
      Notification.countDocuments({ user: userId, read: false })
    ]);

    res.json({
      success: true,
      data: {
        unreadMessages,
        pendingRequests,
        unreadNotifications,
        total: unreadMessages + unreadNotifications
      }
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actor', 'username profileImage level totalXp');

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications list' });
  }
});

router.put('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

router.put('/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

router.get('/activity/feed', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({ users: req.user._id }).select('users');
    const friendIds = friendships
      .flatMap((item) => item.users.map((id) => id.toString()))
      .filter((id) => id !== req.user._id.toString());

    const follows = await Follow.find({ follower: req.user._id }).select('following');
    const followingIds = follows.map((item) => item.following.toString());

    const actorIds = Array.from(new Set([...friendIds, ...followingIds]));
    if (actorIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const activities = await Activity.find({ actor: { $in: actorIds } })
      .sort({ createdAt: -1 })
      .limit(25)
      .populate('actor', 'username profileImage level totalXp');

    const filteredActivities = activities.filter((activity) => {
      const actorId = activity.actor?._id?.toString?.() || activity.actor?.toString?.();
      if (activity.visibility === 'public') return true;
      if (activity.visibility === 'friends') return friendIds.includes(actorId);
      return followingIds.includes(actorId) || friendIds.includes(actorId);
    });

    res.json({ success: true, data: filteredActivities });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity feed' });
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

    await createActivity({
      actorId: req.user._id,
      type: 'challenge_created',
      title: 'Новый челлендж',
      message: `${req.user.username} создал(а) челлендж «${challenge.title}»`,
      link: `/dashboard?tab=friends&challenge=${challenge._id}`,
      visibility: challenge.isPublic ? 'public' : 'followers',
      payload: { challengeId: challenge._id }
    });
    
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

    await createNotification({
      userId: challenge.creator,
      actorId: req.user._id,
      type: 'challenge_join',
      title: 'Новый участник челленджа',
      message: `${req.user.username} присоединился(ась) к вашему челленджу «${challenge.title}»`,
      link: '/dashboard',
      payload: { challengeId: challenge._id }
    });

    await createActivity({
      actorId: req.user._id,
      type: 'challenge_joined',
      title: 'Участие в челлендже',
      message: `${req.user.username} присоединился(ась) к челленджу «${challenge.title}»`,
      link: `/dashboard?tab=friends&challenge=${challenge._id}`,
      visibility: 'followers',
      payload: { challengeId: challenge._id }
    });
    
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
        shareLink: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/share/${setId}`,
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
      owner: req.user._id,
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

// ==================== FOLLOW / SUBSCRIBE ====================

// Follow a user
router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }
    const existing = await Follow.findOne({ follower: req.user._id, following: targetUserId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already following' });
    }
    await new Follow({ follower: req.user._id, following: targetUserId }).save();
    await createNotification({
      userId: targetUserId,
      actorId: req.user._id,
      type: 'follow',
      title: 'Новый подписчик',
      message: `${req.user.username} подписался(ась) на вас`,
      link: `/users/${req.user._id}`,
      payload: { followerId: req.user._id }
    });

    await createActivity({
      actorId: req.user._id,
      type: 'follow',
      title: 'Новая подписка',
      message: `${req.user.username} подписался(ась) на автора`,
      link: `/users/${targetUserId}`,
      visibility: 'followers',
      payload: { targetUserId }
    });
    res.json({ success: true, message: 'Followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ success: false, message: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    await Follow.findOneAndDelete({ follower: req.user._id, following: req.params.userId });
    res.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ success: false, message: 'Failed to unfollow user' });
  }
});

// Get follow status for a user
router.get('/follow/:userId/status', authMiddleware, async (req, res) => {
  try {
    const [isFollowing, followersCount, followingCount] = await Promise.all([
      Follow.findOne({ follower: req.user._id, following: req.params.userId }),
      Follow.countDocuments({ following: req.params.userId }),
      Follow.countDocuments({ follower: req.params.userId })
    ]);
    res.json({
      success: true,
      data: { isFollowing: !!isFollowing, followersCount, followingCount }
    });
  } catch (error) {
    console.error('Error fetching follow status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch follow status' });
  }
});

// Get followers of a user
router.get('/follow/:userId/followers', authMiddleware, async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.params.userId })
      .populate('follower', 'username profileImage level totalXp')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: follows.map(f => f.follower) });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch followers' });
  }
});

// Get who a user is following
router.get('/follow/:userId/following', authMiddleware, async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.params.userId })
      .populate('following', 'username profileImage level totalXp')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: follows.map(f => f.following) });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch following' });
  }
});

export default router;
