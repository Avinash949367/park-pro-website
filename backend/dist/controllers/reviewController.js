const mongoose = require('mongoose');
const Review = require('../models/Review');
const Station = require('../models/Station');

// Add a review
exports.addReview = async (req, res) => {
  try {
    const { stationId, rating, comment } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets req.user
    const stationIdObj = new mongoose.Types.ObjectId(stationId);

    // Check if user already reviewed this station
    const existingReview = await Review.findOne({ userId, stationId: stationIdObj });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this station'
      });
    }

    const review = new Review({
      userId,
      stationId: stationIdObj,
      rating,
      comment
    });

    await review.save();

    // Update station rating
    await updateStationRating(stationId);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get reviews for a station
exports.getStationReviews = async (req, res) => {
  try {
    const { stationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const stationIdObj = new mongoose.Types.ObjectId(stationId);

    const reviews = await Review.find({ stationId: stationIdObj })
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ stationId: stationIdObj });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { stationId: stationIdObj } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;

    res.json({
      success: true,
      reviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      { rating, comment },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Update station rating
    await updateStationRating(review.stationId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOneAndDelete({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    // Update station rating
    await updateStationRating(review.stationId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to update station rating
async function updateStationRating(stationId) {
  try {
    const stationIdObj = new mongoose.Types.ObjectId(stationId);

    const ratingStats = await Review.aggregate([
      { $match: { stationId: stationIdObj } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;
    const totalReviews = ratingStats.length > 0 ? ratingStats[0].totalReviews : 0;

    await Station.findByIdAndUpdate(stationId, {
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: totalReviews
    });
  } catch (error) {
    console.error('Error updating station rating:', error);
  }
}
