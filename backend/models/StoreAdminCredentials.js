const mongoose = require("mongoose");

const storeAdminCredentialsSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stations",
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

module.exports = mongoose.model("StoreAdminCredentials", storeAdminCredentialsSchema);
