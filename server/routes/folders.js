import express from 'express';
import Folder from '../models/Folder.js';
import FlashcardSet from '../models/FlashcardSet.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get all user folders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    // Add setsCount for backward compatibility
    const foldersWithCount = folders.map(f => {
      const obj = f.toObject();
      obj.setsCount = obj.sets ? obj.sets.length : 0;
      return obj;
    });
    
    res.json(foldersWithCount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create new folder
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, color, isPublic } = req.body;
    
    const folder = new Folder({
      name,
      description,
      color,
      isPublic,
      userId: req.user.id,
      sets: []
    });
    
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single folder with populated sets
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('sets');
    
    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }
    
    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update folder
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, color, isPublic } = req.body;
    
    const folder = await Folder.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }
    
    if (name !== undefined) folder.name = name;
    if (description !== undefined) folder.description = description;
    if (color !== undefined) folder.color = color;
    if (isPublic !== undefined) folder.isPublic = isPublic;
    
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete folder
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }
    
    res.json({ message: 'Папка удалена' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add set to folder
router.post('/:id/sets', authMiddleware, async (req, res) => {
  try {
    const { setId } = req.body;
    
    const folder = await Folder.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }
    
    // Verify the set exists and belongs to the user
    const set = await FlashcardSet.findOne({
      _id: setId,
      owner: req.user.id
    });
    
    if (!set) {
      return res.status(404).json({ message: 'Набор не найден' });
    }
    
    // Check if set is already in folder
    if (folder.sets.includes(setId)) {
      return res.status(400).json({ message: 'Набор уже в папке' });
    }
    
    folder.sets.push(setId);
    await folder.save();
    
    res.status(201).json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove set from folder
router.delete('/:id/sets/:setId', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!folder) {
      return res.status(404).json({ message: 'Папка не найдена' });
    }
    
    folder.sets = folder.sets.filter(
      set => set.toString() !== req.params.setId
    );
    
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
