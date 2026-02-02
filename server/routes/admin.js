import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import User from '../models/User.js';
import FlashcardSet from '../models/FlashcardSet.js';
import UserGamification from '../models/UserGamification.js';

const router = express.Router();

// All routes require auth + admin
router.use(authMiddleware, adminMiddleware);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('[Admin] Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('[Admin] Error updating role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Delete user's gamification data
    await UserGamification.deleteOne({ userId: req.params.userId });
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('[Admin] Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all sets (including private)
router.get('/sets', async (req, res) => {
  try {
    const { search, isPublic, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    
    const sets = await FlashcardSet.find(query)
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await FlashcardSet.countDocuments(query);
    
    res.json({
      success: true,
      data: sets,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('[Admin] Error fetching sets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete any set
router.delete('/sets/:setId', async (req, res) => {
  try {
    const set = await FlashcardSet.findByIdAndDelete(req.params.setId);
    
    if (!set) {
      return res.status(404).json({ success: false, message: 'Set not found' });
    }
    
    res.json({ success: true, message: 'Set deleted' });
  } catch (error) {
    console.error('[Admin] Error deleting set:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalSets, totalTeachers, totalStudents] = await Promise.all([
      User.countDocuments(),
      FlashcardSet.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' })
    ]);
    
    // Get recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get recent sets
    const recentSets = await FlashcardSet.find()
      .populate('owner', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalSets,
        totalTeachers,
        totalStudents,
        recentUsers,
        recentSets
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
