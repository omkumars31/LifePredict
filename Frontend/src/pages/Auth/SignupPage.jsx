import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  UserRound,
  Stethoscope,
  Eye,
  EyeOff,
} from "lucide-react";
import "./AuthPage.css";

function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");


    // =========================================
    // CHECK REQUIRED FIELDS
    // =========================================
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim() ||
      !formData.role
    ) {
      setErrorMessage(
        "Please fill in all required fields."
      );
      return;
    }


    // =========================================
    // PASSWORD LENGTH
    // =========================================
    if (formData.password.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters long."
      );
      return;
    }


    // =========================================
    // PASSWORD NUMBER VALIDATION
    // =========================================
    if (!/\d/.test(formData.password)) {
      setErrorMessage(
        "Password must contain at least one number."
      );
      return;
    }


    // =========================================
    // PASSWORD SPECIAL CHARACTER VALIDATION
    // =========================================
    if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]\\/;'`~+=]/.test(formData.password)) {
      setErrorMessage(
        "Password must contain at least one special character."
      );
      return;
    }


    // =========================================
    // CONFIRM PASSWORD
    // =========================================
    if (
      formData.password !== formData.confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match."
      );
      return;
    }


    // =========================================
    // TERMS & PRIVACY
    // =========================================
    if (!termsAccepted) {
      setErrorMessage(
        "Please agree to the Terms of Use and Privacy Policy to continue."
      );
      return;
    }


    try {

      setLoading(true);

      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
          }),
        }
      );


      const data = await response.json();


      // =========================================
      // BACKEND ERROR
      // =========================================
      if (!response.ok || !data.success) {

        setErrorMessage(
          data.message ||
            "Unable to create your account."
        );

        return;
      }


      /*
        Signup successful.

        Backend has:
        1. Created the account
        2. Hashed the password
        3. Generated verification token
        4. Sent verification email

        So DON'T go to Login yet.

        Go to the "Verify Your Email" page instead.
      */


      // Remove any old verification flag
      localStorage.removeItem(
        "lifepredict_email_verified"
      );


      navigate(
        `/verify-email-sent?email=${encodeURIComponent(
          formData.email.trim()
        )}`
      );


    } catch (error) {

      console.error(
        "Signup error:",
        error
      );

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="auth-page">


      {/* =========================================
          LEFT SIDE - BRAND SECTION
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
              START YOUR HEALTH JOURNEY
            </span>


            <h1>

              Your health

              <span>
                deserves more than numbers.
              </span>

            </h1>


            <p>
              Create your LifePredict account and turn your health and
              lifestyle data into meaningful insights.
            </p>

          </div>


          <div className="auth-trust">

            <ShieldCheck size={18} />

            <span>
              Built to help you understand your everyday health.
            </span>

          </div>

        </div>


        {/* Decorative circles */}

        <div className="auth-brand-decoration">

          <div className="auth-circle auth-circle-one"></div>

          <div className="auth-circle auth-circle-two"></div>

        </div>

      </section>


      {/* =========================================
          RIGHT SIDE - SIGNUP FORM
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
              CREATE YOUR ACCOUNT
            </span>

            <h2>
              Start your journey.
            </h2>

            <p>
              Create your account to begin exploring your health insights.
            </p>

          </div>


          {/* Signup Form */}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >


            {/* Error Message */}

            {errorMessage && (

              <div className="auth-message auth-error">
                {errorMessage}
              </div>

            )}


            {/* =====================================
                FULL NAME
            ===================================== */}

            <div className="form-field">

              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fullName: e.target.value,
                  })
                }
              />

            </div>


            {/* =====================================
                EMAIL
            ===================================== */}

            <div className="form-field">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
              />

            </div>


            {/* =====================================
                PASSWORD
            ===================================== */}

            <div className="form-field">

              <label htmlFor="password">
                Password
              </label>


              <div className="password-input-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}

                </button>

              </div>

            </div>


            {/* =====================================
                CONFIRM PASSWORD
            ===================================== */}

            <div className="form-field">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>


              <div className="password-input-wrapper">

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword:
                        e.target.value,
                    })
                  }
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >

                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}

                </button>

              </div>

            </div>


            {/* =====================================
                ROLE SELECTION
            ===================================== */}

            <div className="form-field">

              <label>
                I am signing up as
              </label>


              <div className="role-options">


                {/* PATIENT */}

                <label className="role-option">

                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={
                      formData.role === "patient"
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value,
                      })
                    }
                  />


                  <div className="role-option-content">

                    <UserRound size={20} />

                    <div>

                      <strong>
                        Patient
                      </strong>

                      <span>
                        Track your health and lifestyle insights
                      </span>

                    </div>

                  </div>

                </label>


                {/* DOCTOR */}

                <label className="role-option">

                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    checked={
                      formData.role === "doctor"
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value,
                      })
                    }
                  />


                  <div className="role-option-content">

                    <Stethoscope size={20} />

                    <div>

                      <strong>
                        Doctor
                      </strong>

                      <span>
                        Monitor and understand patient health insights
                      </span>

                    </div>

                  </div>

                </label>

              </div>

            </div>


            {/* =====================================
                TERMS & PRIVACY
            ===================================== */}

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginTop: "2px",
                marginBottom: "4px",
              }}
            >

              <input
                id="termsAccepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) =>
                  setTermsAccepted(e.target.checked)
                }
                style={{
                  marginTop: "4px",
                  width: "16px",
                  height: "16px",
                  accentColor: "#159b96",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />

              <label
                htmlFor="termsAccepted"
                style={{
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "#55777d",
                  cursor: "pointer",
                }}
              >
                I agree to the Terms of Use and Privacy Policy.
              </label>

            </div>


            {/* CREATE ACCOUNT BUTTON */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              <span>
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
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


          {/* Login */}

          <p className="auth-switch">

            Already have an account?

            <Link to="/login">
              Login
            </Link>

          </p>


          {/* Back Home */}

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

export default SignupPage;