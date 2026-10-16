import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HeartPulse,
  Mail,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import "./AuthPage.css";

function VerifyEmailSentPage() {
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";

  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // Listen for email verification from another browser tab
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "lifepredict_email_verified") {
        setVerified(true);
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  // Resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      setResendError("Email address is missing.");
      return;
    }

    setResendMessage("");
    setResendError("");

    try {
      setResending(true);

      const response = await fetch(
        "http://localhost:5001/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setResendError(
          data.message ||
            "Unable to resend verification email."
        );
        return;
      }

      // Account was already verified
      if (data.alreadyVerified) {
        setResendMessage(
          "Your email is already verified. You can continue to login."
        );

        setVerified(true);
        return;
      }

      setResendMessage(
        "A new verification email has been sent. Please check your inbox."
      );
    } catch (error) {
      console.error(
        "Resend verification error:",
        error
      );

      setResendError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">

      {/* =========================================
          LEFT SIDE - BRAND
      ========================================= */}

      <section className="auth-brand">

        <div className="auth-brand-content">

          <Link to="/" className="auth-logo">

            <div className="auth-logo-icon">
              <HeartPulse size={22} />
            </div>

            <span>
              LifePredict
            </span>

          </Link>


          <div className="auth-brand-text">

            <span className="auth-eyebrow">
              {verified
                ? "EMAIL VERIFIED"
                : "ALMOST THERE"}
            </span>


            <h1>

              {verified ? (
                <>
                  Your email is
                  <span> verified.</span>
                </>
              ) : (
                <>
                  One small step
                  <span> toward better health.</span>
                </>
              )}

            </h1>


            <p>

              {verified
                ? "Your LifePredict account is now ready. Continue to login and begin your health journey."
                : "Verify your email address to secure your LifePredict account and continue your journey."}

            </p>

          </div>

        </div>


        {/* Decorative circles */}

        <div className="auth-brand-decoration">

          <div className="auth-circle auth-circle-one"></div>

          <div className="auth-circle auth-circle-two"></div>

        </div>

      </section>


      {/* =========================================
          RIGHT SIDE
      ========================================= */}

      <section className="auth-form-section">

        <div className="auth-form-wrapper verify-email-wrapper">


          {/* Mobile Logo */}

          <div className="mobile-auth-logo">

            <Link to="/" className="auth-logo">

              <div className="auth-logo-icon">
                <HeartPulse size={20} />
              </div>

              <span>
                LifePredict
              </span>

            </Link>

          </div>


          {!verified ? (

            /* =====================================
               WAITING FOR EMAIL VERIFICATION
            ===================================== */

            <div className="verify-status">

              <div className="verify-icon loading">
                <Mail size={38} />
              </div>


              <div className="auth-heading">

                <span>
                  VERIFY YOUR EMAIL
                </span>

                <h2>
                  Check your inbox.
                </h2>

                <p>
                  We've sent a verification link to your
                  email address. Open the email and click
                  <strong> "Verify My Email"</strong> to
                  activate your LifePredict account.
                </p>

                {email && (
                  <div className="verify-email-address">
                    {email}
                  </div>
                )}

              </div>


              <div className="auth-message auth-success">

                <Mail size={17} />

                <span>
                  The verification link will expire in
                  24 hours. Please also check your spam
                  or promotions folder.
                </span>

              </div>


              {/* Resend Verification */}

              <button
                type="button"
                className="auth-submit verify-login-button"
                onClick={handleResendVerification}
                disabled={resending}
              >

                <span>
                  {resending
                    ? "Sending..."
                    : "Resend Verification Email"}
                </span>

                {!resending && (
                  <RefreshCw size={18} />
                )}

              </button>


              {/* Resend Success */}

              {resendMessage && (
                <div className="auth-message auth-success">

                  <CheckCircle2 size={17} />

                  <span>
                    {resendMessage}
                  </span>

                </div>
              )}


              {/* Resend Error */}

              {resendError && (
                <div className="auth-message auth-error">

                  <span>
                    {resendError}
                  </span>

                </div>
              )}


              <p className="verify-wait-text">
                This page will automatically update after
                you verify your email.
              </p>

            </div>

          ) : (

            /* =====================================
               EMAIL VERIFIED
            ===================================== */

            <div className="verify-status">

              <div className="verify-icon success">

                <CheckCircle2 size={40} />

              </div>


              <div className="auth-heading">

                <span>
                  EMAIL VERIFIED
                </span>

                <h2>
                  You're all set.
                </h2>

                <p>
                  Your email has been successfully verified.
                  Your LifePredict account is ready to use.
                </p>

              </div>


              <Link
                to="/login"
                className="auth-submit verify-login-button"
              >

                <span>
                  Continue to Login
                </span>

                <ArrowRight size={18} />

              </Link>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default VerifyEmailSentPage;