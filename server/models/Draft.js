import mongoose from 'mongoose';

const DraftCardSchema = new mongoose.Schema({
  id: { type: String },
  term: { type: String, default: '' },
  definition: { type: String, default: '' },
  pinyin: { type: String, default: '' },
  translation: { type: String, default: '' },
  imageUrl: { type: String, default: '' }
}, { _id: false });

const DraftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  setId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet', default: null },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  isPublic: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  clozeText: { type: String, default: '' },
  clozeBlanks: {
    type: [
      {
        start: { type: Number, required: true },
        end: { type: Number, required: true },
        answer: { type: String, required: true }
      }
    ],
    default: []
  },
  cards: { type: [DraftCardSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

DraftSchema.index({ user: 1, setId: 1 }, { unique: true });

export default mongoose.model('Draft', DraftSchema);
