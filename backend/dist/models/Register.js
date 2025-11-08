const mongoose = require('mongoose');

const RegisterSchema = new mongoose.Schema({
    registrationId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    googleMapLocation: {
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
    stationName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'doc-processing', 'active'],
        default: 'pending'
    },
    approvedBy: {
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
    }
}, {
    timestamps: true
});

// Pre-save hook to generate registration ID


module.exports = mongoose.model('Register', RegisterSchema);
