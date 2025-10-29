require("dotenv").config();
const express = require("express");
const path = require("path")
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const logger = require("./utils/logger");
const {sequelize, connectDB} = require("./config/db");
const appRouter = require("./modules/mainRoutes");
const {notFound, errorHandler} = require("./middlewares/appMiddleware");
const runMigrations = require("./utils/runMigrations");
const app = express();

// init server
let server;

// config - Updated CSP with Cloudinary
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://www.smartsuppchat.com",
          "https://*.smartsuppcdn.com",
          "https://code.jquery.com", // jQuery
          "https://res.cloudinary.com", // Add Cloudinary for scripts
          "'unsafe-inline'"
        ],
        styleSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://*.smartsuppcdn.com",
          "https://fonts.googleapis.com",
          "'unsafe-inline'"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:",
          "https://*.smartsupp.com",
          "https://*.smartsuppcdn.com",
          "https://app.ciqpay.com",
          "https://via.placeholder.com",
          "https://cdn.pixabay.com",
          "https://images.unsplash.com",
          "https://img.youtube.com",
          "https://*.unsplash.com",
          "https://res.cloudinary.com", // Cloudinary images
          "https://*.cloudinary.com"   // All Cloudinary subdomains
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://*.smartsuppcdn.com",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
          "data:",
          "http://localhost:2000",
          "https://vitron-trade.com/"
        ],
        mediaSrc: [
          "'self'",
          "https:",
          "blob:",
          "https://*.smartsuppcdn.com",
          "https://*.youtube.com",
          "https://res.cloudinary.com", // Add Cloudinary for videos
          "https://*.cloudinary.com"    // All Cloudinary subdomains
        ],
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://images.unsplash.com",
          "https://res.cloudinary.com", // Cloudinary API calls
          "https://*.cloudinary.com"    // All Cloudinary subdomains
        ],
        scriptSrcAttr: [
          "'self'", "'unsafe-inline'"
        ],
        frameSrc: [
          "https://*.smartsupp.com",
          "https://*.smartsuppcdn.com",
          "https://www.youtube.com",
          "https://*.youtube.com"
        ]
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use((req, res, next) => {
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  if (req.url.endsWith('.mp4')) {
    res.setHeader('Content-Type', 'video/mp4');
  }
  if (req.url.endsWith('.woff2')) {
    res.setHeader('Content-Type', 'font/woff2');
  }
  next();
});

app.set('trust proxy', true)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, './public')));
app.use(morgan("combined"));
// app.use(bodyParser.json());
// Apply bodyParser.json() selectively (avoid for multipart routes)
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next(); // Skip JSON parsing for multipart requests
  }
  bodyParser.json()(req, res, next);
});

// check out route
app.get("/check-out", async(req,res) =>{
  console.log(`User ip => ${req.ip}`)
  console.log(req)
  res.json({
    success: true,
    msg: req.ip
  })
});

app.use("/api/v1", appRouter);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  const port = process.env.PORT || 1212;
    
    try {
        await connectDB();
        // await runMigrations()
        server = app.listen(port, () => { // ✅ Store server instance
            logger.info(`Server running on http://localhost:${port}`);
        });
        
        return server; // ✅ Return server instance
    } catch (error) {
        logger.error('Failed to start application:', error);
        console.error(error);
        process.exit(1); // Exit the process with a failure code
    }
};



// ✅ Fixed gracefulShutdown function
function gracefulShutdown() {
  console.log('Starting graceful shutdown...');
  
  if (!server) {
    console.log('No server instance found, exiting...');
    process.exit(0);
  }

  server.close(() => {
    console.log('Server stopped!!');
    
    if (sequelize) {
      sequelize.close().then(() => {
        console.log("Database connections closed");
        process.exit(0);
      }).catch(err => {
        console.error('Error closing database: ', err);
        process.exit(1);
      });
    } else {
      process.exit(0);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start the server
startServer().then(serverInstance => {
  // Server is now started
  logger.info('Application started successfully');
}).catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);