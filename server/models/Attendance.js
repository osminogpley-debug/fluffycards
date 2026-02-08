import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'rescheduled'],
    required: true
  }
});

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  records: [attendanceRecordSchema]
});

const attendanceSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Посещаемость'
  },
  students: [studentSchema]
}, {
  timestamps: true
});

// Index for fast lookup
attendanceSchema.index({ teacherId: 1 });

export default mongoose.model('Attendance', attendanceSchema);
