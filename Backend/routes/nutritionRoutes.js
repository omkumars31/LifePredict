const express = require("express");

const {
  searchFood,
  getNutrition,
} = require("../controllers/nutritionController");

const router = express.Router();

router.get("/search", searchFood);

router.get("/:fdcId", getNutrition);

module.exports = router;