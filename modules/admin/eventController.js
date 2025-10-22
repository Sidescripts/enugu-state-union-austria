// controllers/eventController.js
const { Event } = require('../../model');
const { deleteMultipleImages, deleteMultipleVideos } = require('../../utils/cloudConfig');
const { validationResult } = require('express-validator');

const eventController = {
  
  // POST /create - Create new event
  createEvent: async (req, res) => {
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

      const { title, description, date, images = [], videos = [], featuredImage } = req.body;

      // Auto-determine status based on date
      const eventDate = new Date(date);
      const currentDate = new Date();
      const status = eventDate < currentDate ? 'past' : 'recent';

      const event = await Event.create({
        title,
        description,
        date: eventDate,
        images,
        videos,
        featuredImage,
        status
      });

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event
      });

    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating event',
        error: error.message
      });
    }
  },

  // GET /all-events - Get all events with filtering and pagination
  getAllEvents: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        isActive = true,
        sortBy = 'date',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      if (status) whereClause.status = status;
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';

      const events = await Event.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        success: true,
        message: 'Events retrieved successfully',
        data: {
          events: events.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(events.count / limit),
            totalEvents: events.count,
            hasNext: offset + events.rows.length < events.count,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving events',
        error: error.message
      });
    }
  },

  // PATCH /update/:id - Update event details
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, date, images, videos} = req.body;

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Prepare update data
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      
      // Handle date update and auto-update status
      if (date !== undefined) {
        const eventDate = new Date(date);
        const currentDate = new Date();
        updateData.date = eventDate;
        updateData.status = eventDate < currentDate ? 'past' : 'recent';
      }

      // Handle images update
      if (images !== undefined) {
        updateData.images = images;
      }

      // Handle videos update
      if (videos !== undefined) {
        updateData.videos = videos;
      }

      await event.update(updateData);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: event
      });

    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating event',
        error: error.message
      });
    }
  },

  // PATCH /update-status/:id - Update event status and active state
  updateEventStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, isActive } = req.body;

      // Validate that at least one field is provided
      if (status === undefined && isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Either status or isActive must be provided'
        });
      }

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const updateData = {};
      if (status !== undefined) {
        if (!['recent', 'past'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Status must be either "recent" or "past"'
          });
        }
        updateData.status = status;
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      await event.update(updateData);

      res.json({
        success: true,
        message: 'Event status updated successfully',
        data: event
      });

    } catch (error) {
      console.error('Update event status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating event status',
        error: error.message
      });
    }
  },

  // DELETE /delete/:id - Delete event and associated media
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Delete associated media from Cloudinary
      if (event.images && event.images.length > 0) {
        await deleteMultipleImages(event.images);
      }

      if (event.videos && event.videos.length > 0) {
        await deleteMultipleVideos(event.videos);
      }

      // Delete event from database
      await event.destroy();

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting event',
        error: error.message
      });
    }
  },

  // GET /:id - Get single event by ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      res.json({
        success: true,
        message: 'Event retrieved successfully',
        data: event
      });

    } catch (error) {
      console.error('Get event by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving event',
        error: error.message
      });
    }
  },

  // PATCH /:id/add-media - Add images/videos to existing event
  addMediaToEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { images = [], videos = [] } = req.body;

      if (images.length === 0 && videos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Either images or videos must be provided'
        });
      }

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const updateData = {};
      
      // Add new images
      if (images.length > 0) {
        const currentImages = Array.isArray(event.images) ? event.images : [];
        const updatedImages = [...currentImages, ...images];
        
        if (updatedImages.length > 20) {
          return res.status(400).json({
            success: false,
            message: 'Cannot have more than 20 images total'
          });
        }
        
        updateData.images = updatedImages;
        
        // Set featured image if not already set
        if (!event.featuredImage) {
          updateData.featuredImage = images[0];
        }
      }

      // Add new videos
      if (videos.length > 0) {
        const currentVideos = Array.isArray(event.videos) ? event.videos : [];
        const updatedVideos = [...currentVideos, ...videos];
        
        if (updatedVideos.length > 5) {
          return res.status(400).json({
            success: false,
            message: 'Cannot have more than 5 videos total'
          });
        }
        
        updateData.videos = updatedVideos;
      }

      await event.update(updateData);

      res.json({
        success: true,
        message: 'Media added to event successfully',
        data: event
      });

    } catch (error) {
      console.error('Add media to event error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding media to event',
        error: error.message
      });
    }
  },

  // PATCH /:id/remove-media - Remove specific images/videos from event
  removeMediaFromEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrls = [], videoUrls = [] } = req.body;

      if (imageUrls.length === 0 && videoUrls.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Either imageUrls or videoUrls must be provided'
        });
      }

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const updateData = {};
      
      // Remove specified images
      if (imageUrls.length > 0) {
        const currentImages = Array.isArray(event.images) ? event.images : [];
        updateData.images = currentImages.filter(img => !imageUrls.includes(img));
        
        // Update featured image if it was removed
        if (imageUrls.includes(event.featuredImage)) {
          updateData.featuredImage = updateData.images.length > 0 ? updateData.images[0] : null;
        }
        
        // Delete images from Cloudinary
        await deleteMultipleImages(imageUrls);
      }

      // Remove specified videos
      if (videoUrls.length > 0) {
        const currentVideos = Array.isArray(event.videos) ? event.videos : [];
        updateData.videos = currentVideos.filter(vid => !videoUrls.includes(vid));
        
        // Delete videos from Cloudinary
        await deleteMultipleVideos(videoUrls);
      }

      await event.update(updateData);

      res.json({
        success: true,
        message: 'Media removed from event successfully',
        data: event
      });

    } catch (error) {
      console.error('Remove media from event error:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing media from event',
        error: error.message
      });
    }
  },

  // GET /upcoming/events - Get upcoming events
  getUpcomingEvents: async (req, res) => {
    try {
      const { limit = 5 } = req.query;

      const events = await Event.findAll({
        where: {
          status: 'recent',
          isActive: true,
          date: {
            [Sequelize.Op.gte]: new Date()
          }
        },
        limit: parseInt(limit),
        order: [['date', 'ASC']]
      });

      res.json({
        success: true,
        message: 'Recent events retrieved successfully',
        data: events
      });

    } catch (error) {
      console.error('Get upcoming events error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving upcoming events',
        error: error.message
      });
    }
  },

  // GET /past/events - Get past events
  getPastEvents: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const events = await Event.findAndCountAll({
        where: {
          status: 'past',
          isActive: true
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['date', 'DESC']]
      });

      res.json({
        success: true,
        message: 'Past events retrieved successfully',
        data: {
          events: events.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(events.count / limit),
            totalEvents: events.count
          }
        }
      });

    } catch (error) {
      console.error('Get past events error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving past events',
        error: error.message
      });
    }
  }
};

module.exports = eventController;