const express = require('express');
const router = express.Router();
const stationsController = require('../controllers/stationsController');

router.post('/', stationsController.createStation);

// Get stations by status
router.get('/status/:status', stationsController.getStationsByStatus);

// Update station status
router.patch('/:id/status', stationsController.updateStationStatus);

module.exports = router;
