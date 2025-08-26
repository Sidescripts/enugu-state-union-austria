const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Admin connection for database creation
const adminConnection = new Sequelize('', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASSWORD || 'Dubemernest23',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

// Main Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'esuaDev',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Dubemernest23',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: msg => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ER_BAD_DB_ERROR/,
        /ESOCKET/
      ],
      max: 3,
      backoffBase: 1000,
      backoffExponent: 1.5
    }
  }
);

// Database creation function
const createDatabaseIfNotExists = async () => {
  try {
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'esuaDev'}`);
    logger.info(`✅ Database ${process.env.DB_NAME || 'esuaDev'} verified`);
  } catch (error) {
    logger.error('❌ Database creation failed:', error);
    throw error;
  } finally {
    await adminConnection.close();
  }
};

// Connection monitoring (correct implementation)
const setupConnectionEvents = () => {
  sequelize.authenticate()
    .then(() => logger.debug('🔁 Database connection established'))
    .catch(() => logger.warn('⚠️ Database connection lost'));
};

// Main connection function
const connectDB = async () => {
  try {
    // 1. Ensure database exists
    await createDatabaseIfNotExists();
    
    // 2. Authenticate
    await sequelize.authenticate();
    
    // 3. Sync models
    await sequelize.sync({ alter: true });
    
    // 4. Setup connection monitoring
    setupConnectionEvents();
    
    logger.info('✅ Database connected and models synced');
    return sequelize;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    
    if (error.original?.code === 'ER_BAD_DB_ERROR') {
      logger.error('💡 Solution: Create the database manually:');
      logger.error(`   CREATE DATABASE ${process.env.DB_NAME || 'esuaDev'};`);
      logger.error(`Then grant privileges: GRANT ALL ON ${process.env.DB_NAME || 'esuaDev'}.* TO '${process.env.DB_USER || 'root'}'@'localhost';`);
    }
    
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };