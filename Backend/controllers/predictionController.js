const pool = require("../config/db");

// ======================================================
// HELPER: Calculate age
// ======================================================

const calculateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age =
    today.getFullYear() -
    dob.getFullYear();

  const monthDifference =
    today.getMonth() -
    dob.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < dob.getDate()
    )
  ) {
    age--;
  }

  return age;
};


// ======================================================
// HELPER: Prepare user data for ML model
// ======================================================

const preparePredictionData = async (userId) => {

  // ----------------------------------------------------
  // 1. Get patient profile
  // ----------------------------------------------------

  const [profiles] = await pool.query(
    `SELECT
      date_of_birth,
      gender,
      height_cm,
      smoking_status,
      alcohol_status,
      activity_level
     FROM patient_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  if (profiles.length === 0) {
    throw new Error("Patient profile not found.");
  }

  // ----------------------------------------------------
  // 2. Get latest health record
  // ----------------------------------------------------

  const [records] = await pool.query(
    `SELECT
      weight_kg,
      systolic_bp,
      diastolic_bp,
      cholesterol,
      glucose,
      recorded_at
     FROM health_records
     WHERE user_id = ?
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [userId]
  );

  if (records.length === 0) {
    throw new Error("No health record found.");
  }

  const profile = profiles[0];
  const health = records[0];

  // ----------------------------------------------------
  // 3. Calculate age
  // ----------------------------------------------------

  const ageYears = calculateAge(
    profile.date_of_birth
  );

  // ----------------------------------------------------
  // 4. Convert height to meters
  // ----------------------------------------------------

  const heightM =
    Number(profile.height_cm) / 100;

  // ----------------------------------------------------
  // 5. Calculate BMI
  // ----------------------------------------------------

  const weight =
    Number(health.weight_kg);

  const bmi =
    weight / (heightM * heightM);

  // ----------------------------------------------------
  // 6. Convert profile values to ML encoding
  // ----------------------------------------------------

  const genderMap = {
    male: 1,
    female: 2,
    other: 2,
  };

  const smokeMap = {
    never: 0,
    former: 1,
    current: 1,
  };

  const alcoholMap = {
    never: 0,
    occasionally: 1,
    frequently: 1,
  };

  const activityMap = {
    low: 0,
    moderate: 1,
    high: 1,
  };

  // ----------------------------------------------------
  // 7. Prepare ML input
  // ----------------------------------------------------

  const predictionInput = {
    gender: genderMap[profile.gender],
    weight,
    ap_hi: Number(health.systolic_bp),
    ap_lo: Number(health.diastolic_bp),
    cholesterol: Number(health.cholesterol),
    gluc: Number(health.glucose),

    smoke:
      smokeMap[profile.smoking_status] ?? 0,

    alco:
      alcoholMap[profile.alcohol_status] ?? 0,

    active:
      activityMap[profile.activity_level] ?? 0,

    age_years: ageYears,
    height_m: heightM,
    BMI: bmi,
  };

  // ----------------------------------------------------
  // 8. Return everything needed by Predictions page
  // ----------------------------------------------------

  return {
    profile,
    health,
    predictionInput,
  };
};


// ======================================================
// HELPER: Generate personalized observations
// ======================================================

const generateHealthInsights = (
  input,
  prediction
) => {

  const insights = [];
  const contributingFactors = [];
  const recommendedActions = [];

  const systolic = Number(input.ap_hi);
  const diastolic = Number(input.ap_lo);
  const bmi = Number(input.BMI);
  const weight = Number(input.weight);
  const cholesterol = Number(input.cholesterol);
  const glucose = Number(input.gluc);

  // ----------------------------------------------------
  // Blood pressure observation
  // ----------------------------------------------------

  if (systolic >= 140 || diastolic >= 90) {

    contributingFactors.push({
      factor: "Blood Pressure",
      value: `${systolic}/${diastolic} mmHg`,
      status: "Needs attention",
      type: "attention",
    });

    insights.push({
      title: "Blood pressure deserves attention",
      message:
        `Your latest recorded blood pressure is ${systolic}/${diastolic} mmHg. This measurement is an important health parameter to keep monitoring.`,
      type: "attention",
    });

    recommendedActions.push(
      "Keep track of your blood pressure readings over time."
    );

  } else {

    contributingFactors.push({
      factor: "Blood Pressure",
      value: `${systolic}/${diastolic} mmHg`,
      status: "Within recorded range",
      type: "positive",
    });
  }


  // ----------------------------------------------------
  // BMI observation
  // ----------------------------------------------------

  if (bmi >= 25) {

    contributingFactors.push({
      factor: "BMI",
      value: bmi.toFixed(1),
      status: "Above reference range",
      type: "attention",
    });

    insights.push({
      title: "Weight-related factors may be worth monitoring",
      message:
        `Your current weight is ${weight} kg and your calculated BMI is ${bmi.toFixed(1)}. Tracking how these values change over time can help you understand your lifestyle trend.`,
      type: "attention",
    });

    recommendedActions.push(
      "Monitor weight and BMI trends rather than focusing only on a single reading."
    );

  } else {

    contributingFactors.push({
      factor: "BMI",
      value: bmi.toFixed(1),
      status: "Within reference range",
      type: "positive",
    });
  }


  // ----------------------------------------------------
  // Cholesterol observation
  // ----------------------------------------------------

  if (cholesterol > 1) {

    contributingFactors.push({
      factor: "Cholesterol",
      value: String(cholesterol),
      status: "Elevated category",
      type: "attention",
    });

    insights.push({
      title: "Cholesterol category needs monitoring",
      message:
        "Your latest health record contains a higher cholesterol category. This is one of the variables considered by the prediction model.",
      type: "attention",
    });

    recommendedActions.push(
      "Discuss cholesterol monitoring with a healthcare professional when appropriate."
    );

  } else {

    contributingFactors.push({
      factor: "Cholesterol",
      value: String(cholesterol),
      status: "Recorded category",
      type: "positive",
    });
  }


  // ----------------------------------------------------
  // Glucose observation
  // ----------------------------------------------------

  if (glucose > 1) {

    contributingFactors.push({
      factor: "Glucose",
      value: String(glucose),
      status: "Elevated category",
      type: "attention",
    });

    insights.push({
      title: "Glucose category is worth monitoring",
      message:
        "Your latest health record contains a higher glucose category. Changes in this value should be interpreted together with your other health information.",
      type: "attention",
    });

    recommendedActions.push(
      "Keep your glucose-related health measurements updated."
    );

  } else {

    contributingFactors.push({
      factor: "Glucose",
      value: String(glucose),
      status: "Recorded category",
      type: "positive",
    });
  }


  // ----------------------------------------------------
  // Smoking
  // ----------------------------------------------------

  if (Number(input.smoke) === 1) {

    contributingFactors.push({
      factor: "Smoking",
      value: "Current / former",
      status: "Contributing factor",
      type: "attention",
    });

    insights.push({
      title: "Smoking history is included in your model inputs",
      message:
        "Your smoking status is one of the lifestyle variables considered by the cardiovascular prediction model.",
      type: "attention",
    });

  } else {

    contributingFactors.push({
      factor: "Smoking",
      value: "Never",
      status: "Positive",
      type: "positive",
    });
  }


  // ----------------------------------------------------
  // Alcohol
  // ----------------------------------------------------

  if (Number(input.alco) === 1) {

    contributingFactors.push({
      factor: "Alcohol",
      value: "Reported",
      status: "Lifestyle factor",
      type: "neutral",
    });
  }


  // ----------------------------------------------------
  // Activity
  // ----------------------------------------------------

  if (Number(input.active) === 0) {

    contributingFactors.push({
      factor: "Activity",
      value: "Low",
      status: "Needs improvement",
      type: "attention",
    });

    insights.push({
      title: "Activity level is an area to improve",
      message:
        "Your current profile records a low activity level. Increasing regular physical activity may be an important lifestyle area to discuss and work on.",
      type: "attention",
    });

    recommendedActions.push(
      "Gradually work toward a more active daily routine."
    );

  } else {

    contributingFactors.push({
      factor: "Activity",
      value: "Active",
      status: "Positive",
      type: "positive",
    });
  }


  // ----------------------------------------------------
  // Model probability
  // ----------------------------------------------------

  const cardioProbability =
    Number(prediction.probability_cardio) * 100;


  // ----------------------------------------------------
  // Overall model observation
  // ----------------------------------------------------

  if (prediction.prediction === 1) {

    insights.unshift({
      title: "Your current model output indicates increased attention",
      message:
        `The LifePredict model currently estimates a ${cardioProbability.toFixed(1)}% probability for the cardiovascular disease class based on the information provided.`,
      type: "attention",
    });

  } else {

    insights.unshift({
      title: "Your current model output is in the lower prediction class",
      message:
        `The LifePredict model currently estimates a ${cardioProbability.toFixed(1)}% probability for the cardiovascular disease class based on the information provided.`,
      type: "positive",
    });
  }


  return {
    insights,
    contributingFactors,
    recommendedActions,
  };
};


// ======================================================
// GET PREPARED PREDICTION INPUT
// GET /api/predictions/input
// ======================================================

const getPredictionInput = async (req, res) => {

  try {

    const userId = req.user.userId;

    const {
      predictionInput
    } = await preparePredictionData(userId);

    return res.status(200).json({
      success: true,
      predictionInput,
    });

  } catch (error) {

    console.error(
      "Get prediction input error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Something went wrong while preparing prediction data.",
    });
  }
};


// ======================================================
// GENERATE ACTUAL ML PREDICTION
// POST /api/predictions/predict
// ======================================================

const getPrediction = async (req, res) => {

  try {

    const userId = req.user.userId;

    // --------------------------------------------------
    // 1. Prepare latest user data
    // --------------------------------------------------

    const {
      predictionInput,
      health,
    } = await preparePredictionData(userId);


    // --------------------------------------------------
    // 2. Send data to FastAPI ML service
    // --------------------------------------------------

    const mlResponse = await fetch(
      "http://127.0.0.1:8000/predict",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(
          predictionInput
        ),
      }
    );


    // --------------------------------------------------
    // 3. Check ML service
    // --------------------------------------------------

    if (!mlResponse.ok) {

      console.error(
        "ML service returned status:",
        mlResponse.status
      );

      return res.status(502).json({
        success: false,
        message:
          "ML prediction service is unavailable.",
      });
    }


    // --------------------------------------------------
    // 4. Read ML result
    // --------------------------------------------------

    const predictionResult =
      await mlResponse.json();


    // --------------------------------------------------
    // 5. Generate page-level insights
    // --------------------------------------------------

    const analysis =
      generateHealthInsights(
        predictionInput,
        predictionResult
      );


    // --------------------------------------------------
    // 6. Save prediction history
    // --------------------------------------------------

    await pool.query(
      `INSERT INTO prediction_history (
        user_id,
        prediction,
        probability_no_cardio,
        probability_cardio,
        weight_kg,
        systolic_bp,
        diastolic_bp,
        cholesterol,
        glucose,
        age_years,
        bmi
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        predictionResult.prediction,
        predictionResult.probability_no_cardio,
        predictionResult.probability_cardio,
        Number(health.weight_kg),
        Number(health.systolic_bp),
        Number(health.diastolic_bp),
        Number(health.cholesterol),
        Number(health.glucose),
        predictionInput.age_years,
        predictionInput.BMI,
      ]
    );


    // --------------------------------------------------
    // 7. Return complete prediction response
    // --------------------------------------------------

    return res.status(200).json({

      success: true,

      predictionInput,

      prediction: predictionResult,

      analysis: {

        insights:
          analysis.insights,

        contributingFactors:
          analysis.contributingFactors,

        recommendedActions:
          analysis.recommendedActions,
      },

      metadata: {

        generatedAt:
          new Date().toISOString(),

        recordDate:
          health.recorded_at,

        disclaimer:
          "This information is generated from your recorded health data and a machine-learning model. It is intended for informational purposes and does not constitute a medical diagnosis.",
      },
    });

  } catch (error) {

    console.error(
      "Get prediction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Something went wrong while generating the prediction.",
    });
  }
};


// ======================================================
// GET PREDICTION HISTORY
// GET /api/predictions/history
// ======================================================

const getPredictionHistory = async (req, res) => {

  try {

    const userId = req.user.userId;

    const [history] = await pool.query(
      `SELECT
        id,
        prediction,
        probability_no_cardio,
        probability_cardio,
        weight_kg,
        systolic_bp,
        diastolic_bp,
        cholesterol,
        glucose,
        age_years,
        bmi,
        created_at
       FROM prediction_history
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );


    return res.status(200).json({

      success: true,

      count: history.length,

      history,

    });

  } catch (error) {

    console.error(
      "Get prediction history error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Something went wrong while fetching prediction history.",

    });
  }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  getPredictionInput,

  getPrediction,

  getPredictionHistory,

};