import express from 'express';
import Message from '../models/Message.js';
import { Friendship } from '../models/Social.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get conversations (list of friends with last message)
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all friendships
    const friendships = await Friendship.find({ users: userId })
      .populate('users', 'username profileImage')
      .lean();

    const conversations = [];
    for (const friendship of friendships) {
      const friend = friendship.users.find(u => u._id.toString() !== userId.toString());
      if (!friend) continue;

      // Get last message between users
      const lastMessage = await Message.findOne({
        $or: [
          { from: userId, to: friend._id },
          { from: friend._id, to: userId }
        ]
      }).sort({ createdAt: -1 }).lean();

      // Count unread
      const unreadCount = await Message.countDocuments({
        from: friend._id,
        to: userId,
        read: false
      });

      conversations.push({
        friend,
        lastMessage,
        unreadCount
      });
    }

    // Sort by last message date
    conversations.sort((a, b) => {
      const aDate = a.lastMessage?.createdAt || 0;
      const bDate = b.lastMessage?.createdAt || 0;
      return new Date(bDate) - new Date(aDate);
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Ошибка при загрузке чатов' });
  }
});

// Get messages with a specific friend
router.get('/:friendId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.friendId;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('from', 'username')
      .populate('to', 'username')
      .lean();

    // Mark friend's messages as read
    await Message.updateMany(
      { from: friendId, to: userId, read: false },
      { read: true }
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Ошибка при загрузке сообщений' });
  }
});

// Send a message
router.post('/:friendId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.friendId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Сообщение не может быть пустым' });
    }

    // Verify they are friends
    const friendship = await Friendship.findOne({
      users: { $all: [userId, friendId] }
    });

    if (!friendship) {
      return res.status(403).json({ message: 'Вы можете писать только друзьям' });
    }

    const message = new Message({
      from: userId,
      to: friendId,
      text: text.trim()
    });

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('from', 'username')
      .populate('to', 'username')
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Ошибка при отправке сообщения' });
  }
});

// Get unread count
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Ошибка' });
  }
});

export default router;
