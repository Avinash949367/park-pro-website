const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zip: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  googleMapLocation: {
    type: String,
    required: false,
    default: null
  },
  stationName: {
    type: String,
    required: false,
    default: null
  },
  slots: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: [ 'active', 'inactive' ],
    default: 'received'
  },
  registrationId: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    default: null
  },
  adminName: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  // GPS Structure Data
  gpsStructure: {
    boundary: [{
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }],
    entry: {
      lat: { type: Number },
      lng: { type: Number }
    },
    exit: {
      lat: { type: Number },
      lng: { type: Number }
    },
    slots: [{
      id: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
      reason: { type: String, default: null }
    }],
    walls: [[{
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }]],
    roads: [[{
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }]]
  },
  // Station Status
  gpsMappingStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'submitted_for_approval', 'approved', 'rejected'],
    default: 'not_started'
  },
  publicVisibility: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  openAt: {
    type: String,
    default: '00:00'
  },
  closeAt: {
    type: String,
    default: '23:59'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  }
});

// Update the updatedAt field before saving
stationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Station', stationSchema);
