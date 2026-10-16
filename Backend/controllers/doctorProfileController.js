const pool = require("../config/db");

// ==========================================
// GET DOCTOR PROFILE
// ==========================================

const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Only doctors can access doctor profile
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access this profile.",
      });
    }

    const [rows] = await pool.query(
      `SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        u.role,

        dp.id AS profile_id,
        dp.doctor_id,
        dp.specialization,
        dp.qualification,
        dp.experience_years,
        dp.hospital_clinic,
        dp.created_at,
        dp.updated_at

       FROM users u

       LEFT JOIN doctor_profiles dp
         ON dp.user_id = u.id

       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor account not found.",
      });
    }

    const doctor = rows[0];

    return res.status(200).json({
      success: true,

      profileExists: Boolean(doctor.profile_id),

      profile: {
        userId: doctor.user_id,
        fullName: doctor.full_name,
        email: doctor.email,

        doctorId: doctor.doctor_id,

        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experienceYears: doctor.experience_years,
        hospitalClinic: doctor.hospital_clinic,

        createdAt: doctor.created_at,
        updatedAt: doctor.updated_at,
      },
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the doctor profile.",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE / UPDATE DOCTOR PROFILE
// ==========================================

const saveDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Only doctors can update doctor profile
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can update this profile.",
      });
    }

    const {
      specialization,
      qualification,
      experienceYears,
      hospitalClinic,
    } = req.body;

    // ==========================================
    // CLEAN INPUT
    // ==========================================

    const cleanSpecialization =
      typeof specialization === "string"
        ? specialization.trim()
        : "";

    const cleanQualification =
      typeof qualification === "string"
        ? qualification.trim()
        : "";

    const cleanHospitalClinic =
      typeof hospitalClinic === "string"
        ? hospitalClinic.trim()
        : "";

    let cleanExperienceYears = null;

    if (
      experienceYears !== undefined &&
      experienceYears !== null &&
      experienceYears !== ""
    ) {
      const parsedExperience = Number(experienceYears);

      if (
        !Number.isInteger(parsedExperience) ||
        parsedExperience < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Experience must be a valid number of years.",
        });
      }

      cleanExperienceYears = parsedExperience;
    }

    // ==========================================
    // GET EXISTING DOCTOR PROFILE
    // ==========================================

    const [existingProfile] = await pool.query(
      `SELECT
        id,
        doctor_id
       FROM doctor_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    // ==========================================
    // UPDATE EXISTING PROFILE
    // ==========================================

    if (existingProfile.length > 0) {
      await pool.query(
        `UPDATE doctor_profiles
         SET
           specialization = ?,
           qualification = ?,
           experience_years = ?,
           hospital_clinic = ?,
           updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          cleanSpecialization || null,
          cleanQualification || null,
          cleanExperienceYears,
          cleanHospitalClinic || null,
          userId,
        ]
      );

      return res.status(200).json({
        success: true,
        message: "Doctor profile updated successfully.",
        doctorId: existingProfile[0].doctor_id,
      });
    }

    // ==========================================
    // CREATE NEW PROFILE
    // ==========================================

    const doctorId = `LP-D-${String(userId).padStart(6, "0")}`;

    await pool.query(
      `INSERT INTO doctor_profiles (
        user_id,
        doctor_id,
        specialization,
        qualification,
        experience_years,
        hospital_clinic
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        doctorId,
        cleanSpecialization || null,
        cleanQualification || null,
        cleanExperienceYears,
        cleanHospitalClinic || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Doctor profile created successfully.",
      doctorId,
    });
  } catch (error) {
    console.error("Save doctor profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while saving the doctor profile.",
      error: error.message,
    });
  }
};

module.exports = {
  getDoctorProfile,
  saveDoctorProfile,
};