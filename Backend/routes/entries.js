const express = require("express");
const router = express.Router();
const Entry = require("../models/Entry");
const { body, validationResult } = require('express-validator');
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const cache = require("node-cache");

// Create a simple cache instance
const trendsCache = new cache();

// Create a logger instance using winston
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Apply rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

router.use(limiter); // Use rate limiter for all routes

// Create Entry (POST)
router.post(
  "/",
  [
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("type").isIn(["income", "expense"]).withMessage("Type must be either income or expense"),
    body("category").isString().isLength({ min: 1 }).withMessage("Category cannot be empty"),
    body("note").optional().isString().isLength({ max: 500 }).withMessage("Note should be less than 500 characters")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const entry = new Entry(req.body);
      await entry.save();
      logger.info(`Entry created: ${entry._id}`);
      res.status(201).json(entry);
    } catch (err) {
      logger.error(`Error creating entry: ${err.message}`);
      res.status(400).json({ error: err.message });
    }
  }
);

// Read all Entries with pagination, filters (GET)
router.get("/", async (req, res) => {
  const { page = 1, limit = 5, type, category, startdate, enddate } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (category) filter.category = category;
  
  if (startdate || enddate) {
    filter.date = {};
    if (startdate) {
      const start = new Date(`${startdate}T00:00:00.000Z`);
      if (isNaN(start)) return res.status(400).json({ error: "Invalid startdate format" });
      filter.date.$gte = start;
    }
    if (enddate) {
      const end = new Date(`${enddate}T23:59:59.999Z`);
      if (isNaN(end)) return res.status(400).json({ error: "Invalid enddate format" });
      filter.date.$lte = end;
    }
  }

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const entries = await Entry.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Entry.countDocuments(filter);
    res.json({
      entries,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error(`Error fetching entries: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Trends (GET)
router.get("/trends", async (req, res) => {
  const { startdate, enddate, period = "month" } = req.query;

  const match = {};
  if (startdate) {
    const start = new Date(startdate);
    if (isNaN(start)) return res.status(400).json({ error: "Invalid startdate format" });
    match.date = { $gte: start };
  }
  if (enddate) {
    const end = new Date(enddate);
    if (isNaN(end)) return res.status(400).json({ error: "Invalid enddate format" });
    match.date = { ...match.date, $lte: end };
  }

  const cacheKey = `trends-${startdate}-${enddate}-${period}`;
  const cachedTrends = trendsCache.get(cacheKey);
  if (cachedTrends) {
    return res.json(cachedTrends);
  }

  try {
    const groupFormat = period === "day" ? "%Y-%m-%d" : "%Y-%m";
    const trends = await Entry.aggregate([
      { $match: match },
      {
        $group: {
          _id: { period: { $dateToString: { format: groupFormat, date: "$date" } }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.period",
          data: { $push: { type: "$_id.type", total: "$total" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Cache the result for future requests
    trendsCache.set(cacheKey, trends, 3600); // Cache for 1 hour

    res.json(trends);
  } catch (err) {
    logger.error(`Error fetching trends: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Update Entry (PUT)
router.put("/:id", async (req, res) => {
  try {
    const updated = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Entry not found" });
    logger.info(`Entry updated: ${updated._id}`);
    res.json(updated);
  } catch (err) {
    logger.error(`Error updating entry: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Soft Delete Entry (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const entry = await Entry.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    logger.info(`Entry soft-deleted: ${entry._id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Error soft-deleting entry: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Summary of Income and Expenses (GET)
router.get("/summary", async (req, res) => {
  try {
    const entries = await Entry.find();
    const income = entries
      .filter((e) => e.type === "income")
      .reduce((acc, e) => acc + e.amount, 0);
    const expense = entries
      .filter((e) => e.type === "expense")
      .reduce((acc, e) => acc + e.amount, 0);
    res.json({ income, expense, balance: income - expense });
  } catch (err) {
    logger.error(`Error fetching summary: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
