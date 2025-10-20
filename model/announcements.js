// models/Announcement.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Announcement = sequelize.define('Announcement', {
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: [],
      validate: {
        isValidImagesArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Images must be an array');
          }
          if (value && value.length > 2) {
            throw new Error('Cannot have more than 2 images');
          }
          if (value) {
            value.forEach(url => {
              if (typeof url !== 'string' || !url.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\/.+$/)) {
                throw new Error('Each image must be a valid URL');
              }
            });
          }
        }
      }
    },
    isImportant: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_important'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    }
  }, {
    tableName: 'announcements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['is_active']
      },
      {
        fields: ['is_important']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Instance methods for image management
  Announcement.prototype.addImage = function(imageUrl) {
    if (typeof imageUrl !== 'string' || !imageUrl.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\/.+$/)) {
      throw new Error('Image URL must be a valid URL');
    }
    
    const images = Array.isArray(this.images) ? this.images : [];
    
    if (images.length >= 2) {
      throw new Error('Cannot add more than 2 images');
    }
    
    images.push(imageUrl);
    return this.update({ images });
  };

  Announcement.prototype.removeImage = function(imageUrl) {
    const images = Array.isArray(this.images) ? this.images : [];
    const updatedImages = images.filter(img => img !== imageUrl);
    return this.update({ images: updatedImages });
  };

  Announcement.prototype.clearImages = function() {
    return this.update({ images: [] });
  };

  // Method to check if announcement is expired
  Announcement.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  };

  Announcement.beforeValidate((announcement) => {
    if (!announcement.id) {
      announcement.id = uuidv4();
    }
  });

  return Announcement;
};