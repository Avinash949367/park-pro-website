const Register = require('../models/Register');

exports.registerStation = async (req, res) => {
    try {
        const newStation = new Register(req.body);
        const savedStation = await newStation.save();
        res.status(201).json(savedStation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all pending registrations
exports.getPendingRegistrations = async (req, res) => {
    try {
        const pendingRegistrations = await Register.find({ status: 'pending' })
            .sort({ createdAt: -1});
        res.status(200).json(pendingRegistrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get registrations by status
exports.getRegistrationsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const registrations = await Register.find({ status });
        res.status(200).json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
