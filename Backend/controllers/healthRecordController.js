const pool = require("../config/db");

// ======================================================
// HELPERS
// ======================================================

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const isYes = (value) =>
  value === "Yes" ||
  value === "yes" ||
  value === 1 ||
  value === "1" ||
  value === true;

// ======================================================
// CREATE / UPDATE TODAY'S HEALTH RECORD
// ======================================================
// One user should have at most one daily check-in.
// If today's record exists -> UPDATE it.
// If today's record does not exist -> INSERT it.
// ======================================================

const createHealthRecord = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      // Current frontend field names
      weight,
      systolicBP,
      diastolicBP,
      restingHeartRate,
      bloodGlucose,
      glucoseType,
      totalCholesterol,
      physicalActivity,
      steps,
      sleepHours,
      sleepQuality,
      stressLevel,
      waterIntake,
      alcoholToday,
      alcoholDrinks,
      smokingToday,
      cigarettesToday,
      sedentaryHours,
      energyLevel,
      mood,
      symptoms,

      // Backward-compatible aliases in case an older frontend
      // version sends these names.
      weightKg,
      systolicBp,
      diastolicBp,
      glucose,
      glucoseReadingType,
      cholesterol,
      physicalActivityMinutes,
      waterIntakeLitres,
      drinksToday,
      smoking_today,
      cigarettes_today,
      sedentaryTimeHours,
    } = req.body;

    // --------------------------------------------------
    // NORMALIZE INPUT NAMES
    // --------------------------------------------------

    const finalWeight = weight ?? weightKg;
    const finalSystolicBP = systolicBP ?? systolicBp;
    const finalDiastolicBP = diastolicBP ?? diastolicBp;

    const finalBloodGlucose =
      bloodGlucose ?? glucose;

    const finalGlucoseType =
      glucoseType ?? glucoseReadingType;

    const finalTotalCholesterol =
      totalCholesterol ?? cholesterol;

    const finalPhysicalActivity =
      physicalActivity ?? physicalActivityMinutes;

    const finalWaterIntake =
      waterIntake ?? waterIntakeLitres;

    const finalAlcoholDrinks =
      alcoholDrinks ?? drinksToday;

    const finalSmokingToday =
      smokingToday ?? smoking_today;

    const finalCigarettesToday =
      cigarettesToday ?? cigarettes_today;

    const finalSedentaryHours =
      sedentaryHours ?? sedentaryTimeHours;

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (
      finalWeight == null ||
      finalSystolicBP == null ||
      finalDiastolicBP == null ||
      finalWeight === "" ||
      finalSystolicBP === "" ||
      finalDiastolicBP === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Weight, systolic blood pressure and diastolic blood pressure are required.",
      });
    }

    // --------------------------------------------------
    // NUMERIC VALIDATION
    // --------------------------------------------------

    const weightValue = Number(finalWeight);
    const systolicValue = Number(finalSystolicBP);
    const diastolicValue = Number(finalDiastolicBP);

    if (
      !Number.isFinite(weightValue) ||
      !Number.isFinite(systolicValue) ||
      !Number.isFinite(diastolicValue)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Weight and blood pressure values must be valid numbers.",
      });
    }

    if (
      weightValue <= 0 ||
      systolicValue <= 0 ||
      diastolicValue <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Health measurement values must be greater than zero.",
      });
    }

    // --------------------------------------------------
    // BLOOD PRESSURE VALIDATION
    // --------------------------------------------------

    if (diastolicValue >= systolicValue) {
      return res.status(400).json({
        success: false,
        message:
          "Diastolic blood pressure must be lower than systolic blood pressure.",
      });
    }

    // --------------------------------------------------
    // CONDITIONAL VALIDATION
    // --------------------------------------------------

    if (
      isYes(alcoholToday) &&
      (finalAlcoholDrinks == null || finalAlcoholDrinks === "")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter the number of drinks consumed today.",
      });
    }

    if (
      isYes(finalSmokingToday) &&
      (finalCigarettesToday == null ||
        finalCigarettesToday === "")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter the number of cigarettes smoked today.",
      });
    }

    // --------------------------------------------------
    // PREPARE DATABASE VALUES
    // --------------------------------------------------

    const alcoholValue = isYes(alcoholToday) ? 1 : 0;
    const smokingValue = isYes(finalSmokingToday) ? 1 : 0;

    const values = [
      weightValue,
      systolicValue,
      diastolicValue,
      toNullableNumber(restingHeartRate),
      toNullableNumber(finalBloodGlucose),
      finalGlucoseType || null,
      toNullableNumber(finalTotalCholesterol),
      toNullableNumber(finalPhysicalActivity),
      toNullableNumber(steps),
      toNullableNumber(sleepHours),
      sleepQuality || null,
      stressLevel || null,
      toNullableNumber(finalWaterIntake),
      alcoholValue,
      isYes(alcoholToday)
        ? toNullableNumber(finalAlcoholDrinks)
        : null,
      smokingValue,
      isYes(finalSmokingToday)
        ? toNullableNumber(finalCigarettesToday)
        : null,
      toNullableNumber(finalSedentaryHours),
      energyLevel || null,
      mood || null,
      symptoms?.trim() ? symptoms.trim() : null,
    ];

    // --------------------------------------------------
    // CHECK WHETHER TODAY'S RECORD ALREADY EXISTS
    // --------------------------------------------------

    const [existingRecords] = await pool.query(
      `SELECT id
       FROM health_records
       WHERE user_id = ?
         AND DATE(recorded_at) = CURDATE()
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [userId]
    );

    // --------------------------------------------------
    // UPDATE TODAY'S RECORD
    // --------------------------------------------------

    if (existingRecords.length > 0) {
      const healthRecordId = existingRecords[0].id;

      await pool.query(
        `UPDATE health_records
         SET
           weight_kg = ?,
           systolic_bp = ?,
           diastolic_bp = ?,
           resting_heart_rate = ?,
           glucose = ?,
           glucose_reading_type = ?,
           cholesterol = ?,
           physical_activity_minutes = ?,
           steps = ?,
           sleep_hours = ?,
           sleep_quality = ?,
           stress_level = ?,
           water_intake_litres = ?,
           alcohol_today = ?,
           drinks_today = ?,
           smoking_today = ?,
           cigarettes_today = ?,
           sedentary_time_hours = ?,
           energy_level = ?,
           mood = ?,
           symptoms = ?
         WHERE id = ? AND user_id = ?`,
        [
          ...values,
          healthRecordId,
          userId,
        ]
      );

      return res.status(200).json({
        success: true,
        action: "updated",
        message:
          "Today's health check-in has been updated successfully.",
        healthRecordId,
      });
    }

    // --------------------------------------------------
    // INSERT NEW TODAY'S RECORD
    // --------------------------------------------------

    const [result] = await pool.query(
      `INSERT INTO health_records (
        user_id,
        weight_kg,
        systolic_bp,
        diastolic_bp,
        resting_heart_rate,
        glucose,
        glucose_reading_type,
        cholesterol,
        physical_activity_minutes,
        steps,
        sleep_hours,
        sleep_quality,
        stress_level,
        water_intake_litres,
        alcohol_today,
        drinks_today,
        smoking_today,
        cigarettes_today,
        sedentary_time_hours,
        energy_level,
        mood,
        symptoms
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, ...values]
    );

    return res.status(201).json({
      success: true,
      action: "created",
      message:
        "Today's health check-in has been saved successfully.",
      healthRecordId: result.insertId,
    });
  } catch (error) {
    console.error("Create/update health record error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while saving today's health record.",
    });
  }
};

// ======================================================
// GET ALL HEALTH RECORDS
// ======================================================

const getHealthRecords = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [records] = await pool.query(
      `SELECT
        id,
        recorded_at,
        weight_kg,
        systolic_bp,
        diastolic_bp,
        resting_heart_rate,
        glucose,
        glucose_reading_type,
        cholesterol,
        physical_activity_minutes,
        steps,
        sleep_hours,
        sleep_quality,
        stress_level,
        water_intake_litres,
        alcohol_today,
        drinks_today,
        smoking_today,
        cigarettes_today,
        sedentary_time_hours,
        energy_level,
        mood,
        symptoms,
        created_at
       FROM health_records
       WHERE user_id = ?
       ORDER BY recorded_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Get health records error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching health records.",
    });
  }
};

// ======================================================
// GET TODAY'S HEALTH RECORD
// ======================================================

const getTodayHealthRecord = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [records] = await pool.query(
      `SELECT
        id,
        recorded_at,
        weight_kg,
        systolic_bp,
        diastolic_bp,
        resting_heart_rate,
        glucose,
        glucose_reading_type,
        cholesterol,
        physical_activity_minutes,
        steps,
        sleep_hours,
        sleep_quality,
        stress_level,
        water_intake_litres,
        alcohol_today,
        drinks_today,
        smoking_today,
        cigarettes_today,
        sedentary_time_hours,
        energy_level,
        mood,
        symptoms,
        created_at
       FROM health_records
       WHERE user_id = ?
         AND DATE(recorded_at) = CURDATE()
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [userId]
    );

    if (records.length === 0) {
      return res.status(200).json({
        success: true,
        exists: false,
        record: null,
      });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      record: records[0],
    });
  } catch (error) {
    console.error("Get today's health record error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching today's health record.",
    });
  }
};

module.exports = {
  createHealthRecord,
  getHealthRecords,
  getTodayHealthRecord,
};