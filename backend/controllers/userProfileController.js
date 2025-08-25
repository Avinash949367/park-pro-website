const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from auth middleware
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        vehicle: user.vehicle || '',
        membershipStatus: user.membershipStatus || 'Basic',
        walletBalance: user.walletBalance || 0,
        savedVehicles: user.savedVehicles || [],
        preferredSpots: user.preferredSpots || [],
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, vehicle } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phone, vehicle },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        vehicle: updatedUser.vehicle
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change user password
const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user dashboard data
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Here you can add additional data like:
    // - Recent bookings count
    // - Upcoming reservations count
    // - Wallet balance
    // - Membership status
    // - Saved vehicles count
    // - Preferred parking spots count

    res.json({
      success: true,
      dashboard: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          vehicle: user.vehicle,
          membershipStatus: user.membershipStatus || 'Basic',
          walletBalance: user.walletBalance || 0
        },
        stats: {
          savedVehicles: user.savedVehicles ? user.savedVehicles.length : 0,
          preferredSpots: user.preferredSpots ? user.preferredSpots.length : 0,
          recentBookings: 0, // This would come from bookings collection
          upcomingReservations: 0, // This would come from reservations collection
          totalTransactions: 0 // This would come from transactions collection
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserDashboard
};
