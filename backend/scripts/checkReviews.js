const mongoose = require('mongoose');
const Review = require('../models/Review');
require('dotenv').config();

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

const checkReviews = async () => {
  await connectDB();
  try {
    const count = await Review.countDocuments({});
    console.log('Total reviews:', count);
    const reviews = await Review.find({}).populate('userId', 'name').populate('stationId', 'name');
    console.log('Reviews:', JSON.stringify(reviews, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkReviews();
