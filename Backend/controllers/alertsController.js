const pool = require("../config/db");

// =====================================================
// HELPERS
// =====================================================

const requireDoctor = (req) => {
  return req.user && req.user.role === "doctor";
};

const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
};

const getInitials = (name = "Patient") => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "P";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};

const roundNumber = (value, decimals = 1) => {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Number(number.toFixed(decimals));
};

const percentageChange = (previous, current) => {
  if (
    previous === null ||
    current === null ||
    previous === undefined ||
    current === undefined ||
    Number(previous) === 0
  ) {
    return null;
  }

  return roundNumber(
    ((Number(current) - Number(previous)) /
      Math.abs(Number(previous))) *
      100,
    1
  );
};

const formatChange = (previous, current, suffix = "") => {
  if (
    previous === null ||
    current === null ||
    previous === undefined ||
    current === undefined
  ) {
    return null;
  }

  const change = roundNumber(
    Number(current) - Number(previous),
    1
  );

  if (change === null) return null;

  const sign = change > 0 ? "+" : "";

  return `${sign}${change}${suffix}`;
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

// =====================================================
// GET DOCTOR ALERTS
// =====================================================

const getDoctorAlerts = async (req, res) => {
  try {
    // -------------------------------------------------
    // ROLE CHECK
    // -------------------------------------------------

    if (!requireDoctor(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can access patient alerts.",
      });
    }

    const doctorUserId = req.user.userId;

    // =====================================================
// DOCTOR: CREATE MANUAL ALERT
// =====================================================

const createManualDoctorAlert = async (req, res) => {
  try {
    if (!requireDoctor(req)) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create patient alerts.",
      });
    }

    const doctorUserId = req.user.userId;
    const { patientUserId, title, message, priority } = req.body;

    const cleanTitle = String(title || "").trim();
    const cleanMessage = String(message || "").trim();
    const cleanPriority = String(priority || "review").trim().toLowerCase();
    const patientId = Number(patientUserId);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid patient must be selected.",
      });
    }

    if (!cleanTitle || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    if (cleanTitle.length > 200 || cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Title or message exceeds the allowed length.",
      });
    }

    const allowedPriorities = ["critical", "review", "follow-up"];

    if (!allowedPriorities.includes(cleanPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert priority.",
      });
    }

    // Only allow an accepted connection belonging to this doctor.
    const [connections] = await pool.query(
      `
      SELECT id
      FROM doctor_patient_connections
      WHERE doctor_user_id = ?
        AND patient_user_id = ?
        AND status = 'accepted'
      LIMIT 1
      `,
      [doctorUserId, patientId]
    );

    if (connections.length === 0) {
      return res.status(403).json({
        success: false,
        message: "This patient is not connected to your account.",
      });
    }

    const connectionId = connections[0].id;

    const [result] = await pool.query(
      `
      INSERT INTO doctor_patient_alerts (
        connection_id,
        doctor_user_id,
        patient_user_id,
        title,
        message,
        priority
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        connectionId,
        doctorUserId,
        patientId,
        cleanTitle,
        cleanMessage,
        cleanPriority,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Patient alert created successfully.",
      alert: {
        id: result.insertId,
        patientUserId: patientId,
        title: cleanTitle,
        message: cleanMessage,
        priority: cleanPriority,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Create manual doctor alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create patient alert.",
    });
  }
};


// =====================================================
// PATIENT: GET MANUAL DOCTOR ALERTS
// =====================================================

const getPatientDoctorAlerts = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access their doctor alerts.",
      });
    }

    const patientUserId = req.user.userId;

    const [alerts] = await pool.query(
      `
      SELECT
        a.id,
        a.title,
        a.message,
        a.priority,
        a.created_at,
        a.updated_at,
        u.full_name AS doctor_name
      FROM doctor_patient_alerts a
      INNER JOIN users u
        ON u.id = a.doctor_user_id
      INNER JOIN doctor_patient_connections c
        ON c.id = a.connection_id
      WHERE a.patient_user_id = ?
        AND c.status = 'accepted'
      ORDER BY
        CASE a.priority
          WHEN 'critical' THEN 1
          WHEN 'review' THEN 2
          WHEN 'follow-up' THEN 3
          ELSE 4
        END,
        a.created_at DESC
      `,
      [patientUserId]
    );

    return res.status(200).json({
      success: true,
      alerts: alerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        doctorName: alert.doctor_name,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
        source: "doctor",
      })),
    });
  } catch (error) {
    console.error("Get patient doctor alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load doctor alerts.",
    });
  }
};

    // -------------------------------------------------
    // GET ACCEPTED PATIENTS + THEIR HEALTH DATA
    // -------------------------------------------------

    const [patients] = await pool.query(
      `
      SELECT
        c.id AS connection_id,

        u.id AS user_id,
        u.full_name,
        u.email,

        pp.patient_id,
        pp.date_of_birth,
        pp.gender,

        hr.id AS health_record_id,
        hr.recorded_at,
        hr.weight_kg,
        hr.systolic_bp,
        hr.diastolic_bp,
        hr.resting_heart_rate,
        hr.glucose,
        hr.cholesterol,
        hr.physical_activity_minutes,
        hr.steps,
        hr.sleep_hours,
        hr.sleep_quality,
        hr.stress_level,
        hr.water_intake_litres,
        hr.smoking_today,
        hr.cigarettes_today,
        hr.alcohol_today,
        hr.drinks_today,
        hr.sedentary_time_hours,
        hr.energy_level,
        hr.mood,
        hr.symptoms

      FROM doctor_patient_connections c

      INNER JOIN users u
        ON u.id = c.patient_user_id

      LEFT JOIN patient_profiles pp
        ON pp.user_id = c.patient_user_id

      LEFT JOIN health_records hr
        ON hr.user_id = c.patient_user_id
        AND hr.recorded_at = (
          SELECT MAX(hr2.recorded_at)
          FROM health_records hr2
          WHERE hr2.user_id = c.patient_user_id
        )

      WHERE c.doctor_user_id = ?
        AND c.status = 'accepted'

      ORDER BY hr.recorded_at DESC
      `,
      [doctorUserId]
    );

    // -------------------------------------------------
    // GET PREVIOUS HEALTH RECORD FOR EACH PATIENT
    // -------------------------------------------------

    const patientIds = patients.map(
      (patient) => patient.user_id
    );

    let previousRecords = [];

    if (patientIds.length > 0) {
      const placeholders = patientIds
        .map(() => "?")
        .join(",");

      const [rows] = await pool.query(
        `
        SELECT
          hr.user_id,
          hr.recorded_at,
          hr.weight_kg,
          hr.systolic_bp,
          hr.diastolic_bp,
          hr.glucose,
          hr.cholesterol,
          hr.physical_activity_minutes,
          hr.steps,
          hr.sleep_hours,
          hr.stress_level,
          hr.sedentary_time_hours

        FROM health_records hr

        INNER JOIN (
          SELECT
            user_id,
            MAX(recorded_at) AS latest_recorded_at
          FROM health_records
          WHERE user_id IN (${placeholders})
          GROUP BY user_id
        ) latest
          ON latest.user_id = hr.user_id

        WHERE hr.recorded_at < latest.latest_recorded_at

        AND hr.recorded_at = (
          SELECT MAX(hr2.recorded_at)
          FROM health_records hr2
          WHERE hr2.user_id = hr.user_id
            AND hr2.recorded_at < latest.latest_recorded_at
        )
        `,
        patientIds
      );

      previousRecords = rows;
    }

    const previousByUserId = new Map();

    previousRecords.forEach((record) => {
      previousByUserId.set(
        record.user_id,
        record
      );
    });

    // -------------------------------------------------
    // GET LATEST + PREVIOUS PREDICTIONS
    // -------------------------------------------------

    let predictionRows = [];

    if (patientIds.length > 0) {
      const placeholders = patientIds
        .map(() => "?")
        .join(",");

      const [rows] = await pool.query(
        `
        SELECT
          ph.user_id,
          ph.prediction,
          ph.probability_cardio,
          ph.probability_no_cardio,
          ph.created_at
        FROM prediction_history ph
        WHERE ph.user_id IN (${placeholders})
        ORDER BY ph.user_id, ph.created_at DESC
        `,
        patientIds
      );

      predictionRows = rows;
    }

    const predictionsByUserId = new Map();

    predictionRows.forEach((prediction) => {
      if (!predictionsByUserId.has(prediction.user_id)) {
        predictionsByUserId.set(
          prediction.user_id,
          []
        );
      }

      const list =
        predictionsByUserId.get(
          prediction.user_id
        );

      if (list.length < 2) {
        list.push(prediction);
      }
    });

    // -------------------------------------------------
    // GENERATE ALERTS
    // -------------------------------------------------

    const alerts = [];

    patients.forEach((patient) => {
      const latest = patient;
      const previous =
        previousByUserId.get(
          patient.user_id
        );

      const predictions =
        predictionsByUserId.get(
          patient.user_id
        ) || [];

      const latestPrediction =
        predictions[0] || null;

      const previousPrediction =
        predictions[1] || null;

      const age = getAge(
        patient.date_of_birth
      );

      const patientInfo = {
        patientId:
          patient.patient_id ||
          `USER-${patient.user_id}`,

        patient:
          patient.full_name ||
          "Patient",

        initials: getInitials(
          patient.full_name
        ),

        age,

        userId: patient.user_id,
      };

      // =================================================
      // 1. CRITICAL — VERY HIGH BLOOD PRESSURE
      // =================================================

      if (
        latest.systolic_bp !== null &&
        latest.systolic_bp >= 180
      ) {
        alerts.push({
          id: `BP-CRITICAL-SYS-${patient.user_id}-${latest.health_record_id}`,

          ...patientInfo,

          priority: "critical",

          type: "Blood pressure",

          title:
            "Very high systolic blood pressure",

          description:
            "The latest recorded systolic blood pressure is 180 mmHg or higher and requires prompt clinical review.",

          previous: previous?.systolic_bp
            ? `${previous.systolic_bp} mmHg`
            : null,

          current:
            `${latest.systolic_bp} mmHg`,

          change:
            formatChange(
              previous?.systolic_bp,
              latest.systolic_bp,
              " mmHg"
            ),

          timestamp:
            formatDateTime(
              latest.recorded_at
            ),

          action: "View assessment",

          metric: "systolic_bp",
        });
      }

      // =================================================
      // 2. CRITICAL — VERY HIGH DIASTOLIC BP
      // =================================================

      if (
        latest.diastolic_bp !== null &&
        latest.diastolic_bp >= 120
      ) {
        alerts.push({
          id: `BP-CRITICAL-DIA-${patient.user_id}-${latest.health_record_id}`,

          ...patientInfo,

          priority: "critical",

          type: "Blood pressure",

          title:
            "Very high diastolic blood pressure",

          description:
            "The latest recorded diastolic blood pressure is 120 mmHg or higher and requires prompt clinical review.",

          previous: previous?.diastolic_bp
            ? `${previous.diastolic_bp} mmHg`
            : null,

          current:
            `${latest.diastolic_bp} mmHg`,

          change:
            formatChange(
              previous?.diastolic_bp,
              latest.diastolic_bp,
              " mmHg"
            ),

          timestamp:
            formatDateTime(
              latest.recorded_at
            ),

          action: "View assessment",

          metric: "diastolic_bp",
        });
      }

      // =================================================
      // 3. REVIEW — BP INCREASE
      // =================================================

      if (
        previous &&
        latest.systolic_bp !== null &&
        previous.systolic_bp !== null &&
        latest.systolic_bp >
          previous.systolic_bp &&
        latest.systolic_bp -
          previous.systolic_bp >= 15
      ) {
        alerts.push({
          id: `BP-INCREASE-${patient.user_id}-${latest.health_record_id}`,

          ...patientInfo,

          priority: "review",

          type: "Health change",

          title:
            "Systolic blood pressure increased",

          description:
            "The latest systolic blood pressure is noticeably higher than the patient's previous recorded value.",

          previous:
            `${previous.systolic_bp} mmHg`,

          current:
            `${latest.systolic_bp} mmHg`,

          change:
            formatChange(
              previous.systolic_bp,
              latest.systolic_bp,
              " mmHg"
            ),

          timestamp:
            formatDateTime(
              latest.recorded_at
            ),

          action: "Review change",

          metric: "systolic_bp",
        });
      }

      // =================================================
      // 4. REVIEW — GLUCOSE INCREASE
      // =================================================

      if (
        previous &&
        latest.glucose !== null &&
        previous.glucose !== null &&
        latest.glucose >
          previous.glucose &&
        latest.glucose -
          previous.glucose >= 20
      ) {
        alerts.push({
          id: `GLUCOSE-INCREASE-${patient.user_id}-${latest.health_record_id}`,

          ...patientInfo,

          priority: "review",

          type: "Glucose change",

          title:
            "Blood glucose increased",

          description:
            "The latest recorded glucose value is substantially higher than the patient's previous recorded value.",

          previous:
            `${previous.glucose} mg/dL`,

          current:
            `${latest.glucose} mg/dL`,

          change:
            formatChange(
              previous.glucose,
              latest.glucose,
              " mg/dL"
            ),

          timestamp:
            formatDateTime(
              latest.recorded_at
            ),

          action: "Review change",

          metric: "glucose",
        });
      }

      // =================================================
      // 5. REVIEW — CHOLESTEROL INCREASE
      // =================================================

      if (
        previous &&
        latest.cholesterol !== null &&
        previous.cholesterol !== null &&
        latest.cholesterol >
          previous.cholesterol &&
        latest.cholesterol -
          previous.cholesterol >= 30
      ) {
        alerts.push({
          id: `CHOLESTEROL-INCREASE-${patient.user_id}-${latest.health_record_id}`,

          ...patientInfo,

          priority: "review",

          type: "Cholesterol change",

          title:
            "Cholesterol increased",

          description:
            "The latest recorded cholesterol value is higher than the patient's previous recorded value.",

          previous:
            `${previous.cholesterol} mg/dL`,

          current:
            `${latest.cholesterol} mg/dL`,

          change:
            formatChange(
              previous.cholesterol,
              latest.cholesterol,
              " mg/dL"
            ),

          timestamp:
            formatDateTime(
              latest.recorded_at
            ),

          action: "Review change",

          metric: "cholesterol",
        });
      }

      // =================================================
      // 6. CRITICAL — PREDICTION RISK INCREASE
      // =================================================

      if (
        latestPrediction &&
        previousPrediction &&
        latestPrediction.probability_cardio !== null &&
        previousPrediction.probability_cardio !== null
      ) {
        const previousRisk =
          Number(
            previousPrediction.probability_cardio
          );

        const latestRisk =
          Number(
            latestPrediction.probability_cardio
          );

        const riskIncrease =
          latestRisk - previousRisk;

        if (riskIncrease >= 0.10) {
          alerts.push({
            id: `RISK-CRITICAL-${patient.user_id}-${latestPrediction.created_at}`,

            ...patientInfo,

            priority: "critical",

            type: "Risk change",

            title:
              "Cardiovascular risk increased",

            description:
              "The latest cardiovascular prediction increased meaningfully compared with the previous prediction.",

            previous:
              `${roundNumber(
                previousRisk * 100,
                0
              )}%`,

            current:
              `${roundNumber(
                latestRisk * 100,
                0
              )}%`,

            change:
              `+${
                roundNumber(
                  riskIncrease * 100,
                  0
                )
              }%`,

            timestamp:
              formatDateTime(
                latestPrediction.created_at
              ),

            action: "View assessment",

            metric: "prediction",
          });
        } else if (riskIncrease >= 0.05) {
          alerts.push({
            id: `RISK-REVIEW-${patient.user_id}-${latestPrediction.created_at}`,

            ...patientInfo,

            priority: "review",

            type: "Risk change",

            title:
              "Cardiovascular risk increased",

            description:
              "The latest cardiovascular prediction increased compared with the previous prediction.",

            previous:
              `${roundNumber(
                previousRisk * 100,
                0
              )}%`,

            current:
              `${roundNumber(
                latestRisk * 100,
                0
              )}%`,

            change:
              `+${
                roundNumber(
                  riskIncrease * 100,
                  0
                )
              }%`,

            timestamp:
              formatDateTime(
                latestPrediction.created_at
              ),

            action: "Review prediction",

            metric: "prediction",
          });
        }
      }

      // =================================================
      // 7. FOLLOW-UP — NO RECENT HEALTH RECORD
      // =================================================

      if (!latest.recorded_at) {
        alerts.push({
          id: `NO-DATA-${patient.user_id}`,

          ...patientInfo,

          priority: "follow-up",

          type: "Follow-up",

          title:
            "No health check-in recorded",

          description:
            "This patient has no health check-in available for review.",

          previous: null,

          current:
            "Health data unavailable",

          change: null,

          timestamp: null,

          action: "View patient",

          metric: "health_record",
        });
      }

      // =================================================
      // 8. FOLLOW-UP — INACTIVE FOR 7+ DAYS
      // =================================================

      if (latest.recorded_at) {
        const lastRecorded =
          new Date(
            latest.recorded_at
          ).getTime();

        const daysSinceRecord =
          (Date.now() - lastRecorded) /
          (1000 * 60 * 60 * 24);

        if (daysSinceRecord >= 7) {
          alerts.push({
            id: `INACTIVE-${patient.user_id}-${latest.health_record_id}`,

            ...patientInfo,

            priority: "follow-up",

            type: "Follow-up",

            title:
              "Patient health check-in is overdue",

            description:
              "No new health check-in has been recorded for at least 7 days.",

            previous: null,

            current:
              `${Math.floor(
                daysSinceRecord
              )} days since last check-in`,

            change: null,

            timestamp:
              formatDateTime(
                latest.recorded_at
              ),

            action: "View patient",

            metric: "health_record",
          });
        }
      }
    });

    // -------------------------------------------------
    // SORT
    // -------------------------------------------------

    const priorityOrder = {
      critical: 1,
      review: 2,
      "follow-up": 3,
    };

    alerts.sort((a, b) => {
      const priorityDifference =
        priorityOrder[a.priority] -
        priorityOrder[b.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (
        new Date(b.timestamp || 0) -
        new Date(a.timestamp || 0)
      );
    });

    // -------------------------------------------------
    // SUMMARY
    // -------------------------------------------------

    const summary = {
      critical: alerts.filter(
        (alert) =>
          alert.priority === "critical"
      ).length,

      review: alerts.filter(
        (alert) =>
          alert.priority === "review"
      ).length,

      followUp: alerts.filter(
        (alert) =>
          alert.priority === "follow-up"
      ).length,

      total: alerts.length,
    };

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      summary,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error(
      "Get doctor alerts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while generating doctor alerts.",
    });
  }
};

// =====================================================
// DOCTOR: CREATE MANUAL ALERT
// =====================================================

const createManualDoctorAlert = async (req, res) => {
  try {
    if (!requireDoctor(req)) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create patient alerts.",
      });
    }

    const doctorUserId = req.user.userId;
    const { patientUserId, title, message, priority } = req.body || {};

    const patientId = Number(patientUserId);
    const cleanTitle = String(title || "").trim();
    const cleanMessage = String(message || "").trim();
    const cleanPriority = String(priority || "review")
      .trim()
      .toLowerCase();

    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid patient.",
      });
    }

    if (!cleanTitle || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Alert title and message are required.",
      });
    }

    if (cleanTitle.length > 200 || cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Title or message is too long.",
      });
    }

    const allowedPriorities = ["critical", "review", "follow-up"];

    if (!allowedPriorities.includes(cleanPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert priority.",
      });
    }

    // Confirm that the patient is connected to this doctor.
    const [connections] = await pool.query(
      `
      SELECT id
      FROM doctor_patient_connections
      WHERE doctor_user_id = ?
        AND patient_user_id = ?
        AND status = 'accepted'
      LIMIT 1
      `,
      [doctorUserId, patientId]
    );

    if (!connections.length) {
      return res.status(403).json({
        success: false,
        message: "You do not have an accepted connection with this patient.",
      });
    }

    const connectionId = connections[0].id;

    const [result] = await pool.query(
      `
      INSERT INTO doctor_patient_alerts (
        connection_id,
        doctor_user_id,
        patient_user_id,
        title,
        message,
        priority
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        connectionId,
        doctorUserId,
        patientId,
        cleanTitle,
        cleanMessage,
        cleanPriority,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Manual patient alert created successfully.",
      alert: {
        id: result.insertId,
        patientUserId: patientId,
        title: cleanTitle,
        message: cleanMessage,
        priority: cleanPriority,
        createdAt: new Date().toISOString(),
        source: "doctor",
      },
    });
  } catch (error) {
    console.error("Create manual doctor alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create the manual alert.",
    });
  }
};


// =====================================================
// PATIENT: GET MANUAL DOCTOR ALERTS
// =====================================================

const getPatientDoctorAlerts = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access their doctor alerts.",
      });
    }

    const patientUserId = req.user.userId;

    const [alerts] = await pool.query(
      `
      SELECT
        a.id,
        a.title,
        a.message,
        a.priority,
        a.created_at,
        a.updated_at,
        u.full_name AS doctor_name
      FROM doctor_patient_alerts a
      INNER JOIN users u
        ON u.id = a.doctor_user_id
      INNER JOIN doctor_patient_connections c
        ON c.id = a.connection_id
      WHERE a.patient_user_id = ?
        AND c.status = 'accepted'
      ORDER BY
        CASE a.priority
          WHEN 'critical' THEN 1
          WHEN 'review' THEN 2
          WHEN 'follow-up' THEN 3
          ELSE 4
        END,
        a.created_at DESC
      `,
      [patientUserId]
    );

    return res.status(200).json({
      success: true,
      alerts: alerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        doctorName: alert.doctor_name,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
        source: "doctor",
      })),
    });
  } catch (error) {
    console.error("Get patient doctor alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load doctor alerts.",
    });
  }
};


const getDoctorManualAlerts = async (req, res) => {
  try {
    if (!requireDoctor(req)) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access their manual alerts.",
      });
    }

    const doctorUserId = req.user.userId;

    const [alerts] = await pool.query(
      `
      SELECT
        a.id,
        a.patient_user_id,
        p.full_name AS patient_name,
        a.title,
        a.message,
        a.priority,
        a.created_at,
        a.updated_at
      FROM doctor_patient_alerts a
      INNER JOIN users p
        ON p.id = a.patient_user_id
      INNER JOIN doctor_patient_connections c
        ON c.id = a.connection_id
      WHERE a.doctor_user_id = ?
        AND c.status = 'accepted'
      ORDER BY a.created_at DESC
      `,
      [doctorUserId]
    );

    return res.status(200).json({
      success: true,
      alerts: alerts.map((alert) => ({
        id: alert.id,
        patientUserId: alert.patient_user_id,
        patientName: alert.patient_name,
        title: alert.title,
        message: alert.message,
        priority: alert.priority,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
        source: "doctor",
      })),
    });
  } catch (error) {
    console.error("Get doctor manual alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load manually added alerts.",
    });
  }
};


module.exports = {
  getDoctorAlerts,
  createManualDoctorAlert,
  getPatientDoctorAlerts,
  getDoctorManualAlerts,
};