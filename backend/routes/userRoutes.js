const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const jwt = require('jsonwebtoken');

// Middleware to protect routes with JWT authentication
const ensureAuthenticated = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const ensureAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Admin user management routes
router.get('/admin/users', ensureAuthenticated, ensureAdmin, getAllUsers);
router.get('/admin/users/:id', ensureAuthenticated, ensureAdmin, getUserById);
router.put('/admin/users/:id', ensureAuthenticated, ensureAdmin, updateUser);
router.delete('/admin/users/:id', ensureAuthenticated, ensureAdmin, deleteUser);

// General users route (admin only)
router.get('/users', ensureAuthenticated, ensureAdmin, getAllUsers);

module.exports = router;
