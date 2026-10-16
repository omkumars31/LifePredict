import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HeartPulse,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import "./AuthPage.css";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const verificationStarted = useRef(false);

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");


  useEffect(() => {

    // Prevent duplicate verification requests
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const token = searchParams.get("token");


    // Token missing
    if (!token) {

      setStatus("error");

      setMessage(
        "Verification token is missing."
      );

      return;
    }


    const verifyEmail = async () => {

      try {

        const response = await fetch(
          `http://localhost:5001/api/auth/verify-email?token=${encodeURIComponent(
            token
          )}`
        );


        const data = await response.json();


        if (response.ok && data.success) {

          /*
            IMPORTANT:

            Tell the original
            /verify-email-sent tab that
            verification was successful.
          */

          localStorage.setItem(
            "lifepredict_email_verified",
            Date.now().toString()
          );


          setStatus("success");

          setMessage(
            data.message ||
            "Email verified successfully."
          );

        } else {

          setStatus("error");

          setMessage(
            data.message ||
            "Email verification failed."
          );

        }

      } catch (error) {

        console.error(
          "Email verification error:",
          error
        );

        setStatus("error");

        setMessage(
          "Unable to verify your email right now. Please try again."
        );

      }

    };


    verifyEmail();

  }, [searchParams]);


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
              EMAIL VERIFICATION
            </span>


            <h1>
              One small step
              <span> toward better health.</span>
            </h1>


            <p>
              Verify your email address to secure your
              LifePredict account and continue your journey.
            </p>

          </div>

        </div>


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


          {/* =====================================
              LOADING
          ===================================== */}

          {status === "loading" && (

            <div className="verify-status">

              <div className="verify-icon loading">

                <Loader2
                  size={34}
                  className="verify-spinner"
                />

              </div>


              <div className="auth-heading">

                <span>
                  VERIFYING YOUR EMAIL
                </span>

                <h2>
                  Just a moment.
                </h2>

                <p>
                  We are verifying your email address.
                </p>

              </div>

            </div>

          )}


          {/* =====================================
              SUCCESS
          ===================================== */}

          {status === "success" && (

            <div className="verify-status">

              <div className="verify-icon success">

                <CheckCircle2 size={38} />

              </div>


              <div className="auth-heading">

                <span>
                  EMAIL VERIFIED
                </span>

                <h2>
                  You're all set.
                </h2>

                <p>
                  {message}
                </p>

              </div>


              <p className="verify-wait-text">

                Your email has been verified successfully.
                You can now return to your LifePredict
                signup window to continue.

              </p>

            </div>

          )}


          {/* =====================================
              ERROR
          ===================================== */}

          {status === "error" && (

            <div className="verify-status">

              <div className="verify-icon error">

                <XCircle size={38} />

              </div>


              <div className="auth-heading">

                <span>
                  VERIFICATION FAILED
                </span>

                <h2>
                  We couldn't verify your email.
                </h2>

                <p>
                  {message}
                </p>

              </div>


              <Link
                to="/"
                className="auth-submit verify-login-button"
              >

                <span>
                  Back to LifePredict
                </span>

              </Link>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default VerifyEmailPage;