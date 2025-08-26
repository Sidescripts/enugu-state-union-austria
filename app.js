require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const {sequelize,connectDB} = require("./config/db");
const logger = require("./utils/logger");
const path = require('path');
const app = express();


// config
app.use(helmet()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', true);

//routes
// Admin base route

// Basic route example
app.get("/health", async (req, res) => {
    try {
        await sequelize.authenticate();
        
        res.json({
          status: 'UP',
          database: 'CONNECTED',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          status: 'DOWN',
          database: 'DISCONNECTED',
          error: error.message
        });
      }
});

const startServer = async () => {
    const port = process.env.PORT || 12000;
    try {
        await connectDB();
        
        app.listen(port, () => {
            logger.info(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1); // Exit the process with a failure code
    }
};
startServer();

function gracefulShutdown(){
  console.log('Starting graceful shutdown...');

  Server.close(() =>{
    console.log('Server stopped!!')
  });

  sequelize.close().then(() =>{
    console.log("Database connections closed");
    process.exit(0);
  }).catch(err =>{
    console.error('Error closing database: ', err);
    process.exit(1);
  });

  setTimeout(() =>{
    console.log('Forcing shutdown after timeout')
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);