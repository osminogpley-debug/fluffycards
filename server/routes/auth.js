import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
const DEFAULT_MOBILE_REDIRECT = 'fluffycards://auth/callback';

const setAuthCookie = (res, token, sameSite = 'lax') => {
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite,
    secure: process.env.NODE_ENV === 'production'
  });
};

const issueAuthToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, {
  expiresIn: '30d'
});

const encodeState = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodeState = (value) => {
  try {
    return JSON.parse(Buffer.from(String(value || ''), 'base64url').toString('utf8'));
  } catch {
    return {};
  }
};

const appendQueryParams = (target, params) => {
  const [base, hash = ''] = String(target || '').split('#');

  if (/^[a-z][a-z0-9+.-]*:/i.test(base)) {
    const separator = base.includes('?') ? '&' : '?';
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value);
      }
    });

    const prefixed = query.toString() ? `${base}${separator}${query.toString()}` : base;
    return hash ? `${prefixed}#${hash}` : prefixed;
  }

  if (base.startsWith('http://') || base.startsWith('https://')) {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    return hash ? `${url.toString()}#${hash}` : url.toString();
  }

  const url = new URL(base.startsWith('/') ? base : `/${base}`, FRONTEND_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const relativeUrl = `${url.pathname}${url.search}`;
  return hash ? `${relativeUrl}#${hash}` : relativeUrl;
};

const buildUniqueUsername = async (baseName) => {
  const slug = String(baseName || 'yandex-user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'yandex-user';

  let candidate = slug;
  let suffix = 1;

  while (await User.exists({ username: candidate })) {
    candidate = `${slug.slice(0, Math.max(1, 24 - String(suffix).length - 1))}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const getYandexConfig = () => ({
  clientId: process.env.YANDEX_CLIENT_ID,
  clientSecret: process.env.YANDEX_CLIENT_SECRET,
  callbackUrl: process.env.YANDEX_CALLBACK_URL
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validate role
    if (role && !['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Неверная роль пользователя 😢'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }]
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
      email: normalizedEmail,
      password,
      role: role || 'student'
    });

    await user.save();

    // Generate JWT token
    const token = issueAuthToken(user._id);
    setAuthCookie(res, token, 'lax');

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
    const normalizedEmail = normalizeEmail(email);

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Неверный email или пароль. Попробуйте снова. 🔍'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Для этого аккаунта вход по паролю недоступен. Обратитесь к администратору для переноса аккаунта.'
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
    const token = issueAuthToken(user._id);
    setAuthCookie(res, token, 'strict');

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

// Heartbeat to keep lastSeen fresh while user is on the site
router.post('/heartbeat', authMiddleware, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { lastSeen: new Date() });
  res.json({ success: true });
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

router.get('/yandex/start', async (req, res) => {
  const { clientId, callbackUrl } = getYandexConfig();

  if (!clientId || !callbackUrl) {
    return res.status(500).json({
      success: false,
      message: 'Яндекс авторизация не настроена на сервере'
    });
  }

  const platform = req.query.platform === 'mobile' ? 'mobile' : 'web';
  const role = ['student', 'teacher'].includes(req.query.role) ? req.query.role : 'student';
  const returnTo = String(req.query.return_to || (platform === 'mobile' ? DEFAULT_MOBILE_REDIRECT : `${FRONTEND_URL}/auth`));
  const state = encodeState({
    nonce: crypto.randomBytes(12).toString('hex'),
    platform,
    role,
    returnTo
  });

  const authorizeUrl = new URL('https://oauth.yandex.ru/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('scope', 'login:email login:info');
  authorizeUrl.searchParams.set('state', state);

  return res.redirect(authorizeUrl.toString());
});

router.get('/yandex/callback', async (req, res) => {
  const { clientId, clientSecret, callbackUrl } = getYandexConfig();
  const state = decodeState(req.query.state);
  const platform = state.platform === 'mobile' ? 'mobile' : 'web';
  const defaultReturnTo = platform === 'mobile' ? DEFAULT_MOBILE_REDIRECT : `${FRONTEND_URL}/auth`;
  const returnTo = String(state.returnTo || defaultReturnTo);

  if (req.query.error) {
    return res.redirect(appendQueryParams(returnTo, {
      oauth: 'yandex',
      error: req.query.error_description || req.query.error
    }));
  }

  if (!clientId || !clientSecret || !callbackUrl) {
    return res.redirect(appendQueryParams(returnTo, {
      oauth: 'yandex',
      error: 'Яндекс авторизация не настроена на сервере'
    }));
  }

  try {
    const tokenResponse = await axios.post(
      'https://oauth.yandex.ru/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(req.query.code || ''),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) {
      throw new Error('Не удалось получить access token Яндекса');
    }

    const profileResponse = await axios.get('https://login.yandex.ru/info', {
      headers: {
        Authorization: `OAuth ${accessToken}`
      },
      params: {
        format: 'json'
      }
    });

    const profile = profileResponse.data || {};
    const yandexId = String(profile.id || '').trim();
    const email = normalizeEmail(profile.default_email || profile.email || profile.defaultEmail);
    const baseUsername = profile.login || profile.real_name || profile.display_name || `yandex-${yandexId.slice(-6)}`;

    if (!yandexId || !email) {
      throw new Error('Яндекс не вернул обязательные данные профиля');
    }

    let user = await User.findOne({ $or: [{ yandexId }, { email }] });

    if (!user) {
      user = new User({
        username: await buildUniqueUsername(baseUsername),
        email,
        yandexId,
        password: crypto.randomBytes(24).toString('hex'),
        role: ['student', 'teacher'].includes(state.role) ? state.role : 'student'
      });
      await user.save();
    } else {
      let changed = false;

      if (!user.yandexId) {
        user.yandexId = yandexId;
        changed = true;
      }

      if (user.email !== email) {
        user.email = email;
        changed = true;
      }

      if (changed) {
        await user.save();
      }
    }

    const token = issueAuthToken(user._id);
    setAuthCookie(res, token, platform === 'mobile' ? 'lax' : 'strict');

    return res.redirect(appendQueryParams(returnTo, {
      oauth: 'yandex',
      token,
      success: '1'
    }));
  } catch (error) {
    console.error('Yandex auth error:', error.response?.data || error.message);
    return res.redirect(appendQueryParams(returnTo, {
      oauth: 'yandex',
      error: 'Не удалось завершить вход через Яндекс'
    }));
  }
});

// Test protected route
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Вы успешно авторизованы! ✅',
    user: req.user
  });
});

// Update profile and login email
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email, isProfilePublic, profileImage } = req.body;
    const trimmedUsername = username?.trim();
    const normalizedEmail = normalizeEmail(email);
    
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Имя пользователя должно содержать минимум 3 символа'
      });
    }

    if (trimmedUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Имя пользователя не должно превышать 30 символов'
      });
    }

    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Введите корректный email'
      });
    }

    // Check if username is already taken by another user
    const existingUser = await User.findOne({ 
      username: trimmedUsername,
      _id: { $ne: req.user._id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Это имя уже занято другим пользователем'
      });
    }

    const existingEmailUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id }
    });

    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'Этот email уже используется другим пользователем'
      });
    }

    const updateData = { username: trimmedUsername, email: normalizedEmail };
    if (typeof isProfilePublic === 'boolean') {
      updateData.isProfilePublic = isProfilePublic;
    }
    if (typeof profileImage === 'string') {
      // Allow empty string to revert to default avatar
      updateData.profileImage = profileImage.trim() || 'https://fluffycards.com/default-avatar.png';
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
