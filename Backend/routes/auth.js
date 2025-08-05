const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

// @desc      Register user
// @route     POST /api/auth/register
// @access    Public
router.post("/register", register);

// @desc      Login user
// @route     POST /api/auth/login
// @access    Public
router.post("/login", login);

// @desc      Get current logged in user
// @route     GET /api/auth/me
// @access    Private
router.get("/me", protect, getMe);

module.exports = router;
