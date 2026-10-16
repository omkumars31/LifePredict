const pool = require("../config/db");

// =====================================================
// HELPER: GET ACCEPTED DOCTOR-PATIENT CONNECTION
// =====================================================

const getAcceptedDoctorPatientConnection = async (
  doctorUserId,
  patientId
) => {
  const normalizedPatientId = String(
    patientId || ""
  )
    .trim()
    .toUpperCase();

  const [connections] = await pool.query(
    `
      SELECT
        c.id AS connection_id,
        c.patient_user_id,
        c.doctor_user_id

      FROM doctor_patient_connections c

      INNER JOIN patient_profiles pp
        ON pp.user_id = c.patient_user_id

      WHERE c.doctor_user_id = ?
        AND pp.patient_id = ?
        AND c.status = 'accepted'

      LIMIT 1
    `,
    [
      doctorUserId,
      normalizedPatientId,
    ]
  );

  return connections[0] || null;
};

// =====================================================
// HELPER: VALID DATE
// =====================================================

const isValidDateFormat = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

// =====================================================
// HELPER: VALID TIME
// =====================================================

const isValidTimeFormat = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{2}:\d{2}$/.test(value)
  ) {
    return false;
  }

  const [hours, minutes] = value
    .split(":")
    .map(Number);

  return (
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
};

// =====================================================
// HELPER: CONSULTATION VALIDATION
// =====================================================

const validateConsultationInput = ({
  scheduledDate,
  startTime,
  durationMinutes,
  consultationType,
}) => {
  if (!isValidDateFormat(scheduledDate)) {
    return "Please provide a valid consultation date.";
  }

  if (!isValidTimeFormat(startTime)) {
    return "Please provide a valid consultation time.";
  }

  const duration = Number(
    durationMinutes
  );

  if (
    !Number.isInteger(duration) ||
    ![15, 30, 45, 60].includes(duration)
  ) {
    return "Duration must be 15, 30, 45 or 60 minutes.";
  }

  const allowedTypes = [
    "general",
    "follow-up",
    "risk-review",
    "lifestyle-review",
  ];

  if (
    !allowedTypes.includes(
      consultationType
    )
  ) {
    return "Invalid consultation type.";
  }

  const [hours, minutes] = String(
    startTime
  )
    .split(":")
    .map(Number);

  const startMinutes =
    hours * 60 + minutes;

  if (
    startMinutes + duration >
    24 * 60
  ) {
    return "Consultation cannot extend into the next day.";
  }

  return null;
};

// =====================================================
// DOCTOR: GET ONE CONNECTED PATIENT
// =====================================================

const getDoctorPatient = async (
  req,
  res
) => {
  try {
    // -------------------------------------------------
    // 1. ONLY DOCTORS
    // -------------------------------------------------

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can access patient details.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const { patientId } = req.params;

    // -------------------------------------------------
    // 2. VALIDATE PATIENT ID
    // -------------------------------------------------

    const normalizedPatientId = String(
      patientId || ""
    )
      .trim()
      .toUpperCase();

    if (
      !/^LP-P-\d{6}$/.test(
        normalizedPatientId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    // -------------------------------------------------
    // 3. GET CONNECTED PATIENT
    // -------------------------------------------------

    const [patients] =
      await pool.query(
        `
        SELECT
          c.id AS connection_id,
          c.status,
          c.requested_at,
          c.responded_at,

          u.id AS user_id,
          u.full_name,
          u.email,

          pp.patient_id,
          pp.date_of_birth,
          pp.gender,
          pp.height_cm,
          pp.smoking_status,
          pp.alcohol_status,
          pp.activity_level,
          pp.existing_conditions,
          pp.family_history,
          pp.current_medications,
          pp.previous_health_issues,
          pp.profile_completed

        FROM doctor_patient_connections c

        INNER JOIN users u
          ON u.id = c.patient_user_id

        INNER JOIN patient_profiles pp
          ON pp.user_id = c.patient_user_id

        WHERE c.doctor_user_id = ?
          AND c.status = 'accepted'
          AND pp.patient_id = ?

        LIMIT 1
        `,
        [
          doctorUserId,
          normalizedPatientId,
        ]
      );

    // -------------------------------------------------
    // 4. NOT FOUND
    // -------------------------------------------------

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Patient not found or this patient is not connected to you.",
      });
    }

    const patient = patients[0];

    // -------------------------------------------------
    // 5. HEALTH RECORDS
    // -------------------------------------------------

    const [healthRecords] =
      await pool.query(
        `
        SELECT
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

        ORDER BY recorded_at DESC
        `,
        [patient.user_id]
      );

    // -------------------------------------------------
    // 6. PREDICTION HISTORY
    // -------------------------------------------------

    const [predictionHistory] =
      await pool.query(
        `
        SELECT
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

        ORDER BY created_at DESC
        `,
        [patient.user_id]
      );

    // -------------------------------------------------
    // 7. REVIEWS
    // -------------------------------------------------

    const [reviews] =
      await pool.query(
        `
        SELECT
          id,
          category,
          review_text,
          created_at,
          updated_at

        FROM doctor_patient_reviews

        WHERE connection_id = ?
          AND doctor_user_id = ?
          AND patient_user_id = ?

        ORDER BY created_at DESC
        `,
        [
          patient.connection_id,
          doctorUserId,
          patient.user_id,
        ]
      );

    // -------------------------------------------------
    // 8. CONSULTATIONS
    // -------------------------------------------------

    const [consultations] =
      await pool.query(
        `
        SELECT
          id,
          connection_id,
          scheduled_date,
          start_time,
          duration_minutes,
          consultation_type,
          notes,
          status,
          created_at,
          updated_at

        FROM doctor_patient_consultations

        WHERE connection_id = ?
          AND doctor_user_id = ?
          AND patient_user_id = ?

        ORDER BY
          scheduled_date ASC,
          start_time ASC
        `,
        [
          patient.connection_id,
          doctorUserId,
          patient.user_id,
        ]
      );

    // -------------------------------------------------
    // 9. RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      patient: {
        userId: patient.user_id,
        patientId: patient.patient_id,

        fullName: patient.full_name,
        email: patient.email,

        dateOfBirth:
          patient.date_of_birth,

        gender: patient.gender,

        heightCm:
          patient.height_cm,

        smokingStatus:
          patient.smoking_status,

        alcoholStatus:
          patient.alcohol_status,

        activityLevel:
          patient.activity_level,

        existingConditions:
          patient.existing_conditions,

        familyHistory:
          patient.family_history,

        currentMedications:
          patient.current_medications,

        previousHealthIssues:
          patient.previous_health_issues,

        profileCompleted:
          Boolean(
            patient.profile_completed
          ),
      },

      connection: {
        id: patient.connection_id,

        status:
          patient.status,

        requestedAt:
          patient.requested_at,

        respondedAt:
          patient.responded_at,
      },

      healthRecords,

      predictionHistory,

      reviews,

      consultations,
    });
  } catch (error) {
    console.error(
      "Get doctor patient error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching patient details.",
    });
  }
};

// =====================================================
// DOCTOR: CREATE REVIEW
// =====================================================

const createDoctorReview = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can create patient reviews.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const { patientId } = req.params;

    const category = String(
      req.body.category || "general"
    )
      .trim()
      .toLowerCase();

    const reviewText = String(
      req.body.reviewText || ""
    ).trim();

    const allowedCategories = [
      "general",
      "lifestyle",
      "medication",
      "follow-up",
      "clinical-review",
    ];

    if (
      !allowedCategories.includes(
        category
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid review category.",
      });
    }

    if (!reviewText) {
      return res.status(400).json({
        success: false,
        message:
          "Review or suggestion cannot be empty.",
      });
    }

    if (reviewText.length > 5000) {
      return res.status(400).json({
        success: false,
        message:
          "Review cannot exceed 5000 characters.",
      });
    }

    const connection =
      await getAcceptedDoctorPatientConnection(
        doctorUserId,
        patientId
      );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Accepted doctor-patient connection not found.",
      });
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO doctor_patient_reviews (
          connection_id,
          doctor_user_id,
          patient_user_id,
          category,
          review_text
        )

        VALUES (?, ?, ?, ?, ?)
        `,
        [
          connection.connection_id,
          doctorUserId,
          connection.patient_user_id,
          category,
          reviewText,
        ]
      );

    const [reviews] =
      await pool.query(
        `
        SELECT
          id,
          category,
          review_text,
          created_at,
          updated_at

        FROM doctor_patient_reviews

        WHERE id = ?

        LIMIT 1
        `,
        [result.insertId]
      );

    return res.status(201).json({
      success: true,
      message:
        "Doctor review saved successfully.",
      review: reviews[0],
    });
  } catch (error) {
    console.error(
      "Create doctor review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while saving the review.",
    });
  }
};

// =====================================================
// DOCTOR: GET REVIEWS
// =====================================================

const getDoctorReviews = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can access patient reviews.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const { patientId } = req.params;

    const connection =
      await getAcceptedDoctorPatientConnection(
        doctorUserId,
        patientId
      );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Accepted doctor-patient connection not found.",
      });
    }

    const [reviews] =
      await pool.query(
        `
        SELECT
          id,
          category,
          review_text,
          created_at,
          updated_at

        FROM doctor_patient_reviews

        WHERE connection_id = ?
          AND doctor_user_id = ?
          AND patient_user_id = ?

        ORDER BY created_at DESC
        `,
        [
          connection.connection_id,
          doctorUserId,
          connection.patient_user_id,
        ]
      );

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(
      "Get doctor reviews error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while loading reviews.",
    });
  }
};

// =====================================================
// DOCTOR: UPDATE REVIEW
// =====================================================

const updateDoctorReview = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can update reviews.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const {
      patientId,
      reviewId,
    } = req.params;

    const reviewIdNumber =
      Number(reviewId);

    if (
      !Number.isInteger(
        reviewIdNumber
      ) ||
      reviewIdNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid review ID.",
      });
    }

    const category = String(
      req.body.category || "general"
    )
      .trim()
      .toLowerCase();

    const reviewText = String(
      req.body.reviewText || ""
    ).trim();

    const allowedCategories = [
      "general",
      "lifestyle",
      "medication",
      "follow-up",
      "clinical-review",
    ];

    if (
      !allowedCategories.includes(
        category
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid review category.",
      });
    }

    if (!reviewText) {
      return res.status(400).json({
        success: false,
        message:
          "Review cannot be empty.",
      });
    }

    if (reviewText.length > 5000) {
      return res.status(400).json({
        success: false,
        message:
          "Review cannot exceed 5000 characters.",
      });
    }

    const connection =
      await getAcceptedDoctorPatientConnection(
        doctorUserId,
        patientId
      );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Accepted doctor-patient connection not found.",
      });
    }

    const [result] =
      await pool.query(
        `
        UPDATE doctor_patient_reviews

        SET
          category = ?,
          review_text = ?

        WHERE id = ?
          AND connection_id = ?
          AND doctor_user_id = ?
          AND patient_user_id = ?
        `,
        [
          category,
          reviewText,

          reviewIdNumber,

          connection.connection_id,

          doctorUserId,

          connection.patient_user_id,
        ]
      );

    if (
      result.affectedRows === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Review updated successfully.",
    });
  } catch (error) {
    console.error(
      "Update doctor review error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the review.",
    });
  }
};

// =====================================================
// DOCTOR: GET CONSULTATIONS
// =====================================================

const getConsultations = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can access consultations.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const { patientId } = req.params;

    const connection =
      await getAcceptedDoctorPatientConnection(
        doctorUserId,
        patientId
      );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Accepted doctor-patient connection not found.",
      });
    }

    const [consultations] =
      await pool.query(
        `
        SELECT
          id,
          connection_id,
          DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date,
          TIME_FORMAT(start_time, '%H:%i:%s') AS start_time,
          duration_minutes,
          consultation_type,
          notes,
          status,
          created_at,
          updated_at

        FROM doctor_patient_consultations

        WHERE connection_id = ?
          AND doctor_user_id = ?
          AND patient_user_id = ?

        ORDER BY
          scheduled_date ASC,
          start_time ASC
        `,
        [
          connection.connection_id,
          doctorUserId,
          connection.patient_user_id,
        ]
      );

    return res.status(200).json({
      success: true,
      consultations,
    });
  } catch (error) {
    console.error(
      "Get consultations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while loading consultations.",
    });
  }
};

// =====================================================
// DOCTOR: CREATE CONSULTATION
// =====================================================

const createConsultation = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can schedule consultations.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const { patientId } = req.params;

    const {
      scheduledDate,
      startTime,
      durationMinutes,
      consultationType,
      notes,
    } = req.body;

    const type =
      consultationType || "general";

    const duration = Number(
      durationMinutes || 30
    );

    const validationError =
      validateConsultationInput({
        scheduledDate,
        startTime,
        durationMinutes:
          duration,
        consultationType: type,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // -------------------------------------------------
    // CHECK DATE USING MYSQL SERVER DATE
    // -------------------------------------------------

    const [dateRows] =
  await pool.query(
    `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today`
  );

const todayString =
  String(dateRows[0].today);

    if (
      scheduledDate < todayString
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Consultation date cannot be in the past.",
      });
    }

    const connection =
      await getAcceptedDoctorPatientConnection(
        doctorUserId,
        patientId
      );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Accepted doctor-patient connection not found.",
      });
    }

    // -------------------------------------------------
    // OVERLAP CHECK
    // -------------------------------------------------

    const [conflicts] =
      await pool.query(
        `
        SELECT id

        FROM doctor_patient_consultations

        WHERE scheduled_date = ?

          AND status = 'scheduled'

          AND (
            doctor_user_id = ?
            OR patient_user_id = ?
          )

          AND start_time <
            ADDTIME(
              ?,
              SEC_TO_TIME(? * 60)
            )

          AND ADDTIME(
            start_time,
            SEC_TO_TIME(
              duration_minutes * 60
            )
          ) > ?

        LIMIT 1
        `,
        [
          scheduledDate,

          doctorUserId,

          connection.patient_user_id,

          startTime,

          duration,

          startTime,
        ]
      );

    if (
      conflicts.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This consultation time overlaps with an existing scheduled consultation.",
      });
    }

    // -------------------------------------------------
    // INSERT
    // -------------------------------------------------

    const [result] =
      await pool.query(
        `
        INSERT INTO doctor_patient_consultations (
          connection_id,
          doctor_user_id,
          patient_user_id,
          scheduled_date,
          start_time,
          duration_minutes,
          consultation_type,
          notes,
          status
        )

        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'scheduled'
        )
        `,
        [
          connection.connection_id,

          doctorUserId,

          connection.patient_user_id,

          scheduledDate,

          startTime,

          duration,

          type,

          notes
            ? String(notes).trim()
            : null,
        ]
      );

    return res.status(201).json({
      success: true,
      message:
        "Consultation scheduled successfully.",
      consultationId:
        result.insertId,
    });
  } catch (error) {
    console.error(
      "Create consultation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while scheduling the consultation.",
    });
  }
};

// =====================================================
// DOCTOR: UPDATE / RESCHEDULE CONSULTATION
// =====================================================

const updateConsultation = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can update consultations.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const {
      patientId,
      consultationId,
    } = req.params;

    const consultationIdNumber =
      Number(consultationId);

    if (
      !Number.isInteger(
        consultationIdNumber
      ) ||
      consultationIdNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid consultation ID.",
      });
    }

    const {
      scheduledDate,
      startTime,
      durationMinutes,
      consultationType,
      notes,
    } = req.body;

    const type =
      consultationType || "general";

    const duration = Number(
      durationMinutes || 30
    );

    const validationError =
      validateConsultationInput({
        scheduledDate,
        startTime,
        durationMinutes:
          duration,
        consultationType: type,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // -------------------------------------------------
    // DATE CHECK
    // -------------------------------------------------

    const [dateRows] =
  await pool.query(
    `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today`
  );

const todayString =
  String(dateRows[0].today);

    if (
      scheduledDate < todayString
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Consultation date cannot be in the past.",
      });
    }

    // -------------------------------------------------
    // CONNECTION
    // -------------------------------------------------

    const connection =
      await getAcceptedDoctorPatientConnection(
        doctorUserId,
        patientId
      );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Accepted doctor-patient connection not found.",
      });
    }

    // -------------------------------------------------
    // VERIFY CONSULTATION OWNERSHIP
    // -------------------------------------------------

    const [existing] =
      await pool.query(
        `
        SELECT
          id,
          status

        FROM doctor_patient_consultations

        WHERE id = ?
          AND connection_id = ?
          AND doctor_user_id = ?
          AND patient_user_id = ?

        LIMIT 1
        `,
        [
          consultationIdNumber,

          connection.connection_id,

          doctorUserId,

          connection.patient_user_id,
        ]
      );

    if (
      existing.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Consultation not found.",
      });
    }

    if (
      existing[0].status ===
      "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A cancelled consultation cannot be rescheduled.",
      });
    }

    // -------------------------------------------------
    // OVERLAP CHECK
    // EXCLUDE CURRENT CONSULTATION
    // -------------------------------------------------

    const [conflicts] =
      await pool.query(
        `
        SELECT id

        FROM doctor_patient_consultations

        WHERE id <> ?

          AND scheduled_date = ?

          AND status = 'scheduled'

          AND (
            doctor_user_id = ?
            OR patient_user_id = ?
          )

          AND start_time <
            ADDTIME(
              ?,
              SEC_TO_TIME(? * 60)
            )

          AND ADDTIME(
            start_time,
            SEC_TO_TIME(
              duration_minutes * 60
            )
          ) > ?

        LIMIT 1
        `,
        [
          consultationIdNumber,

          scheduledDate,

          doctorUserId,

          connection.patient_user_id,

          startTime,

          duration,

          startTime,
        ]
      );

    if (
      conflicts.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The new consultation time overlaps with another scheduled consultation.",
      });
    }

    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------

    await pool.query(
      `
      UPDATE doctor_patient_consultations

      SET
        scheduled_date = ?,
        start_time = ?,
        duration_minutes = ?,
        consultation_type = ?,
        notes = ?,
        status = 'scheduled'

      WHERE id = ?

        AND connection_id = ?

        AND doctor_user_id = ?

        AND patient_user_id = ?
      `,
      [
        scheduledDate,

        startTime,

        duration,

        type,

        notes
          ? String(notes).trim()
          : null,

        consultationIdNumber,

        connection.connection_id,

        doctorUserId,

        connection.patient_user_id,
      ]
    );

    return res.status(200).json({
      success: true,
      message:
        "Consultation rescheduled successfully.",
    });
  } catch (error) {
    console.error(
      "Update consultation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the consultation.",
    });
  }
};

// =====================================================
// DOCTOR: CANCEL CONSULTATION
// =====================================================

const cancelConsultation = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can cancel consultations.",
      });
    }

    const doctorUserId =
      req.user.userId;

    const {
      patientId,
      consultationId,
    } = req.params;

    const consultationIdNumber =
      Number(consultationId);

    if (
      !Number.isInteger(
        consultationIdNumber
      ) ||
      consultationIdNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid consultation ID.",
      });
    }

    const connection =
      await getAcceptedDoctorPatientConnection(
        doctorUserId,
        patientId
      );

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "Accepted doctor-patient connection not found.",
      });
    }

    const [result] =
      await pool.query(
        `
        UPDATE doctor_patient_consultations

        SET status = 'cancelled'

        WHERE id = ?

          AND connection_id = ?

          AND doctor_user_id = ?

          AND patient_user_id = ?

          AND status = 'scheduled'
        `,
        [
          consultationIdNumber,

          connection.connection_id,

          doctorUserId,

          connection.patient_user_id,
        ]
      );

    if (
      result.affectedRows === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Scheduled consultation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Consultation cancelled successfully.",
    });
  } catch (error) {
    console.error(
      "Cancel consultation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while cancelling the consultation.",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getDoctorPatient,

  createDoctorReview,
  getDoctorReviews,
  updateDoctorReview,

  createConsultation,
  getConsultations,
  updateConsultation,
  cancelConsultation,
};