const Slot = require('../models/Slot');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dwgwtx0jz',
  api_key: '523154331876144',
  api_secret: 'j-XAGu4EUdSjqw9tGwa85ZbQ0v0'
});

// Get all slots for a station
exports.getSlotsByStation = async (req, res) => {
    try {
        const { stationId } = req.params;
        const slots = await Slot.find({ stationId }).sort({ createdAt: -1 });
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
        const { id } = req.params; // slot id
        const { userEmail, vehicleNumber, bookingStartTime, durationHours, amountPaid, paymentMethod } = req.body;

        if (!userEmail || !vehicleNumber || !bookingStartTime || !durationHours || !amountPaid || !paymentMethod) {
            return res.status(400).json({ message: 'Missing required booking fields' });
        }

        const User = require('../models/User');
        const Vehicle = require('../models/Vehicle');
        const Slot = require('../models/Slot');
        const Station = require('../models/Station');
        const SlotBooking = require('../models/SlotBooking');

        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find vehicle by vehicleNumber and userId
        const vehicle = await Vehicle.findOne({ number: vehicleNumber, userId: user._id });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found for user' });
        }

        // Find slot by id
        const slot = await Slot.findById(id);
        if (!slot) {
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

        // Create new booking
        const newBooking = new SlotBooking({
            slotId: slot._id,
            userId: user._id,
            vehicleId: vehicle._id,
            stationId: station._id,
            bookingStartTime: startTime,
            bookingEndTime: endTime,
            amountPaid,
            paymentStatus: 'paid',
            status: 'active',
            cancelReason: null
        });

        await newBooking.save();

        // Update slot availability to Booked
        slot.availability = 'Booked';
        await slot.save();

        res.status(201).json(newBooking);
    } catch (error) {
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

        const openAt = station.openAt || '00:00';
        const closeAt = station.closeAt || '23:59';

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
        const startOfDay = new Date(`${date}T00:00:00.000Z`);
        const endOfDay = new Date(`${date}T23:59:59.999Z`);

        const bookings = await SlotBooking.find({
            stationId: id,
            status: { $in: ['reserved', 'confirmed'] },
            bookingStartTime: { $gte: startOfDay, $lt: endOfDay }
        });

        // Mark slots as booked if they overlap with existing bookings
        slots.forEach(slot => {
            const slotStart = new Date(`${date}T${slot.start_time}:00.000Z`);
            const slotEnd = new Date(`${date}T${slot.end_time}:00.000Z`);

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
