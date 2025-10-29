
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
        updateData.status = eventDate < currentDate ? 'recent' : 'past';
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
  }