const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  addHealthData,
  getLatestHealthData,
  getHealthDataHistory,
} = require("../controllers/healthController");

const router = express.Router();


// ==========================================
// ADD HEALTH DATA
// ==========================================

router.post(
  "/",
  authMiddleware,
  addHealthData
);


// ==========================================
// GET LATEST HEALTH DATA
// ==========================================

router.get(
  "/latest",
  authMiddleware,
  getLatestHealthData
);


// ==========================================
// GET HEALTH DATA HISTORY
// ==========================================

router.get(
  "/history",
  authMiddleware,
  getHealthDataHistory
);


module.exports = router;