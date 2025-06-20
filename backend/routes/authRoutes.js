const express = require("express");
const passport = require("passport");
const { register, login, googleCallback, facebookCallback, getUserCount, getUsersList, deleteUsersExceptAdmins, googleSignIn, verifyOtp } = require("../controllers/authController");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

// Admin login route with role check
router.post("/admin/login", async (req, res, next) => {
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

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/userlogin.html' }),
  googleCallback);

// New route for Flutter app Google sign-in
router.post('/auth/google-signin', googleSignIn);

// Facebook OAuth routes
router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] }));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/userlogin.html' }),
  facebookCallback);

module.exports = router;
