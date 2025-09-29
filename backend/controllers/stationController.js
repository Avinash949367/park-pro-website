const Station = require('../models/Station');

// Get station stats
exports.getStationStats = async (req, res) => {
  try {
    const totalStations = await Station.countDocuments();
    const activeStations = await Station.countDocuments({ status: 'active' });
    const inactiveStations = await Station.countDocuments({ status: 'inactive' });
    res.status(200).json({
      totalStations,
      activeStations,
      inactiveStations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get GPS structure for station
exports.getStationGPSStructure = async (req, res) => {
  try {
    const { stationId } = req.params;
    const station = await Station.findById(stationId).select('gpsStructure');
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.status(200).json(station.gpsStructure || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save GPS structure for station
exports.saveStationGPSStructure = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { gpsStructure } = req.body;
    const station = await Station.findByIdAndUpdate(stationId, { gpsStructure }, { new: true });
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.status(200).json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit station for approval
exports.submitStationForApproval = async (req, res) => {
  try {
    const { stationId } = req.params;
    const station = await Station.findByIdAndUpdate(stationId, { status: 'pending' }, { new: true });
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.status(200).json({ message: 'Station submitted for approval' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve station
exports.approveStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const station = await Station.findByIdAndUpdate(stationId, { status: 'active' }, { new: true });
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.status(200).json({ message: 'Station approved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject station
exports.rejectStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const station = await Station.findByIdAndUpdate(stationId, { status: 'rejected' }, { new: true });
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.status(200).json({ message: 'Station rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle public visibility
exports.togglePublicVisibility = async (req, res) => {
  try {
    const { stationId } = req.params;
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    station.publicVisibility = !station.publicVisibility;
    await station.save();
    res.status(200).json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stations by mapping status
exports.getStationsByMappingStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const stations = await Station.find({ mappingStatus: status });
    res.status(200).json(stations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stations by status
exports.getStationsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const stations = await Station.find({ status });
        res.status(200).json(stations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all stations
exports.getAllStations = async (req, res) => {
    try {
        const stations = await Station.find().sort({ createdAt: -1 });
        res.status(200).json(stations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get station by ID
exports.getStationById = async (req, res) => {
    try {
        const { id } = req.params;
        const station = await Station.findById(id);

        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        res.status(200).json(station);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search stations by city
exports.searchStationsByCity = async (req, res) => {
    try {
        const { city } = req.params;
        const stations = await Station.find({
            city: { $regex: city, $options: 'i' },
            status: 'active',
            $or: [
                { publicVisibility: true },
                { publicVisibility: { $exists: false } }
            ]
        }).select('stationId name address city price slots gpsStructure').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: stations.length,
            stations
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new station
exports.createStation = async (req, res) => {
    try {
        const { name, location } = req.body;
        const newStation = new Station({ name, location });
        await newStation.save();
        res.status(201).json(newStation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update station status
exports.updateStationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const station = await Station.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }
        
        res.status(200).json(station);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get station settings for station admin
exports.getStationSettings = async (req, res) => {
  try {
    console.log('Route /stations/settings hit, req.user:', req.user);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing token' });
    }
    // Get stationId from authenticated user (store admin)
    const stationId = req.user.stationId;
    console.log('stationId from req.user:', stationId);
    if (!stationId) {
      console.log('Station ID not found in token');
      return res.status(400).json({ success: false, message: 'Station ID not found in token' });
    }

    const station = await Station.findOne({ _id: stationId }).select('openAt closeAt');
    console.log('Station found:', station);

    if (!station) {
      console.log('Station not found for stationId:', stationId);
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Handle missing fields for existing stations (default to open 24 hours)
    const openAt = station.openAt || '00:00';
    const closeAt = station.closeAt || '23:59';

    // Determine if open 24 hours (default times)
    const isOpen24 = openAt === '00:00' && closeAt === '23:59';

    console.log('Returning settings:', { open24: isOpen24, startTime: isOpen24 ? null : openAt, endTime: isOpen24 ? null : closeAt });
    res.status(200).json({
      success: true,
      settings: {
        open24: isOpen24,
        startTime: isOpen24 ? null : openAt,
        endTime: isOpen24 ? null : closeAt
      }
    });
  } catch (error) {
    console.error('Error in getStationSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save station settings for station admin
exports.saveStationSettings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing token' });
    }
    // Get stationId from authenticated user (store admin)
    const stationId = req.user.stationId;
    if (!stationId) {
      return res.status(400).json({ success: false, message: 'Station ID not found in token' });
    }

    const { open24, startTime, endTime } = req.body;

    // Validate input
    if (open24 === undefined) {
      return res.status(400).json({ success: false, message: 'open24 field is required' });
    }

    let openAt, closeAt;
    if (open24) {
      openAt = '00:00';
      closeAt = '23:59';
    } else {
      if (!startTime || !endTime) {
        return res.status(400).json({ success: false, message: 'startTime and endTime are required when not open 24 hours' });
      }
      openAt = startTime;
      closeAt = endTime;
    }

    const station = await Station.findByIdAndUpdate(
      stationId,
      { openAt, closeAt },
      { new: true }
    );

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set station working hours (admin API)
exports.setStationHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { opening_time, closing_time } = req.body;

    if (!opening_time || !closing_time) {
      return res.status(400).json({ message: 'opening_time and closing_time are required' });
    }

    const station = await Station.findByIdAndUpdate(
      id,
      { openAt: opening_time, closeAt: closing_time },
      { new: true }
    );

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.status(200).json({ message: 'Station working hours updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
