const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  registrationId: { type: String, required: true },
  category: { type: String, required: true }, // e.g. LandLeaseDocs, StationPics
  originalFilename: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Media', mediaSchema);
