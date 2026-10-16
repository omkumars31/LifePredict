const express = require("express");

const {
  getPredictionInput,
  getPrediction,
  getPredictionHistory,
} = require("../controllers/predictionController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get prepared ML input
router.get(
  "/input",
  authMiddleware,
  getPredictionInput
);

// Generate new prediction
router.post(
  "/predict",
  authMiddleware,
  getPrediction
);

// Get previous predictions
router.get(
  "/history",
  authMiddleware,
  getPredictionHistory
);

module.exports = router;