import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header first (for LAN play)
    let token = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    
    // Fallback to cookies if no header
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Необходима авторизация. Пожалуйста, войдите в систему. 🔐'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    req.user = user;
    next();
  } catch (error) {
    // Clear invalid token
    res.clearCookie('token');
    
    let message = 'Неверный токен авторизации. Пожалуйста, войдите снова. ❌';
    if (error.name === 'TokenExpiredError') {
      message = 'Время сессии истекло. Пожалуйста, войдите снова. ⏳';
    }

    res.status(401).json({ 
      success: false,
      message,
      details: error.message
    });
  }
};

export default auth;
