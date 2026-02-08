import express from 'express';
import Attendance from '../models/Attendance.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get teacher's attendance sheet
router.get('/', authMiddleware, async (req, res) => {
  try {
    let sheet = await Attendance.findOne({ teacherId: req.user.id });
    if (!sheet) {
      sheet = new Attendance({ teacherId: req.user.id, students: [] });
      await sheet.save();
    }
    res.json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add student
router.post('/students', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Имя ученика обязательно' });
    }

    let sheet = await Attendance.findOne({ teacherId: req.user.id });
    if (!sheet) {
      sheet = new Attendance({ teacherId: req.user.id, students: [] });
    }

    sheet.students.push({ name: name.trim(), records: [] });
    await sheet.save();
    res.status(201).json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all students
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const sheet = await Attendance.findOne({ teacherId: req.user.id });
    const students = sheet ? sheet.students : [];
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove student
router.delete('/students/:studentId', authMiddleware, async (req, res) => {
  try {
    const sheet = await Attendance.findOne({ teacherId: req.user.id });
    if (!sheet) return res.status(404).json({ message: 'Лист не найден' });

    sheet.students = sheet.students.filter(
      s => s._id.toString() !== req.params.studentId
    );
    await sheet.save();
    res.json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rename student
router.put('/students/:studentId', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const sheet = await Attendance.findOne({ teacherId: req.user.id });
    if (!sheet) return res.status(404).json({ message: 'Лист не найден' });

    const student = sheet.students.id(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Ученик не найден' });

    student.name = name.trim();
    await sheet.save();
    res.json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Set attendance record for a student on a specific date
router.post('/students/:studentId/record', authMiddleware, async (req, res) => {
  try {
    const { date, status } = req.body;
    if (!date || !status) {
      return res.status(400).json({ message: 'Дата и статус обязательны' });
    }
    if (!['present', 'absent', 'rescheduled'].includes(status)) {
      return res.status(400).json({ message: 'Статус: present, absent, rescheduled' });
    }

    const sheet = await Attendance.findOne({ teacherId: req.user.id });
    if (!sheet) return res.status(404).json({ message: 'Лист не найден' });

    const student = sheet.students.id(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Ученик не найден' });

    // Find existing record for this date
    const existingIdx = student.records.findIndex(r => r.date === date);
    if (existingIdx >= 0) {
      // If same status, remove it (toggle off)
      if (student.records[existingIdx].status === status) {
        student.records.splice(existingIdx, 1);
      } else {
        student.records[existingIdx].status = status;
      }
    } else {
      student.records.push({ date, status });
    }

    await sheet.save();
    res.json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Bulk set records (optional: set multiple students for same date)
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { records } = req.body; // [{ studentId, date, status }]
    const sheet = await Attendance.findOne({ teacherId: req.user.id });
    if (!sheet) return res.status(404).json({ message: 'Лист не найден' });

    for (const rec of records) {
      const student = sheet.students.id(rec.studentId);
      if (!student) continue;

      const existingIdx = student.records.findIndex(r => r.date === rec.date);
      if (existingIdx >= 0) {
        student.records[existingIdx].status = rec.status;
      } else {
        student.records.push({ date: rec.date, status: rec.status });
      }
    }

    await sheet.save();
    res.json(sheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
