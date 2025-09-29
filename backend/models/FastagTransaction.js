const mongoose = require('mongoose');

const fastagTransactionSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  txnId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['recharge', 'deduction'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['upi', 'card', 'wallet', 'auto-deduction'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FastagTransaction', fastagTransactionSchema);
