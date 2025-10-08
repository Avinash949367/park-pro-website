const mongoose = require('mongoose');
const SlotBooking = require('./backend/models/SlotBooking');
const Payment = require('./backend/models/Payment');
const User = require('./backend/models/User');
const Vehicle = require('./backend/models/Vehicle');
const Station = require('./backend/models/Station');
const Slot = require('./backend/models/Slot');

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/parkpro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create test user
    const user = new User({
      name: 'Test User',
      email: 'testuser@gmail.com',
      password: '$2a$10$hashedpassword', // dummy hash
      role: 'user'
    });
    const savedUser = await user.save();
    console.log('Test user created:', savedUser._id);

    // Create test vehicle
    const vehicle = new Vehicle({
      userId: savedUser._id,
      number: 'KA01AB1234',
      type: 'car'
    });
    const savedVehicle = await vehicle.save();
    console.log('Test vehicle created:', savedVehicle._id);

    // Create test station
    const station = new Station({
      name: 'Test Station',
      stationId: 'ST001',
      location: 'Test Location',
      capacity: '10',
      mobile: '1234567890',
      email: 'test@station.com',
      maplink: 'https://maps.google.com',
      apartment: 'Test Mall',
      size: 'Medium',
      facilities: 'Parking',
      status: 'active',
      registrationId: 'REG001',
      reason: 'Test',
      price: '100',
      slots: '10',
      country: 'India',
      zip: '560001',
      state: 'Karnataka',
      city: 'Bangalore',
      address: 'Test Address',
      phone: '1234567890'
    });
    const savedStation = await station.save();
    console.log('Test station created:', savedStation._id);

    // Create test slot
    const slot = new Slot({
      slotId: 'SL001',
      stationId: savedStation.stationId,
      type: 'car',
      price: 50,
      status: 'Enabled',
      availability: 'Free'
    });
    const savedSlot = await slot.save();
    console.log('Test slot created:', savedSlot._id);

    // Create test booking
    const booking = new SlotBooking({
      slotId: savedSlot._id,
      userId: savedUser._id,
      vehicleId: savedVehicle._id,
      stationId: savedStation._id,
      bookingStartTime: new Date(),
      bookingEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
      amountPaid: 100,
      paymentMethod: 'upi',
      paymentStatus: 'pending',
      status: 'reserved'
    });
    const savedBooking = await booking.save();
    console.log('Test booking created:', savedBooking._id);

    // Create test payment
    const payment = new Payment({
      id: 'TXN001',
      bookingId: savedBooking._id,
      amount: 100,
      method: 'upi',
      txnId: 'UPI123456',
      status: 'pending'
    });
    const savedPayment = await payment.save();
    console.log('Test payment created:', savedPayment._id);

    console.log('Test data created successfully!');
    console.log('Booking ID:', savedBooking._id);
    console.log('Payment ID:', savedPayment._id);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestData();
