const express = require("express");
const passport = require("passport");
const { register, login, googleCallback, facebookCallback, getUserCount, getUsersList, deleteUsersExceptAdmins, googleSignIn } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", register);
router.post("/login", login);

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
