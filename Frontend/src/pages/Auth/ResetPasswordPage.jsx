import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import "./AuthPage.css";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5001/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to reset your password."
        );
        return;
      }

      setSuccess(true);

    } catch (error) {
      console.error("Reset password error:", error);

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
              ACCOUNT SECURITY
            </span>

            <h1>
              Create a new
              <span> password.</span>
            </h1>

            <p>
              Choose a strong password to secure your
              LifePredict account.
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

        <div className="auth-form-wrapper reset-password-wrapper">

          <div className="mobile-auth-logo">

            <Link to="/" className="auth-logo">

              <div className="auth-logo-icon">
                <HeartPulse size={20} />
              </div>

              <span>LifePredict</span>

            </Link>

          </div>


          {!success ? (
            <>
              <div className="auth-heading">

                <span>CREATE NEW PASSWORD</span>

                <h2>Reset your password.</h2>

                <p>
                  Enter a new password for your
                  LifePredict account.
                </p>

              </div>


              <form
                className="auth-form reset-password-form"
                onSubmit={handleSubmit}
              >

                <div className="form-field">

                  <label htmlFor="new-password">
                    New Password
                  </label>

                  <div className="password-input-wrapper">

                    <LockKeyhole
                      size={17}
                      className="reset-password-icon"
                    />

                    <input
                      id="new-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      autoComplete="new-password"
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


                <div className="form-field">

                  <label htmlFor="confirm-password">
                    Confirm Password
                  </label>

                  <div className="password-input-wrapper">

                    <LockKeyhole
                      size={17}
                      className="reset-password-icon"
                    />

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                </div>


                {error && (
                  <p className="auth-error-message">
                    {error}
                  </p>
                )}


                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >

                  <span>
                    {loading
                      ? "Updating..."
                      : "Update Password"}
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

                <span>PASSWORD UPDATED</span>

                <h2>You’re all set.</h2>

                <p>
                  Your password has been reset successfully.
                  You can now log in with your new password.
                </p>

              </div>

              <button
                type="button"
                className="auth-submit"
                onClick={() =>
                  navigate("/login", {
                    replace: true,
                  })
                }
              >
                <span>Continue to Login</span>
                <ArrowRight size={18} />
              </button>

            </div>
          )}


          {!success && (
            <Link
              to="/login"
              className="forgot-back-login"
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          )}

        </div>

      </section>

    </div>
  );
}

export default ResetPasswordPage;