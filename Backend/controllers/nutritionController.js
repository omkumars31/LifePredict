const nutritionService = require("../utils/nutritionService");

const searchFood = (req, res) => {
  try {
    const { q } = req.query;

    const results = nutritionService.searchFoods(q);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Food search error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to search foods",
    });
  }
};

const getNutrition = (req, res) => {
  try {
    const { fdcId } = req.params;
    const grams = Number(req.query.grams) || 100;

    const result = nutritionService.getFoodNutrition(
      fdcId,
      grams
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Nutrition error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch nutrition data",
    });
  }
};

module.exports = {
  searchFood,
  getNutrition,
};