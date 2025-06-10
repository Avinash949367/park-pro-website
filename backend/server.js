require('dotenv').config();  // make sure dotenv is loaded

const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const stationsRoutes = require('./routes/stationsRoutes');
require('./config/passport'); // Passport config

const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();

// Connect to MongoDB
connectDB();

// Create default admin user if not exists
const createAdminUser = async () => {
  try {
    const adminUser = await User.findOne({ email: 'admin1@gmail.com' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('adminlogin', 10);
      await User.create({
        name: 'admin',
        email: 'admin1@gmail.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Default admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  }
};

createAdminUser();

const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', authRoutes);
app.use('/api/stations', stationsRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
