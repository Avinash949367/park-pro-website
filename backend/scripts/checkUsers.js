const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parkpro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('-password -confirmationToken -otpExpiry');

    console.log(`\nTotal users found: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users found in database. You may need to create some users first.');
    } else {
      console.log('Users in database:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Confirmed: ${user.isConfirmed}`);
      });
    }

    // Check specifically for admin users
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\nAdmin users: ${adminUsers.length}`);
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkUsers();
