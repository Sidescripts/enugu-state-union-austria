// utils/runMigrations.js
const { sequelize } = require('../config/db');

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Import and run migrations
    const migrations = [
      { name: 'events', file: require('../migrations/001-events') },
      { name: 'executives', file: require('../migrations/002-executive') },
      { name: 'announcements', file: require('../migrations/003-announcement') },
      { name: 'admins', file: require('../migrations/004-admin') }
    ];
    
    for (const migration of migrations) {
      try {
        console.log(`\n🔄 Running ${migration.name} migration...`);
        await migration.file.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        console.log(`✅ ${migration.name} migration completed`);
      } catch (error) {
        if (error.name === 'SequelizeDatabaseError' && 
            (error.parent.code === 'ER_DUP_KEYNAME' || error.parent.code === 'ER_TABLE_EXISTS_ERROR')) {
          console.log(`ℹ️  ${migration.name} migration already applied - skipping`);
          continue;
        }
        throw error; // Re-throw other errors
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Don't exit process for duplicate key/table errors
    if (error.name === 'SequelizeDatabaseError' && 
        (error.parent.code === 'ER_DUP_KEYNAME' || error.parent.code === 'ER_TABLE_EXISTS_ERROR')) {
      console.log('ℹ️  Migration already applied - continuing with server startup');
      return;
    }
    
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;