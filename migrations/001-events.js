// migrations/001-create-event.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if the table exists
    const [tables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'events'");
    const tableExists = tables.length > 0;

    if (!tableExists) {
      // Create table if it doesn't exist
      await queryInterface.createTable('events', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        date: {
          type: Sequelize.DATE,
          allowNull: false
        },
        images: {
          type: Sequelize.JSON,
          defaultValue: []
        },
        videos: {
          type: Sequelize.JSON,
          defaultValue: []
        },
        featured_image: {
          type: Sequelize.STRING(1000),
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('recent', 'past'),
          defaultValue: 'recent'
        },
        is_active: {
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
      console.log('✅ Events table created');
    } else {
      console.log('✅ Events table already exists');
    }

    // Safely add indexes - check if they exist first
    try {
      const [indexes] = await queryInterface.sequelize.query("SHOW INDEX FROM events WHERE Key_name = 'events_date_is_active'");
      if (indexes.length === 0) {
        await queryInterface.addIndex('events', ['date', 'is_active'], {
          name: 'events_date_is_active'
        });
        console.log('✅ Added events_date_is_active index');
      } else {
        console.log('✅ events_date_is_active index already exists');
      }
    } catch (error) {
      console.log('ℹ️  events_date_is_active index already exists');
    }

    try {
      const [indexes] = await queryInterface.sequelize.query("SHOW INDEX FROM events WHERE Key_name = 'events_status'");
      if (indexes.length === 0) {
        await queryInterface.addIndex('events', ['status'], {
          name: 'events_status'
        });
        console.log('✅ Added events_status index');
      } else {
        console.log('✅ events_status index already exists');
      }
    } catch (error) {
      console.log('ℹ️  events_status index already exists');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('events');
  }
};