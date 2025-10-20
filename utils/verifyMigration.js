// utils/verifyMigration.js
require('dotenv').config(); // Add this line at the top
const { sequelize } = require('../config/db');

const verifyMigrations = async () => {
  try {
    console.log('🔍 Verifying database migrations...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('\n📊 Database Tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    // Verify each table structure
    const tablesToVerify = ['events', 'executives', 'announcements', 'admins'];
    
    for (const tableName of tablesToVerify) {
      try {
        const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
        console.log(`\n🔍 ${tableName} table structure:`);
        columns.forEach(col => {
          console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Count records in each table
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   📈 Records: ${countResult[0].count}`);
        
      } catch (error) {
        console.log(`   ❌ Table ${tableName} not found or error: ${error.message}`);
      }
    }

    // Check indexes
    console.log('\n🔍 Checking indexes...');
    for (const tableName of tablesToVerify) {
      try {
        const [indexes] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);
        console.log(`\n📑 ${tableName} indexes (${indexes.length}):`);
        const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
        uniqueIndexes.forEach(indexName => {
          const indexColumns = indexes
            .filter(idx => idx.Key_name === indexName)
            .map(idx => idx.Column_name)
            .join(', ');
          console.log(`   - ${indexName} (${indexColumns})`);
        });
      } catch (error) {
        console.log(`   ❌ Could not check indexes for ${tableName}`);
      }
    }
    
    console.log('\n✅ All migrations verified successfully!');
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  verifyMigrations();
}

module.exports = verifyMigrations;