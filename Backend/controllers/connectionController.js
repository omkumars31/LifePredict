const pool = require("../config/db");

// =====================================================
// HELPER: CHECK USER ROLE
// =====================================================

const requireRole = (req, role) => {
  return req.user && req.user.role === role;
};

// =====================================================
// PATIENT: LOOKUP DOCTOR BY DOCTOR ID
// =====================================================

const getDoctorById = async (req, res) => {
  try {
    if (!requireRole(req, "patient")) {
      return res.status(403).json({
        success: false,
        message: "Only patients can search for doctors.",
      });
    }

    const doctorId = String(req.params.doctorId || "")
      .trim()
      .toUpperCase();

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required.",
      });
    }

    const [doctors] = await pool.query(
      `SELECT
        dp.doctor_id,
        dp.user_id,
        dp.specialization,
        dp.qualification,
        dp.experience_years,
        dp.hospital_clinic,
        u.full_name,
        u.email
       FROM doctor_profiles dp
       INNER JOIN users u
         ON u.id = dp.user_id
       WHERE dp.doctor_id = ?
         AND u.role = 'doctor'
       LIMIT 1`,
      [doctorId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No doctor found with this LifePredict Doctor ID.",
      });
    }

    const doctor = doctors[0];

    return res.status(200).json({
      success: true,
      doctor: {
        doctorId: doctor.doctor_id,
        userId: doctor.user_id,
        fullName: doctor.full_name,
        email: doctor.email,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experienceYears: doctor.experience_years,
        hospitalClinic: doctor.hospital_clinic,
      },
    });
  } catch (error) {
    console.error("Get doctor by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while searching for the doctor.",
    });
  }
};

// =====================================================
// PATIENT: SEND CONNECTION REQUEST
// =====================================================

const sendConnectionRequest = async (req, res) => {
  try {
    if (!requireRole(req, "patient")) {
      return res.status(403).json({
        success: false,
        message: "Only patients can send connection requests.",
      });
    }

    const patientUserId = req.user.userId;

    const doctorId = String(req.body.doctorId || "")
      .trim()
      .toUpperCase();

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required.",
      });
    }

    if (!/^LP-D-\d{6}$/.test(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Doctor ID format.",
      });
    }

    // -------------------------------------------------
    // Check doctor
    // -------------------------------------------------

    const [doctors] = await pool.query(
      `SELECT
        dp.user_id,
        dp.doctor_id,
        u.full_name
       FROM doctor_profiles dp
       INNER JOIN users u
         ON u.id = dp.user_id
       WHERE dp.doctor_id = ?
         AND u.role = 'doctor'
       LIMIT 1`,
      [doctorId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const doctorUserId = doctors[0].user_id;

    // -------------------------------------------------
    // Prevent patient connecting to themselves
    // -------------------------------------------------

    if (doctorUserId === patientUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot connect to yourself.",
      });
    }

    // -------------------------------------------------
    // Check existing connection
    // -------------------------------------------------

    const [existingConnections] = await pool.query(
      `SELECT
        id,
        status
       FROM doctor_patient_connections
       WHERE doctor_user_id = ?
         AND patient_user_id = ?
       LIMIT 1`,
      [doctorUserId, patientUserId]
    );

    if (existingConnections.length > 0) {
      const existing = existingConnections[0];

      if (existing.status === "pending") {
        return res.status(409).json({
          success: false,
          message: "A connection request is already pending.",
          status: "pending",
        });
      }

      if (existing.status === "accepted") {
        return res.status(409).json({
          success: false,
          message: "You are already connected with this doctor.",
          status: "accepted",
        });
      }

      // Previously rejected → allow new request
      await pool.query(
        `UPDATE doctor_patient_connections
         SET
           status = 'pending',
           requested_at = CURRENT_TIMESTAMP,
           responded_at = NULL
         WHERE id = ?`,
        [existing.id]
      );

      return res.status(200).json({
        success: true,
        message: "Connection request sent again.",
        status: "pending",
      });
    }

    // -------------------------------------------------
    // Create new request
    // -------------------------------------------------

    await pool.query(
      `INSERT INTO doctor_patient_connections (
        doctor_user_id,
        patient_user_id,
        status,
        requested_at
      )
      VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`,
      [doctorUserId, patientUserId]
    );

    return res.status(201).json({
      success: true,
      message: `Connection request sent to Dr. ${doctors[0].full_name}.`,
      status: "pending",
    });
  } catch (error) {
    console.error("Send connection request error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending the connection request.",
    });
  }
};

// =====================================================
// PATIENT: GET CURRENT CONNECTION STATUS
// =====================================================

const getPatientConnection = async (req, res) => {
  try {
    if (!requireRole(req, "patient")) {
      return res.status(403).json({
        success: false,
        message: "Only patients can access this information.",
      });
    }

    const patientUserId = req.user.userId;

    const [connections] = await pool.query(
      `
      SELECT
        c.id,
        c.doctor_user_id,
        c.status,
        c.requested_at,
        c.responded_at,

        dp.doctor_id,
        dp.specialization,
        dp.qualification,
        dp.experience_years,
        dp.hospital_clinic,

        u.full_name,
        u.email

      FROM doctor_patient_connections c

      INNER JOIN doctor_profiles dp
        ON dp.user_id = c.doctor_user_id

      INNER JOIN users u
        ON u.id = c.doctor_user_id

      WHERE c.patient_user_id = ?
ORDER BY
  CASE WHEN c.status = 'accepted' THEN 0 ELSE 1 END,
  c.requested_at DESC
LIMIT 1`,
      [patientUserId]
    );

    // -------------------------------------------------
    // No connection found
    // -------------------------------------------------

    if (connections.length === 0) {
      return res.status(200).json({
        success: true,
        connected: false,
        latestDoctorReview: null,
        upcomingConsultations: [],
        connection: null,
      });
    }

    const connection = connections[0];

    // -------------------------------------------------
    // LATEST DOCTOR REVIEW
    // -------------------------------------------------

    let latestDoctorReview = null;

    if (connection.status === "accepted") {
      const [reviews] = await pool.query(
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

        LIMIT 1
        `,
        [
          connection.id,
          connection.doctor_user_id,
          patientUserId,
        ]
      );

      if (reviews.length > 0) {
        const review = reviews[0];

        latestDoctorReview = {
          id: review.id,
          category: review.category,
          reviewText: review.review_text,
          createdAt: review.created_at,
          updatedAt: review.updated_at,
        };
      }
    }

    // -------------------------------------------------
    // UPCOMING CONSULTATIONS
    // -------------------------------------------------
    // Only consultations that:
    // 1. belong to this patient + connected doctor
    // 2. are still scheduled
    // 3. have an exact date/time later than NOW()
    //
    // This automatically excludes:
    // - past consultations
    // - cancelled consultations
    // - completed consultations

    let upcomingConsultations = [];

    if (connection.status === "accepted") {
      const [consultations] = await pool.query(
        `
        SELECT
          id,

          DATE_FORMAT(
            scheduled_date,
            '%Y-%m-%d'
          ) AS scheduled_date,

          TIME_FORMAT(
            start_time,
            '%H:%i:%s'
          ) AS start_time,

          duration_minutes,
          consultation_type,
          notes,
          status

        FROM doctor_patient_consultations

        WHERE patient_user_id = ?
          AND doctor_user_id = ?
          AND status = 'scheduled'
          AND TIMESTAMP(scheduled_date, start_time) > NOW()

        ORDER BY
          scheduled_date ASC,
          start_time ASC
        `,
        [
          patientUserId,
          connection.doctor_user_id,
        ]
      );

      upcomingConsultations = consultations.map((consultation) => ({
        id: consultation.id,
        scheduled_date: consultation.scheduled_date,
        start_time: consultation.start_time,
        duration_minutes: consultation.duration_minutes,
        consultation_type: consultation.consultation_type,
        notes: consultation.notes,
        status: consultation.status,
        doctorName: connection.full_name,
        specialization: connection.specialization,
      }));
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      connected: connection.status === "accepted",
      latestDoctorReview,
      upcomingConsultations,

      connection: {
        id: connection.id,
        status: connection.status,
        requestedAt: connection.requested_at,
        respondedAt: connection.responded_at,

        doctor: {
          doctorId: connection.doctor_id,
          fullName: connection.full_name,
          email: connection.email,
          specialization: connection.specialization,
          qualification: connection.qualification,
          experienceYears: connection.experience_years,
          hospitalClinic: connection.hospital_clinic,
        },
      },
    });
  } catch (error) {
    console.error("Get patient connection error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching your doctor connection.",
    });
  }
};



const getPatientReviewHistory = async (req, res) => {
  try {
    if (!requireRole(req, "patient")) {
      return res.status(403).json({
        success: false,
        message: "Only patients can access their doctor review history.",
      });
    }

    const patientUserId = req.user.userId;
    const showAll = String(req.query.all || "").toLowerCase() === "true";

    // Find the patient's current accepted doctor connection.
    const [connections] = await pool.query(
      `SELECT id, doctor_user_id
       FROM doctor_patient_connections
       WHERE patient_user_id = ?
         AND status = 'accepted'
       ORDER BY requested_at DESC
       LIMIT 1`,
      [patientUserId]
    );
    
    if (connections.length === 0) {
      return res.status(200).json({
        success: true,
        reviews: [],
      });
    }

    const connection = connections[0];

    // Recent mode: reviews from the last 3 days.
    // All mode: complete history for this accepted connection.

// Default mode: latest 3 reviews, regardless of date.
// All mode: complete review history for this connection.
const [reviews] = await pool.query(
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
  ORDER BY created_at DESC, id DESC
  ${showAll ? "" : "LIMIT 3"}
  `,
  [
    connection.id,
    connection.doctor_user_id,
    patientUserId,
  ]
);

    return res.status(200).json({
      success: true,
      reviews: reviews.map((review) => ({
        id: review.id,
        category: review.category,
        reviewText: review.review_text,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      })),
    });
  } catch (error) {
    console.error("Get patient review history error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching doctor review history.",
    });
  }
};


// =====================================================
// DOCTOR: GET PENDING CONNECTION REQUESTS
// =====================================================

const getDoctorRequests = async (req, res) => {
  try {
    if (!requireRole(req, "doctor")) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access connection requests.",
      });
    }

    const doctorUserId = req.user.userId;

    const [requests] = await pool.query(
      `SELECT
        c.id AS connection_id,
        c.status,
        c.requested_at,

        u.id AS patient_user_id,
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

       LEFT JOIN patient_profiles pp
         ON pp.user_id = c.patient_user_id

       WHERE c.doctor_user_id = ?
         AND c.status = 'pending'

       ORDER BY c.requested_at DESC`,
      [doctorUserId]
    );

    return res.status(200).json({
      success: true,
      count: requests.length,

      requests: requests.map((request) => ({
        connectionId: request.connection_id,
        status: request.status,
        requestedAt: request.requested_at,

        patient: {
          userId: request.patient_user_id,
          patientId: request.patient_id,
          fullName: request.full_name,
          email: request.email,
          dateOfBirth: request.date_of_birth,
          gender: request.gender,
          heightCm: request.height_cm,
          smokingStatus: request.smoking_status,
          alcoholStatus: request.alcohol_status,
          activityLevel: request.activity_level,
          existingConditions: request.existing_conditions,
          familyHistory: request.family_history,
          currentMedications: request.current_medications,
          previousHealthIssues: request.previous_health_issues,
          profileCompleted: request.profile_completed,
        },
      })),
    });
  } catch (error) {
    console.error("Get doctor requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching connection requests.",
    });
  }
};

// =====================================================
// DOCTOR: ACCEPT / REJECT REQUEST
// =====================================================

const respondToConnectionRequest = async (req, res) => {
  try {
    if (!requireRole(req, "doctor")) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can respond to connection requests.",
      });
    }

    const doctorUserId = req.user.userId;

    const connectionId = Number(req.params.connectionId);

    const action = String(req.body.action || "")
      .trim()
      .toLowerCase();

    if (!Number.isInteger(connectionId) || connectionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection ID.",
      });
    }

    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be accepted or rejected.",
      });
    }

    const [connections] = await pool.query(
      `SELECT
        id,
        status,
        patient_user_id

       FROM doctor_patient_connections

       WHERE id = ?
         AND doctor_user_id = ?

       LIMIT 1`,
      [connectionId, doctorUserId]
    );

    if (connections.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found.",
      });
    }

    const connection = connections[0];

    if (connection.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: `This request has already been ${connection.status}.`,
        status: connection.status,
      });
    }

    await pool.query(
      `UPDATE doctor_patient_connections
       SET
         status = ?,
         responded_at = CURRENT_TIMESTAMP
       WHERE id = ?
         AND doctor_user_id = ?`,
      [action, connectionId, doctorUserId]
    );

    return res.status(200).json({
      success: true,
      message:
        action === "accepted"
          ? "Patient connection accepted."
          : "Patient connection request rejected.",
      status: action,
    });
  } catch (error) {
    console.error("Respond to connection request error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while responding to the request.",
    });
  }
};

// =====================================================
// DOCTOR: GET ACCEPTED PATIENTS
// =====================================================

const getDoctorPatients = async (req, res) => {
  try {
    if (!requireRole(req, "doctor")) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access their patients.",
      });
    }

    const doctorUserId = req.user.userId;

    const [patients] = await pool.query(
      `SELECT
        c.id AS connection_id,
        c.status,
        c.responded_at,
        r.reviewed_at AS reviewed_at,

        u.id AS patient_user_id,
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

       LEFT JOIN patient_profiles pp
         ON pp.user_id = c.patient_user_id
         LEFT JOIN doctor_patient_review_status r
  ON r.doctor_user_id = c.doctor_user_id
  AND r.patient_user_id = c.patient_user_id
         

       WHERE c.doctor_user_id = ?
         AND c.status = 'accepted'

       ORDER BY u.full_name ASC`,
      [doctorUserId]
    );

    return res.status(200).json({
      success: true,
      count: patients.length,

      patients: patients.map((patient) => ({
  connectionId: patient.connection_id,
  status: patient.status,
  respondedAt: patient.responded_at,
  reviewedAt: patient.reviewed_at,

        patient: {
          userId: patient.patient_user_id,
          patientId: patient.patient_id,
          fullName: patient.full_name,
          email: patient.email,
          dateOfBirth: patient.date_of_birth,
          gender: patient.gender,
          heightCm: patient.height_cm,
          smokingStatus: patient.smoking_status,
          alcoholStatus: patient.alcohol_status,
          activityLevel: patient.activity_level,
          existingConditions: patient.existing_conditions,
          familyHistory: patient.family_history,
          currentMedications: patient.current_medications,
          previousHealthIssues: patient.previous_health_issues,
          profileCompleted: patient.profile_completed,
        },
      })),
    });
  } catch (error) {
    console.error("Get doctor patients error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching your patients.",
    });
  }
};




const markPatientReviewed = async (req, res) => {
  try {
    if (!requireRole(req, "doctor")) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can mark patients as reviewed.",
      });
    }

    const doctorUserId = req.user.userId;
    const patientUserId = Number(req.params.patientUserId);

    if (!Number.isSafeInteger(patientUserId) || patientUserId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid patient ID is required.",
      });
    }

    const [connections] = await pool.query(
      `SELECT id
       FROM doctor_patient_connections
       WHERE doctor_user_id = ?
         AND patient_user_id = ?
         AND status = 'accepted'
       LIMIT 1`,
      [doctorUserId, patientUserId]
    );

    if (!connections.length) {
      return res.status(404).json({
        success: false,
        message: "No accepted connection found for this patient.",
      });
    }

    await pool.query(
      `INSERT INTO doctor_patient_review_status
         (doctor_user_id, patient_user_id, reviewed_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         reviewed_at = IF(
           DATE(reviewed_at) = CURRENT_DATE,
           reviewed_at,
           CURRENT_TIMESTAMP
         )`,
      [doctorUserId, patientUserId]
    );

    const [reviewRows] = await pool.query(
      `SELECT reviewed_at
       FROM doctor_patient_review_status
       WHERE doctor_user_id = ?
         AND patient_user_id = ?
       LIMIT 1`,
      [doctorUserId, patientUserId]
    );

    if (!reviewRows.length) {
      return res.status(500).json({
        success: false,
        message: "Review status could not be retrieved.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient marked as reviewed.",
      patientUserId,
      reviewedAt: reviewRows[0].reviewed_at,
    });
  } catch (error) {
    console.error("Mark patient reviewed error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to mark this patient as reviewed.",
    });
  }
};

const getPatientsReviewedToday = async (req, res) => {
try {
if (!requireRole(req, "doctor")) {
return res.status(403).json({
success: false,
message: "Only doctors can access this count.",
});
}

const doctorUserId = req.user.userId;

const [rows] = await pool.query(
  `SELECT patient_user_id, reviewed_at
   FROM doctor_patient_review_status
   WHERE doctor_user_id = ?
     AND reviewed_at >= CURRENT_DATE
     AND reviewed_at < CURRENT_DATE + INTERVAL 1 DAY`,
  [doctorUserId]
);

return res.status(200).json({
  success: true,
  reviewedToday: rows.length,
  patients: rows.map((row) => ({
    patientUserId: row.patient_user_id,
    reviewedAt: row.reviewed_at,
  })),
});

} catch (error) {
console.error("Get patients reviewed today error:", error);

return res.status(500).json({
  success: false,
  message: "Unable to fetch today's reviewed-patient status.",
});

}
};


// =====================================================
// EXPORTS
// =====================================================


module.exports = {
  getDoctorById,
  sendConnectionRequest,
  getPatientConnection,
  getPatientReviewHistory,
  getDoctorRequests,
  respondToConnectionRequest,
  getDoctorPatients,
  markPatientReviewed,
  getPatientsReviewedToday,
};
