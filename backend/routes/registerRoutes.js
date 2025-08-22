const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const adminController = require('../controllers/adminController');
const finalApprovalController = require('../controllers/finalApprovalController');

// Registration routes
router.post('/register', registerController.registerStation);
router.get('/pending', adminController.getPendingRegistrations);
router.get('/all', adminController.getAllRegistrations);
router.put('/approve/:id', adminController.approveRegistration);
router.put('/reject/:id', adminController.rejectRegistration);
router.put('/accept/:id', adminController.acceptRegistration);
router.get('/stats', adminController.getRegistrationStats);

// Get registrations by status
router.get('/status/:status', registerController.getRegistrationsByStatus);
router.get('/doc-processing', finalApprovalController.getDocProcessingStations);

// Get detailed registration with media
router.get('/:id/details', registerController.getRegistrationDetails);

// Update address and location details
router.post('/update-address', registerController.updateAddress);

// Final approval routes
router.put('/final-approve/:id', finalApprovalController.finalApproveRegistration);
router.put('/final-reject/:id', finalApprovalController.rejectRegistrationWithReason);

module.exports = router;
