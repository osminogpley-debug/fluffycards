// Script to make a user admin
// Usage: node scripts/makeAdmin.js <email>

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const makeAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`✅ User "${user.username}" (${email}) is now ADMIN`);
    } else {
      console.log(`❌ User with email "${email}" not found`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/makeAdmin.js <email>');
  console.log('Example: node scripts/makeAdmin.js admin@example.com');
  process.exit(1);
}

makeAdmin(email);
