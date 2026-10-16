const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

// ==========================================
// NUTRITION DATA DIRECTORY
// ==========================================

const DATA_DIR = path.resolve(__dirname, "../data/nutrition");

// ==========================================
// CSV FILE PATHS
// ==========================================

const fnddsFoodPath = path.join(DATA_DIR, "fndds_foods.csv");

const foundationFoodPath = path.join(
  DATA_DIR,
  "foundation_foods.csv"
);

const nutritionPath = path.join(
  DATA_DIR,
  "food_nutrient.csv"
);

const nutrientPath = path.join(
  DATA_DIR,
  "nutrient.csv"
);

// ==========================================
// DATA STORAGE
// ==========================================

let foods = [];
let foodNutrients = [];
let nutrients = [];

// ==========================================
// CHECK FILE
// ==========================================

function checkFile(filePath, fileName) {
  const exists = fs.existsSync(filePath);

  console.log(`${fileName}: ${exists}`);

  if (!exists) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  return true;
}

// ==========================================
// LOAD CSV
// ==========================================

function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// ==========================================
// LOAD ALL NUTRITION DATA
// ==========================================

async function loadNutritionData() {
  try {
    console.log("Loading nutrition data...");

    // Check all files first
    checkFile(fnddsFoodPath, "fndds_foods.csv");
    checkFile(foundationFoodPath, "foundation_foods.csv");
    checkFile(nutritionPath, "food_nutrient.csv");
    checkFile(nutrientPath, "nutrient.csv");

    console.log("All nutrition CSV files found.");

    const [
      fndds,
      foundation,
      nutrientData,
      nutrientMaster,
    ] = await Promise.all([
      loadCSV(fnddsFoodPath),
      loadCSV(foundationFoodPath),
      loadCSV(nutritionPath),
      loadCSV(nutrientPath),
    ]);

    foods = [...fndds, ...foundation];

    foodNutrients = nutrientData;

    nutrients = nutrientMaster;

    console.log(`Nutrition data loaded: ${foods.length} foods`);
    console.log(
      `Food nutrient records: ${foodNutrients.length}`
    );
    console.log(`Nutrients: ${nutrients.length}`);

    return true;
  } catch (error) {
    console.error("Error loading nutrition data:");
    console.error(error.message);

    throw error;
  }
}

// ==========================================
// SEARCH FOODS
// ==========================================

function searchFoods(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const search = query.toLowerCase().trim();

  return foods
    .filter((food) =>
      food.description?.toLowerCase().includes(search)
    )
    .slice(0, 20)
    .map((food) => ({
      fdc_id: food.fdc_id,
      description: food.description,
      data_type: food.data_type,
    }));
}

// ==========================================
// GET FOOD NUTRITION
// ==========================================

function getFoodNutrition(fdcId, grams = 100) {
  const food = foods.find(
    (item) => String(item.fdc_id) === String(fdcId)
  );

  if (!food) {
    return null;
  }

  const nutrientRecords = foodNutrients.filter(
    (item) => String(item.fdc_id) === String(fdcId)
  );

  const nutrition = {};

  nutrientRecords.forEach((record) => {
    const nutrient = nutrients.find(
      (item) =>
        String(item.id) === String(record.nutrient_id)
    );

    if (!nutrient) return;

    const nutrientName = nutrient.name
      ?.toLowerCase()
      .trim();

    const amount = parseFloat(record.amount);

    if (isNaN(amount)) return;

    const adjustedAmount = (amount * grams) / 100;

    if (nutrientName === "energy") {
      nutrition.calories = adjustedAmount;
    }

    if (nutrientName === "protein") {
      nutrition.protein = adjustedAmount;
    }

    if (nutrientName === "total lipid (fat)") {
      nutrition.fat = adjustedAmount;
    }

    if (
      nutrientName ===
      "carbohydrate, by difference"
    ) {
      nutrition.carbohydrates = adjustedAmount;
    }

    if (
      nutrientName ===
      "fiber, total dietary"
    ) {
      nutrition.fiber = adjustedAmount;
    }

    if (
      nutrientName === "sodium, na"
    ) {
      nutrition.sodium = adjustedAmount;
    }

    if (
      nutrientName ===
      "sugars, total including nlea"
    ) {
      nutrition.sugar = adjustedAmount;
    }
  });

  return {
    fdc_id: food.fdc_id,
    food: food.description,
    grams,
    nutrition,
  };
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  loadNutritionData,
  searchFoods,
  getFoodNutrition,
};