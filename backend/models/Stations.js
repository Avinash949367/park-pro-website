const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  capacity: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  maplink: {
    type: String,
    required: true,
  },
  apartment: {
    type: String,
  },
  size: {
    type: String,
    required: true,
  },
  facilities: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Stations", stationSchema);
