const Register = require('../models/Register');
const Media = require('../models/Media');

exports.registerStation = async (req, res) => {
    try {
        console.log('Received registration request body:', req.body);
        const newStation = new Register(req.body);
        const savedStation = await newStation.save();
        
        const response = savedStation.toObject();
        delete response.registrationId;
        res.status(201).json(response);
    } catch (error) {
        console.error('Registration error:', error);
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

// Get detailed registration with media
exports.getRegistrationDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await Register.findById(id);
        
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Get associated media files
        const media = await Media.find({ registrationId: registration.registrationId });
        
        res.status(200).json({
            registration,
            media
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update registration status
exports.updateRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const registration = await Register.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
            { new: true }
        );
        
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }
        
        res.status(200).json(registration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
