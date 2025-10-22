const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Executive = sequelize.define('Executive', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    position: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidUrl(value) {
          if (value && !value.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\/.+$/)) {
            throw new Error('Image must be a valid URL');
          }
        }
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'For sorting display order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'executives',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['order']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  Executive.prototype.addImage = function(imageUrl) {
    if (typeof imageUrl !== 'string' || !imageUrl.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\/.+$/)) {
      throw new Error('Image URL must be a valid URL');
    }
    return this.update({ image: imageUrl });
  };

  Executive.prototype.removeImage = function() {
    return this.update({ image: null });
  };

  Executive.beforeValidate((executive) => {
    if (!executive.id) {
      executive.id = uuidv4();
    }
  });

  return Executive;
};