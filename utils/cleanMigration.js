// utils/cleanMigrations.js
require('dotenv').config();
const { sequelize } = require('../config/db');

const cleanMigrations = async () => {
  try {
    // Drop the SequelizeMeta table if it exists
    await sequelize.query('DROP TABLE IF EXISTS SequelizeMeta');
    console.log('✅ Migration tracking cleared');
    
  } catch (error) {
    console.error('❌ Error cleaning migrations:', error.message);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  cleanMigrations();
}

module.exports = cleanMigrations;