const pool = require("../config/db");

// ==========================================
// ADD HEALTH DATA
// ==========================================

const addHealthData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      age,
      gender,
      height,
      weight,
      systolic_bp,
      diastolic_bp,
      cholesterol,
      glucose,
      smoking,
      alcohol,
      physical_activity,
    } = req.body;

    // Basic validation
    if (
      age === undefined ||
      gender === undefined ||
      height === undefined ||
      weight === undefined ||
      systolic_bp === undefined ||
      diastolic_bp === undefined ||
      cholesterol === undefined ||
      glucose === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required health data.",
      });
    }

    // Validate gender
    if (!["male", "female", "other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender value.",
      });
    }

    // Validate blood pressure
    if (systolic_bp <= 0 || diastolic_bp <= 0) {
      return res.status(400).json({
        success: false,
        message: "Blood pressure values must be greater than zero.",
      });
    }

    if (diastolic_bp >= systolic_bp) {
      return res.status(400).json({
        success: false,
        message:
          "Diastolic blood pressure must be lower than systolic blood pressure.",
      });
    }

    // Validate cholesterol
    if (![1, 2, 3].includes(Number(cholesterol))) {
      return res.status(400).json({
        success: false,
        message: "Invalid cholesterol value.",
      });
    }

    // Validate glucose
    if (![1, 2, 3].includes(Number(glucose))) {
      return res.status(400).json({
        success: false,
        message: "Invalid glucose value.",
      });
    }

    // Insert health data
    const [result] = await pool.query(
      `INSERT INTO patient_health_data
      (
        user_id,
        age,
        gender,
        height,
        weight,
        systolic_bp,
        diastolic_bp,
        cholesterol,
        glucose,
        smoking,
        alcohol,
        physical_activity
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        age,
        gender,
        height,
        weight,
        systolic_bp,
        diastolic_bp,
        cholesterol,
        glucose,
        smoking ? 1 : 0,
        alcohol ? 1 : 0,
        physical_activity ? 1 : 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Health data added successfully.",
      healthDataId: result.insertId,
    });

  } catch (error) {
    console.error("Add health data error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while saving health data.",
    });
  }
};


// ==========================================
// GET LATEST HEALTH DATA
// ==========================================

const getLatestHealthData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.query(
      `SELECT
        id,
        age,
        gender,
        height,
        weight,
        systolic_bp,
        diastolic_bp,
        cholesterol,
        glucose,
        smoking,
        alcohol,
        physical_activity,
        created_at,
        updated_at
       FROM patient_health_data
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No health data found.",
        healthData: null,
      });
    }

    return res.status(200).json({
      success: true,
      healthData: rows[0],
    });

  } catch (error) {
    console.error("Get health data error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching health data.",
    });
  }
};


// ==========================================
// GET HEALTH DATA HISTORY
// ==========================================

const getHealthDataHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await pool.query(
      `SELECT
        id,
        age,
        gender,
        height,
        weight,
        systolic_bp,
        diastolic_bp,
        cholesterol,
        glucose,
        smoking,
        alcohol,
        physical_activity,
        created_at,
        updated_at
       FROM patient_health_data
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      healthData: rows,
    });

  } catch (error) {
    console.error("Get health history error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching health history.",
    });
  }
};


module.exports = {
  addHealthData,
  getLatestHealthData,
  getHealthDataHistory,
};