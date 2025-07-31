
const Station = require('../models/Stations');
const nodemailer = require('nodemailer');
const StoreAdminCredentials = require('../models/StoreAdminCredentials');
const bcrypt = require('bcryptjs');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.createStation = async (req, res) => {
  try {
    const { fullname, mobile, email, maplink, apartment, address, rent, size, facilities, name } = req.body;

    // Create new station with status 'received'
    const newStation = new Station({
      name: name || fullname, // Use station name if provided, otherwise use fullname
      location: address,
      capacity: rent, // No need to convert to number since schema accepts String
      mobile,
      email,
      maplink,
      apartment,
      size,
      facilities,
      status: 'received',
    });

    await newStation.save();

    res.status(201).json({ message: 'Station registered successfully' });
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get stations by status
exports.getStationsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const stations = await Station.find({ status });
    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations by status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



exports.updateStationStatus = async (req, res) => {
  try {
    const stationId = req.params.id;
    const { status } = req.body;

    if (!['received', 'admin confirm', 'active'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const station = await Station.findByIdAndUpdate(
      stationId,
      { status },
      { new: true }
    );

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Send detailed registration successful email when status changes to 'admin confirm'
    if (status === 'admin confirm') {
      // Generate a random password
      const generatedPassword = Math.random().toString(36).slice(-8);

      // Save credentials in StoreAdminCredentials model
      const existingCredentials = await StoreAdminCredentials.findOne({ email: station.email });
      if (!existingCredentials) {
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
        const newCredentials = new StoreAdminCredentials({
          stationId: station._id,
          email: station.email,
          password: hashedPassword,
        });
        await newCredentials.save();

        // Create new user in Users model with role 'store admin'
        const User = require('../models/User');
        const existingUser = await User.findOne({ email: station.email });
        if (!existingUser) {
          const newUser = new User({
            email: station.email,
            password: hashedPassword,
            role: 'store admin',
            isConfirmed: true
          });
          await newUser.save();
        }
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: station.email1 || station.email,
        subject: '🎉 Welcome! Your Parking Station is Successfully Registered',
        html: `
          Hi ${station.name},<br><br>
          We’re excited to inform you that your parking station registration has been successfully approved! 🎉<br><br>
          You are now officially a part of our partnered stations network.<br>
          Below are your login credentials to access your Station Admin Dashboard:<br><br>
          🆔 Station ID: ${station.email}<br>
          🔑 Password: ${generatedPassword}<br>
          🌐 Login URL: http://127.0.0.1:5500/frontend/storeAdmin/storeadminlogin.html<br><br>
          Please keep these credentials secure. You can now:<br><br>
          - View and manage your station details<br>
          - Track slot bookings in real-time<br>
          - Access earnings reports<br>
          - And much more!<br><br>
          If you have any questions or need assistance, feel free to reach out to us at support@parkpro.com.<br><br>
          Best regards,<br>
          The ParkPro Team<br>
          🚗 Making Parking Smarter, Together.
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent successfully:', info.response);
        }
      });
    }

    res.json({ message: 'Station status updated', station });
  } catch (error) {
    console.error('Error updating station status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single station by ID
exports.getStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    res.json(station);
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Send credentials email to station admin
exports.sendCredentialsEmail = async (req, res) => {
  try {
    const { email, password, stationName } = req.body;

    // Create or update user with admin role
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        password: await bcrypt.hash(password, 10),
        role: 'store admin',
        isConfirmed: true
      });
      await user.save();
    }

    // Send email with credentials
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your ParkPro Admin Credentials',
      html: `
        <h2>Welcome to ParkPro Admin Portal</h2>
        <p>Your station "${stationName}" has been approved!</p>
        <p>Here are your login credentials:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please login at: <a href="http://localhost:3000/site%20admin/adminlogin.html">Admin Login</a></p>
        <p>For security reasons, please change your password after first login.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Credentials email sent successfully' });
  } catch (error) {
    console.error('Error sending credentials email:', error);
    res.status(500).json({ error: 'Failed to send credentials email' });
  }
};
