import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate role
    if (role && !['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Неверная роль пользователя 😢'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email или именем уже существует 😢'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'student'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      secure: false // Allow HTTP for LAN play
    });

    // Return user data (excluding password)
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: 'Аккаунт успешно создан! Добро пожаловать! 🎉',
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании аккаунта. Попробуйте снова. 😔'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Неверный email или пароль. Попробуйте снова. 🔍'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Неверный email или пароль. Попробуйте снова. 🔍'
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    // Return user data (excluding password)
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: 'Вход выполнен успешно! Рады видеть вас снова! 👋',
      user: userData,
      token: token // Return token for localStorage (LAN play)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при входе. Попробуйте снова. 😔'
    });
  }
});

// Logout user
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  });
  
  res.json({
    success: true,
    message: 'Вы успешно вышли из системы. До новых встреч! 👋'
  });
});

// Test protected route
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Вы успешно авторизованы! ✅',
    user: req.user
  });
});

export default router;
