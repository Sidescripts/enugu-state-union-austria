// controllers/executiveController.js
const { Executive } = require('../../model');
const { deleteImage } = require('../../utils/cloudConfig');
const { validationResult } = require('express-validator');

const executiveController = {

  // POST /create - Create new executive
  createExecutive: async (req, res) => {
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

      const { name, position, bio, image, order } = req.body;
      let imageUrl = null;
      // console.log(req.file)
      // Use Cloudinary URL from multer if an image was uploaded
      if (req.file) {
        imageUrl = req.file.path; // Cloudinary URL from imageStorage
      }
      // console.log(req.body)
      // console.log(imageUrl)
      const executive = await Executive.create({
        name,
        position,
        bio,
        image:imageUrl,
        order: order || 0
      });
      console.log(executive)
      res.status(201).json({
        success: true,
        message: 'Executive created successfully',
        data: executive
      });

    } catch (error) {
      console.error('Create executive error:', error);
      
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
        message: 'Error creating executive',
        error: error.message
      });
    }
  },

  // GET /all - Get all executives with sorting and filtering
  getAllExecutives: async (req, res) => {
    try {
      const executives = await Executive.findAll();
      // console.log(executives)
      res.json({
        success: true,
        message: 'Executives retrieved successfully',
        data: executives
      });

    } catch (error) {
      console.error('Get all executives error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving executives',
        error: error.message
      });
    }
  },

  // GET /:id - Get single executive by ID
  getExecutiveById: async (req, res) => {
    try {
      const { id } = req.params;

      const executive = await Executive.findByPk(id);
      if (!executive) {
        return res.status(404).json({
          success: false,
          message: 'Executive not found'
        });
      }

      res.json({
        success: true,
        message: 'Executive retrieved successfully',
        data: executive
      });

    } catch (error) {
      console.error('Get executive by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving executive',
        error: error.message
      });
    }
  },

  // PATCH /update/:id - Update executive details
  updateExecutive: async (req, res) => {
    try {
      // console.log(req.body)
      // console.log("update route is working")
      const { id } = req.params;
      const { name, position, bio, order } = req.body;

      // Check if at least one field is provided
      if (name === undefined && position === undefined && bio === undefined && order === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name, position, bio, or order) must be provided for update'
        });
      }

      const executive = await Executive.findByPk(id);
      if (!executive) {
        return res.status(404).json({
          success: false,
          message: 'Executive not found'
        });
      }

      // Prepare update data
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (position !== undefined) updateData.position = position;
      if (bio !== undefined) updateData.bio = bio;
      if (order !== undefined) updateData.order = order;

      await executive.update(updateData);

      res.json({
        success: true,
        message: 'Executive updated successfully',
        data: executive
      });

    } catch (error) {
      console.error('Update executive error:', error);
      
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
        message: 'Error updating executive',
        error: error.message
      });
    }
  },

  // PATCH /update-image/:id - Update executive image using model method
  updateExecutiveImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Image URL is required'
        });
      }

      const executive = await Executive.findByPk(id);
      if (!executive) {
        return res.status(404).json({
          success: false,
          message: 'Executive not found'
        });
      }

      // Use the model's addImage method which includes validation
      await executive.addImage(image);

      res.json({
        success: true,
        message: 'Executive image updated successfully',
        data: executive
      });

    } catch (error) {
      console.error('Update executive image error:', error);
      
      // Handle URL validation errors from model method
      if (error.message.includes('Image URL must be a valid URL')) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating executive image',
        error: error.message
      });
    }
  },

  // PATCH /remove-image/:id - Remove executive image using model method
  removeExecutiveImage: async (req, res) => {
    try {
      const { id } = req.params;

      const executive = await Executive.findByPk(id);
      if (!executive) {
        return res.status(404).json({
          success: false,
          message: 'Executive not found'
        });
      }

      // Delete old image from Cloudinary if exists
      if (executive.image) {
        await deleteImage(executive.image);
      }

      // Use the model's removeImage method
      await executive.removeImage();

      res.json({
        success: true,
        message: 'Executive image removed successfully',
        data: executive
      });

    } catch (error) {
      console.error('Remove executive image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing executive image',
        error: error.message
      });
    }
  },

  // PATCH /update-status/:id - Update executive active status
  updateExecutiveStatus: async (req, res) => {
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

      const executive = await Executive.findByPk(id);
      if (!executive) {
        return res.status(404).json({
          success: false,
          message: 'Executive not found'
        });
      }

      await executive.update({ isActive });

      res.json({
        success: true,
        message: `Executive ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: executive
      });

    } catch (error) {
      console.error('Update executive status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating executive status',
        error: error.message
      });
    }
  },

  // DELETE /delete/:id - Delete executive and associated image
  deleteExecutive: async (req, res) => {
    try {
      const { id } = req.params;

      const executive = await Executive.findByPk(id);
      if (!executive) {
        return res.status(404).json({
          success: false,
          message: 'Executive not found'
        });
      }
      console.log(executive.image)
      // Delete associated image from Cloudinary if exists
      if (executive.image) {
        await deleteImage(executive.image);
      }

      // Delete executive from database
      await executive.destroy();

      res.json({
        success: true,
        message: 'Executive deleted successfully'
      });

    } catch (error) {
      console.error('Delete executive error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting executive',
        error: error.message
      });
    }
  },

  // GET /active/board - Get active executives (for public display)
  getActiveBoard: async (req, res) => {
    try {
      const executives = await Executive.findAll({
        where: {
          isActive: true
        },
        order: [['order', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'position', 'bio', 'image', 'order']
      });
      console.log(executives)
      res.json({
        success: true,
        message: 'Active executive board retrieved successfully',
        data: executives
      });

    } catch (error) {
      console.error('Get active board error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving executive board',
        error: error.message
      });
    }
  }
};

module.exports = executiveController;