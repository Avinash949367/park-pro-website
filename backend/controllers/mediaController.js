const cloudinary = require('cloudinary').v2;
const Media = require('../models/Media');
const { Readable } = require('stream');

// Configure cloudinary using env vars (set in your .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload buffer to Cloudinary
function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

exports.uploadMedia = async (req, res) => {
  try {
    const { registrationId } = req.body;
    if (!registrationId) {
      return res.status(400).json({ error: "Missing registrationId in request body" });
    }

    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const folderMap = {
      landDocs: "LandLeaseDocs",
      stationPics: "StationPics",
      partnershipDocs: "PartnershipDocs",
      digitalSign: "DigitalSignature",
      personalDocs: "PersonalDocs",
    };

    let uploadedFilesInfo = {};

    // Loop through each field and upload files
    for (const fieldName in files) {
      uploadedFilesInfo[folderMap[fieldName]] = [];

      for (const file of files[fieldName]) {
        // Check if file already exists for this registration and filename
        const existingFile = await Media.findOne({
          registrationId,
          category: folderMap[fieldName],
          originalFilename: file.originalname
        });

        if (existingFile) {
          // Skip if file already exists
          uploadedFilesInfo[folderMap[fieldName]].push({
            originalFilename: existingFile.originalFilename,
            url: existingFile.cloudinaryUrl,
            status: 'already_exists'
          });
          continue;
        }

        // Remove extension from original name for Cloudinary public_id
        const originalNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, "");
        const publicId = `${registrationId}/${folderMap[fieldName]}/${originalNameWithoutExt}`;

        const uploadResult = await uploadBufferToCloudinary(file.buffer, publicId);

        // Save in MongoDB
        const mediaDoc = new Media({
          registrationId,
          category: folderMap[fieldName],
          originalFilename: file.originalname,
          cloudinaryUrl: uploadResult.secure_url,
        });
        await mediaDoc.save();

        uploadedFilesInfo[folderMap[fieldName]].push({
          originalFilename: file.originalname,
          url: uploadResult.secure_url,
          status: 'uploaded'
        });
      }
    }

    res.json({ message: "Files uploaded successfully", uploadedFiles: uploadedFilesInfo });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
