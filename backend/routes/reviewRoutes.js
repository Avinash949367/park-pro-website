const express = require('express');
const router = express.Router();
const passport = require('passport');
const reviewController = require('../controllers/reviewController');

// Add a review (requires authentication)
router.post('/', passport.authenticate('jwt', { session: false }), reviewController.addReview);

// Get reviews for a station
router.get('/station/:stationId', reviewController.getStationReviews);

// Update a review (requires authentication)
router.put('/:reviewId', passport.authenticate('jwt', { session: false }), reviewController.updateReview);

// Delete a review (requires authentication)
router.delete('/:reviewId', passport.authenticate('jwt', { session: false }), reviewController.deleteReview);

module.exports = router;
