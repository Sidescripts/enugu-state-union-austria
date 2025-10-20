// utils/mediaHelpers.js
const { cloudinary } = require('./cloudinaryConfig');

// Extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
  return matches ? matches[1] : null;
};

// Delete image from Cloudinary
const deleteImage = async (imageUrl) => {
  try {
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Delete video from Cloudinary
const deleteVideo = async (videoUrl) => {
  try {
    const publicId = extractPublicId(videoUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
};

// Delete multiple images
const deleteMultipleImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls.map(url => deleteImage(url));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    return false;
  }
};

// Delete multiple videos
const deleteMultipleVideos = async (videoUrls) => {
  try {
    const deletePromises = videoUrls.map(url => deleteVideo(url));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting multiple videos:', error);
    return false;
  }
};

module.exports = {
  extractPublicId,
  deleteImage,
  deleteVideo,
  deleteMultipleImages,
  deleteMultipleVideos
};