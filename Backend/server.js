// server.js
const fs = require("fs");
const mongoose = require("mongoose");
const app = require("./app");
const winston = require("winston");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Winston logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Load environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate required environment variables
if (!MONGO_URI) {
  logger.error("❌ Missing MONGO_URI environment variable");
  process.exit(1);
}

if (!JWT_SECRET) {
  logger.error("❌ Missing JWT_SECRET environment variable");
  logger.error("Please add a strong JWT_SECRET to your .env file");
  process.exit(1);
}

// Main server start function - ONLY STARTS SERVER AFTER DB CONNECTION
const startServer = async () => {
  try {
    // Connect to MongoDB (no need for useNewUrlParser and useUnifiedTopology anymore)
    await mongoose.connect(MONGO_URI);

    logger.info("✅ MongoDB connected successfully");

    // Verify we can access collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        logger.error("❌ Failed to list MongoDB collections:", err);
        process.exit(1);
      } else {
        logger.info(
          `📦 Connected to database with ${collections.length} collections`
        );
        collections.forEach((col) => logger.info(`- ${col.name}`));
      }
    });

    // ONLY START SERVER AFTER DB CONNECTION IS VERIFIED
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info("🛑 Shutdown signal received. Closing server...");

      server.close(async () => {
        logger.info("HTTP server closed");
        await mongoose.connection.close();
        logger.info("MongoDB connection closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (error) {
    logger.error("❌ MongoDB connection failed", {
      message: error.message,
      stack: error.stack,
    });

    logger.error(
      "Make sure your MONGO_URI is correct and your IP is whitelisted in MongoDB Atlas"
    );
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("🚨 Uncaught Exception", {
    message: error.message,
    stack: error.stack,
  });
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("🚨 Unhandled Rejection", {
    reason: reason.message || reason,
    promise,
  });
});

// Start the server
startServer();
