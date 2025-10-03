const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
reviewSchema.index({ stationId: 1, date: -1 });
reviewSchema.index({ userId: 1, stationId: 1 }, { unique: true }); // One review per user per station

module.exports = mongoose.model('Review', reviewSchema);
