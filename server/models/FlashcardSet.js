import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  pinyin: { type: String }, // Пиньинь для китайских слов
  translation: { type: String }, // Перевод для китайских слов
  isChinese: { type: Boolean, default: false }, // Флаг китайского слова
  imageUrl: { type: String },
  audioUrl: { type: String }
});

const flashcardSetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String },
  flashcards: [flashcardSchema],
  isPublic: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  lastStudied: { type: Date },
  studyStats: {
    totalViews: { type: Number, default: 0 },
    masteryLevel: { type: Number, default: 0 }
  }
});

// Метод для импорта из текста
// Поддерживает форматы:
// - термин - определение
// - термин - пиньинь - определение (для китайских слов)
flashcardSetSchema.methods.importFromText = function(text) {
  const cards = text.split('\n')
    .filter(line => line.includes('-'))
    .map(line => {
      const parts = line.split('-').map(s => s.trim());
      
      // Определение китайских иероглифов
      const isChinese = /[\u4e00-\u9fff]/.test(parts[0]);
      
      if (parts.length >= 3 && isChinese) {
        // Формат: 你好 - nǐ hǎo - привет
        return { 
          term: parts[0], 
          pinyin: parts[1],
          definition: parts[2],
          isChinese: true
        };
      } else {
        // Обычный формат: термин - определение
        return { 
          term: parts[0], 
          definition: parts[1] || '',
          isChinese
        };
      }
    });
  
  this.flashcards = cards;
  return this;
};

export default mongoose.model('FlashcardSet', flashcardSetSchema);
