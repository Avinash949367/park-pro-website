const express = require('express');
const router = express.Router();
const stationsController = require('../controllers/stationsController');

router.post('/', stationsController.createStation);

// Get stations by status
router.get('/status/:status', stationsController.getStationsByStatus);

// Get single station
router.get('/:id', stationsController.getStation);

// Update station status
router.patch('/:id/status', stationsController.updateStationStatus);

// Send credentials email
router.post('/send-credentials', stationsController.sendCredentialsEmail);

module.exports = router;
