import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './src/models/user.model.js'; // Update path if needed

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ashiverma1758:PMLV8CNEUsjMP6nj@cluster0.rearyv8.mongodb.net';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('📡 Connected to MongoDB Atlas');

    const existingAdmin = await User.findOne({ email: 'johnnn@university.edu' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.email);
      await mongoose.disconnect();
      return;
    }


    const admin = new User({
      
  firstName: "John",
  lastName: "Doe",
  email: "johnnn@university.edu",
  university: "Stanford University",
  academicYear: "3rd Year",
  major: "Computer Science",
  password: "SecurePass123!",
  role:"admin"

    });
await admin.save(); // Pre-save will hash the password here
    console.log('✅ Admin user added successfully:', admin.email);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Error adding admin:', err.message);
  }
}

createAdmin();
