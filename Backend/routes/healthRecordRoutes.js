const express = require("express");

const {
  createHealthRecord,
  getHealthRecords,
  getTodayHealthRecord,
} = require("../controllers/healthRecordController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Today's record must be checked explicitly before the generic
// collection endpoint is used by the frontend.
router.get(
  "/today",
  authMiddleware,
  getTodayHealthRecord
);

// Create a new daily record OR update today's existing record.
router.post(
  "/",
  authMiddleware,
  createHealthRecord
);

// Fetch all historical records for the logged-in patient.
router.get(
  "/",
  authMiddleware,
  getHealthRecords
);

module.exports = router;