// migrations/005-fix-table-issues.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Fixing table structure issues...');

    // 1. Drop duplicate 'admin' table if it exists
    try {
      await queryInterface.dropTable('admin');
      console.log('✅ Dropped duplicate admin table');
    } catch (error) {
      console.log('ℹ️  No duplicate admin table to drop');
    }

    // 2. Fix events table status enum
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE events 
        MODIFY status ENUM('recent', 'past') NOT NULL DEFAULT 'recent'
      `);
      console.log('✅ Fixed events status enum to recent/past');
    } catch (error) {
      console.log('ℹ️  Events status enum already correct or error:', error.message);
    }

    // 3. Fix executives table structure
    try {
      // Check if executives table needs UUID migration
      const [executiveColumns] = await queryInterface.sequelize.query(`
        SELECT DATA_TYPE FROM information_schema.columns 
        WHERE table_name = 'executives' AND column_name = 'id'
      `);

      if (executiveColumns[0]?.DATA_TYPE === 'int') {
        console.log('🔄 Converting executives id from INT to UUID...');
        
        // Create temporary table with UUID
        await queryInterface.sequelize.query(`
          CREATE TABLE executives_new (
            id CHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            position VARCHAR(255) NOT NULL,
            bio TEXT,
            image VARCHAR(1000),
            email VARCHAR(255),
            phone VARCHAR(20),
            \`order\` INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

        // Copy data
        await queryInterface.sequelize.query(`
          INSERT INTO executives_new (name, position, bio, image, email, phone, \`order\`, is_active, created_at, updated_at)
          SELECT name, position, bio, image, email, phone, \`order\`, isActive, created_at, updated_at 
          FROM executives
        `);

        // Drop old table and rename new one
        await queryInterface.dropTable('executives');
        await queryInterface.renameTable('executives_new', 'executives');

        // Recreate indexes
        await queryInterface.addIndex('executives', ['order']);
        await queryInterface.addIndex('executives', ['is_active']);
        
        console.log('✅ Converted executives to UUID successfully');
      }
    } catch (error) {
      console.log('ℹ️  Executives table already uses UUID or error:', error.message);
    }

    // 4. Fix announcements field names
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE announcements 
        CHANGE isActive is_active BOOLEAN DEFAULT TRUE,
        CHANGE deletedAt deleted_at DATETIME NULL
      `);
      console.log('✅ Fixed announcements field names');
    } catch (error) {
      console.log('ℹ️  Announcements field names already correct or error:', error.message);
    }

    console.log('✅ All table issues fixed');
  },

  async down(queryInterface, Sequelize) {
    // We generally don't rollback fixes, but you can implement if needed
    console.log('⚠️  Fix migration rollback not implemented');
  }
};