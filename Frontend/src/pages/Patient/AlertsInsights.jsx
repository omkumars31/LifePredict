
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Info,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react";
import "./AlertsInsights.css";

const API_BASE = "http://localhost:5001/api";

function numeric(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDoctorName(connection) {
  const name =
    connection?.name ||
    connection?.doctorName ||
    connection?.doctor_name ||
    connection?.fullName ||
    connection?.full_name ||
    connection?.doctor?.name ||
    connection?.doctor?.fullName ||
    connection?.doctor?.full_name ||
    connection?.connectedDoctor?.name ||
    connection?.connectedDoctor?.fullName ||
    connection?.connected_doctor?.full_name ||
    "";

  if (!name) return "Connected Doctor";

  const cleanName = String(name).trim();

  return /^dr\.?\s/i.test(cleanName)
    ? cleanName
    : `Dr. ${cleanName}`;
}

function getDoctorPhone(connection) {
  return (
    connection?.phone ||
    connection?.phoneNumber ||
    connection?.phone_number ||
    connection?.mobile ||
    connection?.doctor?.phone ||
    connection?.doctor?.phoneNumber ||
    connection?.doctor?.phone_number ||
    ""
  );
}

/*
 * Reviews may use different field names depending on the API.
 * Prefer actual review/observation text over generic metadata.
 */
function getReviewText(insight) {
  const possibleFields = [
    insight?.reviewText,
    insight?.review_text,
    insight?.observationText,
    insight?.observation_text,
    insight?.observation,
    insight?.feedback,
    insight?.comment,
    insight?.notes,
    insight?.doctorNotes,
    insight?.doctor_notes,
    insight?.reviewDetails,
    insight?.review_details,
    insight?.review,
    insight?.content,
    insight?.description,
    insight?.message,
    insight?.text,
    insight?.recommendation,
  ];

  const actualText = possibleFields.find(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0
  );

  // Some APIs may return nested review content.
  if (actualText) return actualText.trim();

  const nestedText =
    insight?.review?.text ||
    insight?.review?.message ||
    insight?.review?.observation ||
    insight?.details?.text ||
    insight?.details?.observation;

  if (typeof nestedText === "string" && nestedText.trim()) {
    return nestedText.trim();
  }

  return "Review text is not available in the API response.";
}

function getReviewDate(insight) {
  return (
    insight?.createdAt ||
    insight?.created_at ||
    insight?.updatedAt ||
    insight?.updated_at ||
    insight?.reviewDate ||
    insight?.review_date ||
    insight?.date ||
    null
  );
}

function getReviewTitle(insight) {
  return (
    insight?.title ||
    insight?.subject ||
    insight?.heading ||
    insight?.reviewTitle ||
    insight?.review_title ||
    "Doctor's observation"
  );
}

function getReviewCategory(insight) {
  return (
    insight?.type ||
    insight?.category ||
    insight?.reviewType ||
    insight?.review_type ||
    "Doctor review"
  );
}

function getReviewAdvice(insight) {
  return (
    insight?.action ||
    insight?.recommendation ||
    insight?.advice ||
    insight?.suggestedAction ||
    insight?.suggested_action ||
    ""
  );
}

function isHighPriorityDoctorReview(review) {
  if (!review || typeof review !== "object") {
    return false;
  }

  const flags = [
    review.isHighPriority,
    review.is_high_priority,
    review.highPriority,
    review.high_priority,
    review.isCritical,
    review.is_critical,
  ];

  if (flags.some((value) => value === true)) {
    return true;
  }

  const priorityFields = [
    review.priority,
    review.severity,
    review.riskLevel,
    review.risk_level,
    review.alertLevel,
    review.alert_level,
  ];

 const highValues = new Set([
  "high",
  "critical",
  "urgent",
  "review",
  "follow-up",
  "high priority",
  "high-priority",
]);

  return priorityFields.some((value) =>
    highValues.has(normalizeText(value))
  );
}

function getReviewPriority(review) {
  return (
    review.priority ||
    review.severity ||
    review.riskLevel ||
    review.risk_level ||
    review.alertLevel ||
    "High priority"
  );
}

function extractReviews(data) {
  const possibleArrays = [
    data?.reviews,
    data?.data?.reviews,
    data?.data?.data?.reviews,
    data?.data,
    data?.results,
    data?.data?.results,
  ];

  return possibleArrays.find(Array.isArray) || [];
}

function extractConnection(data) {
  const root = data?.data ?? data;

  const connection =
    root?.connection ||
    root?.doctorConnection ||
    root?.doctor_connection ||
    root?.doctor ||
    root?.connectedDoctor ||
    root?.connected_doctor ||
    data?.connection ||
    null;

  const connected =
    root?.connected === true ||
    data?.connected === true ||
    root?.isConnected === true ||
    root?.is_connected === true ||
    Boolean(
      connection?.id ||
      connection?.doctorId ||
      connection?.doctor_id ||
      connection?.name ||
      connection?.doctorName ||
      connection?.fullName
    );

  return { connection, connected, root };
}

function buildSignals(input, prediction) {
  const signals = [];

  const systolic = numeric(input.ap_hi);
  const diastolic = numeric(input.ap_lo);
  const activity = numeric(input.physicalActivity);
  const sleep = numeric(input.sleepHours);
  const stress = input.stressLevel;
  const smoking = input.smokingToday;

  if (systolic !== null && diastolic !== null) {
    if (systolic >= 140 || diastolic >= 90) {
      signals.push({
        key: "blood-pressure",
        priority: 100,
        title: "Blood pressure is a priority signal",
        text:
          "Your assessment contains a blood-pressure reading that needs attention.",
        action:
          "Discuss repeated elevated readings with a qualified healthcare professional.",
      });
    } else if (systolic >= 130 || diastolic >= 80) {
      signals.push({
        key: "blood-pressure",
        priority: 70,
        title: "Blood pressure is worth monitoring",
        text:
          "Your recorded blood-pressure reading is worth following over time.",
        action:
          "Continue recording readings consistently and review changes with your healthcare professional.",
      });
    }
  }

  if (
    smoking !== undefined &&
    smoking !== null &&
    normalizeText(smoking) === "yes"
  ) {
    signals.push({
      key: "smoking",
      priority: 80,
      title: "Smoking is a current lifestyle signal",
      text:
        "Smoking is recorded in the health information used by your assessment.",
      action:
        "Consider discussing smoking cessation support with a healthcare professional.",
    });
  }

  if (sleep !== null && sleep < 6) {
    signals.push({
      key: "sleep",
      priority: 60,
      title: "Sleep is a current focus area",
      text:
        "Your assessment includes a low recorded sleep duration.",
      action:
        "Track your sleep pattern and discuss persistent concerns with a professional.",
    });
  }

  if (activity !== null && activity < 30) {
    signals.push({
      key: "activity",
      priority: 50,
      title: "Physical activity is a current focus area",
      text:
        "Your assessment includes a relatively low recorded activity value.",
      action:
        "Continue tracking your activity over time.",
    });
  }

  if (stress) {
    const stressText = normalizeText(stress);

    if (
      stressText.includes("high") ||
      stressText.includes("very")
    ) {
      signals.push({
        key: "stress",
        priority: 50,
        title: "Stress is currently marked high",
        text:
          "Your assessment includes a high reported stress level.",
        action:
          "Track stress alongside sleep, activity and other lifestyle information.",
      });
    }
  }

  if (Number(prediction?.prediction) === 1) {
    signals.push({
      key: "prediction",
      priority: 1000,
      title: "Your current cardiovascular assessment needs follow-up",
      text:
        "The LifePredict model returned a positive cardiovascular prediction. This result does not identify one factor as the cause.",
      action:
        "Review the assessment with a qualified healthcare professional.",
    });
  }

  return signals.sort((a, b) => b.priority - a.priority);
}

function SignalIcon({ signalKey }) {
  if (
    signalKey === "prediction" ||
    signalKey === "blood-pressure"
  ) {
    return <HeartPulse size={21} />;
  }

  if (signalKey === "sleep") {
    return <Clock3 size={21} />;
  }

  if (
    signalKey === "activity" ||
    signalKey === "smoking"
  ) {
    return <Activity size={21} />;
  }

  if (signalKey === "stress") {
    return <Sparkles size={21} />;
  }

  return <Info size={21} />;
}

function BellIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function AlertsInsights() {
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [predictionError, setPredictionError] = useState("");

  const [doctorConnection, setDoctorConnection] = useState(null);
  const [doctorIsConnected, setDoctorIsConnected] = useState(false);
  const [doctorInsights, setDoctorInsights] = useState([]);
  const [manualDoctorAlerts, setManualDoctorAlerts] = useState([]);
  const [doctorDataError, setDoctorDataError] = useState("");
  const [loadingDoctorData, setLoadingDoctorData] = useState(true);
  const [showAllDoctorInsights, setShowAllDoctorInsights] = useState(false);
  const [showAllDoctorAlerts, setShowAllDoctorAlerts] = useState(false);

  const [upcomingConsultations, setUpcomingConsultations] = useState([]);
  const [loadingConsultation, setLoadingConsultation] = useState(true);
  const [consultationError, setConsultationError] = useState("");

  const fetchPrediction = useCallback(async () => {
    try {
      setLoadingPrediction(true);
      setPredictionError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setPredictionError("You are not logged in.");
        setPrediction(null);
        return;
      }

      const response = await fetch(
        `${API_BASE}/predictions/predict`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load your current assessment."
        );
      }

      setPrediction(data);
    } catch (error) {
      console.error("Alerts prediction error:", error);
      setPredictionError(
        error.message || "Unable to load your current assessment."
      );
      setPrediction(null);
    } finally {
      setLoadingPrediction(false);
    }
  }, []);

  const fetchDoctorData = useCallback(async () => {
    try {
      setLoadingDoctorData(true);
      setLoadingConsultation(true);
      setDoctorDataError("");
      setConsultationError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setDoctorConnection(null);
        setDoctorIsConnected(false);
        setDoctorInsights([]);
        setUpcomingConsultations([]);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      
const [
  connectionResponse,
  reviewsResponse,
  manualAlertsResponse,
] = await Promise.all([
  fetch(`${API_BASE}/connections/patient`, { headers }),

  fetch(`${API_BASE}/connections/patient/reviews?all=true`, {
    headers,
  }),

  fetch(`${API_BASE}/alerts/patient`, { headers }),
]);


      const connectionData = await connectionResponse.json();
      const reviewsData = await reviewsResponse.json();

      const manualAlertsData = await manualAlertsResponse.json();

if (!manualAlertsResponse.ok || !manualAlertsData.success) {
  throw new Error(
    manualAlertsData.message || "Doctor alerts could not be loaded."
  );
}

setManualDoctorAlerts(
  Array.isArray(manualAlertsData.alerts)
    ? manualAlertsData.alerts
    : []
);

      if (!connectionResponse.ok) {
        throw new Error(
          connectionData.message ||
            "Doctor connection could not be loaded."
        );
      }

      if (!reviewsResponse.ok) {
        throw new Error(
          reviewsData.message || "Doctor reviews could not be loaded."
        );
      }

      const {
        connection,
        connected,
        root,
      } = extractConnection(connectionData);

      const reviews = extractReviews(reviewsData);

      setDoctorConnection(connection);
      setDoctorIsConnected(connected);
      setDoctorInsights(reviews);

      const consultations =
        Array.isArray(root?.upcomingConsultations)
          ? root.upcomingConsultations
          : Array.isArray(connectionData?.upcomingConsultations)
            ? connectionData.upcomingConsultations
            : Array.isArray(connectionData?.data?.upcomingConsultations)
              ? connectionData.data.upcomingConsultations
              : [];

      setUpcomingConsultations(connected ? consultations : []);
    } catch (error) {
      console.error("Alerts doctor data error:", error);

      setDoctorDataError(
        error.message || "Doctor information could not be loaded."
      );

      setConsultationError(
        error.message || "Consultations could not be loaded."
      );

      setDoctorConnection(null);
      setDoctorIsConnected(false);
      setDoctorInsights([]);
      setUpcomingConsultations([]);
    } finally {
      setLoadingDoctorData(false);
      setLoadingConsultation(false);
    }
  }, []);

  useEffect(() => {
    fetchPrediction();
    fetchDoctorData();
  }, [fetchPrediction, fetchDoctorData]);

  const predictionInput = prediction?.predictionInput || {};
  const predictionResult = prediction?.prediction || {};

  const prioritySignals = useMemo(
    () => buildSignals(predictionInput, predictionResult),
    [predictionInput, predictionResult]
  );

  const prioritySignal = prioritySignals[0] || null;
  const secondarySignals = prioritySignals.slice(1, 4);

  const predictionDate =
    prediction?.updatedAt ||
    prediction?.createdAt ||
    prediction?.timestamp;

  const doctorName = getDoctorName(doctorConnection);
  const doctorPhone = getDoctorPhone(doctorConnection);

  
const highPriorityDoctorReviews = useMemo(() => {
  const savedManualAlerts = manualDoctorAlerts.map((alert) => ({
    ...alert,
    source: "doctor",
    isManualAlert: true,
  }));

  const reviewedAlerts = doctorInsights.filter(
    isHighPriorityDoctorReview
  );

  return [...savedManualAlerts, ...reviewedAlerts].sort(
    (a, b) =>
      new Date(b.createdAt || b.created_at || 0).getTime() -
      new Date(a.createdAt || a.created_at || 0).getTime()
  );
}, [doctorInsights, manualDoctorAlerts]);


  const visibleDoctorInsights = showAllDoctorInsights
    ? doctorInsights
    : doctorInsights.slice(0, 3);

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <div className="alerts-title">
          <span>YOUR PERSONAL HEALTH GUIDE</span>
          <h1>Alerts &amp; Insights</h1>
          <p>
            A focused view of what currently deserves your attention,
            plus advice and communication from your healthcare team.
          </p>
        </div>

        <div className="alerts-header-icon">
          <BellIcon />
        </div>
      </div>

      {/* PRIORITY HEALTH SIGNALS */}
      <section className="priority-section">
        <div className="priority-heading">
          <div>
            <span>PRIORITY HEALTH SIGNAL</span>
            <h2>What needs your attention first</h2>
          </div>
        </div>

        {loadingPrediction ? (
          <div className="state-card">
            <RefreshCw size={19} className="alerts-spin" />
            <div>
              <h3>Reviewing your latest assessment</h3>
              <p>
                LifePredict is checking the latest prediction available
                for your account.
              </p>
            </div>
          </div>
        ) : predictionError ? (
          <div className="state-card state-warning">
            <Info size={19} />
            <div>
              <h3>Your priority signal could not be loaded</h3>
              <p>{predictionError}</p>
              <button
                type="button"
                className="text-action-button"
                onClick={fetchPrediction}
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        ) : prioritySignal ? (
          <div className="priority-card">
            <div className="priority-card-icon">
              <SignalIcon signalKey={prioritySignal.key} />
            </div>

            <div className="priority-card-content">
              <div className="priority-card-topline">
                <span className="priority-label">CURRENT PRIORITY</span>

                {predictionDate && (
                  <span className="priority-date">
                    Based on assessment: {formatDate(predictionDate)}
                  </span>
                )}
              </div>

              <h3>{prioritySignal.title}</h3>
              <p>{prioritySignal.text}</p>

              <div className="priority-action">
                <strong>Suggested next step</strong>
                <span>{prioritySignal.action}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="clear-state-card">
            <div className="clear-state-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>No priority signal identified</h3>
              <p>
                LifePredict has not identified a separate priority signal
                from the available assessment. This does not guarantee
                that no health concern exists.
              </p>
            </div>
          </div>
        )}

        {secondarySignals.length > 0 &&
          !loadingPrediction &&
          !predictionError && (
            <div className="secondary-signals">
              <div className="secondary-signals-heading">
                <Sparkles size={15} />
                <span>Other signals from this assessment</span>
              </div>

              <div
                className={`secondary-signals-grid secondary-count-${Math.min(
                  secondarySignals.length,
                  3
                )}`}
              >
                {secondarySignals.map((signal) => (
                  <div className="secondary-signal" key={signal.key}>
                    <div className="secondary-signal-icon">
                      <SignalIcon signalKey={signal.key} />
                    </div>
                    <div>
                      <h4>{signal.title}</h4>
                      <p>{signal.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </section>

      {/* DOCTOR INSIGHTS */}
      <section className="doctor-section">
        <div className="section-heading-row doctor-heading-row">
          <div>
            <span>DOCTOR'S INSIGHT</span>
            <h2>Advice from your connected doctor</h2>
            <p>
              Reviews and recommendations supplied by your connected
              healthcare professional.
            </p>
          </div>

          <button
            type="button"
            className="text-action-button doctor-refresh-button"
            onClick={fetchDoctorData}
            disabled={loadingDoctorData}
          >
            <RefreshCw
              size={15}
              className={loadingDoctorData ? "alerts-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loadingDoctorData ? (
          <div className="doctor-empty-state">
            <RefreshCw size={19} className="alerts-spin" />
            <div>
              <h3>Loading doctor insights...</h3>
              <p>
                Checking your doctor connection and available reviews.
              </p>
            </div>
          </div>
        ) : doctorDataError ? (
          <div className="doctor-empty-state">
            <Info size={19} />
            <div>
              <h3>Doctor information could not be loaded</h3>
              <p>{doctorDataError}</p>
              <button
                type="button"
                className="secondary-outline-button"
                onClick={fetchDoctorData}
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        ) : doctorIsConnected ? (
          <>
            <div className="doctor-profile-strip">
              <div className="doctor-avatar">
                <Stethoscope size={19} />
              </div>

              <div>
                <strong>{doctorName}</strong>
                <span>Connected healthcare professional</span>
              </div>

              <div className="doctor-connected-badge">
                <CheckCircle2 size={14} />
                Connected
              </div>
            </div>

            {doctorInsights.length > 0 ? (
              <>
                <div className="doctor-insights-list">
                  {visibleDoctorInsights.map((insight, index) => (
                    <article
                      className="doctor-insight-card"
                      key={
                        insight.id ||
                        insight._id ||
                        `${getReviewDate(insight) || "review"}-${index}`
                      }
                    >
                      <div className="doctor-insight-meta">
                        <span>{getReviewCategory(insight)}</span>

                        {getReviewDate(insight) && (
                          <time>
                            {formatDate(getReviewDate(insight))}
                          </time>
                        )}
                      </div>

                      <h3>{getReviewTitle(insight)}</h3>
                      <p>{getReviewText(insight)}</p>

                      {getReviewAdvice(insight) && (
                        <div className="doctor-advice">
                          <strong>Doctor's advice</strong>
                          <span>{getReviewAdvice(insight)}</span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                {doctorInsights.length > 3 && (
                  <button
                    type="button"
                    className="secondary-outline-button"
                    onClick={() =>
                      setShowAllDoctorInsights((previous) => !previous)
                    }
                  >
                    {showAllDoctorInsights
                      ? "Show Less"
                      : `View All Reviews (${doctorInsights.length})`}
                  </button>
                )}
              </>
            ) : (
              <div className="doctor-empty-state">
                <Info size={19} />
                <div>
                  <h3>No doctor insight has been added yet</h3>
                  <p>
                    Once your connected doctor records a review or
                    recommendation, it will appear here.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="doctor-empty-state">
            <div className="doctor-empty-icon">
              <Stethoscope size={21} />
            </div>
            <div className="doctor-empty-content">
              <h3>No doctor connected yet</h3>
              <p>
                Your doctor's notes and recommendations will appear
                here once you connect with a healthcare professional.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* HIGH ALERTS FROM DOCTOR */}
      <section className="doctor-section">
        <div className="section-heading-row">
          <div>
            <span>DOCTOR-RECORDED ALERTS</span>
            <h2>High Alerts from Doctor</h2>
            <p>
              Only reviews with an explicit high-priority, critical
              or urgent indicator are shown here.
            </p>
          </div>
        </div>

        {loadingDoctorData ? (
          <div className="doctor-empty-state">
            <RefreshCw size={19} className="alerts-spin" />
            <div>
              <h3>Checking doctor alerts...</h3>
              <p>Loading the latest available review data.</p>
            </div>
          </div>
        ) : doctorDataError ? (
          <div className="doctor-empty-state">
            <Info size={19} />
            <div>
              <h3>Doctor alerts could not be verified</h3>
              <p>{doctorDataError}</p>
            </div>
          </div>
        ) : !doctorIsConnected ? (
          <div className="doctor-empty-state">
            <Info size={19} />
            <div>
              <h3>No doctor connected yet</h3>
              <p>
                Doctor-recorded alerts will appear here after a
                healthcare connection is established.
              </p>
            </div>
          </div>
        ) : highPriorityDoctorReviews.length > 0 ? (
          <div className="doctor-insights-list">
            {(showAllDoctorAlerts
  ? highPriorityDoctorReviews
  : highPriorityDoctorReviews.slice(0, 3)
).map((insight, index) => (
              <article
                className="doctor-insight-card"
                key={insight.id || insight._id || `high-alert-${index}`}
              >
                <div className="doctor-insight-meta">
                  <span>{getReviewPriority(insight)}</span>

                  {getReviewDate(insight) && (
                    <time>{formatDate(getReviewDate(insight))}</time>
                  )}
                </div>

                <h3>{getReviewTitle(insight)}</h3>
                <p>{getReviewText(insight)}</p>

                {getReviewAdvice(insight) && (
                  <div className="doctor-advice">
                    <strong>Doctor's advice</strong>
                    <span>{getReviewAdvice(insight)}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
          
        ) : (
          
          <div className="doctor-empty-state">
            <ShieldCheck size={20} />
            <div>
              <h3>No high-priority doctor alerts found</h3>
              <p>
                There are no high-priority alerts from your doctor
                based on the currently available review data.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* DOCTOR COMMUNICATION */}
      <section className="care-section">
        <div className="section-heading-row">
          <div>
            <span>DOCTOR COMMUNICATION</span>
            <h2>Need to speak with your doctor?</h2>
            <p>
              View your upcoming appointment and contact your doctor
              when contact details are available.
            </p>
          </div>
        </div>

        <div className="care-grid care-grid-updated">
          {/* LARGER SCHEDULE CARD — LEFT */}
          <div className="appointment-card schedule-featured">
            <div className="appointment-card-top">
              <div className="care-card-icon appointment-care-icon">
                <CalendarClock size={19} />
              </div>
              <span className="care-card-label">UPCOMING SCHEDULE</span>
            </div>

            {loadingConsultation ? (
              <div className="consultation-state">
                <RefreshCw size={18} className="alerts-spin" />
                <p>Loading consultations...</p>
              </div>
            ) : consultationError ? (
              <div className="consultation-state">
                <Info size={18} />
                <h3>Consultations unavailable</h3>
                <p>{consultationError}</p>
                <button
                  type="button"
                  className="secondary-outline-button"
                  onClick={fetchDoctorData}
                >
                  <RefreshCw size={15} />
                  Try again
                </button>
              </div>
            ) : upcomingConsultations.length > 0 ? (
              <div className="schedule-list">
                {upcomingConsultations.map((consultation, index) => (
                  <article
                    className="consultation-item"
                    key={
                      consultation.id ||
                      consultation._id ||
                      `consultation-${index}`
                    }
                  >
                    <h3>
                      {consultation.doctorName ||
                        consultation.doctor_name ||
                        doctorName}
                    </h3>

                    {consultation.specialization && (
                      <p className="consultation-specialization">
                        {consultation.specialization}
                      </p>
                    )}

                    <div className="appointment-detail">
                      <CalendarClock size={16} />
                      <span>
                        {formatDate(consultation.scheduled_date)}
                      </span>
                    </div>

                    <div className="appointment-detail">
                      <Clock3 size={16} />
                      <span>
                        {consultation.start_time ||
                          "Time not available"}
                      </span>
                    </div>

                    <div className="appointment-detail">
                      <Clock3 size={16} />
                      <span>
                        {consultation.duration_minutes != null
                          ? `${consultation.duration_minutes} minutes`
                          : "Duration not available"}
                      </span>
                    </div>

                    <div className="appointment-mode">
                      {normalizeText(
                        consultation.consultation_type
                      ).includes("video") ? (
                        <Video size={14} />
                      ) : (
                        <Phone size={14} />
                      )}

                      {consultation.consultation_type ||
                        "Consultation type not available"}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="consultation-state">
                <CalendarClock size={22} />
                <h3>No scheduled consultation</h3>
                <p>
                  Your next doctor appointment will appear here when
                  one is actually scheduled.
                </p>
              </div>
            )}
          </div>

          {/* SMALLER CONTACT CARDS — RIGHT */}
          <div className="care-contact-stack">
            <div className="care-card care-card-featured">
              <div className="care-card-icon">
                <Phone size={20} />
              </div>

              <div className="care-card-content">
                <span className="care-card-label">NORMAL CALL</span>
                <h3>Call your doctor</h3>
                <p>
                  Start a normal phone call using your connected
                  doctor's contact number.
                </p>

                <button
                  type="button"
                  className="primary-care-button"
                  disabled={!doctorIsConnected || !doctorPhone}
                  onClick={() => {
                    if (doctorPhone) {
                      window.location.href = `tel:${String(
                        doctorPhone
                      ).replace(/[^\d+]/g, "")}`;
                    }
                  }}
                >
                  <Phone size={16} />
                  Call doctor
                </button>

                {!doctorPhone && doctorIsConnected && (
                  <p className="care-hint">
                    A phone number is not available in the connection
                    data.
                  </p>
                )}
              </div>
            </div>

            <div className="care-card">
              <div className="care-card-icon video-care-icon">
                <Video size={19} />
              </div>

              <div className="care-card-content">
                <span className="care-card-label">
                  VIDEO CONSULTATION
                </span>
                <h3>Video call</h3>
                <p>
                  Video calling requires a configured consultation
                  service or meeting link.
                </p>

                <button
                  type="button"
                  className="secondary-outline-button"
                  disabled
                  title="Video consultation integration is not configured"
                >
                  <Video size={16} />
                  Coming soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="alerts-note">
        <HeartPulse size={17} />
        <p>
          Alerts are generated from the health information and
          prediction currently available in your account. Doctor
          insights are shown only when supplied by a connected
          healthcare professional. This page is for awareness and
          is not a medical diagnosis.
        </p>
      </div>
    </div>
  );
}

export default AlertsInsights;
