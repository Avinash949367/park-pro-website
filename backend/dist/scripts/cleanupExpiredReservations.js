const mongoose = require('mongoose');
const SlotBooking = require('../models/SlotBooking');

async function cleanupExpiredReservations() {
  try {
    const now = new Date();

    // Find all bookings with status 'reserved' and reservationExpiresAt < now
    const expiredBookings = await SlotBooking.find({
      status: 'reserved',
      reservationExpiresAt: { $lt: now }
    });

    if (expiredBookings.length > 0) {
      // Update status to 'expired'
      await SlotBooking.updateMany(
        {
          status: 'reserved',
          reservationExpiresAt: { $lt: now }
        },
        {
          status: 'expired',
          cancelReason: 'timeout'
        }
      );

      console.log(`Cleaned up ${expiredBookings.length} expired reservations`);
    } else {
      console.log('No expired reservations to clean up');
    }
  } catch (error) {
    console.error('Error cleaning up expired reservations:', error);
  }
}

module.exports = cleanupExpiredReservations;
