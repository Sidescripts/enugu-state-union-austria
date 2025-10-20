// middleware/uploadMiddleware.js
const multer = require('multer');
const { imageStorage, videoStorage, generalStorage } = require('../utils/cloudinaryConfig');

// Configure multer for different file types
const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

const uploadAny = multer({
  storage: generalStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB general files
  }
});

// Middleware for multiple image uploads (up to 10 images)
const uploadMultipleImages = uploadImage.array('images', 10);

// Middleware for multiple video uploads (up to 5 videos)
const uploadMultipleVideos = uploadVideo.array('videos', 3);

// Middleware for mixed uploads (images and videos together)
const uploadMixedMedia = uploadAny.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 3 }
]);

// Error handling middleware for uploads
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: error.message
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: error.message
      });
    }
  }
  next(error);
};

module.exports = {
  uploadImage: uploadImage.single('image'),
  uploadVideo: uploadVideo.single('video'),
  uploadMultipleImages,
  uploadMultipleVideos,
  uploadMixedMedia,
  uploadAny: uploadAny.single('file'),
  handleUploadError
};