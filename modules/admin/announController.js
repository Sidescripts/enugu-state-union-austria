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

      const { title, content,isImportant = false, expiresAt = null } = req.body;
      console.log('Request files:', req.files);
      console.log('Request body:', req.body);
      
      // Handle image uploads
      const imageUrls = [];

      // Case 1: req.files is an array
      if (Array.isArray(req.files)) {
        req.files.forEach(file => {
          if (file.mimetype.startsWith('image/')) {
            imageUrls.push(file.secure_url || file.path || file.location);
          } 
        });
      } else if(req.files.images){
        // Handle images
        
          const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
          images.forEach(file => {
            if (file.mimetype.startsWith('image/')) {
              imageUrls.push(file.secure_url || file.path || file.location);
            }
          });
        
      }else if(req.files.mimetype){
        if (req.files.mimetype.startsWith('image/')) {
          imageUrls.push(req.files.secure_url || req.files.path || req.files.location);
        }
      }

      console.log('Processed image URLs:', imageUrls);

      const announcement = await Announcement.create({
        title,
        content,
        images: imageUrls,
        isImportant: isImportant === 'true' || isImportant === true,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      console.log('Event created with media:', {
          images: imageUrls.length
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
 
      const announcements  = await Announcement.findAll({});

      res.json({
        success: true,
        message: 'Announcements retrieved successfully',
        data: announcements
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
      const {
        title,
        content,
        existingImages: existingImagesJson,
        isImportant,
        expiresAt,
      } = req.body;
      console.log(req.body)
      // -----------------------------------------------------------------
      // 1. Find the announcement
      // -----------------------------------------------------------------
      const announcement = await Announcement.findByPk(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found',
        });
      }

      // -----------------------------------------------------------------
      // 2. Parse existing images (sent as JSON string by the client)
      // -----------------------------------------------------------------
      let keptImages = [];
      if (existingImagesJson) {
        try {
          const parsed = JSON.parse(existingImagesJson);
          if (Array.isArray(parsed)) {
            keptImages = parsed.filter(url => typeof url === 'string' && url.trim());
          }
        } catch (e) {
          console.warn('Invalid existingImages JSON:', existingImagesJson);
          // ignore – we’ll just start with an empty list
        }
      }

      // -----------------------------------------------------------------
      // 3. Collect new uploaded files
      // -----------------------------------------------------------------
      const newFiles = [];
      if (req.files) {
        // Multer can give us:
        //   - req.files.images  (array or single object)
        //   - req.files        (array when field name is omitted)
        const candidates = [];

        if (Array.isArray(req.files.images)) {
          candidates.push(...req.files.images);
        } else if (req.files.images) {
          candidates.push(req.files.images);
        } else if (Array.isArray(req.files)) {
          candidates.push(...req.files);
        } else if (req.files && req.files.mimetype) {
          candidates.push(req.files);
        }

        for (const file of candidates) {
          if (file && file.mimetype && file.mimetype.startsWith('image/')) {
            // Cloudinary / local storage – take the URL that was saved
            const url = file.secure_url || file.path || file.location || file.filename;
            if (url) newFiles.push(url);
          }
        }
      }

      // -----------------------------------------------------------------
      // 4. Build final image list (max 2)
      // -----------------------------------------------------------------
      const finalImages = [...keptImages, ...newFiles].slice(0, 2);

      // -----------------------------------------------------------------
      // 5. Prepare data for Sequelize .update()
      // -----------------------------------------------------------------
      const updateData = {};

      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (isImportant !== undefined) {
        updateData.isImportant = isImportant === 'true' || isImportant === true;
      }
      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }

      // Always replace the whole array – the DB column is JSON[]
      updateData.images = finalImages;

      // -----------------------------------------------------------------
      // 6. Persist
      // -----------------------------------------------------------------
      await announcement.update(updateData);

      // -----------------------------------------------------------------
      // 7. Respond
      // -----------------------------------------------------------------
      res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: announcement,
      });
    } catch (error) {
      console.error('Update announcement error:', error);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating announcement',
        error: error.message,
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
          await deleteMultipleImages(imageUrl);
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