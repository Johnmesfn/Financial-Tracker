// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const winston = require("winston");
const helmet = require("helmet");
require("dotenv").config();

const entryRoutes = require("./routes/entries");

const app = express();

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Winston logger setup (separate logger from server.js)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/server.log" }),
  ],
});

// Use Morgan HTTP logger with Winston stream
app.use(morgan("combined", {
  stream: {
    write: (msg) => logger.info(msg.trim()),
  },
}));

// API Routes
app.use("/api/entries", entryRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "Server is healthy" });
});

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
