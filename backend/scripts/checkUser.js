const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb+srv://avinash:949367%40Sv@park-pro.rxeddmo.mongodb.net/?retryWrites=true&w=majority&appName=park-pro";
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

const checkUserPassword = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB successfully');
    
    // Find the user with email parkproplus@gmail.com
    console.log('Looking for user: parkproplus@gmail.com');
    const User = require('../models/User');
    const user = await User.findOne({ email: 'parkproplus@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      // List all users to see what's in the database
      const allUsers = await User.find({});
      console.log('All users in database:', allUsers);
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Current password hash:', user.password);
    console.log('User role:', user.role);
    console.log('Is confirmed:', user.isConfirmed);
    
    // Test password comparison
    const testPassword = '1234';
    console.log('Testing password:', testPassword);
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('Password "1234" matches:', isMatch);
    
    // Test with wrong password
    const wrongPassword = 'wrongpassword';
    const isWrongMatch = await bcrypt.compare(wrongPassword, user.password);
    console.log('Password "wrongpassword" matches:', isWrongMatch);
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking user:', err);
    console.error('Error stack:', err.stack);
    process.exit(1);
  }
};

checkUserPassword();
