const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Folder name in Cloudinary
    resource_type: 'auto', // Automatically detect file type (image or video)
  },
});

const upload = multer({ storage });

// Controller function to handle media upload
exports.uploadMedia = async (req, res) => {
  try {
    // Multer middleware will handle the upload and attach the file info to req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the secure URL of the uploaded media
    res.status(200).json({
      message: 'File uploaded successfully',
      secureUrl: req.file.path, // Cloudinary secure URL
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ message: 'Error uploading media', error: error.message });
  }
};

module.exports.upload = upload;