const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");


// =========================================================
// SIGNUP
// =========================================================

const signup = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // 1. Check required fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    // 2. Clean input
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();

    // 3. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // 4. Validate role
    if (!["patient", "doctor"].includes(cleanRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account role.",
      });
    }

    // 5. Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // 6. Check whether email already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this email address.",
      });
    }

    // 7. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 8. Generate email verification token
    const verificationToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Token valid for 24 hours
    const verificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // ---------------------------------------------------------
    // 9. Create user
    // ---------------------------------------------------------

    const [result] = await pool.query(
      `INSERT INTO users
      (
        full_name,
        email,
        password_hash,
        role,
        email_verified,
        verification_token,
        verification_expires
      )
      VALUES (?, ?, ?, ?, FALSE, ?, ?)`,
      [
        cleanName,
        cleanEmail,
        passwordHash,
        cleanRole,
        verificationToken,
        verificationExpires,
      ]
    );

    const userId = result.insertId;

    // ---------------------------------------------------------
    // 10. Generate role-specific profile
    // ---------------------------------------------------------

    let doctorId = null;

    if (cleanRole === "doctor") {
      // Public LifePredict Doctor ID
      doctorId = `LP-D-${String(userId).padStart(6, "0")}`;

      await pool.query(
        `INSERT INTO doctor_profiles (
          user_id,
          doctor_id
        )
        VALUES (?, ?)`,
        [userId, doctorId]
      );
    }

    // ---------------------------------------------------------
    // 11. Send verification email
    // ---------------------------------------------------------

    await sendVerificationEmail({
      email: cleanEmail,
      fullName: cleanName,
      verificationToken,
    });

    // ---------------------------------------------------------
    // 12. Success response
    // ---------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      userId,
      role: cleanRole,

      // Only doctors receive a Doctor ID
      ...(cleanRole === "doctor" && {
        doctorId,
      }),
    });

  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating your account.",
    });
  }
};


// =========================================================
// VERIFY EMAIL
// =========================================================

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // 1. Check whether token exists
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is missing.",
      });
    }

    // 2. Find user with matching token
    const [users] = await pool.query(
      `SELECT
        id,
        email_verified,
        verification_expires
       FROM users
       WHERE verification_token = ?
       LIMIT 1`,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    const user = users[0];

    // 3. Check whether already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified.",
      });
    }

    // 4. Check token expiry
    if (
      !user.verification_expires ||
      new Date() > new Date(user.verification_expires)
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification link has expired.",
      });
    }

    // 5. Mark email as verified
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_expires = NULL
       WHERE id = ?`,
      [user.id]
    );

    // 6. Success
    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });

  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying your email.",
    });
  }
};


// =========================================================
// RESEND VERIFICATION EMAIL
// =========================================================

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        email_verified
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail]
    );

    // Don't reveal whether account exists
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification email has been sent.",
      });
    }

    const user = users[0];

    // Already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: "This email is already verified.",
      });
    }

    // Generate new verification token
    const verificationToken = crypto
      .randomBytes(32)
      .toString("hex");

    // New token valid for 24 hours
    const verificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // Replace old token
    await pool.query(
      `UPDATE users
       SET verification_token = ?,
           verification_expires = ?
       WHERE id = ?`,
      [
        verificationToken,
        verificationExpires,
        user.id,
      ]
    );

    // Send new verification email
    await sendVerificationEmail({
      email: user.email,
      fullName: user.full_name,
      verificationToken,
    });

    return res.status(200).json({
      success: true,
      message: "A new verification email has been sent.",
    });

  } catch (error) {
    console.error(
      "Resend verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while resending the verification email.",
    });
  }
};


// =========================================================
// FORGOT PASSWORD
// =========================================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        email_verified
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail]
    );

    /*
      Always return the same message whether
      the email exists or not.
    */
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const user = users[0];

    /*
      Password reset should only be available
      for verified accounts.
    */
    if (!user.email_verified) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate secure random token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Hash token before storing it
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token valid for 1 hour
    const resetExpires = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await pool.query(
      `UPDATE users
       SET reset_password_token_hash = ?,
           reset_password_expires = ?
       WHERE id = ?`,
      [
        resetTokenHash,
        resetExpires,
        user.id,
      ]
    );

    await sendPasswordResetEmail({
      email: user.email,
      fullName: user.full_name,
      resetToken,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while processing your request.",
    });
  }
};


// =========================================================
// RESET PASSWORD
// =========================================================

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Hash token received from email
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user using hashed token
    const [users] = await pool.query(
      `SELECT
        id,
        email,
        reset_password_expires
       FROM users
       WHERE reset_password_token_hash = ?
       LIMIT 1`,
      [resetTokenHash]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link.",
      });
    }

    const user = users[0];

    // Check expiration
    if (
      !user.reset_password_expires ||
      new Date() > new Date(user.reset_password_expires)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link.",
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(
      newPassword,
      12
    );

    // Update password and invalidate reset token
    await pool.query(
      `UPDATE users
       SET password_hash = ?,
           reset_password_token_hash = NULL,
           reset_password_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        passwordHash,
        user.id,
      ]
    );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in.",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while resetting your password.",
    });
  }
};


// =========================================================
// LOGIN
// =========================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // 2. Clean email
    const cleanEmail = email.trim().toLowerCase();

    // 3. Find user
    const [users] = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        email_verified
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail]
    );

    // 4. Generic error for invalid credentials
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    // 5. Check email verification
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // 6. Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ---------------------------------------------------------
    // 7. Get Doctor ID if this is a doctor account
    // ---------------------------------------------------------

    let doctorId = null;

    if (user.role === "doctor") {
      const [doctorProfiles] = await pool.query(
        `SELECT doctor_id
         FROM doctor_profiles
         WHERE user_id = ?
         LIMIT 1`,
        [user.id]
      );

      if (doctorProfiles.length > 0) {
        doctorId = doctorProfiles[0].doctor_id;
      }
    }

    // ---------------------------------------------------------
    // 8. Generate JWT
    // ---------------------------------------------------------

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    // ---------------------------------------------------------
    // 9. Login success
    // ---------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,

      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,

        // Doctor gets Doctor ID
        ...(user.role === "doctor" && {
          doctorId,
        }),
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  signup,
  verifyEmail,
  resendVerificationEmail,
  login,
  forgotPassword,
  resetPassword,
};