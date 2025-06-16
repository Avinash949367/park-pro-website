const Station = require('../models/Stations');

exports.createStation = async (req, res) => {
  try {
    const { fullname, mobile, email, maplink, apartment, address, rent, size, facilities, name } = req.body;

    // Create new station with status 'received'
    const newStation = new Station({
      name: name || fullname, // Use station name if provided, otherwise use fullname
      location: address,
      capacity: rent, // No need to convert to number since schema accepts String
      mobile,
      email,
      maplink,
      apartment,
      size,
      facilities,
      status: 'received',
    });

    await newStation.save();

    res.status(201).json({ message: 'Station registered successfully' });
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get stations by status
exports.getStationsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const stations = await Station.find({ status });
    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations by status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update station status
exports.updateStationStatus = async (req, res) => {
  try {
    const stationId = req.params.id;
    const { status } = req.body;

    if (!['received', 'admin confirm', 'active'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const station = await Station.findByIdAndUpdate(
      stationId,
      { status },
      { new: true }
    );

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json({ message: 'Station status updated', station });
  } catch (error) {
    console.error('Error updating station status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
