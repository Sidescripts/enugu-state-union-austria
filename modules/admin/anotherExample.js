const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Announcement = require('../models/Announcement');

// Cloudinary helper functions
const uploadToCloudinary = async (file) => {
  // Your Cloudinary upload implementation
  return file.path; // Return the URL
};

const deleteFromCloudinary = async (url) => {
  // Your Cloudinary delete implementation
};

module.exports = {
  // POST /create - Create new announcement with image upload
  createAnnouncement: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title, content, isImportant = false, expiresAt = null } = req.body;

      // Handle image uploads
      const imageUrls = [];

      if (req.files && req.files.images) {
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const image of images) {
          const imageUrl = await uploadToCloudinary(image);
          imageUrls.push(imageUrl);
        }
      }

      const announcement = await Announcement.create({
        title,
        content,
        images: imageUrls,
        isImportant: isImportant === 'true' || isImportant === true,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: announcement
      });

    } catch (error) {
      console.error('Create announcement error:', error);
      
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating announcement',
        error: error.message
      });
    }
  },

  // GET /all - Get all announcements with filtering and pagination
  getAllAnnouncements: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        isActive = true,
        isImportant,
        showExpired = false,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';
      if (isImportant !== undefined) whereClause.isImportant = isImportant === 'true';
      
      // Handle expired announcements filter
      if (showExpired === 'false') {
        whereClause[Op.or] = [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ];
      }

      const { count, rows: announcements } = await Announcement.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        success: true,
        message: 'Announcements retrieved successfully',
        data: {
          announcements,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalAnnouncements: count,
            hasNext: offset + announcements.length < count,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get all announcements error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving announcements',
        error: error.message
      });
    }
  },

  // GET /:id - Get single announcement by ID
  getAnnouncementById: async (req, res) => {
    try {
      const { id } = req.params;

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      res.json({
        success: true,
        message: 'Announcement retrieved successfully',
        data: announcement
      });

    } catch (error) {
      console.error('Get announcement by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving announcement',
        error: error.message
      });
    }
  },

  // PATCH /update/:id - Update announcement details with image upload
  updateAnnouncement: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, images: existingImages = [], isImportant, expiresAt } = req.body;

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Handle new image uploads
      let finalImages = [...(existingImages || [])];

      if (req.files && req.files.images) {
        const newImages = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const image of newImages) {
          const imageUrl = await uploadToCloudinary(image);
          finalImages.push(imageUrl);
        }
      }

      // Prepare update data
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (isImportant !== undefined) updateData.isImportant = isImportant === 'true' || isImportant === true;
      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }

      // Update images
      updateData.images = finalImages;

      await announcement.update(updateData);

      res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: announcement
      });

    } catch (error) {
      console.error('Update announcement error:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating announcement',
        error: error.message
      });
    }
  },

  // PATCH /update-status/:id - Update announcement active status
  updateAnnouncementStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive field is required'
        });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      await announcement.update({ isActive });

      res.json({
        success: true,
        message: `Announcement ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: announcement
      });

    } catch (error) {
      console.error('Update announcement status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating announcement status',
        error: error.message
      });
    }
  },

  // PATCH /toggle-importance/:id - Toggle announcement importance
  toggleAnnouncementImportance: async (req, res) => {
    try {
      const { id } = req.params;

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      await announcement.update({ isImportant: !announcement.isImportant });

      res.json({
        success: true,
        message: `Announcement marked as ${!announcement.isImportant ? 'important' : 'normal'} successfully`,
        data: announcement
      });

    } catch (error) {
      console.error('Toggle announcement importance error:', error);
      res.status(500).json({
        success: false,
        message: 'Error toggling announcement importance',
        error: error.message
      });
    }
  },

  // DELETE /delete/:id - Delete announcement and associated images
  deleteAnnouncement: async (req, res) => {
    try {
      const { id } = req.params;

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Delete associated images from Cloudinary
      if (announcement.images && announcement.images.length > 0) {
        for (const imageUrl of announcement.images) {
          await deleteFromCloudinary(imageUrl);
        }
      }

      // Delete announcement from database
      await announcement.destroy();

      res.json({
        success: true,
        message: 'Announcement deleted successfully'
      });

    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting announcement',
        error: error.message
      });
    }
  }
};

// Example (Node.js/Express)
const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
const newImages = req.files?.images || [];

// Keep only existing + new (max 2)
const finalImages = [...existingImages, ...newImageUrls].slice(0, 2);