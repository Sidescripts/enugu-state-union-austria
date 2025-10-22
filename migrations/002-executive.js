// migrations/002-create-executive.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('executives', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      position: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING(1000), // Using STRING for single image URL
        allowNull: true
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'For sorting display order'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes - matching your model exactly
    await queryInterface.addIndex('executives', ['order']);
    await queryInterface.addIndex('executives', ['isActive']);

    console.log('✅ Executives table created with single image support');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('executives');
  }
};