const pool = require("../config/db");


// ==========================================
// GET PATIENT PROFILE
// ==========================================

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [profiles] = await pool.query(
      `SELECT
        id,
        user_id,
        patient_id,
        date_of_birth,
        gender,
        height_cm,
        smoking_status,
        alcohol_status,
        activity_level,
        existing_conditions,
        family_history,
        current_medications,
        previous_health_issues,
        profile_completed,
        created_at,
        updated_at
       FROM patient_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(200).json({
        success: true,
        profileExists: false,
        profile: null,
      });
    }

    return res.status(200).json({
      success: true,
      profileExists: true,
      profile: profiles[0],
    });

  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the profile.",
      error: error.message,
    });
  }
};


// ==========================================
// SAVE / UPDATE PATIENT PROFILE
// ==========================================

const saveProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const patientId = `LP-P-${String(userId).padStart(6, "0")}`;

    const {
      dateOfBirth,
      gender,
      heightCm,
      smokingStatus,
      alcoholStatus,
      activityLevel,
      existingConditions,
      familyHistory,
      currentMedications,
      previousHealthIssues,
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!gender || !heightCm) {
      return res.status(400).json({
        success: false,
        message: "Gender and height are required.",
      });
    }

    // ==========================================
    // CHECK EXISTING PROFILE
    // ==========================================

    const [existingProfile] = await pool.query(
      `SELECT id, patient_id
       FROM patient_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    // ==========================================
    // UPDATE EXISTING PROFILE
    // ==========================================

    if (existingProfile.length > 0) {
      await pool.query(
        `UPDATE patient_profiles
         SET
           patient_id = COALESCE(patient_id, ?),
           date_of_birth = ?,
           gender = ?,
           height_cm = ?,
           smoking_status = ?,
           alcohol_status = ?,
           activity_level = ?,
           existing_conditions = ?,
           family_history = ?,
           current_medications = ?,
           previous_health_issues = ?,
           profile_completed = TRUE,
           updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          patientId,
          dateOfBirth || null,
          gender,
          heightCm,
          smokingStatus || null,
          alcoholStatus || null,
          activityLevel || null,
          existingConditions || null,
          familyHistory || null,
          currentMedications || null,
          previousHealthIssues || null,
          userId,
        ]
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        patientId: existingProfile[0].patient_id || patientId,
      });
    }

    // ==========================================
    // CREATE NEW PROFILE
    // ==========================================

    await pool.query(
      `INSERT INTO patient_profiles (
        user_id,
        patient_id,
        date_of_birth,
        gender,
        height_cm,
        smoking_status,
        alcohol_status,
        activity_level,
        existing_conditions,
        family_history,
        current_medications,
        previous_health_issues,
        profile_completed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        userId,
        patientId,
        dateOfBirth || null,
        gender,
        heightCm,
        smokingStatus || null,
        alcoholStatus || null,
        activityLevel || null,
        existingConditions || null,
        familyHistory || null,
        currentMedications || null,
        previousHealthIssues || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Profile created successfully.",
      patientId,
    });

  } catch (error) {
    console.error("Save profile error:", error);

    // TEMPORARY DEBUGGING RESPONSE
    return res.status(500).json({
      success: false,
      message: "Something went wrong while saving the profile.",
      error: error.message,
    });
  }
};


module.exports = {
  getProfile,
  saveProfile,
};