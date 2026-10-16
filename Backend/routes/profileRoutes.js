const express = require("express");

const {
  getProfile,
  saveProfile,
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.post("/", authMiddleware, saveProfile);

module.exports = router;