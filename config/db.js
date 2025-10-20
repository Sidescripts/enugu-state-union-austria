const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Admin connection for database creation
const adminConnection = new Sequelize(
  '',  // No DB name for admin
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD,

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
  process.env.DB_PASSWORD,  // Env-only
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    define: {
      freezeTableName: true,  // Prevents pluralization
    },
    logging: process.env.NODE_ENV === 'production' ? false : (msg) => logger.debug(msg),
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

// Connection monitoring (periodic health check)
const setupConnectionEvents = () => {
  // Check connection health every 30 seconds
  const CHECK_INTERVAL = 30000; // ms
  const intervalId = setInterval(async () => {
    try {
      await sequelize.authenticate();
      logger.debug('🔁 Database connection healthy');
    } catch (error) {
      logger.warn('⚠️ Database connection lost:', error.message);
      // Optional: Attempt reconnect by re-initializing pools
      sequelize.connectionManager.initPools();
    }
  }, CHECK_INTERVAL);

  // Store interval ID for cleanup if needed (e.g., on app shutdown)
  sequelize.options.checkIntervalId = intervalId;
};

// Main connection function
const connectDB = async () => {
  try {
    // 1. Ensure database exists
    await createDatabaseIfNotExists();

    // 2. Authenticate
    await sequelize.authenticate();

    // 3. Sync models (no alter to avoid index buildup; use migrations instead)
    await sequelize.sync();

    // Optional: Log index count for Admin (remove if not needed)
    try {
      const [results] = await sequelize.query('SHOW INDEX FROM `Admin`');
      logger.info(`Admin table has ${results.length} indexes`);
    } catch (indexError) {
      logger.warn('Could not fetch Admin indexes:', indexError.message);
    }

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

    // Throw instead of exit for better error handling in app.js
    throw error;
  }
};

module.exports = { sequelize, connectDB };