const express = require("express");
const router = express.Router();
const Entry = require("../models/Entry");
const { VALID_CATEGORIES } = require("../models/Entry");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const NodeCache = require("node-cache");
const { protect } = require("../middleware/auth");
const mongoose = require("mongoose"); // Added this import
const trendsCache = new NodeCache();

// Winston logger
const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

// Rate limit
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  })
);

// Apply authentication to all entry routes
router.use(protect);

// Validation middleware
const entryValidationRules = [
  body("amount")
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number."),
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Type must be either 'income' or 'expense'."),
  body("category").isIn(VALID_CATEGORIES).withMessage("Invalid category."),
  body("note")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Note must be less than 500 characters."),
];

// Helper to clear trends cache
const clearTrendsCache = () => {
  trendsCache.flushAll();
};

// Create Entry
router.post("/", entryValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  try {
    // Add user ID to the entry
    const entry = new Entry({
      ...req.body,
      user: req.user.id
    });
    await entry.save();
    clearTrendsCache(); // Clear cache here
    logger.info(`Entry created: ${entry._id} by user ${req.user.id}`);
    res.status(201).json(entry);
  } catch (err) {
    logger.error(`Create failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Get all entries (paginated + filtered)
router.get("/", async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    category,
    startdate,
    enddate,
  } = req.query;
  
  // Start with isDeleted: false and user: req.user.id
  const filter = { 
    isDeleted: false,
    user: req.user.id
  };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startdate || enddate) {
    filter.date = {};
    if (startdate) filter.date.$gte = new Date(startdate + "T00:00:00Z");
    if (enddate) filter.date.$lte = new Date(enddate + "T23:59:59Z");
  }
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [entries, total] = await Promise.all([
      Entry.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Entry.countDocuments(filter),
    ]);
    res.json({
      entries,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error(`Fetch failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Trends
router.get("/trends", async (req, res) => {
  const { startdate, enddate, period = "month" } = req.query;
  const cacheKey = `trends-${req.user.id}-${startdate || "all"}-${enddate || "all"}-${period}`;
  if (trendsCache.has(cacheKey)) return res.json(trendsCache.get(cacheKey));
  
  // FIXED: Convert user ID to ObjectId
  const match = { 
    isDeleted: false,
    user: new mongoose.Types.ObjectId(req.user.id)
  };
  if (startdate) match.date = { $gte: new Date(startdate) };
  if (enddate)
    match.date = { ...match.date, $lte: new Date(enddate + "T23:59:59Z") };
  try {
    const format = period === "day" ? "%Y-%m-%d" : "%Y-%m";
    const trends = await Entry.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format, date: "$date" } },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          data: { $push: { type: "$_id.type", total: "$total" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    trendsCache.set(cacheKey, trends, 3600);
    res.json(trends);
  } catch (err) {
    logger.error(`Trends error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Category breakdown
router.get("/category-breakdown", async (req, res) => {
  try {
    const { type } = req.query;
    
    // FIXED: Convert user ID to ObjectId
    const filter = { 
      isDeleted: false,
      user: new mongoose.Types.ObjectId(req.user.id)
    };
    
    // Only add type to filter if it's valid
    if (type === 'income' || type === 'expense') {
      filter.type = type;
    }
    
    const result = await Entry.aggregate([
      { $match: filter },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);
    
    res.json(result);
  } catch (err) {
    logger.error(`Breakdown error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Summary
router.get("/summary", async (req, res) => {
  try {
    // FIXED: Convert user ID to ObjectId
    const summary = await Entry.aggregate([
      { $match: { 
        isDeleted: false, 
        user: new mongoose.Types.ObjectId(req.user.id) 
      }},
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]);
    let income = 0,
      expense = 0;
    summary.forEach((item) => {
      if (item._id === "income") income = item.total;
      if (item._id === "expense") expense = item.total;
    });
    res.json({ income, expense, balance: income - expense });
  } catch (err) {
    logger.error(`Summary error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put("/:id", entryValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  try {
    // Verify the entry exists and belongs to the user
    const entry = await Entry.findOne({ 
      _id: req.params.id, 
      user: req.user.id,
      isDeleted: false 
    });
    if (!entry) {
      return res.status(404).json({ 
        error: "Entry not found or you don't have permission to update it" 
      });
    }
    // Update the entry
    const updated = await Entry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    clearTrendsCache(); // Clear cache here
    logger.info(`Entry updated: ${updated._id} by user ${req.user.id}`);
    res.json(updated);
  } catch (err) {
    logger.error(`Update failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Soft delete
router.delete("/:id", async (req, res) => {
  try {
    // Verify the entry exists and belongs to the user
    const entry = await Entry.findOne({ 
      _id: req.params.id, 
      user: req.user.id,
      isDeleted: false 
    });
    if (!entry) {
      return res.status(404).json({ 
        error: "Entry not found or you don't have permission to delete it" 
      });
    }
    // Soft delete the entry
    const deleted = await Entry.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    clearTrendsCache(); // Clear cache here
    logger.info(`Entry deleted: ${deleted._id} by user ${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Delete failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;