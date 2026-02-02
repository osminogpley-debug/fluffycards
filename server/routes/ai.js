import express from 'express';
import authMiddleware from '../middleware/auth.js';
import AISuggestionService from '../services/aiSuggestions.js';

const router = express.Router();

// Get AI definition suggestion
router.post('/definition', authMiddleware, async (req, res) => {
  try {
    const { term } = req.body;
    
    if (!term) {
      return res.status(400).json({
        success: false,
        message: 'Термин обязателен'
      });
    }

    const suggestion = await AISuggestionService.getDefinitionSuggestion(term);
    
    if (!suggestion) {
      return res.status(500).json({
        success: false,
        message: 'Не удалось получить подсказку'
      });
    }

    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обработке запроса'
    });
  }
});

// Get image suggestion
router.post('/image', authMiddleware, async (req, res) => {
  try {
    const { term } = req.body;
    
    if (!term) {
      return res.status(400).json({
        success: false,
        message: 'Термин обязателен'
      });
    }

    const suggestion = await AISuggestionService.getImageSuggestion(term);
    
    if (!suggestion) {
      return res.status(500).json({
        success: false,
        message: 'Не удалось найти изображение'
      });
    }

    res.json({
      success: true,
      url: suggestion.url,
      alt: suggestion.alt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обработке запроса'
    });
  }
});

// Get study tips
router.post('/study-tips', authMiddleware, async (req, res) => {
  try {
    const { cards } = req.body;
    
    if (!cards || !cards.length) {
      return res.status(400).json({
        success: false,
        message: 'Нужны карточки для анализа'
      });
    }

    const tips = await AISuggestionService.getStudyTips(cards);
    
    if (!tips) {
      return res.status(500).json({
        success: false,
        message: 'Не удалось сгенерировать советы'
      });
    }

    res.json({
      success: true,
      tips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обработке запроса'
    });
  }
});

export default router;
