const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const stream = require('stream');
const authMiddleware = require('../middleware/auth');

// Configure multer for memory storage with optimized settings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for faster uploads
  },
});

// Configure Cloudinary with timeout
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 seconds timeout
});

// Optimize image before upload
const optimizeImage = async (buffer, mimetype) => {
  try {
    // Convert buffer to Base64
    const b64 = Buffer.from(buffer).toString('base64');
    return 'data:' + mimetype + ';base64,' + b64;
  } catch (error) {
    console.error('Image optimization error:', error);
    throw new Error('Failed to optimize image');
  }
};

// Upload profile picture route
router.post('/profile-picture', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    try {
      // Optimize image before upload
      const optimizedImage = await optimizeImage(req.file.buffer, req.file.mimetype);

      // Upload to Cloudinary with retry logic
      console.log('Attempting to upload to Cloudinary...');
      const uploadPromise = cloudinary.uploader.upload(optimizedImage, {
        folder: 'budget-planner/profile-pictures',
        public_id: `user-${req.user.userId}-${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' } // Automatic quality and format optimization
        ],
        overwrite: true,
        resource_type: 'auto'
      });

      // Set timeout for upload
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 30000); // 30 seconds timeout
      });

      // Race between upload and timeout
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      
      console.log('Upload successful, URL:', result.secure_url);

      res.json({
        message: 'File uploaded successfully',
        imageUrl: result.secure_url,
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      
      // Provide more specific error messages
      if (uploadError.message === 'Upload timeout') {
        return res.status(504).json({ 
          message: 'Upload timed out. Please try again with a smaller image.',
          error: uploadError.message 
        });
      }

      if (uploadError.http_code === 400) {
        return res.status(400).json({ 
          message: 'Invalid image file. Please try another image.',
          error: uploadError.message 
        });
      }

      throw uploadError;
    }
  } catch (error) {
    console.error('Upload error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to upload file. Please try again.',
      error: error.message 
    });
  }
});

module.exports = router; 