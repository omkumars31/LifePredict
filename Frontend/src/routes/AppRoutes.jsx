import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =========================================================
// LANDING
// =========================================================

import LandingPage from "../pages/Landing/LandingPage";

// =========================================================
// AUTH
// =========================================================

import LoginPage from "../pages/Auth/LoginPage";
import SignupPage from "../pages/Auth/SignupPage";
import VerifyEmailPage from "../pages/Auth/VerifyEmailPage";
import VerifyEmailSentPage from "../pages/Auth/VerifyEmailSentPage";
import ForgotPasswordPage from "../pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/Auth/ResetPasswordPage";

// =========================================================
// PROTECTION
// =========================================================

import ProtectedRoute from "../components/common/ProtectedRoute";

// =========================================================
// PATIENT PAGES
// =========================================================

import PatientDashboard from "../pages/Patient/PatientDashboard";
import PatientHealthData from "../pages/Patient/PatientHealthData";
import PatientPredictions from "../pages/Patient/PatientPredictions";
import PatientPredictionHistory from "../pages/Patient/PatientPredictionHistory";
import Profile from "../pages/Patient/Profile";
import WhatIfSimulation from "../pages/Patient/WhatIfSimulation";
import AlertsInsights from "../pages/Patient/AlertsInsights";
import NutritionMeals from "../pages/Patient/NutritionMeals";

// =========================================================
// PATIENT LAYOUT
// =========================================================

import PatientLayout from "../layouts/PatientLayout";

// =========================================================
// DOCTOR PAGES
// =========================================================

import DoctorDashboard from "../pages/Doctor/DoctorDashboard";
import MyPatients from "../pages/Doctor/MyPatients";
import DoctorPatientDetails from "../pages/Doctor/DoctorPatientDetails";
import DoctorConsultations from "../pages/Doctor/DoctorConsultations";
import DoctorConsultationDetail from "../pages/Doctor/DoctorConsultationDetail";
import DoctorAlerts from "../pages/Doctor/DoctorAlerts";
import DoctorProfile from "../pages/Doctor/DoctorProfile";

// =========================================================
// DOCTOR LAYOUT
// =========================================================

import DoctorLayout from "../layouts/DoctorLayout";

// =========================================================
// APP ROUTES
// =========================================================

function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            PUBLIC ROUTES
        ================================================= */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/verify-email-sent"
          element={<VerifyEmailSentPage />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmailPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* =================================================
            PATIENT PROTECTED ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute allowedRole="patient" />
          }
        >

          <Route element={<PatientLayout />}>

            {/* ---------------------------------------------
                Patient Dashboard
            --------------------------------------------- */}

            <Route
              path="/patient/dashboard"
              element={<PatientDashboard />}
            />

            {/* ---------------------------------------------
                Health Data
            --------------------------------------------- */}

            <Route
              path="/patient/health-data"
              element={<PatientHealthData />}
            />

            {/* ---------------------------------------------
                Nutrition & Meals
            --------------------------------------------- */}

            <Route
              path="/patient/nutrition"
              element={<NutritionMeals />}
            />

            {/* ---------------------------------------------
                Predictions
            --------------------------------------------- */}

            <Route
              path="/patient/predictions"
              element={<PatientPredictions />}
            />

            {/* ---------------------------------------------
                Prediction History
            --------------------------------------------- */}

            <Route
              path="/patient/prediction-history"
              element={<PatientPredictionHistory />}
            />

            {/* ---------------------------------------------
                What-if Simulation
            --------------------------------------------- */}

            <Route
              path="/patient/what-if"
              element={<WhatIfSimulation />}
            />

            {/* ---------------------------------------------
                Alerts & Insights
            --------------------------------------------- */}

            <Route
              path="/patient/alerts"
              element={<AlertsInsights />}
            />

            {/* ---------------------------------------------
                Patient Profile
            --------------------------------------------- */}

            <Route
              path="/patient/profile"
              element={<Profile />}
            />

          </Route>

        </Route>

        {/* =================================================
            DOCTOR PROTECTED ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute allowedRole="doctor" />
          }
        >

          {/* =================================================
              DOCTOR LAYOUT
          ================================================= */}

          <Route element={<DoctorLayout />}>

            {/* ---------------------------------------------
                Doctor Dashboard
            --------------------------------------------- */}

            <Route
              path="/doctor/dashboard"
              element={<DoctorDashboard />}
            />

            {/* ---------------------------------------------
                My Patients
            --------------------------------------------- */}

            <Route
              path="/doctor/patients"
              element={<MyPatients />}
            />

            {/* ---------------------------------------------
                Patient Details
            --------------------------------------------- */}

            <Route
              path="/doctor/patients/:patientId"
              element={<DoctorPatientDetails />}
            />

            {/* ---------------------------------------------
                Doctor Consultations
            --------------------------------------------- */}

            <Route
              path="/doctor/consultations"
              element={<DoctorConsultations />}
            />

            {/* ---------------------------------------------
                Consultation Detail
            --------------------------------------------- */}

            <Route
              path="/doctor/consultations/:consultationId"
              element={<DoctorConsultationDetail />}
            />

            {/* ---------------------------------------------
                Doctor Alerts
            --------------------------------------------- */}

            <Route
              path="/doctor/alerts"
              element={<DoctorAlerts />}
            />

            {/* ---------------------------------------------
                Doctor Profile
            --------------------------------------------- */}

            <Route
              path="/doctor/profile"
              element={<DoctorProfile />}
            />

          </Route>

        </Route>

        {/* =================================================
            UNKNOWN ROUTES
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default AppRoutes;