
const express = require("express");

const {
  getDoctorById,
  sendConnectionRequest,
  getPatientConnection,
  getPatientReviewHistory,
  getDoctorRequests,
  respondToConnectionRequest,
  getDoctorPatients,
  markPatientReviewed,
  getPatientsReviewedToday,
} = require("../controllers/connectionController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// PATIENT ROUTES

// Search doctor using LifePredict Doctor ID
router.get("/doctor/:doctorId", authMiddleware, getDoctorById);

// Send connection request
router.post("/request", authMiddleware, sendConnectionRequest);

// Get patient's current doctor connection and latest review
router.get("/patient", authMiddleware, getPatientConnection);

// Get patient's recent or complete doctor review history
router.get("/patient/reviews", authMiddleware, getPatientReviewHistory);

// DOCTOR ROUTES

// Get pending patient requests
router.get("/requests", authMiddleware, getDoctorRequests);

// Accept or reject a connection request
router.patch(
  "/requests/:connectionId",
  authMiddleware,
  respondToConnectionRequest
);

// Get accepted patients
router.get("/patients", authMiddleware, getDoctorPatients);

// Mark an accepted patient as reviewed
router.patch(
  "/patients/:patientUserId/reviewed",
  authMiddleware,
  markPatientReviewed
);

router.get(
  "/patients/reviewed-today",
  authMiddleware,
  getPatientsReviewedToday
);

module.exports = router;
