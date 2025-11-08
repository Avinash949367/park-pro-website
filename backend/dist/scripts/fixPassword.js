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

const fixUserPassword = async () => {
  try {
    await connectDB();
    
    // Find the user with email parkproplus@gmail.com
    const User = require('../models/User');
    const user = await User.findOne({ email: 'parkproplus@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Current password hash:', user.password);
    
    // Re-hash the correct password "1234" properly
    const correctPassword = '1234';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('Password fixed successfully for user:', user.email);
    console.log('New password hash:', user.password);
    
    // Verify the fix works
    const isMatch = await bcrypt.compare(correctPassword, user.password);
    console.log('Password verification test:', isMatch);
    
    process.exit(0);
  } catch (err) {
    console.error('Error fixing password:', err);
    process.exit(1);
  }
};

fixUserPassword();
