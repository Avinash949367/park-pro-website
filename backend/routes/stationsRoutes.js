const express = require('express');
const router = express.Router();
const stationsController = require('../controllers/stationsController');

router.post('/', stationsController.createStation);

module.exports = router;
