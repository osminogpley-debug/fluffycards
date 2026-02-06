import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const normalizeUsername = (name, email) => {
  const base = (name || (email ? email.split('@')[0] : 'user'))
    .toString()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
  return base.length >= 3 ? base : `user_${Math.floor(Math.random() * 10000)}`;
};

const ensureUniqueUsername = async (base) => {
  let candidate = base;
  let suffix = 0;
  while (await User.findOne({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
};

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
      user: userData,
      token: token
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

// Google login/register
router.post('/google', async (req, res) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствует токен Google'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email;
    const name = payload?.name;
    const picture = payload?.picture;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        message: 'Не удалось получить данные Google аккаунта'
      });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      const baseUsername = normalizeUsername(name, email);
      const username = await ensureUniqueUsername(baseUsername);
      const validRole = ['student', 'teacher'].includes(role) ? role : 'student';

      user = new User({
        username,
        email,
        googleId,
        role: validRole,
        profileImage: picture || undefined
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.profileImage) {
        user.profileImage = picture;
      }
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: 'Вход через Google выполнен успешно! 👋',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка авторизации через Google'
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

// Update profile (username)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, isProfilePublic } = req.body;
    
    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Имя пользователя должно содержать минимум 3 символа'
      });
    }

    if (username.trim().length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Имя пользователя не должно превышать 30 символов'
      });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ 
      username: username.trim(),
      _id: { $ne: req.user._id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Это имя уже занято другим пользователем'
      });
    }

    const updateData = { username: username.trim() };
    if (typeof isProfilePublic === 'boolean') {
      updateData.isProfilePublic = isProfilePublic;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      message: 'Профиль успешно обновлен! ✅',
      user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении профиля'
    });
  }
});

export default router;
