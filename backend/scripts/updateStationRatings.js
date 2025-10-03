const mongoose = require('mongoose');
const Station = require('../models/Station');

async function updateStationRatings() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/parkpro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all stations
    const stations = await Station.find({});
    console.log(`Found ${stations.length} stations`);

    for (const station of stations) {
      // Check if rating and reviewCount are missing or need update
      if (station.rating === undefined || station.reviewCount === undefined) {
        console.log(`Updating station ${station._id} (${station.name})`);
        await Station.findByIdAndUpdate(station._id, {
          rating: station.rating || 0,
          reviewCount: station.reviewCount || 0
        });
      }
    }

    console.log('Station ratings update completed');

  } catch (error) {
    console.error('Error updating station ratings:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateStationRatings();
