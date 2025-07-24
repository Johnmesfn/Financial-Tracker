// app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const winston = require("winston");
const helmet = require("helmet");
require("dotenv").config();

const entryRoutes = require("./routes/entries");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());

// Logging setup using Winston
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' }),
  ],
});

// Stream morgan logs to winston
app.use(morgan("combined", {
  stream: {
    write: (msg) => logger.info(msg.trim()),
  },
}));

// Routes
app.use("/api/entries", entryRoutes);

// Optional health check
app.get("/api/health", (req, res) => res.send("Server is healthy"));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
