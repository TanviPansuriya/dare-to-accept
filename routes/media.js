const express = require('express');
const router = express.Router();
const { uploadMedia, upload } = require('../controllers/mediaController');

// POST /media/upload - Upload media to Cloudinary
router.post('/upload', upload.single('file'), uploadMedia);

module.exports = router;