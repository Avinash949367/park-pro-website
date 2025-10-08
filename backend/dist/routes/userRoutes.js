"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const userController_1 = require("../controllers/userController");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware to protect routes with JWT authentication
const ensureAuthenticated = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_key');
        req.user = decoded;
        // Check if user is banned
        if (decoded.role === 'banned') {
            return res.status(403).json({ message: 'Account is banned. Access denied.' });
        }
        // Check if user is temporarily disabled
        if (decoded.disabledUntil && new Date(decoded.disabledUntil) > new Date()) {
            return res.status(403).json({
                message: 'Account is temporarily disabled. Please try again later.',
                disabledUntil: decoded.disabledUntil
            });
        }
        next();
    }
    catch (error) {
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
router.get('/admin/users', ensureAuthenticated, ensureAdmin, userController_1.getAllUsers);
router.get('/admin/users/:id', ensureAuthenticated, ensureAdmin, userController_1.getUserById);
router.put('/admin/users/:id', ensureAuthenticated, ensureAdmin, userController_1.updateUser);
router.delete('/admin/users/:id', ensureAuthenticated, ensureAdmin, userController_1.deleteUser);
router.post('/admin/users/:id/ban', ensureAuthenticated, ensureAdmin, userController_1.banUser);
router.post('/admin/users/:id/disable', ensureAuthenticated, ensureAdmin, userController_1.disableUser);
// General users route (admin only)
router.get('/users', ensureAuthenticated, ensureAdmin, userController_1.getAllUsers);
module.exports = router;
