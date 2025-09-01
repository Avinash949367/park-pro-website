const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const StoreAdminCredentials = require('../models/StoreAdminCredentials');

async function hashStoreAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/parkpro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const email = 'avinash46479@gmail.com';
    const plainPassword = 'akTsRjJvV1Ia';

    // Find the credentials
    const credentials = await StoreAdminCredentials.findOne({ email });
    if (!credentials) {
      console.log('Store admin credentials not found for email:', email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Update the password
    credentials.password = hashedPassword;
    await credentials.save();

    console.log('Password hashed and updated successfully for email:', email);

  } catch (error) {
    console.error('Error hashing password:', error);
  } finally {
    mongoose.connection.close();
  }
}

hashStoreAdminPassword();
