import express from 'express';
import Draft from '../models/Draft.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const normalizeSetId = (setId) => (setId ? setId : null);

// Get draft for set builder (create or edit)
router.get('/sets', authMiddleware, async (req, res) => {
  try {
    const setId = normalizeSetId(req.query.setId);
    const draft = await Draft.findOne({ user: req.user._id, setId });
    res.json(draft || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upsert draft for set builder
router.post('/sets', authMiddleware, async (req, res) => {
  try {
    const setId = normalizeSetId(req.body.setId);
    const update = {
      title: req.body.title || '',
      description: req.body.description || '',
      coverImage: req.body.coverImage || '',
      isPublic: Boolean(req.body.isPublic),
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      clozeText: req.body.clozeText || '',
      clozeBlanks: Array.isArray(req.body.clozeBlanks) ? req.body.clozeBlanks : [],
      cards: Array.isArray(req.body.cards) ? req.body.cards : [],
      updatedAt: new Date()
    };

    const draft = await Draft.findOneAndUpdate(
      { user: req.user._id, setId },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete draft for set builder
router.delete('/sets', authMiddleware, async (req, res) => {
  try {
    const setId = normalizeSetId(req.query.setId);
    await Draft.findOneAndDelete({ user: req.user._id, setId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
