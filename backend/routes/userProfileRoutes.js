const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserDashboard
} = require('../controllers/userProfileController');
const jwt = require('jsonwebtoken');

// Middleware to protect routes with JWT authentication
const ensureAuthenticated = (req, res, next) => {
  // For JWT token authentication
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// User profile routes
router.get('/profile', ensureAuthenticated, getUserProfile);
router.put('/profile', ensureAuthenticated, updateUserProfile);
router.post('/profile/change-password', ensureAuthenticated, changeUserPassword);
router.get('/dashboard', ensureAuthenticated, getUserDashboard);

module.exports = router;
