const Station = require('../models/Station');

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

// Get station statistics
exports.getStationStats = async (req, res) => {
    try {
        const stats = await Station.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
