const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    // Extract JWT
    const token = authHeader.split(" ")[1];

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store authenticated user information
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();

  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

module.exports = authMiddleware;