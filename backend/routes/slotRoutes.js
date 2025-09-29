const express = require('express');
const router = express.Router();
const passport = require('passport');
const slotController = require('../controllers/slotController');

// Get all slots for a station
router.get('/station/:stationId', slotController.getSlotsByStation);

// Create a new slot
router.post('/', slotController.createSlot);

// Update a slot
router.put('/:id', slotController.updateSlot);

// Delete a slot
router.delete('/:id', slotController.deleteSlot);

// Get bookings for a slot
router.get('/:id/bookings', slotController.getSlotBookings);

// Create a new booking for a slot
router.post('/:id/bookings', slotController.createBooking);

// Delete image from Cloudinary
router.delete('/delete-image', slotController.deleteImage);

// Get station availability for a date
router.get('/stations/:id/availability', slotController.getStationAvailability);

// Reserve a booking
router.post('/bookings/reserve', passport.authenticate('jwt', { session: false }), slotController.reserveBooking);

// Verify payment
router.post('/payments/verify', slotController.verifyPayment);

module.exports = router;
