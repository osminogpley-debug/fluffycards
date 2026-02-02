import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  definition: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  example: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true,
    match: [/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/, 'is invalid']
  },
  audioUrl: {
    type: String,
    trim: true,
    match: [/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/, 'is invalid']
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  lastReviewed: Date,
  correctAnswers: {
    type: Number,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    default: 0
  },
  flashcardSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardSet',
    required: true
  }
}, { timestamps: true });

// Virtual for success rate
flashcardSchema.virtual('successRate').get(function() {
  const total = this.correctAnswers + this.wrongAnswers;
  return total > 0 ? Math.round((this.correctAnswers / total) * 100) : 0;
});

export default mongoose.model('Flashcard', flashcardSchema);
