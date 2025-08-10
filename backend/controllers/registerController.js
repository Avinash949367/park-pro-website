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