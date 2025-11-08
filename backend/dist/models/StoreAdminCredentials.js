const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const storeAdminCredentialsSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Pre-save hook to hash password if it's not already hashed
storeAdminCredentialsSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    // Check if password is already hashed (bcrypt hashes start with $2a$ or similar)
    if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$') && !this.password.startsWith('$2y$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
  next();
});

module.exports = mongoose.model("StoreAdminCredentials", storeAdminCredentialsSchema);
