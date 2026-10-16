const express = require("express");

const {
  getDoctorAlerts,
  createManualDoctorAlert,
  getPatientDoctorAlerts,
  getDoctorManualAlerts,
} = require("../controllers/alertsController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// DOCTOR: GET AUTOMATIC HEALTH ALERTS
// GET /api/alerts
// ==========================================
router.get(
  "/",
  authMiddleware,
  getDoctorAlerts
);

// ==========================================
// DOCTOR: CREATE MANUAL ALERT
// POST /api/alerts/manual
// ==========================================
router.post(
  "/manual",
  authMiddleware,
  createManualDoctorAlert
);

// ==========================================
// PATIENT: GET MANUAL DOCTOR ALERTS
// GET /api/alerts/patient
// ==========================================
router.get(
  "/patient",
  authMiddleware,
  getPatientDoctorAlerts
);

router.get(
  "/manual/doctor",
  authMiddleware,
  getDoctorManualAlerts
);

module.exports = router;