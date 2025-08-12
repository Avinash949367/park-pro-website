const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const adminController = require('../controllers/adminController');

// Registration routes
router.post('/register', registerController.registerStation);
router.get('/pending', adminController.getPendingRegistrations);
router.get('/all', adminController.getAllRegistrations);
router.put('/approve/:id', adminController.approveRegistration);
router.put('/reject/:id', adminController.rejectRegistration);
router.put('/accept/:id', adminController.acceptRegistration);
router.get('/stats', adminController.getRegistrationStats);

module.exports = router;
