import express from 'express';
import authMiddleware from '../middleware/auth.js';
import LiveRoom from '../models/LiveRoom.js';
import User from '../models/User.js';

const router = express.Router();

// Генерация PIN
const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

// Создать комнату
router.post('/rooms', authMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;
    
    console.log('[Live] ========== CREATE ROOM ==========');
    console.log('[Live] User:', req.user._id, req.user.username);
    console.log('[Live] Questions count:', questions?.length || 0);
    
    // Проверяем существующие комнаты этого пользователя
    const existingRoom = await LiveRoom.findOne({ hostId: req.user._id, status: 'waiting' });
    if (existingRoom) {
      console.log('[Live] User already has waiting room:', existingRoom.pin);
      return res.json({
        success: true,
        data: {
          pin: existingRoom.pin,
          hostId: existingRoom.hostId,
          hostName: existingRoom.hostName,
          status: existingRoom.status,
          participants: existingRoom.participants
        }
      });
    }
    
    // Очищаем вопросы от _id если они есть
    const cleanQuestions = (questions || []).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct: q.correct
    }));
    
    const room = new LiveRoom({
      pin: generatePin(),
      hostId: req.user._id,
      hostName: req.user.username || 'Unknown',
      status: 'waiting',
      questions: cleanQuestions,
      participants: []
    });
    
    console.log('[Live] Saving room with PIN:', room.pin);
    await room.save();
    
    console.log('[Live] Room created successfully!');
    
    res.json({
      success: true,
      data: {
        pin: room.pin,
        hostId: room.hostId,
        hostName: room.hostName,
        status: room.status,
        participants: room.participants,
        questions: room.questions
      }
    });
  } catch (error) {
    console.error('[Live] ========== ERROR ==========');
    console.error('[Live] Error creating room:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Получить комнату по PIN
router.get('/rooms/:pin', authMiddleware, async (req, res) => {
  try {
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    res.json({
      success: true,
      data: {
        pin: room.pin,
        hostId: room.hostId,
        hostName: room.hostName,
        status: room.status,
        participants: room.participants,
        currentQuestion: room.currentQuestion,
        questions: room.questions
      }
    });
  } catch (error) {
    console.error('[Live] Error getting room:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Присоединиться к комнате
router.post('/rooms/:pin/join', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.body;
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    if (room.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Игра уже началась' });
    }
    
    // Проверяем, не присоединился ли уже пользователь
    const existingParticipant = room.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );
    
    if (existingParticipant) {
      return res.json({
        success: true,
        message: 'Вы уже в комнате',
        data: {
          pin: room.pin,
          hostId: room.hostId,
          hostName: room.hostName,
          status: room.status,
          participants: room.participants,
          questions: room.questions
        }
      });
    }
    
    // Добавляем участника
    room.participants.push({
      userId: req.user._id,
      username: req.user.username,
      teamId: teamId || 'fox',
      score: 0
    });
    
    await room.save();
    
    res.json({
      success: true,
      data: {
        pin: room.pin,
        hostId: room.hostId,
        hostName: room.hostName,
        status: room.status,
        participants: room.participants,
        questions: room.questions
      }
    });
  } catch (error) {
    console.error('[Live] Error joining room:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Начать игру (только хост)
router.post('/rooms/:pin/start', authMiddleware, async (req, res) => {
  try {
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Только хост может начать игру' });
    }
    
    room.status = 'playing';
    await room.save();
    
    res.json({
      success: true,
      data: {
        pin: room.pin,
        status: room.status,
        currentQuestion: room.currentQuestion
      }
    });
  } catch (error) {
    console.error('[Live] Error starting game:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обновить счет участника
router.post('/rooms/:pin/score', authMiddleware, async (req, res) => {
  try {
    const { points } = req.body;
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    const participant = room.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );
    
    if (participant) {
      participant.score += points;
      await room.save();
    }
    
    res.json({
      success: true,
      data: {
        participants: room.participants
      }
    });
  } catch (error) {
    console.error('[Live] Error updating score:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Следующий вопрос (только хост)
router.post('/rooms/:pin/next', authMiddleware, async (req, res) => {
  try {
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Только хост может управлять игрой' });
    }
    
    if (room.currentQuestion < room.questions.length - 1) {
      room.currentQuestion += 1;
      await room.save();
    }
    
    res.json({
      success: true,
      data: {
        currentQuestion: room.currentQuestion,
        totalQuestions: room.questions.length
      }
    });
  } catch (error) {
    console.error('[Live] Error next question:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Завершить игру (только хост)
router.post('/rooms/:pin/end', authMiddleware, async (req, res) => {
  try {
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    if (room.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Только хост может завершить игру' });
    }
    
    room.status = 'finished';
    await room.save();
    
    res.json({
      success: true,
      data: {
        pin: room.pin,
        status: room.status,
        participants: room.participants
      }
    });
  } catch (error) {
    console.error('[Live] Error ending game:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Отправить сообщение в чат
router.post('/rooms/:pin/messages', authMiddleware, async (req, res) => {
  try {
    const { text, color } = req.body;
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    // Проверяем что пользователь в комнате
    const isParticipant = room.participants.some(p => p.userId.toString() === req.user._id.toString());
    const isHost = room.hostId.toString() === req.user._id.toString();
    
    if (!isParticipant && !isHost) {
      return res.status(403).json({ success: false, message: 'Вы не в комнате' });
    }
    
    const message = {
      author: req.user.username,
      text,
      color: color || '#4299e1',
      createdAt: new Date()
    };
    
    room.messages.push(message);
    // Храним только последние 50 сообщений
    if (room.messages.length > 50) {
      room.messages = room.messages.slice(-50);
    }
    
    await room.save();
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('[Live] Error sending message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Получить сообщения чата
router.get('/rooms/:pin/messages', authMiddleware, async (req, res) => {
  try {
    const room = await LiveRoom.findOne({ pin: req.params.pin });
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Комната не найдена' });
    }
    
    res.json({ 
      success: true, 
      data: room.messages.slice(-50) // Последние 50 сообщений
    });
  } catch (error) {
    console.error('[Live] Error fetching messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
