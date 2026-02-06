import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import authMiddleware from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

// Create a support ticket (authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Тема и сообщение обязательны' });
    }

    const ticket = new SupportTicket({
      user: req.user._id,
      subject,
      message,
      category: category || 'question',
      priority: priority || 'medium'
    });

    await ticket.save();
    res.status(201).json({ message: 'Обращение отправлено', ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Ошибка при создании обращения' });
  }
});

// Get user's own tickets
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Ошибка при загрузке обращений' });
  }
});

// ===== ADMIN ROUTES =====

// Get all tickets (admin only)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'username email')
      .populate('respondedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await SupportTicket.countDocuments(filter);

    res.json({ tickets, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    res.status(500).json({ message: 'Ошибка при загрузке обращений' });
  }
});

// Respond to a ticket (admin only)
router.put('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const update = {};

    if (status) update.status = status;
    if (adminResponse) {
      update.adminResponse = adminResponse;
      update.respondedBy = req.user._id;
      update.respondedAt = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('user', 'username email')
     .populate('respondedBy', 'username');

    if (!ticket) {
      return res.status(404).json({ message: 'Обращение не найдено' });
    }

    res.json({ message: 'Обращение обновлено', ticket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Ошибка при обновлении обращения' });
  }
});

// Get support stats (admin)
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [open, inProgress, resolved, closed, total] = await Promise.all([
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in-progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      SupportTicket.countDocuments()
    ]);

    res.json({ open, inProgress, resolved, closed, total });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Ошибка при загрузке статистики' });
  }
});

export default router;
