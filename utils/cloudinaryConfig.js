// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: "djkul7fia",
  api_key: "136958234211595",
  api_secret: "CsFy4wfCCjzwvxqvuNOjMlUbm8c"
  // cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  // api_key: process.env.CLOUDINARY_API_KEY,
  // api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Separate storage configurations for images and videos
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'association/events/images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
    ]
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'association/events/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [
      { width: 1280, height: 720, crop: 'limit' }
    ]
  },
});

const generalStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'association/general',
    resource_type: 'auto',
  },
});

module.exports = {
  cloudinary,
  imageStorage,
  videoStorage,
  generalStorage
};