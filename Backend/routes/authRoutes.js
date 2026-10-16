const express = require("express");

const {
  signup,
  verifyEmail,
  resendVerificationEmail,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// Signup
router.post("/signup", signup);

// Email verification
router.get("/verify-email", verifyEmail);

// Resend verification email
router.post(
  "/resend-verification",
  resendVerificationEmail
);

// Login
router.post("/login", login);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

module.exports = router;