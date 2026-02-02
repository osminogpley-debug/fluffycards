import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  color: { 
    type: String, 
    default: '#63b3ed' 
  },
  sets: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FlashcardSet' 
  }],
  isPublic: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

export default mongoose.model('Folder', folderSchema);
