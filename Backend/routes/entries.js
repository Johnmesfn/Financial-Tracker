const express = require("express");
const router = express.Router();
const Entry = require("../models/Entry");
const { VALID_CATEGORIES } = require("../models/Entry");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const NodeCache = require("node-cache");

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
    const entry = new Entry(req.body);
    await entry.save();
    clearTrendsCache(); // Clear cache here
    logger.info(`Entry created: ${entry._id}`);
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
  const filter = { isDeleted: false };

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
  const match = { isDeleted: false };
  const cacheKey = `trends-${startdate || "all"}-${enddate || "all"}-${period}`;

  if (trendsCache.has(cacheKey)) return res.json(trendsCache.get(cacheKey));

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

// Category breakdown - FIXED TO HANDLE BOTH INCOME AND EXPENSE
router.get("/category-breakdown", async (req, res) => {
  try {
    const { type = "expense" } = req.query; // Default to 'expense' if not provided

    // Validate type parameter
    if (type !== "income" && type !== "expense") {
      return res.status(400).json({
        error: "Type parameter must be either 'income' or 'expense'",
      });
    }

    const result = await Entry.aggregate([
      { $match: { type: type, isDeleted: false } },
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
    const summary = await Entry.aggregate([
      { $match: { isDeleted: false } },
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
    const updated = await Entry.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Entry not found" });
    clearTrendsCache(); // Clear cache here
    logger.info(`Entry updated: ${updated._id}`);
    res.json(updated);
  } catch (err) {
    logger.error(`Update failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Soft delete
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Entry.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!deleted) return res.status(404).json({ error: "Entry not found" });
    clearTrendsCache(); // Clear cache here
    logger.info(`Entry deleted: ${deleted._id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Delete failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
