const mongoose = require('mongoose');
const Station = require('../models/Station');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parkpro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update adminName field for existing stations
const updateAdminNames = async () => {
  try {
    console.log('Starting adminName update process...');

    // Find all stations that don't have adminName set or have it as null/undefined
    const stationsToUpdate = await Station.find({
      $or: [
        { adminName: { $exists: false } },
        { adminName: null },
        { adminName: '' }
      ]
    });

    console.log(`Found ${stationsToUpdate.length} stations that need adminName updates`);

    let updatedCount = 0;

    for (const station of stationsToUpdate) {
      let newAdminName = 'Unassigned'; // Default value

      // If approvedBy exists and is not null/empty, use it as adminName
      if (station.approvedBy && station.approvedBy.trim() !== '') {
        newAdminName = station.approvedBy.trim();
      }

      // Update the station
      await Station.findByIdAndUpdate(station._id, {
        adminName: newAdminName
      });

      updatedCount++;
      console.log(`Updated station ${station.stationId}: adminName set to "${newAdminName}"`);
    }

    console.log(`Successfully updated ${updatedCount} stations`);

    // Verify the updates
    const verificationCount = await Station.countDocuments({
      adminName: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`Total stations with valid adminName: ${verificationCount}`);

  } catch (error) {
    console.error('Error updating adminNames:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await updateAdminNames();

  console.log('AdminName update process completed');
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateAdminNames };
