// controllers/announcementController.js
const { Announcement } = require('../../model');
const { deleteMultipleImages } = require('../../utils/cloudConfig');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const announcementController = {

  // POST /create - Create new announcement
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

      const { title, content, images = [], isImportant = false, expiresAt = null } = req.body;

      const announcement = await Announcement.create({
        title,
        content,
        images,
        isImportant,
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

  // PATCH /update/:id - Update announcement details
  updateAnnouncement: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, images, isImportant, expiresAt } = req.body;

      // Check if at least one field is provided
      if (title === undefined && content === undefined && images === undefined && 
          isImportant === undefined && expiresAt === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field must be provided for update'
        });
      }

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Prepare update data
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (images !== undefined) updateData.images = images;
      if (isImportant !== undefined) updateData.isImportant = isImportant;
      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }

      await announcement.update(updateData);

      res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: announcement
      });

    } catch (error) {
      console.error('Update announcement error:', error);
      
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

  // PATCH /add-image/:id - Add image to announcement using model method
  addImageToAnnouncement: async (req, res) => {
    try {
      const { id } = req.params;
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Image URL is required'
        });
      }

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Use the model's addImage method which includes validation
      await announcement.addImage(image);

      res.json({
        success: true,
        message: 'Image added to announcement successfully',
        data: announcement
      });

    } catch (error) {
      console.error('Add image to announcement error:', error);
      
      // Handle validation errors from model method
      if (error.message.includes('Image URL must be a valid URL') || 
          error.message.includes('Cannot add more than 2 images')) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error adding image to announcement',
        error: error.message
      });
    }
  },

  // PATCH /remove-image/:id - Remove image from announcement using model method
  removeImageFromAnnouncement: async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'imageUrl is required'
        });
      }

      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Delete image from Cloudinary
      await deleteImage(imageUrl);

      // Use the model's removeImage method
      await announcement.removeImage(imageUrl);

      res.json({
        success: true,
        message: 'Image removed from announcement successfully',
        data: announcement
      });

    } catch (error) {
      console.error('Remove image from announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing image from announcement',
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
        await deleteMultipleImages(announcement.images);
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
  },

  // GET /active/announcements - Get active non-expired announcements (for public display)
  getActiveAnnouncements: async (req, res) => {
    try {
      const { 
        limit = 10, 
        importantOnly = false,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const whereClause = {
        isActive: true,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      };

      if (importantOnly === 'true') {
        whereClause.isImportant = true;
      }

      const announcements = await Announcement.findAll({
        where: whereClause,
        limit: parseInt(limit),
        order: [
          ['is_important', 'DESC'],
          [sortBy, sortOrder.toUpperCase()]
        ],
        attributes: [
          'id', 
          'title', 
          'content', 
          'images', 
          'is_important', 
          'expires_at', 
          'created_at'
        ]
      });

      res.json({
        success: true,
        message: 'Active announcements retrieved successfully',
        data: announcements
      });

    } catch (error) {
      console.error('Get active announcements error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving active announcements',
        error: error.message
      });
    }
  },

  // GET /important/active - Get important active announcements
  getImportantActiveAnnouncements: async (req, res) => {
    try {
      const { limit = 5 } = req.query;

      const announcements = await Announcement.findAll({
        where: {
          isActive: true,
          isImportant: true,
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        },
        limit: parseInt(limit),
        order: [['created_at', 'DESC']],
        attributes: ['id', 'title', 'content', 'images', 'created_at']
      });

      res.json({
        success: true,
        message: 'Important active announcements retrieved successfully',
        data: announcements
      });

    } catch (error) {
      console.error('Get important active announcements error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving important announcements',
        error: error.message
      });
    }
  }
};

module.exports = announcementController;