const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// Station routes
router.get('/stations', stationController.getAllStations);
router.get('/stations/status/:status', stationController.getStationsByStatus);
router.post('/stations', stationController.createStation);
router.patch('/stations/:id/status', stationController.updateStationStatus);
router.get('/stations/stats', stationController.getStationStats);

module.exports = router;
