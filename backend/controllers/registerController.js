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

// Update address and location details
exports.updateAddress = async (req, res) => {
    try {
        const { registrationId, address, city, state, zipCode, country, totalSlots, pricePerSlot, stationName, googleMapLocation } = req.body;

        if (!registrationId) {
            return res.status(400).json({ error: "Missing registrationId in request body" });
        }

        // Validate required fields
        const missingFields = [];
        if (!address || address.trim() === '') missingFields.push('address');
        if (!city || city.trim() === '') missingFields.push('city');
        if (!state || state.trim() === '') missingFields.push('state');
        if (!zipCode || zipCode.trim() === '') missingFields.push('zipCode');
        if (!country || country.trim() === '') missingFields.push('country');
        if (!totalSlots || isNaN(parseInt(totalSlots))) missingFields.push('totalSlots');
        if (!pricePerSlot || isNaN(parseFloat(pricePerSlot))) missingFields.push('pricePerSlot');
        if (!stationName || stationName.trim() === '') missingFields.push('stationName');
        if (!googleMapLocation || googleMapLocation.trim() === '') missingFields.push('googleMapLocation');

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing or invalid required fields: ${missingFields.join(', ')}`
            });
        }

        // Google Maps location is stored as-is without coordinate extraction
        // No latitude/longitude extraction needed
        

        // Find the registration by registrationId
        const registration = await Register.findOne({ registrationId });
        
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Update the registration with address details
        const updatedRegistration = await Register.findOneAndUpdate(
            { registrationId: registrationId },
            {
                address: address,
                city: city,
                state: state,
                zip: zipCode,
                country: country,
                slots: parseInt(totalSlots),
                price: parseFloat(pricePerSlot),
                stationName: stationName,
                googleMapLocation: googleMapLocation,
                status: 'doc-processing',
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Address and location updated successfully",
            registration: updatedRegistration
        });

    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ 
            message: "Failed to update address",
            error: error.message 
        });
    }
};
