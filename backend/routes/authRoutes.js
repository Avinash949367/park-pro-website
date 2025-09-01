const express = require("express");
const passport = require("passport");
const { register, login, googleCallback, getUserCount, getUsersList, deleteUsersExceptAdmins, googleSignIn, verifyOtp } = require("../controllers/authController");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const StoreAdminCredentials = require("../models/StoreAdminCredentials");

const router = express.Router();

router.post("/signup", register);
// Regular login route - reject admin attempts
router.post("/login", async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.role === 'admin') {
      return res.status(403).json({
        message: 'Admin users must login via the admin login page'
      });
    }
    // Proceed with regular login
    login(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.post("/verify-otp", verifyOtp);

// Admin login route with role check and referrer validation
router.post("/admin/login", async (req, res, next) => {
  // Verify request came from admin login page
  const referrer = req.get('Referrer');
  if (!referrer || !referrer.includes('adminlogin.html')) {
    return res.status(403).json({ message: 'Admin login only allowed from admin portal' });
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Not an admin" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret_key",
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: { name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// New routes for admin to get user count and user list
const ensureAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};

router.get('/users/count', passport.authenticate('jwt', { session: false }), ensureAdmin, getUserCount);
router.get('/users/list', passport.authenticate('jwt', { session: false }), ensureAdmin, getUsersList);
router.delete('/users/clear', passport.authenticate('jwt', { session: false }), ensureAdmin, deleteUsersExceptAdmins);



// Store admin login route - authenticate user with role 'store admin'
router.post("/storeadmin/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const credentials = await StoreAdminCredentials.findOne({ email });
    if (!credentials) {
      console.log('StoreAdminCredentials not found for email:', email);
      return res.status(400).json({ message: "No user found" });
    }
    console.log('Stored password hash:', credentials.password);
    console.log('Password received:', password);
    const isMatch = await bcrypt.compare(password, credentials.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      return res.status(403).json({ message: "Access denied: Invalid credentials" });
    }
    const token = jwt.sign(
      { id: credentials._id, email: credentials.email, role: 'store admin' },
      process.env.JWT_SECRET || "default_jwt_secret_key",
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: { email: credentials.email, role: 'store admin', stationId: credentials.stationId },
      redirectUrl: "storeadmin_dashboard.html",
    });
  } catch (err) {
    next(err);
  }
});

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/userlogin.html' }),
  googleCallback);

// New route for Flutter app Google sign-in
router.post('/auth/google-signin', googleSignIn);

module.exports = router;
