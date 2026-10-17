import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import "./AuthPage.css";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showResendVerification, setShowResendVerification] =
    useState(false);

  const [resendingVerification, setResendingVerification] =
    useState(false);


  // =========================================
  // HANDLE INPUT CHANGE
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
    setShowResendVerification(false);
  };


  // =========================================
  // LOGIN
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setShowResendVerification(false);

    // Basic frontend validation
    if (
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setErrorMessage(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();


      // =========================================
      // LOGIN ERROR
      // =========================================

      if (!response.ok || !data.success) {

        setErrorMessage(
          data.message ||
            "Unable to login. Please try again."
        );


        // Unverified account
        if (
          response.status === 403 &&
          data.message ===
            "Please verify your email before logging in."
        ) {
          setShowResendVerification(true);
        }

        return;
      }


      // =========================================
      // STORE JWT
      // =========================================

      localStorage.setItem(
        "token",
        data.token
      );


      // =========================================
      // STORE USER
      // =========================================

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );


      console.log("Login successful:", {
        user: data.user,
      });


      // =========================================
      // LOGIN SUCCESS
      // =========================================

      setSuccessMessage(
        `Login successful. Welcome, ${data.user.fullName}!`
      );


      // =========================================
      // ROLE-BASED DASHBOARD
      // =========================================

      setTimeout(() => {

        if (data.user.role === "patient") {

          navigate(
            "/patient/dashboard",
            { replace: true }
          );

        } else if (data.user.role === "doctor") {

          navigate(
            "/doctor/dashboard",
            { replace: true }
          );

        }

      }, 700);

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      setErrorMessage(
        "Unable to connect to the server. Please make sure the backend is running."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================
  // RESEND VERIFICATION EMAIL
  // =========================================

  const handleResendVerification = async () => {

    if (!formData.email.trim()) {

      setErrorMessage(
        "Please enter your email address first."
      );

      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {

      setResendingVerification(true);

      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/auth/resend-verification",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: formData.email,
          }),
        }
      );

      const data = await response.json();


      if (!response.ok || !data.success) {

        setErrorMessage(
          data.message ||
            "Unable to resend verification email."
        );

        return;
      }


      // Already verified
      if (data.alreadyVerified) {

        setSuccessMessage(
          "Your email is already verified. You can login now."
        );

        setShowResendVerification(false);

        return;
      }


      // Resend successful
      setSuccessMessage(
        "A new verification email has been sent. Please check your inbox."
      );

      setShowResendVerification(false);

    } catch (error) {

      console.error(
        "Resend verification error:",
        error
      );

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );

    } finally {

      setResendingVerification(false);

    }
  };


  return (
    <div className="auth-page">


      {/* =========================================
          LEFT SIDE - BRAND
      ========================================= */}

      <section className="auth-brand">

        <div className="auth-brand-content">

          <Link
            to="/"
            className="auth-logo"
          >

            <div className="auth-logo-icon">

              <HeartPulse size={22} />

            </div>

            <span>
              LifePredict
            </span>

          </Link>


          <div className="auth-brand-text">

            <span className="auth-eyebrow">
              AI-POWERED HEALTH INTELLIGENCE
            </span>


            <h1>

              Understand your health.

              <span>
                Improve your future.
              </span>

            </h1>


            <p>
              Continue your health journey with
              personalized insights powered by your
              lifestyle and health data.
            </p>

          </div>


          <div className="auth-trust">

            <ShieldCheck size={18} />

            <span>
              Your health journey, designed around you.
            </span>

          </div>

        </div>


        <div className="auth-brand-decoration">

          <div className="auth-circle auth-circle-one"></div>

          <div className="auth-circle auth-circle-two"></div>

        </div>

      </section>


      {/* =========================================
          RIGHT SIDE - LOGIN FORM
      ========================================= */}

      <section className="auth-form-section">

        <div className="auth-form-wrapper">


          {/* Mobile Logo */}

          <div className="mobile-auth-logo">

            <Link
              to="/"
              className="auth-logo"
            >

              <div className="auth-logo-icon">

                <HeartPulse size={20} />

              </div>

              <span>
                LifePredict
              </span>

            </Link>

          </div>


          {/* Heading */}

          <div className="auth-heading">

            <span>
              WELCOME BACK
            </span>

            <h2>
              Welcome back.
            </h2>

            <p>
              Login to continue to your LifePredict account.
            </p>

          </div>


          {/* =====================================
              FORM
          ===================================== */}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >


            {/* Email */}

            <div className="form-field">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />

            </div>


            {/* Password */}

            <div className="form-field">

              <div className="field-label-row">

                <label htmlFor="password">
                  Password
                </label>


                <Link
                  to="/forgot-password"
                  className="forgot-password"
                >
                  Forgot password?
                </Link>

              </div>


              <div className="password-input-wrapper">

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>


            {/* =====================================
                ERROR MESSAGE
            ===================================== */}

            {errorMessage && (

              <div className="auth-message auth-error">

                {errorMessage}

              </div>

            )}


            {/* =====================================
                RESEND VERIFICATION
            ===================================== */}

            {showResendVerification && (

              <button
                type="button"
                className="auth-submit verify-login-button"
                disabled={resendingVerification}
                onClick={handleResendVerification}
              >

                <span>

                  {resendingVerification
                    ? "Sending..."
                    : "Resend Verification Email"}

                </span>


                {!resendingVerification && (
                  <RefreshCw size={18} />
                )}

              </button>

            )}


            {/* =====================================
                SUCCESS MESSAGE
            ===================================== */}

            {successMessage && (

              <div className="auth-message auth-success">

                {successMessage}

              </div>

            )}


            {/* =====================================
                LOGIN BUTTON
            ===================================== */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              <span>

                {loading
                  ? "Logging in..."
                  : "Login"}

              </span>


              {!loading && (
                <ArrowRight size={18} />
              )}

            </button>

          </form>


          {/* Divider */}

          <div className="auth-divider">

            <span>
              or
            </span>

          </div>


          {/* Signup */}

          <p className="auth-switch">

            Don't have an account?

            <Link to="/signup">
              Create an account
            </Link>

          </p>


          {/* Back */}

          <Link
            to="/"
            className="back-home"
          >
            ← Back to LifePredict
          </Link>

        </div>

      </section>

    </div>
  );
}

export default LoginPage;