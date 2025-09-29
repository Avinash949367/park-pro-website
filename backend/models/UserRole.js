const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    preferredVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'kn', 'te'],
      default: 'en'
    }
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  favorites: [
    {
      stationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Station'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  refreshTokens: [
    {
      type: String
    }
  ],
  lastLogin: {
    type: Date,
    default: null
  },
  dateOfBirth: {
    type: String,
    default: 'n/a'
  },
  gender: {
    type: String,
    default: 'n/a'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserRole', userRoleSchema);
