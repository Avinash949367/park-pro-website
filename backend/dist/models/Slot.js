const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotId: {
    type: String,
    unique: true,
    required: true
  },
  stationId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Car', 'Bike', 'Van'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Enabled', 'Disabled'],
    default: 'Enabled'
  },
  availability: {
    type: String,
    enum: ['Free', 'Booked'],
    default: 'Free'
  },
  images: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
slotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Slot', slotSchema);
