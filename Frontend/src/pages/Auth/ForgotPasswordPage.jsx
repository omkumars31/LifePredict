import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import "./AuthPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5001/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to process your request."
        );
        return;
      }

      setSubmitted(true);

    } catch (error) {
      console.error("Forgot password error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Left Side */}
      <section className="auth-brand">

        <div className="auth-brand-content">

          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">
              <HeartPulse size={22} />
            </div>

            <span>LifePredict</span>
          </Link>

          <div className="auth-brand-text">

            <span className="auth-eyebrow">
              ACCOUNT RECOVERY
            </span>

            <h1>
              Get back to
              <span> your health journey.</span>
            </h1>

            <p>
              Reset your password securely and continue using
              your LifePredict account.
            </p>

          </div>

        </div>

        <div className="auth-brand-decoration">
          <div className="auth-circle auth-circle-one"></div>
          <div className="auth-circle auth-circle-two"></div>
        </div>

      </section>


      {/* Right Side */}
      <section className="auth-form-section">

        <div className="auth-form-wrapper forgot-password-wrapper">

          <div className="mobile-auth-logo">

            <Link to="/" className="auth-logo">

              <div className="auth-logo-icon">
                <HeartPulse size={20} />
              </div>

              <span>LifePredict</span>

            </Link>

          </div>


          {!submitted ? (
            <>
              <div className="auth-heading">

                <span>RESET YOUR PASSWORD</span>

                <h2>Forgot your password?</h2>

                <p>
                  Enter the email address associated with your
                  LifePredict account and we'll send you a reset link.
                </p>

              </div>


              <form
                className="auth-form forgot-password-form"
                onSubmit={handleSubmit}
              >

                <div className="form-field">

                  <label htmlFor="email">
                    Email
                  </label>

                  <div className="forgot-email-input-wrapper">

                    <Mail
                      size={18}
                      className="forgot-email-icon"
                    />

                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      autoComplete="email"
                    />

                  </div>

                  {error && (
                    <p className="auth-error-message">
                      {error}
                    </p>
                  )}

                </div>


                <button
                  type="submit"
                  className="auth-submit forgot-submit-button"
                  disabled={loading}
                >

                  <span>
                    {loading
                      ? "Sending..."
                      : "Send Reset Link"}
                  </span>

                  {!loading && (
                    <ArrowRight size={18} />
                  )}

                </button>

              </form>
            </>
          ) : (
            <div className="verify-status">

              <div className="verify-icon success">
                <CheckCircle2 size={38} />
              </div>

              <div className="auth-heading">

                <span>CHECK YOUR EMAIL</span>

                <h2>Reset link sent.</h2>

                <p>
                  If an account exists with this email,
                  we've sent instructions to reset your password.
                </p>

              </div>

            </div>
          )}


          <Link
            to="/login"
            className="forgot-back-login"
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>

        </div>

      </section>

    </div>
  );
}

export default ForgotPasswordPage;