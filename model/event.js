const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
      validate: {
        isValidImagesArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Images must be an array');
          }
          if (value.length > 10) {
            throw new Error('Cannot have more than 10 images');
          }
          value.forEach(url => {
            if (typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
              throw new Error('Each image must be a valid URL');
            }
          });
        }
      }
    },
    videos: {
      type: DataTypes.JSON,
      defaultValue: [],
      validate: {
        isValidVideosArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('Videos must be an array');
          }
          if (value.length > 3) {
            throw new Error('Cannot have more than 53 videos');
          }
          value.forEach(url => {
            if (typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
              throw new Error('Each video must be a valid URL');
            }
          });
        }
      }
    },
    featuredImage: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'featured_image',
      validate: {
        isUrlOrEmpty(value) {
          if (value && !value.match(/^https?:\/\/.+/)) {
            throw new Error('Featured image must be a valid URL');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('recent', 'past'),
      defaultValue: 'recent'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true, // ADDED: Prevent automatic pluralization
    indexes: [
      { fields: ['date', 'is_active'] },
      { fields: ['status'] }
    ],
    hooks: {
      beforeSave: (event) => {
        if (event.images && event.images.length > 0 && !event.featuredImage) {
          event.featuredImage = event.images[0];
        }
      }
    }
  });

  Event.prototype.addImage = function(imageUrl) {
    const images = Array.isArray(this.images) ? this.images : [];
    images.push(imageUrl);
    return this.update({ images });
  };

  Event.prototype.addVideo = function(videoUrl) {
    const videos = Array.isArray(this.videos) ? this.videos : [];
    videos.push(videoUrl);
    return this.update({ videos });
  };

  Event.prototype.removeImage = function(imageUrl) {
    const images = Array.isArray(this.images) ? this.images : [];
    const updatedImages = images.filter(img => img !== imageUrl);
    return this.update({ images: updatedImages });
  };

  Event.prototype.removeVideo = function(videoUrl) {
    const videos = Array.isArray(this.videos) ? this.videos : [];
    const updatedVideos = videos.filter(vid => vid !== videoUrl);
    return this.update({ videos: updatedVideos });
  };

  // Generate UUID if not provided
  Event.beforeValidate((user) => {
    if (!user.id) {
      user.id = uuidv4();
    }
  });

  return Event;
};