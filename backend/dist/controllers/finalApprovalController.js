const Register = require('../models/Register');
const Station = require('../models/Station');
const StoreAdminCredentials = require('../models/StoreAdminCredentials');
const { sendFinalApprovalEmail } = require('../services/emailService');
const crypto = require('crypto');

// Generate unique station ID
const generateStationId = () => {
  const prefix = 'STN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Generate unique password
const generatePassword = () => {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Final approve registration - doc-processing → active
exports.finalApproveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    // Validate input
    if (!id || !approvedBy) {
      return res.status(400).json({ 
        message: 'Missing required parameters: id and approvedBy are required' 
      });
    }

    const registration = await Register.findById(id);
    if (!registration) {
      return res.status(404).json({ 
        message: 'Registration not found',
        registrationId: id 
      });
    }

    if (registration.status !== 'doc-processing') {
      return res.status(400).json({ 
        message: 'Registration is not in doc-processing status',
        currentStatus: registration.status,
        requiredStatus: 'doc-processing'
      });
    }

    // Check if already processed
    if (registration.status === 'active') {
      return res.status(400).json({ 
        message: 'Registration has already been approved',
        registrationId: registration.registrationId 
      });
    }

    // Generate unique station ID
    const stationId = generateStationId();
    
    // Create station entry
    const station = new Station({
      stationId,
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      address: registration.address,
      city: registration.city,
      state: registration.state,
      zip: registration.zip,
      country: registration.country,
      googleMapLocation: registration.googleMapLocation,
      stationName: registration.stationName,
      latitude: registration.latitude,
      longitude: registration.longitude,
      slots: registration.slots,
      price: registration.price,
      reason: registration.reason,
      status: 'active',
      registrationId: registration.registrationId,
      approvedBy,
      adminName: approvedBy, // Set adminName to the same as approvedBy
      approvedAt: new Date()
    });

    await station.save();

    // Generate login credentials
    const password = generatePassword();
    
    // Check if store admin credentials already exist
    let credentials = await StoreAdminCredentials.findOne({ email: registration.email });
    
    if (credentials) {
      // Update existing credentials
      credentials.stationId = station._id;
      credentials.password = password;
      await credentials.save();
    } else {
      // Create new store admin credentials
      credentials = new StoreAdminCredentials({
        stationId: station._id,
        email: registration.email,
        password: password
      });
      await credentials.save();
    }

    // Update registration status
    registration.status = 'active';
    registration.approvedBy = approvedBy;
    registration.approvedAt = new Date();

    // Handle field name migration: if adminName exists but stationName doesn't, migrate it
    if (registration.adminName && !registration.stationName) {
      registration.stationName = registration.adminName;
      // Remove the old field if it exists
      if (registration.adminName !== undefined) {
        registration.adminName = undefined;
      }
    }

    await registration.save();

    // Send final approval email with credentials
    try {
      await sendFinalApprovalEmail(
        registration.email,
        registration.name,
        registration.registrationId,
        registration.email,
        password
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the entire operation if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Registration approved and station activated successfully',
      station: {
        stationId: station.stationId,
        name: station.name,
        email: station.email,
        status: station.status
      },
      credentials: {
        email: registration.email,
        password: password
      }
    });
  } catch (error) {
    console.error('Error in finalApproveRegistration:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Reject registration with reason
exports.rejectRegistrationWithReason = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectedBy, rejectionReason } = req.body;

    if (!id || !rejectedBy || !rejectionReason) {
      return res.status(400).json({ 
        message: 'Missing required parameters: id, rejectedBy, and rejectionReason are required' 
      });
    }

    const registration = await Register.findById(id);
    if (!registration) {
      return res.status(404).json({ 
        message: 'Registration not found',
        registrationId: id 
      });
    }

    if (registration.status !== 'doc-processing') {
      return res.status(400).json({ 
        message: 'Registration is not in doc-processing status',
        currentStatus: registration.status 
      });
    }

    registration.status = 'rejected';
    registration.approvedBy = rejectedBy;
    registration.rejectedAt = new Date();
    registration.rejectionReason = rejectionReason;

    // Handle field name migration: if adminName exists but stationName doesn't, migrate it
    if (registration.adminName && !registration.stationName) {
      registration.stationName = registration.adminName;
      // Remove the old field if it exists
      if (registration.adminName !== undefined) {
        registration.adminName = undefined;
      }
    }

    await registration.save();

    try {
      await sendFinalApprovalEmail(
        registration.email,
        registration.name,
        rejectionReason
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Registration rejected successfully',
      registration: {
        registrationId: registration.registrationId,
        status: registration.status,
        rejectionReason: registration.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error in rejectRegistrationWithReason:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get stations with doc-processing status
exports.getDocProcessingStations = async (req, res) => {
  try {
    const stations = await Register.find({ status: 'doc-processing' })
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: stations.length,
      stations
    });
  } catch (error) {
    console.error('Error in getDocProcessingStations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};
