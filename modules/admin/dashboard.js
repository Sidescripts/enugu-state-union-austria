// Models
const {Event, Announcement, Executive} = require('../../model');

// controllers/contentController.js
const { Op } = require('sequelize');

/**
 * GET /api/v1/content/stats
 * Returns live dashboard stats for Content Management page
 */
const getContentStats = async (req, res) => {
  try {
    const now = new Date();

    // ==================================================================
    // 1. PAST EVENTS
    // ==================================================================
    const pastEvents = await Event.findAll({
      where: {
        date: { [Op.lt]: now }, // date < now
        isActive: true
      },
      attributes: ['id', 'images', 'videos']
    });

    const pastMediaCount = pastEvents.reduce((total, event) => {
      const images = Array.isArray(event.images) ? event.images.length : 0;
      const videos = Array.isArray(event.videos) ? event.videos.length : 0;
      return total + images + videos;
    }, 0);

    // ==================================================================
    // 2. UPCOMING EVENTS
    // ==================================================================
    const upcomingEvents = await Event.findAll({
      where: {
        date: { [Op.gte]: now }, // date >= now
        isActive: true
      },
      attributes: ['id', 'isActive']
    });

    const activeUpcomingCount = upcomingEvents.filter(e => e.isActive).length;

    // ==================================================================
    // 3. ANNOUNCEMENTS
    // ==================================================================
    const allAnnouncements = await Announcement.findAll({
      where: { isActive: true },
      attributes: ['id', 'expiresAt']
    });

    const activeAnnouncements = allAnnouncements.filter(a => 
      !a.expiresAt || new Date(a.expiresAt) > now
    ).length;

    // ==================================================================
    // 4. EXECUTIVES
    // ==================================================================
    const executives = await Executive.findAll({
      where: { isActive: true },
      attributes: ['id']
    });

    // ==================================================================
    // 5. RESPONSE
    // ==================================================================
    res.json({
      success: true,
      data: {
        pastEvents: {
          total: pastEvents.length,
          media: pastMediaCount
        },
        upcomingEvents: {
          total: upcomingEvents.length,
          active: activeUpcomingCount
        },
        announcements: {
          active: activeAnnouncements,
          total: allAnnouncements.length
        },
        executives: {
          total: executives.length,
          active: executives.length // all fetched are active
        }
      }
    });

  } catch (error) {
    console.error('Content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard stats',
      error: error.message
    });
  }
};

module.exports = { getContentStats };