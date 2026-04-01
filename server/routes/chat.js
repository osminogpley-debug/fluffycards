import express from 'express';
import Message from '../models/Message.js';
import FlashcardSet from '../models/FlashcardSet.js';
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

    // Populate set info for set_share messages
    const setIds = messages.filter(m => m.type === 'set_share' && m.setId).map(m => m.setId);
    let setsMap = {};
    if (setIds.length > 0) {
      const sets = await FlashcardSet.find({ _id: { $in: setIds } })
        .populate('owner', 'username')
        .lean();
      sets.forEach(s => {
        setsMap[s._id.toString()] = {
          _id: s._id,
          title: s.title,
          cardCount: s.flashcards?.length || 0,
          owner: s.owner
        };
      });
    }

    const enriched = messages.map(m => {
      if (m.type === 'set_share' && m.setId) {
        m.set = setsMap[m.setId.toString()] || null;
      }
      return m;
    });

    // Mark friend's messages as read
    await Message.updateMany(
      { from: friendId, to: userId, read: false },
      { read: true }
    );

    res.json(enriched.reverse());
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
    const { text, type, setId } = req.body;

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

    const msgData = {
      from: userId,
      to: friendId,
      text: text.trim()
    };

    // If sharing a set, validate it exists
    if (type === 'set_share' && setId) {
      const set = await FlashcardSet.findById(setId);
      if (!set) {
        return res.status(404).json({ message: 'Набор не найден' });
      }
      msgData.type = 'set_share';
      msgData.setId = setId;
    }

    const message = new Message(msgData);
    await message.save();

    let populated = await Message.findById(message._id)
      .populate('from', 'username')
      .populate('to', 'username')
      .lean();

    // Populate set info for set_share messages
    if (populated.type === 'set_share' && populated.setId) {
      const set = await FlashcardSet.findById(populated.setId)
        .populate('owner', 'username')
        .lean();
      populated.set = set ? {
        _id: set._id,
        title: set.title,
        cardCount: set.flashcards?.length || 0,
        owner: set.owner
      } : null;
    }

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
