const Station = require('../models/Stations');

exports.createStation = async (req, res) => {
  try {
    const { fullname, mobile, email, maplink, apartment, address, rent, size, facilities, name } = req.body;

    // Create new station
    const newStation = new Station({
      name: name || fullname, // Use station name if provided, otherwise use fullname
      location: address,
      capacity: rent, // No need to convert to number since schema accepts String
      mobile,
      email,
      maplink,
      apartment,
      size,
      facilities
    });

    await newStation.save();

    res.status(201).json({ message: 'Station registered successfully' });
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ error: 'Server error' });
  }
};