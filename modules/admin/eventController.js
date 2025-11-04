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

      const { title, description, date, featuredImage } = req.body;


      // console.log('Request files:', req.files);
      // console.log('Request body:', req.body);

      const imageUrls = [];
      const videoUrls = [];

       // FIX: Handle different file structures
    if (req.files) {
      // Case 1: req.files is an array
      if (Array.isArray(req.files)) {
        req.files.forEach(file => {
          if (file.mimetype.startsWith('image/')) {
            imageUrls.push(file.secure_url || file.path || file.location);
          } else if (file.mimetype.startsWith('video/')) {
            videoUrls.push(file.secure_url || file.path || file.location);
          }
        });
      }
        // Case 2: req.files is an object with arrays (like from multer)
      else if (req.files.images || req.files.videos) {
        // Handle images
        if (req.files.images) {
          const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
          images.forEach(file => {
            if (file.mimetype.startsWith('image/')) {
              imageUrls.push(file.secure_url || file.path || file.location);
            }
          });
        }
        
        // Handle videos
        if (req.files.videos) {
          const videos = Array.isArray(req.files.videos) ? req.files.videos : [req.files.videos];
          videos.forEach(file => {
            if (file.mimetype.startsWith('video/')) {
              videoUrls.push(file.secure_url || file.path || file.location);
            }
          });
        }
      }
      // Case 3: req.files is a single file object
      else if (req.files.mimetype) {
        if (req.files.mimetype.startsWith('image/')) {
          imageUrls.push(req.files.secure_url || req.files.path || req.files.location);
        } else if (req.files.mimetype.startsWith('video/')) {
          videoUrls.push(req.files.secure_url || req.files.path || req.files.location);
        }
      }
    }

    // console.log('Processed image URLs:', imageUrls);
    // console.log('Processed video URLs:', videoUrls);



      // Auto-determine status based on date
      const eventDate = new Date(date);
      const currentDate = new Date();
      const status = eventDate < currentDate ? 'recent' : 'past';

      const event = await Event.create({
        title,
        description,
        date: eventDate,
        images: imageUrls, // Save the array of image URLs
        videos: videoUrls, // Save the array of video URLs
        featuredImage: imageUrls[0] || null, // Set first image as featured
        featuredImage,
        status: status || 'recent'
      });

      // console.log('Event created with media:', {
      //     images: imageUrls.length,
      //     videos: videoUrls.length
      // });


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
      
      const event = await Event.findAll({})
      // console.log(event)

      res.json({
        success: true,
        message: 'Events retrieved successfully',
        event
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
updateEvent: async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, status } = req.body;

    // console.log('Update request - Body:', req.body);
    // console.log('Update request - Files:', req.files);

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
      
      // FIXED: Correct status logic
      // If date is in the future → 'recent', if in the past → 'past'
      updateData.status = eventDate >= currentDate ? 'recent' : 'past';
    }

    // Handle manual status override
    if (status !== undefined && status !== '') {
      updateData.status = status;
    }

    // Handle images - merge existing with new
    let finalImages = [...(event.images || [])];
    if (req.files && req.files.images) {
      const newImages = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      newImages.forEach(file => {
        const url = file.secure_url || file.path || file.location;
        if (url) finalImages.push(url);
      });
    }
    updateData.images = finalImages;

    // Handle videos - merge existing with new
    let finalVideos = [...(event.videos || [])];
    if (req.files && req.files.videos) {
      const newVideos = Array.isArray(req.files.videos) ? req.files.videos : [req.files.videos];
      newVideos.forEach(file => {
        const url = file.secure_url || file.path || file.location;
        if (url) finalVideos.push(url);
      });
    }
    updateData.videos = finalVideos;

    // Set featured image to first image if available
    updateData.featuredImage = finalImages.length > 0 ? finalImages[0] : null;

    // console.log('Final update data:', updateData);

    await event.update(updateData);

    // Fetch the updated event
    const updatedEvent = await Event.findByPk(id);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
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