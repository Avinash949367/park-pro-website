const mongoose = require('mongoose');
const StoreAdminCredentials = require('../models/StoreAdminCredentials');
const Station = require('../models/Station');

async function setStationIdForStoreAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/parkpro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const email = 'avinash46479@gmail.com';

    // Find the credentials
    const credentials = await StoreAdminCredentials.findOne({ email });
    if (!credentials) {
      console.log('Store admin credentials not found for email:', email);
      return;
    }

    console.log('Current credentials:', credentials);

    if (credentials.stationId) {
      console.log('StationId already set:', credentials.stationId);
      return;
    }

    // Find an active station to assign
    const station = await Station.findOne({ status: 'active' });
    if (!station) {
      console.log('No active station found to assign');
      return;
    }

    console.log('Assigning station:', station._id, station.stationId);

    // Set stationId
    credentials.stationId = station._id;
    await credentials.save();

    console.log('StationId set successfully for email:', email);

  } catch (error) {
    console.error('Error setting stationId:', error);
  } finally {
    mongoose.connection.close();
  }
}

setStationIdForStoreAdmin();
