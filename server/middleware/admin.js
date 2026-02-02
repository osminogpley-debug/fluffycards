import User from '../models/User.js';

// Middleware to check if user is admin
export const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user exists (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Необходима авторизация'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Требуются права администратора.'
      });
    }

    next();
  } catch (error) {
    console.error('[Admin Middleware] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки прав администратора'
    });
  }
};

// Helper to make a user admin (for CLI or initial setup)
export const makeAdmin = async (email) => {
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`✅ User ${email} is now admin`);
      return true;
    } else {
      console.log(`❌ User ${email} not found`);
      return false;
    }
  } catch (error) {
    console.error('Error making admin:', error);
    return false;
  }
};
