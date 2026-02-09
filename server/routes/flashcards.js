import express from 'express';
import FlashcardSet from '../models/FlashcardSet.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';
import { unsplash } from '../services/unsplash.js';

const router = express.Router();

// Получение публичных наборов (для библиотеки)
router.get('/public', async (req, res) => {
  try {
    console.log('[PUBLIC SETS] Request received');
    const {
      search,
      category,
      sort = 'new',
      page = 1,
      limit = 12,
      userId,
      language,
      level,
      exam,
      tags
    } = req.query;
    
    // Базовый запрос - только публичные наборы
    let query = { isPublic: true };
    
    // Фильтр по пользователю (для профиля)
    if (userId) {
      query.userId = userId;
    }
    
    console.log('[PUBLIC SETS] Query:', query);

    const normalizeTag = (value) => value?.toString().trim().toLowerCase();
    const tagFilters = [];
    
    // Поиск по названию/описанию
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Фильтр по категории
    if (category && category !== 'Все') {
      const normalizedCategory = normalizeTag(category);
      if (normalizedCategory) tagFilters.push(normalizedCategory);
    }

    if (language && language !== 'Все') {
      const normalizedLanguage = normalizeTag(language);
      if (normalizedLanguage) tagFilters.push(normalizedLanguage);
    }

    if (level && level !== 'Все') {
      const normalizedLevel = normalizeTag(level);
      if (normalizedLevel) tagFilters.push(normalizedLevel);
    }

    if (exam && exam !== 'Все') {
      const normalizedExam = normalizeTag(exam);
      if (normalizedExam) tagFilters.push(normalizedExam);
    }

    if (tags) {
      const extraTags = tags
        .split(',')
        .map(normalizeTag)
        .filter(Boolean);
      tagFilters.push(...extraTags);
    }

    if (tagFilters.length > 0) {
      query.tags = { $all: tagFilters };
    }
    
    // Опции сортировки
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'alphabetical':
        sortOption = { title: 1 };
        break;
      case 'new':
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Пагинация
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Получаем наборы с информацией об авторе
    const sets = await FlashcardSet.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'username profileImage');
    
    // Получаем рейтинги для всех наборов
    const { Rating } = await import('../models/Social.js');
    const setIds = sets.map(s => s._id.toString());
    const ratings = await Rating.find({ setId: { $in: setIds } });
    
    // Группируем рейтинги по setId
    const ratingsMap = {};
    ratings.forEach(r => {
      const sid = r.setId.toString();
      if (!ratingsMap[sid]) ratingsMap[sid] = [];
      ratingsMap[sid].push(r.rating);
    });
    
    // Добавляем средний рейтинг к каждому набору
    const setsWithRatings = sets.map(set => {
      const setObj = set.toObject();
      const setRatings = ratingsMap[set._id.toString()] || [];
      setObj.averageRating = setRatings.length > 0 
        ? setRatings.reduce((a, b) => a + b, 0) / setRatings.length 
        : 0;
      setObj.ratingsCount = setRatings.length;
      return setObj;
    });
    
    // Общее количество для пагинации
    const total = await FlashcardSet.countDocuments(query);
    
    res.json({
      success: true,
      data: setsWithRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching public sets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Получение всех наборов текущего пользователя
// Получить наборы пользователя с фильтрацией по тегам
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { tag, search } = req.query;
    
    let query = { owner: req.user._id };
    
    // Фильтр по тегу
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // Поиск по названию/описанию/тегам
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const sets = await FlashcardSet.find(query)
      .sort({ createdAt: -1 });
    
    res.json(sets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Получить популярные теги пользователя
router.get('/tags/popular', authMiddleware, async (req, res) => {
  try {
    const sets = await FlashcardSet.find({ owner: req.user._id });
    
    // Считаем частоту тегов
    const tagCounts = {};
    sets.forEach(set => {
      (set.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Сортируем по популярности
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Топ 20
    
    res.json({ success: true, data: popularTags });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Копирование публичного набора в свою библиотеку
router.post('/:id/copy', authMiddleware, async (req, res) => {
  try {
    console.log('[Copy Set] Request received for set:', req.params.id, 'by user:', req.user._id);
    
    const originalSet = await FlashcardSet.findById(req.params.id);
    
    if (!originalSet) {
      console.log('[Copy Set] Set not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Набор не найден' });
    }
    
    console.log('[Copy Set] Found set:', originalSet.title, 'isPublic:', originalSet.isPublic);
    
    // Проверяем что набор публичный
    if (!originalSet.isPublic) {
      console.log('[Copy Set] Set is not public');
      return res.status(403).json({ success: false, message: 'Набор не является публичным' });
    }
    
    // Создаем копию
    const newSet = new FlashcardSet({
      title: originalSet.title + ' (копия)',
      description: originalSet.description,
      coverImage: originalSet.coverImage,
      flashcards: originalSet.flashcards,
      clozeText: originalSet.clozeText || '',
      clozeBlanks: originalSet.clozeBlanks || [],
      isPublic: false, // Копия по умолчанию приватная
      owner: req.user._id,
      tags: originalSet.tags
    });
    
    await newSet.save();
    console.log('[Copy Set] Set copied successfully:', newSet._id);
    
    res.json({
      success: true,
      message: 'Набор успешно сохранен в вашу библиотеку',
      data: newSet
    });
  } catch (error) {
    console.error('[Copy Set] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public share link — no auth required
router.get('/share/:id', async (req, res) => {
  try {
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      isPublic: true
    }).populate('owner', 'username profileImage');

    if (!set) {
      return res.status(404).json({ message: 'Набор не найден или он приватный' });
    }

    res.json(set);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Merge sets into a new set
router.post('/merge', authMiddleware, async (req, res) => {
  try {
    const { setIds, title, description = '', tags = [], isPublic = false, clozeText = '', clozeBlanks = [] } = req.body;

    if (!Array.isArray(setIds) || setIds.length < 2) {
      return res.status(400).json({ message: 'Нужно выбрать минимум 2 набора' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Название нового набора обязательно' });
    }

    const sets = await FlashcardSet.find({
      _id: { $in: setIds },
      owner: req.user._id
    });

    if (sets.length < 2) {
      return res.status(404).json({ message: 'Наборы не найдены или доступ запрещен' });
    }

    const mergedFlashcards = sets.flatMap(set => set.flashcards || []);
    const mergedTags = Array.from(new Set([
      ...tags.filter(Boolean).map(t => t.trim().toLowerCase()),
      ...sets.flatMap(set => (set.tags || []).map(t => t.trim().toLowerCase()))
    ].filter(Boolean)));

    const newSet = new FlashcardSet({
      title: title.trim(),
      description: description.trim(),
      flashcards: mergedFlashcards,
      clozeText: clozeText || '',
      clozeBlanks: Array.isArray(clozeBlanks) ? clozeBlanks : [],
      isPublic: Boolean(isPublic),
      owner: req.user._id,
      tags: mergedTags
    });

    await newSet.save();
    res.status(201).json(newSet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Получение одного набора с карточками
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const query = { _id: req.params.id };

    // Авторизованный пользователь: свои наборы ИЛИ публичные
    if (req.user?._id) {
      query.$or = [
        { owner: req.user._id },
        { isPublic: true }
      ];
    } else {
      // Неавторизованный: только публичные
      query.isPublic = true;
    }

    const set = await FlashcardSet.findOne(query).populate('owner', 'username profileImage');

    if (!set) {
      return res.status(404).json({ message: 'Набор не найден' });
    }

    res.json(set);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Создание нового набора с карточками
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, coverImage, flashcards = [], isPublic, tags = [], clozeText = '', clozeBlanks = [] } = req.body;
    
    console.log('[Create Set] isPublic value:', isPublic, 'type:', typeof isPublic);
    
    // Нормализуем теги (убираем пробелы, дубликаты, пустые)
    const normalizedTags = [...new Set(
      tags
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
    )];
    
    const set = new FlashcardSet({
      title,
      description,
      coverImage,
      flashcards,
      clozeText,
      clozeBlanks: Array.isArray(clozeBlanks) ? clozeBlanks : [],
      isPublic: Boolean(isPublic),
      owner: req.user._id,
      tags: normalizedTags
    });
    
    await set.save();
    console.log('[Create Set] Saved with isPublic:', set.isPublic);
    res.status(201).json(set);
  } catch (error) {
    console.error('[Create Set] Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Обновление набора (название, описание, карточки, теги)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, coverImage, flashcards, isPublic, tags, clozeText, clozeBlanks } = req.body;
    
    console.log('[Update Set] isPublic value:', isPublic, 'type:', typeof isPublic);
    
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!set) {
      return res.status(404).json({ message: 'Набор не найден' });
    }
    
    if (title !== undefined) set.title = title;
    if (description !== undefined) set.description = description;
    if (coverImage !== undefined) set.coverImage = coverImage;
    if (flashcards !== undefined) set.flashcards = flashcards;
    if (clozeText !== undefined) set.clozeText = clozeText || '';
    if (clozeBlanks !== undefined) set.clozeBlanks = Array.isArray(clozeBlanks) ? clozeBlanks : [];
    if (isPublic !== undefined) set.isPublic = Boolean(isPublic);
    if (tags !== undefined) {
      // Нормализуем теги
      set.tags = [...new Set(
        tags
          .map(t => t.trim().toLowerCase())
          .filter(t => t.length > 0)
      )];
    }
    
    await set.save();
    console.log('[Update Set] Saved with isPublic:', set.isPublic);
    res.json(set);
  } catch (error) {
    console.error('[Update Set] Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Удаление набора
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('[DELETE] Attempting to delete set:', req.params.id);
    console.log('[DELETE] User:', req.user._id);
    
    const set = await FlashcardSet.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!set) {
      console.log('[DELETE] Set not found or not owned by user');
      return res.status(404).json({ message: 'Набор не найден' });
    }
    
    console.log('[DELETE] Set deleted successfully');
    res.json({ message: 'Набор удален' });
  } catch (error) {
    console.error('[DELETE] Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Добавление карточки в набор
router.post('/:id/cards', authMiddleware, async (req, res) => {
  try {
    const { term, definition, imageUrl, audioUrl } = req.body;
    
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!set) {
      return res.status(404).json({ message: 'Набор не найден' });
    }
    
    set.flashcards.push({
      term,
      definition,
      imageUrl,
      audioUrl
    });
    
    await set.save();
    res.status(201).json(set);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Удаление карточки из набора
router.delete('/:id/cards/:cardId', authMiddleware, async (req, res) => {
  try {
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!set) {
      return res.status(404).json({ message: 'Набор не найден' });
    }
    
    set.flashcards = set.flashcards.filter(
      card => card._id.toString() !== req.params.cardId
    );
    
    await set.save();
    res.json(set);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Импорт карточек из текста
router.post('/:id/import', authMiddleware, async (req, res) => {
  try {
    const set = await FlashcardSet.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!set) {
      return res.status(404).json({ message: 'Набор не найден' });
    }
    
    set.importFromText(req.body.text);
    await set.save();
    res.json(set);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Поиск изображений через Unsplash
router.get('/images/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const result = await unsplash.search.getPhotos({
      query,
      perPage: 5,
      orientation: 'landscape'
    });
    
    res.json(result.response.results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
