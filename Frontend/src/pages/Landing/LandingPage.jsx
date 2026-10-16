import "./LandingPage.css";
import {
  ArrowRight,
  Activity,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Brain,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";

function LandingPage() {
  return (
    <div className="landing-page">

      {/* =========================
          NAVBAR
      ========================= */}
      <nav className="landing-navbar">
        <a href="/" className="landing-logo">
          <div className="logo-icon">
            <HeartPulse size={22} />
          </div>

          <span>LifePredict</span>
        </a>

        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
        </div>

        <a href="/login" className="nav-login">
          Login
        </a>
      </nav>


      {/* =========================
          HERO SECTION
      ========================= */}
      <section className="hero-section">

        <div className="hero-container">

          {/* LEFT CONTENT */}
          <div className="hero-content">

            <div className="hero-badge">
              <Activity size={16} />
              <span>AI-Powered Health Intelligence</span>
            </div>

            <h1>
              Understand Your Health.
              <span> Predict Your Future.</span>
            </h1>

            <p className="hero-description">
              LifePredict uses lifestyle and health data to help you
              understand your current health profile and discover how
              your everyday choices may influence your future well-being.
            </p>

            <div className="hero-actions">

              <a href="/signup" className="btn-primary">
                Get Started
                <ArrowRight size={18} />
              </a>

              <a href="#about" className="btn-secondary">
                Learn More
              </a>

            </div>

            <div className="hero-trust">
              <ShieldCheck size={18} />
              <span>
                Designed for patients and healthcare professionals
              </span>
            </div>

          </div>


          {/* RIGHT HEALTH PREVIEW */}
          <div className="health-preview-wrapper">

            <div className="hero-glow hero-glow-one"></div>
            <div className="hero-glow hero-glow-two"></div>

            <div className="health-preview">

              <div className="preview-header">

                <div>
                  <span className="preview-label">
                    HEALTH OVERVIEW
                  </span>

                  <h3>Good Health</h3>
                </div>

                <div className="preview-heart">
                  <HeartPulse size={21} />
                </div>

              </div>


              <div className="health-score-area">

                <div className="score-circle">
                  <div className="score-number">78</div>
                  <div className="score-total">/100</div>
                </div>

                <div className="score-info">
                  <span className="score-label">
                    Health Score
                  </span>

                  <p>Based on your lifestyle</p>
                </div>

              </div>


              <div className="health-metrics">

                <div className="metric">
                  <span>Activity</span>
                  <strong>82%</strong>
                </div>

                <div className="metric">
                  <span>Sleep</span>
                  <strong>76%</strong>
                </div>

                <div className="metric">
                  <span>Nutrition</span>
                  <strong>74%</strong>
                </div>

              </div>

            </div>


            {/* AI FLOATING CARD */}
            <div className="floating-card ai-card">

              <div className="floating-icon">
                <Brain size={18} />
              </div>

              <div>
                <span>AI Prediction</span>
                <strong>Health insights generated</strong>
              </div>

            </div>


            {/* DOCTOR FLOATING CARD */}
            <div className="floating-card doctor-card">

              <div className="floating-icon">
                <Stethoscope size={18} />
              </div>

              <div>
                <span>Doctor Connect</span>
                <strong>Share health insights</strong>
              </div>

            </div>

          </div>

        </div>


        {/* SMALL VALUE STRIP */}
        <div className="hero-value-strip">

          <div className="value-item">

            <div className="value-icon">
              <Activity size={17} />
            </div>

            <div>
              <strong>Track</strong>
              <span>Your lifestyle patterns</span>
            </div>

          </div>


          <div className="value-divider"></div>


          <div className="value-item">

            <div className="value-icon">
              <Brain size={17} />
            </div>

            <div>
              <strong>Understand</strong>
              <span>Your health profile</span>
            </div>

          </div>


          <div className="value-divider"></div>


          <div className="value-item">

            <div className="value-icon">
              <TrendingUp size={17} />
            </div>

            <div>
              <strong>Improve</strong>
              <span>Your everyday choices</span>
            </div>

          </div>

        </div>

      </section>


      {/* =========================
          ABOUT
      ========================= */}
      <section id="about" className="about-section">

        <div className="section-container about-content">

          <span className="section-eyebrow">
            ABOUT LIFEPREDICT
          </span>

          <h2>
            Your lifestyle tells a story
            <br />
            about your health.
          </h2>

          <p>
            LifePredict brings together your health information,
            lifestyle habits and AI-powered analysis into one simple
            platform.
          </p>

        </div>

      </section>


      {/* =========================
          FEATURES
      ========================= */}
      <section id="features" className="features-section">

        <div className="section-container">

          <div className="section-heading">

            <span className="section-eyebrow">
              WHY LIFEPREDICT
            </span>

            <h2>
              Healthcare intelligence, made simple.
            </h2>

          </div>


          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                <Activity size={23} />
              </div>

              <h3>Health Prediction</h3>

              <p>
                Analyze lifestyle and health factors to generate
                personalized health risk insights.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                <HeartPulse size={23} />
              </div>

              <h3>Lifestyle Tracking</h3>

              <p>
                Understand how your daily habits such as activity,
                weight and lifestyle affect your health.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                <Stethoscope size={23} />
              </div>

              <h3>Doctor Insights</h3>

              <p>
                Help healthcare professionals view patient
                information and AI-generated health insights.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          HOW IT WORKS
      ========================= */}
      <section id="how-it-works" className="how-section">

        <div className="section-container">

          <div className="section-heading">

            <span className="section-eyebrow">
              HOW IT WORKS
            </span>

            <h2>
              From data to better decisions.
            </h2>

          </div>


          <div className="steps-grid">

            <div className="step-card">

              <span className="step-number">01</span>

              <div className="step-icon">
                <ClipboardCheck size={21} />
              </div>

              <h3>Assess</h3>

              <p>
                Enter your health and lifestyle information.
              </p>

            </div>


            <div className="step-card">

              <span className="step-number">02</span>

              <div className="step-icon">
                <Brain size={21} />
              </div>

              <h3>Predict</h3>

              <p>
                Our machine learning model analyzes your profile
                to identify potential risks and the key factors
                contributing to them.
              </p>

            </div>


            <div className="step-card">

              <span className="step-number">03</span>

              <div className="step-icon">
                <TrendingUp size={21} />
              </div>

              <h3>Improve</h3>

              <p>
                Understand your insights and simulate how
                lifestyle changes may influence your predicted
                health outcomes.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          CTA
      ========================= */}
      <section className="cta-section">

        <div className="cta-container">

          <div className="cta-content">

            <span className="section-eyebrow">
              START YOUR HEALTH JOURNEY
            </span>

            <h2>
              Your health deserves
              <br />
              more than just numbers.
            </h2>

            <p>
              Turn your health data into meaningful insights
              with LifePredict.
            </p>

          </div>


          <a href="/signup" className="cta-button">
            Get Started
            <ArrowRight size={18} />
          </a>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================= */}
      <footer className="landing-footer">

        <div className="footer-content">

          <a href="/" className="footer-logo">

            <div className="logo-icon">
              <HeartPulse size={19} />
            </div>

            <span>LifePredict</span>

          </a>


          <p>
            Lifestyle-based health prediction platform.
          </p>


          <span className="footer-copy">
            © 2026 LifePredict
          </span>

        </div>

      </footer>

    </div>
  );
}

export default LandingPage;