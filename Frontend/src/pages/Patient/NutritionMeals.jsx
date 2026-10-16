import { useEffect, useMemo, useState } from "react";
import {
  Coffee,
  Utensils,
  Apple,
  Flame,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  TrendingUp,
  CircleCheck,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./NutritionMeals.css";

/* =========================================================
   LIFE PREDICT FOOD DATABASE
   Calories are approximate kcal per 100g.
   Local database is checked first.
   Open Food Facts is used as fallback.
   ========================================================= */

const FOOD_DATABASE = {
  /* ---------------- RICE & GRAINS ---------------- */
  rice: 130,
  "white rice": 130,
  "cooked rice": 130,
  "plain rice": 130,
  "basmati rice": 130,
  "brown rice": 123,
  "jeera rice": 160,
  "fried rice": 163,
  pulao: 150,
  "veg pulao": 145,
  biryani: 180,
  "veg biryani": 170,

  /* ---------------- DAL & LEGUMES ---------------- */
  dal: 116,
  "dal tadka": 135,
  "dal fry": 135,
  "dal chawal": 125,
  "moong dal": 105,
  "masoor dal": 116,
  "toor dal": 120,
  "arhar dal": 120,
  "chana dal": 164,
  rajma: 127,
  "rajma masala": 140,
  chole: 164,
  "chole masala": 165,
  sambar: 80,
  rasam: 45,

  /* ---------------- INDIAN BREAKFAST ---------------- */
  poha: 130,
  upma: 150,
  idli: 146,
  dosa: 168,
  "masala dosa": 190,
  uttapam: 160,
  paratha: 260,
  "aloo paratha": 220,
  "gobi paratha": 240,
  "paneer paratha": 270,
  roti: 297,
  chapati: 297,
  naan: 310,
  "butter naan": 330,
  puri: 330,
  bhatura: 320,
  thepla: 270,
  dhokla: 160,

  /* ---------------- VEGETABLES ---------------- */
  "aloo sabji": 110,
  aloo: 77,
  potato: 77,
  "aloo matar": 110,
  bhindi: 120,
  "bhindi sabji": 120,
  baingan: 90,
  "baingan bharta": 110,
  palak: 70,
  "palak sabji": 70,
  "mixed vegetables": 90,
  "veg sabji": 90,
  "vegetable curry": 100,
  "veg curry": 100,
  cauliflower: 50,
  cabbage: 45,
  peas: 81,
  beans: 31,
  carrot: 41,
  beetroot: 43,
  cucumber: 15,
  tomato: 18,
  spinach: 23,
  corn: 86,

  /* ---------------- PANEER & DAIRY ---------------- */
  paneer: 265,
  "paneer tikka": 220,
  "shahi paneer": 180,
  "palak paneer": 170,
  "matar paneer": 160,
  curd: 61,
  dahi: 61,
  yogurt: 61,
  raita: 70,
  tofu: 76,

  /* ---------------- INDIAN SNACKS ---------------- */
  samosa: 262,
  "vada pav": 290,
  "pav bhaji": 150,
  "bhel puri": 160,
  "sev puri": 220,
  "pani puri": 180,
  pakora: 280,
  kachori: 300,
  "bread pakora": 280,
  "spring roll": 200,
  "veg cutlet": 180,
  sandwich: 250,
  "veg sandwich": 230,
  frankie: 220,
  "veg frankie": 220,
  popcorn: 375,

  /* ---------------- FRUITS ---------------- */
  apple: 52,
  banana: 89,
  orange: 47,
  mango: 60,
  grapes: 69,
  watermelon: 30,
  papaya: 43,
  guava: 68,
  pomegranate: 83,
  pineapple: 50,
  pear: 57,
  kiwi: 61,
  strawberry: 32,
  muskmelon: 34,
  chikoo: 83,
  coconut: 354,

  /* ---------------- PROTEIN / NON-VEG ---------------- */
  egg: 155,
  "boiled egg": 155,
  omelette: 180,
  chicken: 165,
  "chicken curry": 180,
  "chicken biryani": 180,
  "chicken tikka": 165,
  "chicken kebab": 200,
  mutton: 250,
  "mutton curry": 250,
  fish: 150,
  "fish curry": 160,
  prawns: 99,

  /* ---------------- FAST FOOD ---------------- */
  burger: 295,
  "veg burger": 250,
  pizza: 266,
  "veg pizza": 250,
  "french fries": 312,
  noodles: 138,
  "hakka noodles": 160,
  pasta: 157,
  "white sauce pasta": 180,
  "red sauce pasta": 150,
  manchurian: 190,
  momos: 200,
  "fried momos": 260,
  "chow mein": 180,
  "spring roll": 200,

  /* ---------------- BREAKFAST / CEREALS ---------------- */
  oats: 389,
  "oatmeal": 68,
  cornflakes: 357,
  muesli: 360,
  bread: 265,
  "brown bread": 247,
  toast: 313,
  "peanut butter": 588,

  /* ---------------- NUTS ---------------- */
  almonds: 579,
  cashews: 553,
  walnuts: 654,
  pistachios: 562,
  raisins: 299,
  dates: 282,

  /* ---------------- SWEETS ---------------- */
  "gulab jamun": 320,
  rasgulla: 186,
  jalebi: 407,
  kheer: 120,
  halwa: 250,
  "gajar halwa": 180,
  icecream: 207,
  chocolate: 546,
  brownie: 466,
  cake: 350,
};

/* =========================================================
   FOOD PORTION ESTIMATES
   ========================================================= */

const PORTION_GRAMS = {
  bowl: {
    rice: 200,
    "white rice": 200,
    "cooked rice": 200,
    "plain rice": 200,
    "basmati rice": 200,
    "brown rice": 200,
    dal: 180,
    "dal tadka": 180,
    "dal fry": 180,
    "dal chawal": 250,
    "moong dal": 180,
    "masoor dal": 180,
    "toor dal": 180,
    rajma: 180,
    chole: 180,
    sambar: 180,
    rasam: 180,
    "aloo sabji": 150,
    "bhindi sabji": 150,
    "mixed vegetables": 150,
    "veg sabji": 150,
    paneer: 120,
    "paneer tikka": 150,
    "palak paneer": 150,
    "shahi paneer": 150,
    curd: 150,
    dahi: 150,
    yogurt: 150,
    poha: 180,
    upma: 180,
    noodles: 200,
    pasta: 200,
    "chicken curry": 180,
    "chicken biryani": 250,
  },

  plate: {
    rice: 300,
    "white rice": 300,
    "cooked rice": 300,
    "plain rice": 300,
    "basmati rice": 300,
    dal: 250,
    "dal tadka": 250,
    "dal fry": 250,
    "dal chawal": 400,
    poha: 250,
    upma: 250,
    "aloo sabji": 200,
    "bhindi sabji": 200,
    "mixed vegetables": 200,
    "veg sabji": 200,
    paneer: 180,
    "paneer tikka": 200,
    "palak paneer": 200,
    "shahi paneer": 200,
    roti: 120,
    chapati: 120,
    paratha: 150,
    "aloo paratha": 150,
    dosa: 150,
    "masala dosa": 200,
    idli: 150,
    "chicken curry": 250,
    "chicken biryani": 350,
    noodles: 300,
    pasta: 300,
  },

  cup: {
    oats: 80,
    cornflakes: 30,
    muesli: 60,
    curd: 200,
    dahi: 200,
    yogurt: 200,
    rice: 180,
    milk: 200,
  },

  glass: {
    milk: 200,
    curd: 200,
    dahi: 200,
    buttermilk: 250,
    chaas: 250,
    lassi: 250,
    juice: 250,
    "orange juice": 250,
  },

  slice: {
    bread: 30,
    "brown bread": 30,
    toast: 30,
    pizza: 100,
    cake: 80,
    brownie: 80,
  },
};

/* =========================================================
   PIECE-BASED FOOD ESTIMATES
   ========================================================= */

const PIECE_GRAMS = {
  roti: 40,
  chapati: 40,
  naan: 90,
  "butter naan": 100,
  puri: 35,
  bhatura: 90,
  paratha: 90,
  "aloo paratha": 110,
  "gobi paratha": 110,
  "paneer paratha": 120,

  idli: 40,
  dosa: 100,
  "masala dosa": 180,
  uttapam: 100,
  dhokla: 35,

  samosa: 70,
  kachori: 60,
  "vada pav": 100,
  "pav bhaji": 200,
  "veg cutlet": 70,
  pakora: 30,
  "bread pakora": 80,
  "spring roll": 60,
  momo: 25,
  momos: 25,

  egg: 50,
  "boiled egg": 50,
  omelette: 80,

  apple: 182,
  banana: 118,
  orange: 130,
  mango: 200,
  guava: 150,
  pear: 170,
  kiwi: 75,

  "gulab jamun": 45,
  rasgulla: 50,
  jalebi: 30,
  brownie: 80,
  cake: 80,

  bread: 30,
  "brown bread": 30,
  toast: 30,
};

/* =========================================================
   DRINK DATABASE
   Calories represent the displayed standard serving.
   ========================================================= */

const DRINK_DATABASE = [
  { name: "Water", quantity: 1, unit: "glass", calories: 0 },
  { name: "Tea", quantity: 1, unit: "cup", calories: 50 },
  { name: "Black Tea", quantity: 1, unit: "cup", calories: 2 },
  { name: "Green Tea", quantity: 1, unit: "cup", calories: 2 },
  { name: "Coffee", quantity: 1, unit: "cup", calories: 45 },
  { name: "Black Coffee", quantity: 1, unit: "cup", calories: 2 },
  { name: "Cold Coffee", quantity: 1, unit: "glass", calories: 120 },
  { name: "Milk", quantity: 1, unit: "glass", calories: 122 },
  { name: "Buttermilk", quantity: 1, unit: "glass", calories: 40 },
  { name: "Chaas", quantity: 1, unit: "glass", calories: 40 },
  { name: "Lassi", quantity: 1, unit: "glass", calories: 120 },
  { name: "Sweet Lassi", quantity: 1, unit: "glass", calories: 180 },
  { name: "Mango Lassi", quantity: 1, unit: "glass", calories: 190 },
  { name: "Fruit Juice", quantity: 1, unit: "glass", calories: 110 },
  { name: "Orange Juice", quantity: 1, unit: "glass", calories: 110 },
  { name: "Apple Juice", quantity: 1, unit: "glass", calories: 115 },
  { name: "Coconut Water", quantity: 1, unit: "glass", calories: 46 },
  { name: "Lemonade", quantity: 1, unit: "glass", calories: 100 },
  { name: "Cold Drink", quantity: 1, unit: "glass", calories: 105 },
  { name: "Cola", quantity: 1, unit: "glass", calories: 105 },
  { name: "Diet Cola", quantity: 1, unit: "glass", calories: 0 },
  { name: "Iced Tea", quantity: 1, unit: "glass", calories: 90 },
  { name: "Milkshake", quantity: 1, unit: "glass", calories: 250 },
  { name: "Chocolate Shake", quantity: 1, unit: "glass", calories: 300 },
  { name: "Smoothie", quantity: 1, unit: "glass", calories: 180 },
  { name: "Protein Shake", quantity: 1, unit: "glass", calories: 200 },
  { name: "Energy Drink", quantity: 1, unit: "can", calories: 110 },
  { name: "Sports Drink", quantity: 1, unit: "glass", calories: 80 },
];

/* =========================================================
   MEAL CONFIG
   ========================================================= */

const MEALS = {
  breakfast: {
    label: "Breakfast",
    icon: Coffee,
  },

  lunch: {
    label: "Lunch",
    icon: Utensils,
  },

  snacks: {
    label: "Snacks",
    icon: Apple,
  },

  dinner: {
    label: "Dinner",
    icon: Utensils,
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

const normalizeFoodName = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

const isRotiFood = (foodName) => {
  const normalized = normalizeFoodName(foodName);

  return (
    normalized === "roti" ||
    normalized === "chapati"
  );
};

/* =========================================================
   LOCAL FOOD SEARCH
   ========================================================= */

const LOCAL_NUTRITION_DATABASE = {
  rice: { caloriesPer100g: 130, proteinPer100g: 2.7, carbohydratesPer100g: 28.2, fatPer100g: 0.3, fiberPer100g: 0.4, sugarPer100g: 0.1, sodiumPer100g: 1 },
  "white rice": { caloriesPer100g: 130, proteinPer100g: 2.7, carbohydratesPer100g: 28.2, fatPer100g: 0.3, fiberPer100g: 0.4, sugarPer100g: 0.1, sodiumPer100g: 1 },
  dal: { caloriesPer100g: 116, proteinPer100g: 9, carbohydratesPer100g: 20, fatPer100g: 0.4, fiberPer100g: 7.9, sugarPer100g: 2, sodiumPer100g: 2 },
  "dal tadka": { caloriesPer100g: 135, proteinPer100g: 6.5, carbohydratesPer100g: 16, fatPer100g: 5, fiberPer100g: 5, sugarPer100g: 2, sodiumPer100g: 220 },
  "dal fry": { caloriesPer100g: 135, proteinPer100g: 6.5, carbohydratesPer100g: 16, fatPer100g: 5, fiberPer100g: 5, sugarPer100g: 2, sodiumPer100g: 220 },
  rajma: { caloriesPer100g: 127, proteinPer100g: 8.7, carbohydratesPer100g: 22.8, fatPer100g: 0.5, fiberPer100g: 6.4, sugarPer100g: 0.3, sodiumPer100g: 2 },
  chole: { caloriesPer100g: 164, proteinPer100g: 8.9, carbohydratesPer100g: 27.4, fatPer100g: 2.6, fiberPer100g: 7.6, sugarPer100g: 4.8, sodiumPer100g: 7 },
  poha: { caloriesPer100g: 130, proteinPer100g: 2.6, carbohydratesPer100g: 24, fatPer100g: 3, fiberPer100g: 1.7, sugarPer100g: 1.5, sodiumPer100g: 180 },
  upma: { caloriesPer100g: 150, proteinPer100g: 3.5, carbohydratesPer100g: 24, fatPer100g: 4.5, fiberPer100g: 2, sugarPer100g: 1.5, sodiumPer100g: 180 },
  idli: { caloriesPer100g: 146, proteinPer100g: 4.5, carbohydratesPer100g: 28, fatPer100g: 1, fiberPer100g: 1.5, sugarPer100g: 0.5, sodiumPer100g: 180 },
  dosa: { caloriesPer100g: 168, proteinPer100g: 4, carbohydratesPer100g: 30, fatPer100g: 3.5, fiberPer100g: 1.5, sugarPer100g: 1, sodiumPer100g: 220 },
  paratha: { caloriesPer100g: 260, proteinPer100g: 6, carbohydratesPer100g: 35, fatPer100g: 10, fiberPer100g: 3.5, sugarPer100g: 2, sodiumPer100g: 350 },
  roti: { caloriesPer100g: 297, proteinPer100g: 11, carbohydratesPer100g: 55, fatPer100g: 4.5, fiberPer100g: 11, sugarPer100g: 2, sodiumPer100g: 300 },
  chapati: { caloriesPer100g: 297, proteinPer100g: 11, carbohydratesPer100g: 55, fatPer100g: 4.5, fiberPer100g: 11, sugarPer100g: 2, sodiumPer100g: 300 },
  naan: { caloriesPer100g: 310, proteinPer100g: 9, carbohydratesPer100g: 50, fatPer100g: 8, fiberPer100g: 2.5, sugarPer100g: 3, sodiumPer100g: 500 },
  paneer: { caloriesPer100g: 265, proteinPer100g: 18.3, carbohydratesPer100g: 1.2, fatPer100g: 20.8, fiberPer100g: 0, sugarPer100g: 1.2, sodiumPer100g: 22 },
  tofu: { caloriesPer100g: 76, proteinPer100g: 8, carbohydratesPer100g: 1.9, fatPer100g: 4.8, fiberPer100g: 0.3, sugarPer100g: 0.6, sodiumPer100g: 7 },
  curd: { caloriesPer100g: 61, proteinPer100g: 3.5, carbohydratesPer100g: 4.7, fatPer100g: 3.3, fiberPer100g: 0, sugarPer100g: 4.7, sodiumPer100g: 46 },
  dahi: { caloriesPer100g: 61, proteinPer100g: 3.5, carbohydratesPer100g: 4.7, fatPer100g: 3.3, fiberPer100g: 0, sugarPer100g: 4.7, sodiumPer100g: 46 },
  egg: { caloriesPer100g: 155, proteinPer100g: 13, carbohydratesPer100g: 1.1, fatPer100g: 11, fiberPer100g: 0, sugarPer100g: 1.1, sodiumPer100g: 124 },
  "boiled egg": { caloriesPer100g: 155, proteinPer100g: 13, carbohydratesPer100g: 1.1, fatPer100g: 11, fiberPer100g: 0, sugarPer100g: 1.1, sodiumPer100g: 124 },
  omelette: { caloriesPer100g: 180, proteinPer100g: 11, carbohydratesPer100g: 2, fatPer100g: 14, fiberPer100g: 0, sugarPer100g: 1, sodiumPer100g: 250 },
  chicken: { caloriesPer100g: 165, proteinPer100g: 31, carbohydratesPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100g: 74 },
  "chicken curry": { caloriesPer100g: 180, proteinPer100g: 18, carbohydratesPer100g: 6, fatPer100g: 9, fiberPer100g: 1.5, sugarPer100g: 2, sodiumPer100g: 300 },
  "chicken biryani": { caloriesPer100g: 180, proteinPer100g: 8, carbohydratesPer100g: 25, fatPer100g: 5, fiberPer100g: 1.5, sugarPer100g: 1, sodiumPer100g: 350 },
  fish: { caloriesPer100g: 150, proteinPer100g: 22, carbohydratesPer100g: 0, fatPer100g: 7, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100g: 70 },
  prawns: { caloriesPer100g: 99, proteinPer100g: 24, carbohydratesPer100g: 0.2, fatPer100g: 0.3, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100g: 111 },
  apple: { caloriesPer100g: 52, proteinPer100g: 0.3, carbohydratesPer100g: 13.8, fatPer100g: 0.2, fiberPer100g: 2.4, sugarPer100g: 10.4, sodiumPer100g: 1 },
  banana: { caloriesPer100g: 89, proteinPer100g: 1.1, carbohydratesPer100g: 22.8, fatPer100g: 0.3, fiberPer100g: 2.6, sugarPer100g: 12.2, sodiumPer100g: 1 },
  orange: { caloriesPer100g: 47, proteinPer100g: 0.9, carbohydratesPer100g: 11.8, fatPer100g: 0.1, fiberPer100g: 2.4, sugarPer100g: 9.4, sodiumPer100g: 0 },
  mango: { caloriesPer100g: 60, proteinPer100g: 0.8, carbohydratesPer100g: 15, fatPer100g: 0.4, fiberPer100g: 1.6, sugarPer100g: 13.7, sodiumPer100g: 1 },
  watermelon: { caloriesPer100g: 30, proteinPer100g: 0.6, carbohydratesPer100g: 7.6, fatPer100g: 0.2, fiberPer100g: 0.4, sugarPer100g: 6.2, sodiumPer100g: 1 },
  papaya: { caloriesPer100g: 43, proteinPer100g: 0.5, carbohydratesPer100g: 11, fatPer100g: 0.3, fiberPer100g: 1.7, sugarPer100g: 7.8, sodiumPer100g: 8 },
  guava: { caloriesPer100g: 68, proteinPer100g: 2.6, carbohydratesPer100g: 14.3, fatPer100g: 1, fiberPer100g: 5.4, sugarPer100g: 8.9, sodiumPer100g: 2 },
  tomato: { caloriesPer100g: 18, proteinPer100g: 0.9, carbohydratesPer100g: 3.9, fatPer100g: 0.2, fiberPer100g: 1.2, sugarPer100g: 2.6, sodiumPer100g: 5 },
  cucumber: { caloriesPer100g: 15, proteinPer100g: 0.7, carbohydratesPer100g: 3.6, fatPer100g: 0.1, fiberPer100g: 0.5, sugarPer100g: 1.7, sodiumPer100g: 2 },
  carrot: { caloriesPer100g: 41, proteinPer100g: 0.9, carbohydratesPer100g: 9.6, fatPer100g: 0.2, fiberPer100g: 2.8, sugarPer100g: 4.7, sodiumPer100g: 69 },
  potato: { caloriesPer100g: 77, proteinPer100g: 2, carbohydratesPer100g: 17.5, fatPer100g: 0.1, fiberPer100g: 2.2, sugarPer100g: 0.8, sodiumPer100g: 6 },
  aloo: { caloriesPer100g: 77, proteinPer100g: 2, carbohydratesPer100g: 17.5, fatPer100g: 0.1, fiberPer100g: 2.2, sugarPer100g: 0.8, sodiumPer100g: 6 },
  oats: { caloriesPer100g: 389, proteinPer100g: 16.9, carbohydratesPer100g: 66.3, fatPer100g: 6.9, fiberPer100g: 10.6, sugarPer100g: 0.9, sodiumPer100g: 2 },
  bread: { caloriesPer100g: 265, proteinPer100g: 9, carbohydratesPer100g: 49, fatPer100g: 3.2, fiberPer100g: 2.7, sugarPer100g: 5, sodiumPer100g: 491 },
  "brown bread": { caloriesPer100g: 247, proteinPer100g: 13, carbohydratesPer100g: 41, fatPer100g: 4.2, fiberPer100g: 7, sugarPer100g: 5, sodiumPer100g: 400 },
  almonds: { caloriesPer100g: 579, proteinPer100g: 21.2, carbohydratesPer100g: 21.6, fatPer100g: 49.9, fiberPer100g: 12.5, sugarPer100g: 4.4, sodiumPer100g: 1 },
  cashews: { caloriesPer100g: 553, proteinPer100g: 18.2, carbohydratesPer100g: 30.2, fatPer100g: 43.9, fiberPer100g: 3.3, sugarPer100g: 5.9, sodiumPer100g: 12 },
  walnuts: { caloriesPer100g: 654, proteinPer100g: 15.2, carbohydratesPer100g: 13.7, fatPer100g: 65.2, fiberPer100g: 6.7, sugarPer100g: 2.6, sodiumPer100g: 2 },
};

const findLocalNutrition = (foodName, grams) => {
  const normalized = normalizeFoodName(foodName);
  let match = LOCAL_NUTRITION_DATABASE[normalized];

  if (!match) {
    const matchedKey = Object.keys(LOCAL_NUTRITION_DATABASE).find(
      (key) =>
        normalized.includes(key) ||
        key.includes(normalized)
    );
    match = matchedKey
      ? LOCAL_NUTRITION_DATABASE[matchedKey]
      : null;
  }

  return match ? scaleNutrition(match, grams) : null;
};

const findLocalFood = (foodName) => {
  const normalized = normalizeFoodName(foodName);

  if (FOOD_DATABASE[normalized]) {
    return {
      name: foodName.trim(),
      caloriesPer100g: FOOD_DATABASE[normalized],
      source: "LifePredict food database",
    };
  }

  const matchedKey = Object.keys(FOOD_DATABASE).find(
    (key) =>
      normalized.includes(key) ||
      key.includes(normalized)
  );

  if (matchedKey) {
    return {
      name: foodName.trim(),
      caloriesPer100g: FOOD_DATABASE[matchedKey],
      source: "LifePredict food database",
    };
  }

  return null;
};

/* =========================================================
   OPEN FOOD FACTS FALLBACK
   ========================================================= */

const searchOpenFoodFacts = async (foodName) => {
  const encodedFood = encodeURIComponent(foodName);

  const url =
    `https://world.openfoodfacts.org/api/v2/search` +
    `?search_terms=${encodedFood}` +
    `&page_size=10` +
    `&fields=product_name,nutriments,serving_size`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Food database request failed."
    );
  }

  const data = await response.json();

  const products = Array.isArray(data.products)
    ? data.products
    : [];

  const validProduct = products.find((product) => {
    const nutriments = product?.nutriments || {};
    const calories = nutriments["energy-kcal_100g"];

    return (
      product?.product_name &&
      calories !== undefined &&
      calories !== null &&
      Number.isFinite(Number(calories))
    );
  });

  if (!validProduct) {
    return null;
  }

  const n = validProduct.nutriments || {};

  return {
    name: foodName.trim(),
    caloriesPer100g: Number(n["energy-kcal_100g"] || 0),
    proteinPer100g: Number(n["proteins_100g"] || 0),
    carbohydratesPer100g: Number(n["carbohydrates_100g"] || 0),
    fatPer100g: Number(n["fat_100g"] || 0),
    fiberPer100g: Number(n["fiber_100g"] || 0),
    sugarPer100g: Number(n["sugars_100g"] || 0),
    sodiumPer100g: Number(
      n["sodium_100g"] || 0
    ) * 1000,
    source: "Open Food Facts",
    matchedProduct: validProduct.product_name,
    servingSize: validProduct.serving_size || "",
  };
};

/* =========================================================
   PORTION → GRAMS
   ========================================================= */

const getPortionGrams = (
  foodName,
  quantity,
  unit
) => {
  const normalized = normalizeFoodName(foodName);
  const numericQuantity = Number(quantity);

  if (
    !Number.isFinite(numericQuantity) ||
    numericQuantity <= 0
  ) {
    return 0;
  }

  /* GRAMS */
  if (unit === "g") {
    return numericQuantity;
  }

  /* PIECES */
  if (unit === "piece") {
    const exactPieceWeight =
      PIECE_GRAMS[normalized];

    if (exactPieceWeight) {
      return numericQuantity * exactPieceWeight;
    }

    const matchedPieceKey = Object.keys(
      PIECE_GRAMS
    ).find(
      (key) =>
        normalized.includes(key) ||
        key.includes(normalized)
    );

    if (matchedPieceKey) {
      return (
        numericQuantity *
        PIECE_GRAMS[matchedPieceKey]
      );
    }

    /* Generic fallback for unknown piece-based foods */
    return numericQuantity * 50;
  }

  /* STANDARD PORTION */
  const unitMap = PORTION_GRAMS[unit] || {};

  if (unitMap[normalized]) {
    return numericQuantity * unitMap[normalized];
  }

  const matchedKey = Object.keys(unitMap).find(
    (key) =>
      normalized.includes(key) ||
      key.includes(normalized)
  );

  if (matchedKey) {
    return numericQuantity * unitMap[matchedKey];
  }

  /* GENERIC ESTIMATES */
  if (unit === "bowl") {
    return numericQuantity * 200;
  }

  if (unit === "plate") {
    return numericQuantity * 300;
  }

  if (unit === "slice") {
    return numericQuantity * 30;
  }

  return numericQuantity;
};

/* =========================================================
   NUTRITION API + NUTRIENT HELPERS
   ========================================================= */

const NUTRITION_API_BASE =
  "http://localhost:5001/api/nutrition";

const emptyNutrition = () => ({
  calories: null,
  protein: null,
  carbohydrates: null,
  fat: null,
  fiber: null,
  sodium: null,
  sugar: null,
});

const normalizeNutrition = (nutrition = {}) => ({
  calories: Number.isFinite(Number(nutrition.calories))
    ? Number(nutrition.calories)
    : null,
  protein: Number.isFinite(Number(nutrition.protein))
    ? Number(nutrition.protein)
    : null,
  carbohydrates: Number.isFinite(Number(nutrition.carbohydrates))
    ? Number(nutrition.carbohydrates)
    : null,
  fat: Number.isFinite(Number(nutrition.fat))
    ? Number(nutrition.fat)
    : null,
  fiber: Number.isFinite(Number(nutrition.fiber))
    ? Number(nutrition.fiber)
    : null,
  sodium: Number.isFinite(Number(nutrition.sodium))
    ? Number(nutrition.sodium)
    : null,
  sugar: Number.isFinite(Number(nutrition.sugar))
    ? Number(nutrition.sugar)
    : null,
});

const hasNutritionValue = (value) =>
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value));

const searchBackendFoods = async (foodName) => {
  const response = await fetch(
    `${NUTRITION_API_BASE}/search?q=${encodeURIComponent(
      foodName
    )}`
  );

  if (!response.ok) {
    throw new Error("Nutrition search request failed.");
  }

  const data = await response.json();
  const results = Array.isArray(data?.results)
    ? data.results
    : [];

  const normalizedQuery = normalizeFoodName(foodName);

  return [...results].sort((a, b) => {
    const aExact =
      normalizeFoodName(a?.description) ===
      normalizedQuery;
    const bExact =
      normalizeFoodName(b?.description) ===
      normalizedQuery;

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
};

const fetchBackendNutrition = async (
  fdcId,
  grams
) => {
  const response = await fetch(
    `${NUTRITION_API_BASE}/${encodeURIComponent(
      fdcId
    )}?grams=${encodeURIComponent(grams)}`
  );

  if (!response.ok) {
    throw new Error(
      "Nutrition details request failed."
    );
  }

  const data = await response.json();

  if (!data?.success || !data?.data) {
    throw new Error(
      "Nutrition details were not available."
    );
  }

  return data.data;
};

const hasMeaningfulNutrition = (nutrition) => {
  const normalized = normalizeNutrition(nutrition);

  return [
    normalized.calories,
    normalized.protein,
    normalized.carbohydrates,
    normalized.fat,
    normalized.fiber,
    normalized.sodium,
    normalized.sugar,
  ].some(
    (value) =>
      hasNutritionValue(value) &&
      Number(value) > 0
  );
};

const scaleNutrition = (per100g, grams) => {
  const factor = Number(grams) / 100;

  return normalizeNutrition({
    calories: Number(per100g.caloriesPer100g || 0) * factor,
    protein: Number(per100g.proteinPer100g || 0) * factor,
    carbohydrates:
      Number(per100g.carbohydratesPer100g || 0) * factor,
    fat: Number(per100g.fatPer100g || 0) * factor,
    fiber: Number(per100g.fiberPer100g || 0) * factor,
    sodium: Number(per100g.sodiumPer100g || 0) * factor,
    sugar: Number(per100g.sugarPer100g || 0) * factor,
  });
};

const DRINK_UNIT_GRAMS = {
  glass: 250,
  bottle: 500,
  can: 330,
};

const getDrinkGrams = (quantity, unit) =>
  Number(quantity) * (DRINK_UNIT_GRAMS[unit] || 250);

/* Static beverage nutrition is used only as a fallback for typed drinks. */
const DRINK_NUTRITION_DATABASE = {
  Water: {
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  },
  Tea: {
    protein: 1.5,
    carbohydrates: 7,
    fat: 1.5,
    fiber: 0,
    sugar: 5,
    sodium: 25,
  },
  "Black Tea": {
    protein: 0,
    carbohydrates: 0.5,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 5,
  },
  "Green Tea": {
    protein: 0,
    carbohydrates: 0.5,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 2,
  },
  Coffee: {
    protein: 1,
    carbohydrates: 5,
    fat: 1,
    fiber: 0,
    sugar: 4,
    sodium: 20,
  },
  "Black Coffee": {
    protein: 0.3,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 5,
  },
  "Cold Coffee": {
    protein: 4,
    carbohydrates: 18,
    fat: 5,
    fiber: 0,
    sugar: 14,
    sodium: 55,
  },
  Milk: {
    protein: 6.3,
    carbohydrates: 9.6,
    fat: 6.5,
    fiber: 0,
    sugar: 9.6,
    sodium: 100,
  },
  Buttermilk: {
    protein: 2.2,
    carbohydrates: 3.5,
    fat: 1.2,
    fiber: 0,
    sugar: 3.5,
    sodium: 180,
  },
  Chaas: {
    protein: 2.2,
    carbohydrates: 3.5,
    fat: 1.2,
    fiber: 0,
    sugar: 3.5,
    sodium: 180,
  },
  Lassi: {
    protein: 5,
    carbohydrates: 18,
    fat: 3,
    fiber: 0,
    sugar: 16,
    sodium: 80,
  },
  "Sweet Lassi": {
    protein: 5,
    carbohydrates: 30,
    fat: 3,
    fiber: 0,
    sugar: 28,
    sodium: 80,
  },
  "Mango Lassi": {
    protein: 5,
    carbohydrates: 34,
    fat: 3,
    fiber: 1,
    sugar: 30,
    sodium: 75,
  },
  "Fruit Juice": {
    protein: 0.5,
    carbohydrates: 26,
    fat: 0.2,
    fiber: 0.2,
    sugar: 22,
    sodium: 5,
  },
  "Orange Juice": {
    protein: 1.7,
    carbohydrates: 25,
    fat: 0.5,
    fiber: 0.5,
    sugar: 21,
    sodium: 2,
  },
  "Apple Juice": {
    protein: 0.3,
    carbohydrates: 28,
    fat: 0.3,
    fiber: 0.2,
    sugar: 24,
    sodium: 5,
  },
  "Coconut Water": {
    protein: 2,
    carbohydrates: 9,
    fat: 0.5,
    fiber: 2,
    sugar: 6,
    sodium: 60,
  },
  Lemonade: {
    protein: 0,
    carbohydrates: 25,
    fat: 0,
    fiber: 0,
    sugar: 24,
    sodium: 5,
  },
  "Cold Drink": {
    protein: 0,
    carbohydrates: 26,
    fat: 0,
    fiber: 0,
    sugar: 26,
    sodium: 10,
  },
  Cola: {
    protein: 0,
    carbohydrates: 26,
    fat: 0,
    fiber: 0,
    sugar: 26,
    sodium: 10,
  },
  "Diet Cola": {
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 15,
  },
  "Iced Tea": {
    protein: 0,
    carbohydrates: 22,
    fat: 0,
    fiber: 0,
    sugar: 21,
    sodium: 5,
  },
  Milkshake: {
    protein: 7,
    carbohydrates: 35,
    fat: 10,
    fiber: 0,
    sugar: 30,
    sodium: 110,
  },
  "Chocolate Shake": {
    protein: 8,
    carbohydrates: 45,
    fat: 12,
    fiber: 1,
    sugar: 38,
    sodium: 140,
  },
  Smoothie: {
    protein: 4,
    carbohydrates: 30,
    fat: 3,
    fiber: 4,
    sugar: 22,
    sodium: 45,
  },
  "Protein Shake": {
    protein: 25,
    carbohydrates: 12,
    fat: 5,
    fiber: 2,
    sugar: 5,
    sodium: 180,
  },
  "Energy Drink": {
    protein: 0,
    carbohydrates: 28,
    fat: 0,
    fiber: 0,
    sugar: 26,
    sodium: 100,
  },
  "Sports Drink": {
    protein: 0,
    carbohydrates: 20,
    fat: 0,
    fiber: 0,
    sugar: 18,
    sodium: 100,
  },
};

const findKnownDrink = (query) => {
  const normalizedQuery = normalizeFoodName(query);

  if (!normalizedQuery) return null;

  const aliases = {
    chai: "tea",
    "chai tea": "tea",
    "milk tea": "tea",
    "tea with milk": "tea",
    "masala chai": "tea",
    "masala tea": "tea",
    "indian tea": "tea",
    "black chai": "black tea",
    "green chai": "green tea",
  };

  const resolvedQuery = aliases[normalizedQuery] || normalizedQuery;

  const exact = DRINK_DATABASE.find(
    (drink) =>
      normalizeFoodName(drink.name) === resolvedQuery
  );

  if (exact) return exact;

  // Prefer the curated common-beverage record for short/common searches.
  // This prevents generic database matches such as "tea leaves" from
  // replacing an actual beverage.
  const contains = DRINK_DATABASE.find((drink) => {
    const name = normalizeFoodName(drink.name);
    return (
      name === resolvedQuery ||
      name.includes(resolvedQuery) ||
      resolvedQuery.includes(name)
    );
  });

  return contains || null;
};

const getDrinkNutrition = (drink) => ({
  calories: Number(drink.calories || 0),
  ...(DRINK_NUTRITION_DATABASE[drink.name] || emptyNutrition()),
});

const sumNutrition = (items) => {
  const totals = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    sugar: 0,
  };

  const availability = {
    protein: false,
    carbohydrates: false,
    fat: false,
    fiber: false,
    sodium: false,
    sugar: false,
  };

  items.forEach((item) => {
    totals.calories += Number(item.calories || 0);

    const nutrition = item.nutrition || {};

    Object.keys(availability).forEach((key) => {
      if (hasNutritionValue(nutrition[key])) {
        totals[key] += Number(nutrition[key]);
        availability[key] = true;
      }
    });
  });

  return { totals, availability };
};

const roundNutrition = (value, digits = 1) => {
  if (!hasNutritionValue(value)) return null;
  return Number(Number(value).toFixed(digits));
};

/* =========================================================
   INDIA DATE HELPERS
   ========================================================= */

const getIndiaDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleDateString(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
    }
  );
};

const getTodayIndiaDate = () => {
  return new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
    }
  );
};

const getIndiaHour = () => {
  return Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
};

/* =========================================================
   SELECT WEIGHT
   RULE:
   1. Today's latest saved record if available.
   2. Otherwise latest saved record overall.
   ========================================================= */

const selectLatestWeightRecord = (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const validRecords = records.filter(
    (record) =>
      record &&
      record.recorded_at &&
      record.weight_kg !== null &&
      record.weight_kg !== undefined &&
      Number.isFinite(Number(record.weight_kg))
  );

  if (validRecords.length === 0) {
    return null;
  }

  const sortedRecords = [...validRecords].sort(
    (a, b) =>
      new Date(b.recorded_at).getTime() -
      new Date(a.recorded_at).getTime()
  );

  const today = getTodayIndiaDate();

  const todayRecords = sortedRecords.filter(
    (record) =>
      getIndiaDate(record.recorded_at) === today
  );

  return todayRecords.length > 0
    ? todayRecords[0]
    : sortedRecords[0];
};

/* =========================================================
   DAILY MEAL PERSISTENCE
   Meals are stored in the browser for the current India date.
   They survive route changes, refreshes and reopening the page,
   and are cleared automatically when the calendar date changes.
   ========================================================= */

const EMPTY_MEALS = {
  breakfast: [],
  lunch: [],
  snacks: [],
  dinner: [],
};

const getNutritionStorageKey = () => {
  try {
    const token = localStorage.getItem("token");

    if (token) {
      const payload = JSON.parse(
        decodeURIComponent(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
            .split("")
            .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      );

      const userKey =
        payload?.sub ||
        payload?.userId ||
        payload?.user_id ||
        payload?.email;

      if (userKey) {
        return `lifepredict_nutrition_meals_${String(userKey)}`;
      }
    }
  } catch (error) {
    console.warn("Nutrition storage user key unavailable:", error);
  }

  return "lifepredict_nutrition_meals";
};

const getStoredMealsForToday = () => {
  try {
    const raw = localStorage.getItem(getNutritionStorageKey());

    if (!raw) return EMPTY_MEALS;

    const stored = JSON.parse(raw);
    const today = getTodayIndiaDate();

    if (stored?.date !== today) {
      localStorage.removeItem(getNutritionStorageKey());
      return EMPTY_MEALS;
    }

    return {
      ...EMPTY_MEALS,
      ...(stored?.meals || {}),
    };
  } catch (error) {
    console.warn("Nutrition meal restore failed:", error);
    return EMPTY_MEALS;
  }
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function NutritionMeals() {
  const navigate = useNavigate();

  const [activeMeal, setActiveMeal] =
    useState("breakfast");

  const [foodName, setFoodName] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [unit, setUnit] =
    useState("g");

  const [drinkName, setDrinkName] =
    useState("");

  const [drinkQuantity, setDrinkQuantity] =
    useState(1);

  const [drinkUnit, setDrinkUnit] =
    useState("glass");

  const [meals, setMeals] =
    useState(getStoredMealsForToday);


  const [loading, setLoading] =
    useState(false);

  const [foodError, setFoodError] =
    useState("");

  const [drinkError, setDrinkError] =
    useState("");

  const [latestWeight, setLatestWeight] =
    useState(null);

  const [weightRecordDate, setWeightRecordDate] =
    useState(null);

  const [loadingHealth, setLoadingHealth] =
    useState(true);

  /* =========================================================
     SAVE TODAY'S MEALS
     ========================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        getNutritionStorageKey(),
        JSON.stringify({
          date: getTodayIndiaDate(),
          meals,
        })
      );
    } catch (error) {
      console.warn("Nutrition meal save failed:", error);
    }
  }, [meals]);

  /* =========================================================
     CLEAR AUTOMATICALLY WHEN INDIA DATE CHANGES
     ========================================================= */

  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayIndiaDate();

      try {
        const raw = localStorage.getItem(
          getNutritionStorageKey()
        );
        const stored = raw ? JSON.parse(raw) : null;

        if (stored?.date && stored.date !== today) {
          setMeals(EMPTY_MEALS);
          localStorage.setItem(
            getNutritionStorageKey(),
            JSON.stringify({
              date: today,
              meals: EMPTY_MEALS,
            })
          );
        }
      } catch (error) {
        console.warn("Nutrition date check failed:", error);
      }
    };

    checkDateChange();

    const interval = setInterval(
      checkDateChange,
      30 * 1000
    );

    window.addEventListener("focus", checkDateChange);
    window.addEventListener("visibilitychange", checkDateChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkDateChange);
      window.removeEventListener("visibilitychange", checkDateChange);
    };
  }, []);

  /* =========================================================
     LOAD LATEST WEIGHT
     ========================================================= */

  useEffect(() => {
    const loadLatestWeight = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoadingHealth(false);
        return;
      }

      try {
        setLoadingHealth(true);

        const response = await fetch(
          "http://localhost:5001/api/health-records",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to load health records."
          );
        }

        const records =
          Array.isArray(data.records)
            ? data.records
            : [];

        const selectedRecord =
          selectLatestWeightRecord(records);

        if (!selectedRecord) {
          setLatestWeight(null);
          setWeightRecordDate(null);
          return;
        }

        setLatestWeight(
          Number(selectedRecord.weight_kg)
        );

        setWeightRecordDate(
          selectedRecord.recorded_at
        );
      } catch (healthError) {
        console.error(
          "Nutrition health data error:",
          healthError
        );

        setLatestWeight(null);
        setWeightRecordDate(null);
      } finally {
        setLoadingHealth(false);
      }
    };

    loadLatestWeight();
  }, []);

  /* =========================================================
     DAILY CALORIE TARGET
     LifePredict rule:
     latest weight × 24
     ========================================================= */

  const DAILY_TARGET = useMemo(() => {
    if (
      latestWeight === null ||
      !Number.isFinite(Number(latestWeight)) ||
      Number(latestWeight) <= 0
    ) {
      return 0;
    }

    return Math.round(
      Number(latestWeight) * 24
    );
  }, [latestWeight]);

  /* =========================================================
     AUTOMATIC ROTI / CHAPATI MODE
     ========================================================= */

  useEffect(() => {
    if (isRotiFood(foodName)) {
      setUnit("piece");

      if (
        !quantity ||
        Number(quantity) <= 0
      ) {
        setQuantity(1);
      }
    }
  }, [foodName]);

  /* =========================================================
     TOTAL CALORIES
     ========================================================= */

  const consumedCalories = useMemo(() => {
    return Object.values(meals)
      .flat()
      .reduce(
        (total, item) =>
          total + Number(item.calories || 0),
        0
      );
  }, [meals]);

  const remainingCalories =
    DAILY_TARGET > 0
      ? Math.max(
          DAILY_TARGET - consumedCalories,
          0
        )
      : 0;

  const progress =
    DAILY_TARGET > 0
      ? Math.min(
          (consumedCalories /
            DAILY_TARGET) *
            100,
          100
        )
      : 0;

  const currentMealCalories = useMemo(() => {
    return meals[activeMeal].reduce(
      (total, item) =>
        total + Number(item.calories || 0),
      0
    );
  }, [meals, activeMeal]);


  /* =========================================================
     DAILY NUTRITION TOTALS
     ========================================================= */

  const allLoggedFoods = useMemo(
    () => Object.values(meals).flat(),
    [meals]
  );

  const dailyNutrition = useMemo(
    () => sumNutrition(allLoggedFoods),
    [allLoggedFoods]
  );

  const currentMealNutrition = useMemo(
    () => sumNutrition(meals[activeMeal]),
    [meals, activeMeal]
  );

  /* =========================================================
     NUTRIENT REFERENCE RANGES
     These are reference values for the dashboard, not
     individualized medical prescriptions.
     ========================================================= */

  const proteinReference = useMemo(() => {
    if (!latestWeight || latestWeight <= 0) return 0;
    return Number((Number(latestWeight) * 0.8).toFixed(1));
  }, [latestWeight]);

  const carbohydrateRange = useMemo(() => {
    if (!DAILY_TARGET) return { min: 0, max: 0 };

    return {
      min: Math.round((DAILY_TARGET * 0.45) / 4),
      max: Math.round((DAILY_TARGET * 0.65) / 4),
    };
  }, [DAILY_TARGET]);

  const fatRange = useMemo(() => {
    if (!DAILY_TARGET) return { min: 0, max: 0 };

    return {
      min: Math.round((DAILY_TARGET * 0.20) / 9),
      max: Math.round((DAILY_TARGET * 0.35) / 9),
    };
  }, [DAILY_TARGET]);

  const fiberReference = useMemo(() => {
    if (!DAILY_TARGET) return 0;
    return Math.round((DAILY_TARGET / 1000) * 14);
  }, [DAILY_TARGET]);

  const getNutritionInsight = (
    nutrient,
    value,
    min,
    max
  ) => {
    if (!hasNutritionValue(value)) {
      return {
        type: "neutral",
        title: `${nutrient} data is not available yet`,
        text: "Add foods with complete nutrition records to build this insight.",
      };
    }

    const currentHour = getIndiaHour();
    const laterInDay = currentHour >= 18;

    if (nutrient === "Protein") {
      if (value >= min) {
        return {
          type: "positive",
          title: "Protein is meeting your daily reference",
          text: `You've logged ${roundNutrition(value)} g against a ${roundNutrition(min)} g daily reference.`,
        };
      }

      if (laterInDay && value < min * 0.75) {
        return {
          type: "watch",
          title: "Protein is currently below your reference",
          text: `You've logged ${roundNutrition(value)} g against a ${roundNutrition(min)} g daily reference for your current weight.`,
        };
      }

      return {
        type: "positive",
        title: "Protein is building toward your daily reference",
        text: `You've logged ${roundNutrition(value)} g so far against a ${roundNutrition(min)} g daily reference.`,
      };
    }

    if (nutrient === "Carbohydrates") {
      if (value > max) {
        return {
          type: "watch",
          title: "Carbohydrates are currently above the reference range",
          text: `You've logged ${roundNutrition(value)} g. The reference range is ${min}–${max} g.`,
        };
      }

      if (value >= min) {
        return {
          type: "positive",
          title: "Carbohydrates are within the reference range",
          text: `You've logged ${roundNutrition(value)} g within the ${min}–${max} g reference range.`,
        };
      }

      if (laterInDay) {
        return {
          type: "watch",
          title: "Carbohydrates are currently below the reference range",
          text: `You've logged ${roundNutrition(value)} g. The reference range is ${min}–${max} g.`,
        };
      }

      return {
        type: "positive",
        title: "Carbohydrates are building toward the reference range",
        text: `You've logged ${roundNutrition(value)} g so far. The reference range is ${min}–${max} g.`,
      };
    }

    if (nutrient === "Fat") {
      if (value > max) {
        return {
          type: "watch",
          title: "Fat is currently above the reference range",
          text: `You've logged ${roundNutrition(value)} g. The reference range is ${min}–${max} g.`,
        };
      }

      if (value >= min) {
        return {
          type: "positive",
          title: "Fat is within the reference range",
          text: `You've logged ${roundNutrition(value)} g within the ${min}–${max} g reference range.`,
        };
      }

      if (laterInDay) {
        return {
          type: "watch",
          title: "Fat is currently below the reference range",
          text: `You've logged ${roundNutrition(value)} g. The reference range is ${min}–${max} g.`,
        };
      }

      return {
        type: "positive",
        title: "Fat is building toward the reference range",
        text: `You've logged ${roundNutrition(value)} g so far. The reference range is ${min}–${max} g.`,
      };
    }

    if (nutrient === "Fiber") {
      if (value >= min) {
        return {
          type: "positive",
          title: "Fiber has reached the daily reference",
          text: `You've logged ${roundNutrition(value)} g against an approximate ${min} g/day reference.`,
        };
      }

      if (laterInDay && value < min * 0.75) {
        return {
          type: "watch",
          title: "Fiber is currently below the reference",
          text: `You've logged ${roundNutrition(value)} g. A reference of about ${min} g/day is shown for this calorie target.`,
        };
      }

      return {
        type: "positive",
        title: "Fiber is building toward the reference",
        text: `You've logged ${roundNutrition(value)} g so far against an approximate ${min} g/day reference.`,
      };
    }

    return {
      type: "neutral",
      title: `${nutrient} is being tracked`,
      text: `You've logged ${roundNutrition(value)} g today.`,
    };
  };

  const nutritionInsights = useMemo(
    () => [
      getNutritionInsight(
        "Protein",
        dailyNutrition.totals.protein,
        proteinReference,
        proteinReference
      ),
      getNutritionInsight(
        "Carbohydrates",
        dailyNutrition.totals.carbohydrates,
        carbohydrateRange.min,
        carbohydrateRange.max
      ),
      getNutritionInsight(
        "Fat",
        dailyNutrition.totals.fat,
        fatRange.min,
        fatRange.max
      ),
      getNutritionInsight(
        "Fiber",
        dailyNutrition.totals.fiber,
        fiberReference,
        fiberReference
      ),
    ],
    [
      dailyNutrition,
      proteinReference,
      carbohydrateRange,
      fatRange,
      fiberReference,
    ]
  );

  /* =========================================================
     ADD FOOD
     ========================================================= */

  const handleAddFood = async () => {
    setFoodError("");

    const trimmedFoodName = foodName.trim();

    if (!trimmedFoodName) {
      setFoodError("Please enter a food item.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setFoodError("Please enter a valid quantity.");
      return;
    }

    setLoading(true);

    try {
      const grams = getPortionGrams(
        trimmedFoodName,
        quantity,
        unit
      );

      if (!grams || grams <= 0) {
        setFoodError("Unable to calculate this portion size.");
        return;
      }

      let nutritionData = null;
      let source = "";
      let matchedProduct = "";
      let caloriesPer100g = null;
      let fdcId = null;

      /* =====================================================
         1. LIFE PREDICT NUTRITION API / USDA DATA FIRST
         Try multiple search matches because the first FDC
         result can be a record without usable nutrient values.
         ===================================================== */
      try {
        const backendFoods = await searchBackendFoods(
          trimmedFoodName
        );

        for (const backendFood of backendFoods.slice(0, 10)) {
          if (!backendFood?.fdc_id) continue;

          try {
            const backendDetails =
              await fetchBackendNutrition(
                backendFood.fdc_id,
                grams
              );

            const candidateNutrition =
              normalizeNutrition(
                backendDetails.nutrition
              );

            if (!hasMeaningfulNutrition(candidateNutrition)) {
              continue;
            }

            fdcId = backendDetails.fdc_id;
            source = "USDA FoodData Central";
            matchedProduct =
              backendDetails.food ||
              backendFood.description ||
              "";
            nutritionData = candidateNutrition;

            caloriesPer100g =
              hasNutritionValue(
                nutritionData.calories
              )
                ? (Number(nutritionData.calories) * 100) /
                  grams
                : null;

            break;
          } catch (candidateError) {
            console.warn(
              "Nutrition candidate skipped:",
              candidateError
            );
          }
        }
      } catch (backendError) {
        console.warn(
          "LifePredict nutrition API fallback:",
          backendError
        );
      }

      /* =====================================================
         2. LOCAL CALORIE DATABASE FALLBACK
         ===================================================== */
      if (!nutritionData) {
        const localFood = findLocalFood(
          trimmedFoodName
        );

        if (localFood) {
          const calories = Math.round(
            (localFood.caloriesPer100g * grams) / 100
          );

          nutritionData =
            findLocalNutrition(
              trimmedFoodName,
              grams
            ) || {
              ...emptyNutrition(),
              calories,
            };

          source = nutritionData &&
            hasMeaningfulNutrition(nutritionData)
            ? "LifePredict nutrition fallback"
            : localFood.source;
          caloriesPer100g =
            localFood.caloriesPer100g;
        }
      }

      /* =====================================================
         3. OPEN FOOD FACTS FALLBACK
         Also brings macros/micro-nutrients, not calories only.
         ===================================================== */
      if (!nutritionData) {
        const foodData =
          await searchOpenFoodFacts(trimmedFoodName);

        if (foodData) {
          const offNutrition = scaleNutrition(
            foodData,
            grams
          );

          if (hasMeaningfulNutrition(offNutrition)) {
            nutritionData = offNutrition;
            source = foodData.source;
            matchedProduct =
              foodData.matchedProduct || "";
            caloriesPer100g =
              foodData.caloriesPer100g;
          }
        }
      }

      if (!nutritionData) {
        setFoodError(
          `We couldn't find "${trimmedFoodName}". Try a more specific food name.`
        );
        return;
      }

      const calculatedCalories = hasNutritionValue(
        nutritionData.calories
      )
        ? Math.round(Number(nutritionData.calories))
        : 0;

      const newFood = {
        id: `${Date.now()}-${Math.random()}`,
        name: trimmedFoodName,
        quantity: Number(quantity),
        unit,
        grams,
        caloriesPer100g,
        calories: calculatedCalories,
        nutrition: normalizeNutrition(nutritionData),
        source,
        matchedProduct,
        fdcId,
        category: "Food",
      };

      setMeals((previous) => ({
        ...previous,
        [activeMeal]: [
          ...previous[activeMeal],
          newFood,
        ],
      }));

      setFoodName("");
      setQuantity(1);
      setUnit("g");
    } catch (err) {
      console.error("Food add error:", err);
      setFoodError(
        "Unable to search the food database right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     ADD DRINK
     Drinks now use the same typed-search pattern as food.
     The only drink portion choices are glass / bottle / can.
     ========================================================= */

  const handleAddDrink = async () => {
    setDrinkError("");

    const trimmedDrinkName = drinkName.trim();

    if (!trimmedDrinkName) {
      setDrinkError("Please enter a drink or beverage.");
      return;
    }

    if (!drinkQuantity || Number(drinkQuantity) <= 0) {
      setDrinkError("Please enter a valid drink quantity.");
      return;
    }

    setLoading(true);

    try {
      const grams = getDrinkGrams(
        drinkQuantity,
        drinkUnit
      );

      let nutritionData = null;
      let source = "";
      let matchedProduct = "";
      let fdcId = null;

      /*
         Common beverages use the curated LifePredict beverage data first.
         This prevents a generic USDA search for terms like "tea" from
         selecting tea leaves/ingredients instead of an actual beverage.
      */
      const knownDrink = findKnownDrink(trimmedDrinkName);

      if (knownDrink) {
        const standardGrams =
          knownDrink.unit === "can" ? 330 : 250;
        const factor = grams / standardGrams;
        const base = getDrinkNutrition(knownDrink);

        nutritionData = normalizeNutrition({
          calories: base.calories * factor,
          protein: base.protein * factor,
          carbohydrates: base.carbohydrates * factor,
          fat: base.fat * factor,
          fiber: base.fiber * factor,
          sugar: base.sugar * factor,
          sodium: base.sodium * factor,
        });

        source = "LifePredict beverage reference";
        matchedProduct = knownDrink.name;
      }

      if (!nutritionData) {
      try {
        const backendFoods = await searchBackendFoods(
          trimmedDrinkName
        );

        for (const backendFood of backendFoods.slice(0, 10)) {
          if (!backendFood?.fdc_id) continue;

          try {
            const backendDetails =
              await fetchBackendNutrition(
                backendFood.fdc_id,
                grams
              );

            const candidateNutrition =
              normalizeNutrition(
                backendDetails.nutrition
              );

            if (!hasMeaningfulNutrition(candidateNutrition)) {
              continue;
            }

            fdcId = backendDetails.fdc_id;
            source = "USDA FoodData Central";
            matchedProduct =
              backendDetails.food ||
              backendFood.description ||
              "";
            nutritionData = candidateNutrition;
            break;
          } catch (candidateError) {
            console.warn(
              "Drink nutrition candidate skipped:",
              candidateError
            );
          }
        }
      } catch (backendError) {
        console.warn(
          "Drink nutrition API fallback:",
          backendError
        );
      }
      }

      /* Open Food Facts fallback for typed beverages. */
      if (!nutritionData) {
        const drinkData =
          await searchOpenFoodFacts(trimmedDrinkName);

        if (drinkData) {
          nutritionData = scaleNutrition(
            drinkData,
            grams
          );
          source = drinkData.source;
          matchedProduct =
            drinkData.matchedProduct || "";
        }
      }

      if (!nutritionData) {
        setDrinkError(
          `We couldn't find "${trimmedDrinkName}". Try a more specific beverage name.`
        );
        return;
      }

      const drinkItem = {
        id: `${Date.now()}-${Math.random()}`,
        name: trimmedDrinkName,
        quantity: Number(drinkQuantity),
        unit: drinkUnit,
        grams,
        calories: Math.round(
          Number(nutritionData.calories || 0)
        ),
        nutrition: normalizeNutrition(
          nutritionData
        ),
        category: "Drink",
        source,
        matchedProduct,
        fdcId,
      };

      setMeals((previous) => ({
        ...previous,
        [activeMeal]: [
          ...previous[activeMeal],
          drinkItem,
        ],
      }));

      setDrinkName("");
      setDrinkQuantity(1);
      setDrinkUnit("glass");
    } catch (err) {
      console.error("Drink add error:", err);
      setDrinkError(
        "Unable to search the beverage database right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     DELETE FOOD
     ========================================================= */

  const handleDeleteFood = (
    mealType,
    foodId
  ) => {
    setMeals((previous) => ({
      ...previous,

      [mealType]:
        previous[mealType].filter(
          (item) =>
            item.id !== foodId
        ),
    }));
  };

  /* =========================================================
     ENTER KEY
     ========================================================= */

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleAddFood();
    }
  };

  const handleDrinkKeyDown = (event) => {
    if (event.key === "Enter") {
      handleAddDrink();
    }
  };

  /* =========================================================
     STATUS
     ========================================================= */

  const getStatus = () => {
    if (DAILY_TARGET <= 0) {
      return {
        type: "near",
        title:
          "Add your latest weight to set your target",
        text:
          "LifePredict calculates your daily calorie tracking target from your latest saved weight × 24.",
      };
    }

    if (
      consumedCalories >
      DAILY_TARGET
    ) {
      return {
        type: "over",
        title:
          "You have exceeded your daily target",
        text: `${Math.abs(
          DAILY_TARGET -
            consumedCalories
        )} kcal above your target.`,
      };
    }

    if (
      consumedCalories >=
      DAILY_TARGET * 0.85
    ) {
      return {
        type: "near",
        title:
          "You are close to your daily target",
        text: `${remainingCalories} kcal remaining for today.`,
      };
    }

    return {
      type: "good",
      title:
        "You are within your daily target",
      text: `${remainingCalories} kcal remaining for today.`,
    };
  };

  const status = getStatus();

  const rotiSelected =
    isRotiFood(foodName);

  const weightDateLabel =
    weightRecordDate
      ? new Date(
          weightRecordDate
        ).toLocaleDateString(
          "en-IN",
          {
            timeZone:
              "Asia/Kolkata",
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        )
      : null;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="nutrition-page">


      {/* HEADER */}

      <div className="nutrition-header">

        <div>
          <span className="nutrition-eyebrow">
            DAILY NUTRITION
          </span>

          <h1>
            Nutrition & Meals
          </h1>

          <p>
            Track what you eat throughout
            the day and understand how your
            food intake compares with your
            daily calorie target.
          </p>
        </div>

        <div className="nutrition-header-icon">
          <Flame size={25} />
        </div>

      </div>

      {/* SUMMARY */}

      <div className="nutrition-summary">

        {/* DAILY TARGET */}

        <div className="nutrition-summary-card">

          <div className="summary-icon">
            <Flame size={20} />
          </div>

          <div className="target-summary-content">

            <span>
              DAILY TRACKING ESTIMATE
            </span>

            <div className="target-number">
              <strong>
                {DAILY_TARGET || "—"}
              </strong>

              <small>
                kcal
              </small>
            </div>

            {latestWeight ? (
              <em className="target-formula">
                Food-tracking estimate: {latestWeight} kg × 24
              </em>
            ) : (
              <em className="target-formula">
                Weight required
              </em>
            )}

          </div>

        </div>

        {/* CONSUMED */}

        <div className="nutrition-summary-card">

          <div className="summary-icon consumed">
            <TrendingUp size={20} />
          </div>

          <div>

            <span>
              CONSUMED
            </span>

            <strong>
              {consumedCalories}
            </strong>

            <small>
              kcal
            </small>

          </div>

        </div>

        {/* REMAINING */}

        <div className="nutrition-summary-card">

          <div className="summary-icon remaining">
            <CheckCircle2 size={20} />
          </div>

          <div>

            <span>
              REMAINING
            </span>

            <strong>
              {remainingCalories}
            </strong>

            <small>
              kcal
            </small>

          </div>

        </div>

      </div>

      {/* TARGET SOURCE */}

      {latestWeight && (
        <div className="nutrition-target-note">

          <CircleCheck size={16} />

          <span>
            Tracking target is a simplified estimate based on your{" "}
            {weightRecordDate &&
            getIndiaDate(
              weightRecordDate
            ) ===
              getTodayIndiaDate()
              ? "latest weight recorded today"
              : "latest saved weight"}
            {" "}
            of{" "}
            <strong>
              {latestWeight} kg
            </strong>
            {" "}
            {weightDateLabel
              ? ` • recorded ${weightDateLabel}`
              : ""}
          </span>

        </div>
      )}

      {/* PROGRESS */}

      <div className="nutrition-progress-card">

        <div className="progress-top">

          <div>

            <span>
              Today's calorie intake
            </span>

            <strong>
              {consumedCalories} /{" "}
              {DAILY_TARGET || "—"} kcal
            </strong>

          </div>

          <span>
            {DAILY_TARGET > 0
              ? `${Math.round(
                  progress
                )}%`
              : "—"}
          </span>

        </div>

        <div className="progress-track">

          <div
            className={`progress-fill ${
              consumedCalories >
              DAILY_TARGET &&
              DAILY_TARGET > 0
                ? "over"
                : ""
            }`}
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* STATUS */}

      <div
        className={`nutrition-status ${status.type}`}
      >

        <CircleCheck size={20} />

        <div>

          <strong>
            {status.title}
          </strong>

          <p>
            {status.text}
          </p>

        </div>

      </div>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <div className="nutrition-layout">

        {/* LEFT CARD */}

        <div className="nutrition-meals-card">

          <div className="nutrition-card-heading">

            <span>
              MEAL LOG
            </span>

            <h2>
              What did you eat today?
            </h2>

          </div>

          {/* MEAL TABS */}

          <div className="meal-tabs">

            {Object.entries(MEALS).map(
              ([key, meal]) => {

                const Icon =
                  meal.icon;

                return (
                  <button
                    key={key}
                    className={
                      activeMeal === key
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveMeal(key)
                    }
                  >
                    <Icon size={16} />
                    {meal.label}
                  </button>
                );
              }
            )}

          </div>

          {/* ADD FOOD */}

          <div className="add-food-box">

            <div className="add-food-title">

              <Plus size={15} />

              Add food to{" "}
              {MEALS[activeMeal].label}

            </div>

            <div className="add-food-inputs">

              {/* FOOD SEARCH */}

              <div className="food-search-wrapper">

                <Search
                  className="food-search-icon"
                  size={17}
                />

                <input
                  type="text"
                  value={foodName}
                  onChange={(event) => {
                    setFoodName(
                      event.target.value
                    );
                    setFoodError("");
                  }}
                  onKeyDown={
                    handleKeyDown
                  }
                  placeholder="Search food e.g. Dal Chawal, Roti, Paneer"
                  autoComplete="off"
                />

              </div>

              {/* QUANTITY */}

              <div className="quantity-control">

                <input
                  type="number"
                  min={
                    rotiSelected
                      ? "1"
                      : "0.1"
                  }
                  step={
                    rotiSelected
                      ? "1"
                      : "0.1"
                  }
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(
                      event.target.value
                    );
                    setFoodError("");
                  }}
                  onKeyDown={
                    handleKeyDown
                  }
                  aria-label="Quantity"
                />

                {rotiSelected ? (
                  <span className="quantity-unit-label">
                    piece
                  </span>
                ) : (
                  <select
                    value={unit}
                    onChange={(event) =>
                      setUnit(
                        event.target.value
                      )
                    }
                    aria-label="Quantity unit"
                  >
                    <option value="g">
                      grams
                    </option>

                    <option value="piece">
                      pieces
                    </option>

                    <option value="bowl">
                      bowl
                    </option>

                    <option value="plate">
                      plate
                    </option>

                    <option value="slice">
                      slice
                    </option>
                  </select>
                )}

              </div>

              {/* ADD */}

              <button
                className="add-food-button"
                onClick={
                  handleAddFood
                }
                disabled={loading}
              >

                <Plus size={15} />

                {loading
                  ? "Searching..."
                  : "Add"}

              </button>

            </div>

            <p className="food-helper-text">

              {rotiSelected
                ? "Roti is measured by pieces. Enter any number of pieces you ate."
                : "Search a food and enter the quantity. LifePredict estimates calories and nutrition using its nutrition database."}

            </p>

            {foodError && (
              <div className="food-error">
                {foodError}
              </div>
            )}

          </div>

          {/* DRINKS */}

          <div className="drinks-section">

            <div className="drinks-header">

              <div>

                <h3>
                  Add a drink
                </h3>

                <p>
                  Search any beverage and choose glass, bottle or can.
                </p>

              </div>

            </div>

            <div className="drink-inputs">

              <div className="food-search-wrapper">

                <Search
                  className="food-search-icon"
                  size={17}
                />

                <input
                  type="text"
                  value={drinkName}
                  onChange={(event) => {
                    setDrinkName(event.target.value);
                    setDrinkError("");
                  }}
                  onKeyDown={handleDrinkKeyDown}
                  placeholder="Search drink e.g. Tea, Milk, Coke, Juice"
                  autoComplete="off"
                />

              </div>

              <div className="quantity-control drink-quantity-control">

                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={drinkQuantity}
                  onChange={(event) => {
                    setDrinkQuantity(event.target.value);
                    setDrinkError("");
                  }}
                  onKeyDown={handleDrinkKeyDown}
                  aria-label="Drink quantity"
                />

                <select
                  value={drinkUnit}
                  onChange={(event) =>
                    setDrinkUnit(event.target.value)
                  }
                  aria-label="Drink quantity unit"
                >
                  <option value="glass">glass</option>
                  <option value="bottle">bottle</option>
                  <option value="can">can</option>
                </select>

              </div>

              <button
                type="button"
                className="add-food-button"
                onClick={handleAddDrink}
                disabled={loading}
              >
                <Plus size={15} />
                {loading ? "Searching..." : "Add"}
              </button>

            </div>

            {drinkError && (
              <div className="drink-error">
                {drinkError}
              </div>
            )}

          </div>

          {/* LOGGED ITEMS — food + drinks for this meal, after the drink section */}

          <div className="meal-list">

            {meals[activeMeal].map(
              (food) => (

                <div
                  className="food-row"
                  key={food.id}
                >

                  <div>

                    <strong>
                      {food.name}
                    </strong>

                    <span>
                      {food.quantity} {food.unit}
                      {" • "}
                      {food.calories} kcal
                    </span>

                    {food.caloriesPer100g && (
                      <small>
                        Approx. {food.caloriesPer100g} kcal / 100g
                        {" • "}
                        {Math.round(food.grams)}g portion
                      </small>
                    )}

                    {food.nutrition && (
                      <small className="food-nutrition-line">
                        {hasNutritionValue(food.nutrition.protein)
                          ? `P ${roundNutrition(food.nutrition.protein)}g`
                          : "P —"}
                        {" • "}
                        {hasNutritionValue(food.nutrition.carbohydrates)
                          ? `C ${roundNutrition(food.nutrition.carbohydrates)}g`
                          : "C —"}
                        {" • "}
                        {hasNutritionValue(food.nutrition.fat)
                          ? `F ${roundNutrition(food.nutrition.fat)}g`
                          : "F —"}
                      </small>
                    )}

                    <small className="food-source-line">
                      Nutrition estimate
                    </small>

                  </div>

                  <div className="food-row-right">
                    <strong>{food.calories} kcal</strong>

                    <button
                      onClick={() =>
                        handleDeleteFood(
                          activeMeal,
                          food.id
                        )
                      }
                      aria-label={`Delete ${food.category === "Drink" ? "drink" : "food"}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              )
            )}

          </div>

          {/* ACTIVE MEAL NUTRITION */}

          <div className="meal-nutrition-summary">
            <div className="meal-nutrition-heading">
              <div>
                <span>{MEALS[activeMeal].label.toUpperCase()} NUTRITION</span>
                <strong>Meal breakdown</strong>
              </div>
              <small>{currentMealNutrition.totals.calories} kcal</small>
            </div>

            {meals[activeMeal].length === 0 ? (
              <p className="meal-nutrition-empty">
                No items logged yet. Add food or a drink above to see
                this meal's nutrition here.
              </p>
            ) : (
              <div className="meal-nutrition-grid">
                <div>
                  <span>Protein</span>
                  <strong>
                    {currentMealNutrition.availability.protein
                      ? `${roundNutrition(currentMealNutrition.totals.protein)} g`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Carbs</span>
                  <strong>
                    {currentMealNutrition.availability.carbohydrates
                      ? `${roundNutrition(currentMealNutrition.totals.carbohydrates)} g`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Fat</span>
                  <strong>
                    {currentMealNutrition.availability.fat
                      ? `${roundNutrition(currentMealNutrition.totals.fat)} g`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Fiber</span>
                  <strong>
                    {currentMealNutrition.availability.fiber
                      ? `${roundNutrition(currentMealNutrition.totals.fiber)} g`
                      : "—"}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* MEAL TOTAL */}

          <div className="meal-total">

            <span>
              {MEALS[activeMeal].label}{" "}
              Total
            </span>

            <strong>
              {currentMealCalories} kcal
            </strong>

          </div>

        </div>

        {/* RIGHT CARD */}

        <div className="nutrition-today-card">

          <div className="nutrition-card-heading">

            <span>
              TODAY
            </span>

            <h2>
              Your meals
            </h2>

          </div>

          <div className="today-meals">

            {Object.entries(MEALS).map(
              ([key, meal]) => {

                const Icon =
                  meal.icon;

                const total =
                  meals[key].reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.calories || 0
                      ),
                    0
                  );

                return (
                  <div
                    key={key}
                    className="today-meal"
                    onClick={() =>
                      setActiveMeal(key)
                    }
                  >

                    <div className="today-meal-icon">
                      <Icon size={18} />
                    </div>

                    <div className="today-meal-info">

                      <strong>
                        {meal.label}
                      </strong>

                      <span>
                        {meals[key].length >
                        0
                          ? `${meals[key].length} item${
                              meals[key]
                                .length > 1
                                ? "s"
                                : ""
                            }`
                          : "Nothing logged"}
                      </span>

                    </div>

                    <strong className="today-meal-calories">
                      {total} kcal
                    </strong>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          TODAY'S NUTRITION
          ===================================================== */}

      <div className="daily-nutrition-card">

        <div className="daily-nutrition-heading">
          <div>
            <span>DAILY NUTRITION</span>
            <h2>Today's nutrition so far</h2>
            <p>
              A running view of the nutrients from everything
              you've logged so far today.
            </p>
          </div>

          <div className="daily-nutrition-badge">
            <Apple size={17} />
            {allLoggedFoods.length} item{allLoggedFoods.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="nutrition-macro-grid">

          <div className="nutrition-macro-card protein">
            <div className="nutrition-macro-top">
              <span>PROTEIN</span>
              <strong>
                {dailyNutrition.availability.protein
                  ? `${roundNutrition(dailyNutrition.totals.protein)} g`
                  : "—"}
              </strong>
            </div>
            <small>
              {proteinReference
                ? `${roundNutrition(proteinReference)} g daily reference`
                : "Add weight for a reference"}
            </small>
            <div className="nutrition-mini-track">
              <div
                className="nutrition-mini-fill"
                style={{
                  width: `${
                    proteinReference > 0 && dailyNutrition.availability.protein
                      ? Math.min(
                          (dailyNutrition.totals.protein / proteinReference) * 100,
                          100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="nutrition-macro-card carbs">
            <div className="nutrition-macro-top">
              <span>CARBOHYDRATES</span>
              <strong>
                {dailyNutrition.availability.carbohydrates
                  ? `${roundNutrition(dailyNutrition.totals.carbohydrates)} g`
                  : "—"}
              </strong>
            </div>
            <small>
              {DAILY_TARGET
                ? `${carbohydrateRange.min}–${carbohydrateRange.max} g reference range`
                : "Add weight for a reference"}
            </small>
            <div className="nutrition-mini-track">
              <div
                className="nutrition-mini-fill"
                style={{
                  width: `${
                    carbohydrateRange.max > 0 && dailyNutrition.availability.carbohydrates
                      ? Math.min(
                          (dailyNutrition.totals.carbohydrates / carbohydrateRange.max) * 100,
                          100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="nutrition-macro-card fat">
            <div className="nutrition-macro-top">
              <span>FAT</span>
              <strong>
                {dailyNutrition.availability.fat
                  ? `${roundNutrition(dailyNutrition.totals.fat)} g`
                  : "—"}
              </strong>
            </div>
            <small>
              {DAILY_TARGET
                ? `${fatRange.min}–${fatRange.max} g reference range`
                : "Add weight for a reference"}
            </small>
            <div className="nutrition-mini-track">
              <div
                className="nutrition-mini-fill"
                style={{
                  width: `${
                    fatRange.max > 0 && dailyNutrition.availability.fat
                      ? Math.min(
                          (dailyNutrition.totals.fat / fatRange.max) * 100,
                          100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="nutrition-macro-card fiber">
            <div className="nutrition-macro-top">
              <span>FIBER</span>
              <strong>
                {dailyNutrition.availability.fiber
                  ? `${roundNutrition(dailyNutrition.totals.fiber)} g`
                  : "—"}
              </strong>
            </div>
            <small>
              {fiberReference
                ? `about ${fiberReference} g/day reference`
                : "Add weight for a reference"}
            </small>
            <div className="nutrition-mini-track">
              <div
                className="nutrition-mini-fill"
                style={{
                  width: `${
                    fiberReference > 0 && dailyNutrition.availability.fiber
                      ? Math.min(
                          (dailyNutrition.totals.fiber / fiberReference) * 100,
                          100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

        </div>

        <div className="nutrition-secondary-row">
          <div>
            <span>SUGAR</span>
            <strong>
              {dailyNutrition.availability.sugar
                ? `${roundNutrition(dailyNutrition.totals.sugar)} g`
                : "—"}
            </strong>
          </div>
          <div>
            <span>SODIUM</span>
            <strong>
              {dailyNutrition.availability.sodium
                ? `${Math.round(dailyNutrition.totals.sodium)} mg`
                : "—"}
            </strong>
          </div>
          <div>
            <span>LOGGED CALORIES</span>
            <strong>{consumedCalories} kcal</strong>
          </div>
        </div>

        <div className="nutrition-insights-heading">
          <span>YOUR NUTRITION SNAPSHOT</span>
          <strong>What your numbers show</strong>
        </div>

        <div className="nutrition-insights-grid">
          {nutritionInsights.map((insight, index) => (
            <div
              className={`nutrition-insight ${insight.type}`}
              key={`${insight.title}-${index}`}
            >
              <div className="nutrition-insight-icon">
                {insight.type === "positive" ? (
                  <CheckCircle2 size={17} />
                ) : insight.type === "watch" ? (
                  <CircleCheck size={17} />
                ) : (
                  <Flame size={17} />
                )}
              </div>
              <div>
                <strong>{insight.title}</strong>
                <p>{insight.text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="nutrition-reference-note">
          Reference values are simplified estimates calculated from your current daily tracking estimate and saved weight. They help you understand your food log over the day and are not personalized medical or dietary recommendations.
        </p>

      </div>


      {/* DISCLAIMER */}

      <div className="nutrition-disclaimer">

        <Flame size={19} />

        <p>
          Calorie values shown in this
          feature are estimates. The tracking
          target uses LifePredict's simplified
          weight × 24 rule. This feature is
          intended to support food awareness
          and healthy lifestyle tracking,
          not to provide medical diagnosis
          or personalized dietary treatment.
        </p>

      </div>

    </div>
  );
}