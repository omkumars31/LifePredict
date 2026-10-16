const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ==========================================
// DATABASE TABLE INITIALIZER
// ==========================================

const {
  createDoctorPatientTables,
} = require("../Database/doctorPatientTables");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const doctorProfileRoutes = require("./routes/doctorProfileRoutes");
const healthRoutes = require("./routes/healthRoutes");
const healthRecordRoutes = require("./routes/healthRecordRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const alertsRoutes = require("./routes/alertsRoutes");
const doctorPatientRoutes = require("./routes/doctorPatientRoutes");

// ==========================================
// NUTRITION SERVICE
// ==========================================

const {
  loadNutritionData,
} = require("./utils/nutritionService");

// ==========================================
// APP
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/profile", profileRoutes);

app.use(
  "/api/doctor-profile",
  doctorProfileRoutes
);

app.use("/api/health", healthRoutes);

app.use(
  "/api/health-records",
  healthRecordRoutes
);

app.use(
  "/api/predictions",
  predictionRoutes
);

app.use(
  "/api/nutrition",
  nutritionRoutes
);

app.use(
  "/api/connections",
  connectionRoutes
);

app.use(
  "/api/alerts",
  alertsRoutes
);

app.use(
  "/api/doctor",
  doctorPatientRoutes
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "LifePredict Backend is running.",
  });
});

// ==========================================
// START SERVER
// ==========================================

async function startServer() {
  try {
    console.log(
      "Starting LifePredict Backend..."
    );

    // Load nutrition dataset
    await loadNutritionData();

    // Create doctor-patient feature tables
    await createDoctorPatientTables();

    // Start server
    app.listen(PORT, () => {
      console.log(
        `LifePredict Backend running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start LifePredict Backend:"
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();