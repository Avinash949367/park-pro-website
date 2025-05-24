const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Signup Controller
exports.register = async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      role,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error registering", error: err.message });
  }
};

// Login Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    // Remove account confirmation check to allow all users to login regardless of isConfirmed status
    // if (user.role !== 'admin' && !user.isConfirmed) {
    //   return res.status(400).json({ message: "Account not confirmed. Please check your email." });
    // }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret_key',
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

// New controller to get total user count (admin only)
exports.getUserCount = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user count', error: err.message });
  }
};

// OAuth callback handlers
exports.googleCallback = (req, res) => {
  // Successful authentication, issue JWT and redirect or respond
  const user = req.user;
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'default_jwt_secret_key',
    { expiresIn: "1d" }
  );
  // Redirect to frontend with token or set cookie
  res.redirect(`/user.html?token=${token}`);
};

exports.facebookCallback = (req, res) => {
  const user = req.user;
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'default_jwt_secret_key',
    { expiresIn: "1d" }
  );
  res.redirect(`/user.html?token=${token}`);
};

exports.getUsersList = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const users = await User.find({}, 'name email role password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users list', error: err.message });
  }
};

// Controller to delete all users except admins
exports.deleteUsersExceptAdmins = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const result = await User.deleteMany({ role: { $ne: 'admin' } });
    res.json({ message: `Deleted ${result.deletedCount} users except admins` });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting users', error: err.message });
  }
};


// Add this function to your existing authController.js file manually:

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleSignIn = async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verify the idToken with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email,
        role: 'user', // default role
        password: '', // no password for OAuth users
      });
    }

    // Issue JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret_key',
      { expiresIn: "1d" }
    );

    res.json({ token, user: { name: user.name, role: user.role } });
  } catch (err) {
    res.status(401).json({ message: "Invalid Google token", error: err.message });
  }
};

// After adding this function, add the route in authRoutes.js:
// router.post('/auth/google-signin', googleSignIn);
