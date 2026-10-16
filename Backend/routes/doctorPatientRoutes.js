const express = require("express");

const {
  getDoctorPatient,

  // ==========================================
  // REVIEWS
  // ==========================================

  createDoctorReview,
  getDoctorReviews,
  updateDoctorReview,

  // ==========================================
  // CONSULTATIONS
  // ==========================================

  createConsultation,
  getConsultations,
  updateConsultation,
  cancelConsultation,
} = require("../controllers/doctorPatientController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// DOCTOR: GET ONE CONNECTED PATIENT
// =====================================================

router.get(
  "/patients/:patientId",
  authMiddleware,
  getDoctorPatient
);

// =====================================================
// DOCTOR: REVIEWS
// =====================================================

// Get review history
router.get(
  "/patients/:patientId/reviews",
  authMiddleware,
  getDoctorReviews
);

// Create review
router.post(
  "/patients/:patientId/reviews",
  authMiddleware,
  createDoctorReview
);

// Update review
router.patch(
  "/patients/:patientId/reviews/:reviewId",
  authMiddleware,
  updateDoctorReview
);

// =====================================================
// DOCTOR: CONSULTATIONS
// =====================================================

// Get consultations
router.get(
  "/patients/:patientId/consultations",
  authMiddleware,
  getConsultations
);

// Schedule consultation
router.post(
  "/patients/:patientId/consultations",
  authMiddleware,
  createConsultation
);

// Reschedule / edit consultation
router.patch(
  "/patients/:patientId/consultations/:consultationId",
  authMiddleware,
  updateConsultation
);

// Cancel consultation
router.delete(
  "/patients/:patientId/consultations/:consultationId",
  authMiddleware,
  cancelConsultation
);

module.exports = router;