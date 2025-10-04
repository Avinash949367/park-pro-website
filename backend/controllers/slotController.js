const Slot = require('../models/Slot');
const cloudinary = require('cloudinary').v2;
const { sendBookingConfirmationEmail } = require('../services/emailService');

cloudinary.config({
  cloud_name: 'dwgwtx0jz',
  api_key: '523154331876144',
  api_secret: 'j-XAGu4EUdSjqw9tGwa85ZbQ0v0'
});

// Get all slots for a station
exports.getSlotsByStation = async (req, res) => {
    try {
        const { stationId } = req.params;
        const Station = require('../models/Station');

        // Find station by stationId string field
        const station = await Station.findOne({ stationId: stationId });
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        // Query slots by station._id
        const slots = await Slot.find({ stationId: station._id.toString() }).sort({ createdAt: -1 });
        res.status(200).json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new slot
exports.createSlot = async (req, res) => {
    try {
        const { stationId, type, price, images } = req.body;
        if (!stationId || !type || price === undefined) {
            return res.status(400).json({ message: 'stationId, type and price are required' });
        }
        // Generate unique slotId with retry to avoid duplicates
        let slotId;
        let retryCount = 0;
        
        const maxRetries = 5;
        while (retryCount < maxRetries) {
            const slotCount = await Slot.countDocuments({ stationId });
            // Generate short slotId in format slxxx where xxx is a zero-padded number
            const numberPart = (slotCount + 1 + retryCount).toString().padStart(3, '0');
            slotId = `sl${numberPart}`;
            const existingSlot = await Slot.findOne({ slotId });
            if (!existingSlot) {
                break;
            }
            retryCount++;
        }
        if (retryCount === maxRetries) {
            return res.status(500).json({ message: 'Failed to generate unique slotId, please try again later.' });
        }

        const newSlot = new Slot({
            slotId,
            stationId,
            type,
            price,
            status: 'Enabled',
            availability: 'Free',
            images: images || []
        });
        await newSlot.save();
        res.status(201).json(newSlot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update slot details
exports.updateSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, price, status, availability, image, images } = req.body;

        const slot = await Slot.findById(id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        if (type) slot.type = type;
        if (price !== undefined) slot.price = price;
        if (status) slot.status = status;
        if (availability) slot.availability = availability;
        if (image !== undefined) slot.image = image;
        if (images !== undefined) slot.images = images;

        await slot.save();
        res.status(200).json(slot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a slot
exports.deleteSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const slot = await Slot.findByIdAndDelete(id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }
        res.status(200).json({ message: 'Slot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get bookings for a slot
exports.getSlotBookings = async (req, res) => {
    try {
        const { id } = req.params;
        const SlotBooking = require('../models/SlotBooking');
        const bookings = await SlotBooking.find({ slotId: id }).populate('userId', 'name email').populate('vehicleId', 'number').sort({ bookingStartTime: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new booking for a slot
exports.createBooking = async (req, res) => {
    try {
        const { id } = req.params; // slot id from URL
        const { slotId, bookingStartTime, durationHours, vehicleId, paymentMethod, amountPaid } = req.body;

        console.log('Create booking request:', {
            paramsId: id,
            bodySlotId: slotId,
            bookingStartTime,
            durationHours,
            vehicleId,
            paymentMethod,
            amountPaid,
            user: req.user ? req.user.id : 'No user'
        });

        if (!slotId || !bookingStartTime || !durationHours || !vehicleId || !paymentMethod) {
            return res.status(400).json({ message: 'Missing required booking fields' });
        }

        // Validate payment method
        if (!['upi', 'coupon'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        // For coupon payments, validate that amount is 0 and payment method is coupon
        if (paymentMethod === 'coupon' && amountPaid !== 0) {
            return res.status(400).json({ message: 'Coupon bookings must have amountPaid of 0' });
        }

        // For UPI payments, amount must be greater than 0
        if (paymentMethod === 'upi' && amountPaid <= 0) {
            return res.status(400).json({ message: 'UPI payments must have amountPaid greater than 0' });
        }

        const User = require('../models/User');
        const Vehicle = require('../models/Vehicle');
        const Slot = require('../models/Slot');
        const Station = require('../models/Station');
        const SlotBooking = require('../models/SlotBooking');

        // Get user from JWT token (assuming authentication middleware sets req.user)
        if (!req.user || !req.user.id) {
            console.log('Authentication failed: No req.user or req.user.id');
            return res.status(401).json({ message: 'Authentication required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found for id:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }

        // Find vehicle by vehicleId
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            console.log('Vehicle not found for id:', vehicleId);
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Verify vehicle belongs to user
        if (vehicle.userId.toString() !== user._id.toString()) {
            console.log('Vehicle does not belong to user:', vehicle.userId, 'vs', user._id);
            return res.status(403).json({ message: 'Vehicle does not belong to user' });
        }

        // Find slot by id
        const slot = await Slot.findById(slotId);
        if (!slot) {
            console.log('Slot not found for id:', slotId);
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Find station by slot.stationId - try both stationId field and _id
        let station = await Station.findOne({ stationId: slot.stationId });
        if (!station) {
            // If not found by stationId, try finding by _id
            station = await Station.findById(slot.stationId);
        }
        if (!station) {
            console.log('Slot stationId:', slot.stationId);
            console.log('Available stations by stationId:', await Station.find({}, 'stationId name').limit(5));
            console.log('Available stations by _id:', await Station.find({}, '_id stationId name').limit(5));
            return res.status(404).json({ message: `Station not found for slot. Slot stationId: ${slot.stationId}` });
        }

        // Calculate booking end time
        const startTime = new Date(bookingStartTime);
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        // Validate booking times are within operating hours (10:00 to 23:00)
        const bookingDate = startTime.toISOString().split('T')[0]; // YYYY-MM-DD
        const operatingStart = new Date(`${bookingDate}T10:00:00`);
        const operatingEnd = new Date(`${bookingDate}T23:00:00`);

        if (startTime < operatingStart || endTime > operatingEnd) {
            return res.status(400).json({ message: 'Bookings are only allowed between 10:00 AM and 11:00 PM' });
        }

        // Check for overlapping bookings
        const overlappingBookings = await SlotBooking.find({
            slotId: slot._id,
            status: { $in: ['active', 'confirmed'] },
            bookingStartTime: { $lt: endTime },
            bookingEndTime: { $gt: startTime }
        });

        if (overlappingBookings.length > 0) {
            return res.status(409).json({ message: 'Slot is not available for the selected time' });
        }

        console.log('Creating booking with:', {
            slotId: slot._id,
            userId: user._id,
            vehicleId: vehicle._id,
            stationId: station._id,
            startTime,
            endTime,
            amountPaid,
            paymentMethod
        });

        // Create new booking
        const newBooking = new SlotBooking({
            slotId: slot._id,
            userId: user._id,
            vehicleId: vehicle._id,
            stationId: station._id,
            bookingStartTime: startTime,
            bookingEndTime: endTime,
            amountPaid,
            paymentMethod,
            paymentStatus: paymentMethod === 'coupon' ? 'success' : 'paid',
            status: 'active',
            cancelReason: null
        });

        await newBooking.save();

        console.log('Booking created successfully:', newBooking._id);

        // Send booking confirmation email with map link
        try {
            let destination = 's1'; // default
            if (slot.slotId === 'SLOT68c03af1ce3e59677c77fd97-3') destination = 's1';
            else if (slot.slotId === 'SLOT68c03af1ce3e59677c77fd97-2') destination = 's2';
            else if (slot.slotId === 'SLOT68c03af1ce3e59677c77fd97-4') destination = 's3';
            else if (slot.slotId === 'sl004') destination = 's4';

            const mapUrl = `http://localhost:3000/StationAdmin/cursor_ai_map/map.html?source=start&destination=${destination}`;

            const bookingDetails = {
                slotId: slot.slotId,
                startTime: startTime.toLocaleString(),
                endTime: endTime.toLocaleString(),
                amountPaid: amountPaid,
                vehicleNumber: vehicle.number
            };

            await sendBookingConfirmationEmail(user.email, user.name, bookingDetails, mapUrl);
        } catch (emailError) {
            console.error('Error sending booking confirmation email:', emailError);
            // Don't fail the booking if email fails
        }

        // Slot remains available for other bookings, only specific hours are booked
        res.status(201).json({ booking: newBooking, message: 'Booking created successfully' });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete image from Cloudinary
exports.deleteImage = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'Image URL is required' });
        }
        // Extract public_id from URL
        const urlParts = url.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            res.status(200).json({ message: 'Image deleted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to delete image' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get slot availability for a date
exports.getSlotAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
        }

        const Station = require('../models/Station');
        const SlotBooking = require('../models/SlotBooking');

        const slot = await Slot.findById(id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Find station by slot.stationId
        const station = await Station.findById(slot.stationId);
        if (!station) {
            return res.status(404).json({ message: 'Station not found for slot' });
        }

        // Fixed opening hours to 10:00 to 23:00
        const openAt = '10:00';
        const closeAt = '23:00';

        // Parse opening and closing times
        const [openHour, openMin] = openAt.split(':').map(Number);
        const [closeHour, closeMin] = closeAt.split(':').map(Number);

        // Generate 1-hour slots
        const slots = [];
        let currentHour = openHour;
        let currentMin = openMin;

        while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
            const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            const endHour = currentHour + 1;
            const endMin = currentMin;
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

            slots.push({
                time: startTime,
                available: true
            });

            currentHour = endHour;
            currentMin = endMin;
        }

        // Check existing bookings for the date and slot
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        const bookings = await SlotBooking.find({
            slotId: id,
            status: { $in: ['active', 'confirmed'] },
            bookingStartTime: { $gte: startOfDay, $lt: endOfDay }
        });

        // Mark slots as booked if they overlap with existing bookings
        slots.forEach(slotItem => {
            const slotStart = new Date(`${date}T${slotItem.time}:00`);
            const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour later

            bookings.forEach(booking => {
                if (booking.bookingStartTime < slotEnd && booking.bookingEndTime > slotStart) {
                    slotItem.available = false;
                }
            });
        });

        res.status(200).json({ hourlySlots: slots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get station availability for a date
exports.getStationAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
        }

        const Station = require('../models/Station');
        const SlotBooking = require('../models/SlotBooking');

        const station = await Station.findById(id);
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        // Default opening hours to 10:00 to 23:00 if not set
        const openAt = station.openAt || '10:00';
        const closeAt = station.closeAt || '23:00';

        // Parse opening and closing times
        const [openHour, openMin] = openAt.split(':').map(Number);
        const [closeHour, closeMin] = closeAt.split(':').map(Number);

        // Generate 1-hour slots
        const slots = [];
        let currentHour = openHour;
        let currentMin = openMin;

        while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
            const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            const endHour = currentHour + 1;
            const endMin = currentMin;
            const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

            slots.push({
                start_time: startTime,
                end_time: endTime,
                available: true
            });

            currentHour = endHour;
            currentMin = endMin;
        }

        // Check existing bookings for the date
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        const bookings = await SlotBooking.find({
            stationId: id,
            status: { $in: ['reserved', 'confirmed'] },
            bookingStartTime: { $gte: startOfDay, $lt: endOfDay }
        });

        // Mark slots as booked if they overlap with existing bookings
        slots.forEach(slot => {
            const slotStart = new Date(`${date}T${slot.start_time}:00`);
            const slotEnd = new Date(`${date}T${slot.end_time}:00`);

            bookings.forEach(booking => {
                if (booking.bookingStartTime < slotEnd && booking.bookingEndTime > slotStart) {
                    slot.available = false;
                }
            });
        });

        res.status(200).json({ slots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reserve a booking
exports.reserveBooking = async (req, res) => {
    try {
        const { station_id, start_time, end_time, amount } = req.body;

        if (!station_id || !start_time || !end_time || !amount) {
            return res.status(400).json({ message: 'station_id, start_time, end_time, and amount are required' });
        }

        // Assume user is authenticated, get userId from req.user
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const User = require('../models/User');
        const Vehicle = require('../models/Vehicle');
        const Station = require('../models/Station');
        const SlotBooking = require('../models/SlotBooking');

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // For simplicity, use the first vehicle of the user
        const vehicle = await Vehicle.findOne({ userId: user._id });
        if (!vehicle) {
            return res.status(404).json({ message: 'No vehicle found for user' });
        }

        const station = await Station.findById(station_id);
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        // Generate reservation_id (booking id)
        const reservationId = 'B' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

        // Calculate reservation expires at (10 minutes from now)
        const reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Create booking with status reserved
        const newBooking = new SlotBooking({
            slotId: null, // No specific slot, just time slot
            userId: user._id,
            vehicleId: vehicle._id,
            stationId: station._id,
            bookingStartTime: new Date(start_time),
            bookingEndTime: new Date(end_time),
            amountPaid: amount,
            paymentStatus: 'pending',
            status: 'reserved',
            reservationExpiresAt
        });

        await newBooking.save();

        // Generate UPI payment payload
        const upiString = `upi://pay?pa=merchant@upi&pn=${station.name}&am=${amount}&tn=BookingSlot&tr=${reservationId}`;

        res.status(201).json({
            reservation_id: reservationId,
            payment_payload: upiString
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
    try {
        const { reservation_id, txn_id, status } = req.body;

        if (!reservation_id || !txn_id || !status) {
            return res.status(400).json({ message: 'reservation_id, txn_id, and status are required' });
        }

        const SlotBooking = require('../models/SlotBooking');
        const Payment = require('../models/Payment');

        // Find booking by reservation_id (assuming reservation_id is stored or can be derived)
        // For simplicity, assume reservation_id is the booking _id or we can search by some field
        // Since we don't have a reservation_id field, we'll assume it's the booking id
        const booking = await SlotBooking.findById(reservation_id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'reserved') {
            return res.status(400).json({ message: 'Booking is not in reserved state' });
        }

        // Create payment record
        const payment = new Payment({
            id: 'P' + Date.now(),
            bookingId: booking._id,
            amount: booking.amountPaid,
            method: 'UPI',
            txnId: txn_id,
            status: status
        });

        await payment.save();

        // Update booking status
        if (status === 'success') {
            booking.status = 'confirmed';
            booking.paymentStatus = 'success';
        } else {
            booking.status = 'cancelled';
            booking.paymentStatus = 'failed';
        }

        await booking.save();

        res.status(200).json({ message: 'Payment verified and booking updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get dashboard stats for station admin
exports.getDashboardStats = async (req, res) => {
    try {
        const { stationId } = req.params;
        console.log('getDashboardStats called with stationId:', stationId);

        if (!stationId) {
            return res.status(400).json({ message: 'Station ID is required' });
        }

        const SlotBooking = require('../models/SlotBooking');
        const Station = require('../models/Station');

        // Find the station by stationId string field
        const station = await Station.findOne({ stationId: stationId });
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }
        const stationObjectId = station._id;
        console.log('Station found, ObjectId:', stationObjectId);

        // Get total slots for the station
        const totalSlots = await Slot.countDocuments({ stationId: stationObjectId.toString() });
        console.log('Total slots:', totalSlots);

        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Get slots booked today (active/confirmed bookings)
        const slotsBookedToday = await SlotBooking.countDocuments({
            stationId: stationObjectId,
            status: { $in: ['active', 'confirmed'] },
            bookingStartTime: { $gte: startOfDay, $lt: endOfDay }
        });
        console.log('Slots booked today:', slotsBookedToday);

        // Get revenue today (sum of amountPaid for today's bookings)
        const revenueTodayResult = await SlotBooking.aggregate([
            {
                $match: {
                    stationId: stationObjectId,
                    status: { $in: ['active', 'confirmed'] },
                    bookingStartTime: { $gte: startOfDay, $lt: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amountPaid' }
                }
            }
        ]);

        const revenueToday = revenueTodayResult.length > 0 ? revenueTodayResult[0].total : 0;
        console.log('Revenue today:', revenueToday);

        // Get total earnings (sum of all amountPaid for the station)
        const totalEarningsResult = await SlotBooking.aggregate([
            {
                $match: {
                    stationId: stationObjectId,
                    status: { $in: ['active', 'confirmed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amountPaid' }
                }
            }
        ]);

        const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;
        console.log('Total earnings:', totalEarnings);

        res.status(200).json({
            totalSlots,
            slotsBookedToday,
            revenueToday,
            totalEarnings
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get recent bookings for station admin
exports.getRecentBookings = async (req, res) => {
    try {
        const { stationId } = req.params;
        const { limit = 10 } = req.query;
        console.log('getRecentBookings called with stationId:', stationId);

        if (!stationId) {
            return res.status(400).json({ message: 'Station ID is required' });
        }

        const SlotBooking = require('../models/SlotBooking');
        const Station = require('../models/Station');

        // Find the station by stationId string field
        const station = await Station.findOne({ stationId: stationId });
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }
        const stationObjectId = station._id;
        console.log('Station found, ObjectId:', stationObjectId);

        // Get recent bookings with populated user and vehicle data
        const recentBookings = await SlotBooking.find({
            stationId: stationObjectId,
            status: { $in: ['active', 'confirmed'] }
        })
        .populate('userId', 'name email')
        .populate('vehicleId', 'number')
        .populate('slotId', 'slotId')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

        console.log('Recent bookings found:', recentBookings.length);

        // Format the response
        const formattedBookings = recentBookings.map(booking => ({
            bookingId: booking._id,
            userName: booking.userId ? booking.userId.name : 'Unknown',
            vehicleNumber: booking.vehicleId ? booking.vehicleId.number : 'Unknown',
            slotNo: booking.slotId ? booking.slotId.slotId : 'Unknown',
            time: booking.bookingStartTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            duration: `${Math.ceil((booking.bookingEndTime - booking.bookingStartTime) / (1000 * 60 * 60))} hours`,
            amount: booking.amountPaid,
            status: booking.status
        }));

        res.status(200).json(formattedBookings);
    } catch (error) {
        console.error('Error in getRecentBookings:', error);
        res.status(500).json({ message: error.message });
    }
};
