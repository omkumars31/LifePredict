const express = require("express");

const {
  getDoctorProfile,
  saveDoctorProfile,
} = require("../controllers/doctorProfileController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getDoctorProfile);

router.post("/", authMiddleware, saveDoctorProfile);

module.exports = router;