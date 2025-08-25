const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaController = require('../controllers/mediaController');

// Multer setup to store files in memory buffer (for uploading to Cloudinary)
const upload = multer({ storage: multer.memoryStorage() });

// Define fields to accept multiple files from
const uploadFields = upload.fields([
  { name: "landDocs", maxCount: 20 },
  { name: "stationPics", maxCount: 20 },
  { name: "partnershipDocs", maxCount: 20 },
  { name: "digitalSign", maxCount: 1 },
  { name: "personalDocs", maxCount: 20 },
]);

router.post('/upload-media', uploadFields, mediaController.uploadMedia);

module.exports = router;
