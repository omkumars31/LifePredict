import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Clock3,
  ChevronRight,
  CircleGauge,
  Droplets,
  Flame,
  HeartPulse,
  Lightbulb,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Utensils,
  Weight,
} from "lucide-react";
import "./Dashboard.css";

const API = "https://lifepredict-production.up.railway.app/api";

/* NUTRITION HELPERS */
const getTodayIndiaDate = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

const getNutritionStorageKey = () => {
  try {
    const token = localStorage.getItem("token");

    if (token) {
      const payload = JSON.parse(
        decodeURIComponent(
          atob(
            token
              .split(".")[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/")
          )
            .split("")
            .map(
              (char) =>
                "%" +
                ("00" + char.charCodeAt(0).toString(16)).slice(-2)
            )
            .join("")
        )
      );

      const userKey =
        payload?.sub ||
        payload?.userId ||
        payload?.user_id ||
        payload?.email;

      if (userKey) {
        return `lifepredict_nutrition_meals_${String(userKey)}`;
      }
    }
  } catch (error) {
    console.warn("Dashboard nutrition storage key unavailable:", error);
  }

  return "lifepredict_nutrition_meals";
};

/* GENERAL HELPERS */
const numberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeAgo = (value) => {
  if (!value) return "No recent update";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No recent update";
  }

  const diff = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days} days ago`;

  return `Updated ${formatDate(value)}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
};

/* CONSULTATION DATE / TIME HELPERS */
const formatConsultationDate = (value) => {
  if (!value) return "Date unavailable";

  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  return formatDate(value);
};

const formatConsultationTime = (value) => {
  if (!value) return "Time unavailable";

  const raw = String(value).slice(0, 5);
  const [hours, minutes] = raw.split(":");
  const hour = Number(hours);

  if (Number.isNaN(hour) || !minutes) {
    return raw;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
};

/* HEALTH / PREDICTION HELPERS */
const getRisk = (value) => {
  const risk = numberOrNull(value);

  if (risk === null) {
    return {
      value: null,
      tone: "neutral",
      label: "Assessment unavailable",
    };
  }

  if (risk < 40) {
    return {
      value: risk,
      tone: "positive",
      label: "Lower model-estimated risk",
    };
  }

  if (risk < 80) {
    return {
      value: risk,
      tone: "moderate",
      label: "Moderate model-estimated risk",
    };
  }

  return {
    value: risk,
    tone: "attention",
    label: "Higher model-estimated risk",
  };
};

const getBpState = (systolic, diastolic) => {
  const sys = numberOrNull(systolic);
  const dia = numberOrNull(diastolic);

  if (sys === null || dia === null) {
    return {
      tone: "neutral",
      label: "Not recorded",
    };
  }

  if (sys >= 140 || dia >= 90) {
    return {
      tone: "attention",
      label: "Worth monitoring",
    };
  }

  if (sys >= 130 || dia >= 80) {
    return {
      tone: "watch",
      label: "Keep an eye on it",
    };
  }

  return {
    tone: "positive",
    label: "Within usual range",
  };
};

const getSignalState = (type, value) => {
  const n = numberOrNull(value);

  if (n === null) {
    return {
      tone: "neutral",
      label: "Not recorded",
    };
  }

  if (type === "sleep") {
    if (n < 6) {
      return {
        tone: "attention",
        label: "Low today",
      };
    }

    if (n < 7) {
      return {
        tone: "watch",
        label: "Could improve",
      };
    }

    if (n <= 9) {
      return {
        tone: "positive",
        label: "Good range",
      };
    }

    return {
      tone: "watch",
      label: "Longer than usual",
    };
  }

  if (type === "activity") {
    if (n < 30) {
      return {
        tone: "watch",
        label: "Low activity",
      };
    }

    if (n < 60) {
      return {
        tone: "positive",
        label: "Good start",
      };
    }

    return {
      tone: "positive",
      label: "Active day",
    };
  }

  if (type === "glucose") {
    if (n >= 126) {
      return {
        tone: "attention",
        label: "Worth monitoring",
      };
    }

    if (n >= 100) {
      return {
        tone: "watch",
        label: "Keep an eye on it",
      };
    }

    return {
      tone: "positive",
      label: "Within usual range",
    };
  }

  if (type === "bmi") {
    if (n < 18.5) {
      return {
        tone: "watch",
        label: "Below usual range",
      };
    }

    if (n < 25) {
      return {
        tone: "positive",
        label: "Within usual range",
      };
    }

    if (n < 30) {
      return {
        tone: "watch",
        label: "Above usual range",
      };
    }

    return {
      tone: "attention",
      label: "Worth monitoring",
    };
  }

  return {
    tone: "neutral",
    label: "Recorded",
  };
};

/* SIGNAL CARD */
function SignalCard({
  icon: Icon,
  label,
  value,
  unit,
  state,
  onClick,
}) {
  return (
    <button
      type="button"
      className="lp-signal-card"
      onClick={onClick}
      aria-label={`${label}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      <div className="lp-signal-top">
        <span className="lp-signal-icon">
          <Icon size={17} strokeWidth={2} />
        </span>
        <span className={`lp-signal-dot ${state.tone}`} />
      </div>

      <span className="lp-signal-label">{label}</span>

      <span className="lp-signal-value">
        {value}
        {unit && <small>{unit}</small>}
      </span>

      <span className={`lp-signal-state ${state.tone}`}>
        {state.label}
      </span>
    </button>
  );
}

/* PATIENT DASHBOARD */
function PatientDashboard() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token");
  const firstName = user?.fullName?.split(" ")[0] || "there";

  const [healthRecords, setHealthRecords] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [upcomingConsultations, setUpcomingConsultations] = useState([]);
  const [loadingConsultation, setLoadingConsultation] = useState(true);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [predictionError, setPredictionError] = useState("");

  /* LOAD BACKEND DATA */
  useEffect(() => {
    if (!token) {
      setLoadingHealth(false);
      setLoadingPrediction(false);
      setLoadingConsultation(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    /* LOAD HEALTH RECORDS */
    const loadHealth = async () => {
      try {
        const response = await fetch(`${API}/health-records`, {
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load health data.");
        }

        const records = Array.isArray(data.records) ? data.records : [];

        setHealthRecords(
          [...records].sort(
            (a, b) =>
              new Date(a.recorded_at) - new Date(b.recorded_at)
          )
        );
      } catch (error) {
        console.error("Dashboard health data error:", error);
        setHealthRecords([]);
      } finally {
        setLoadingHealth(false);
      }
    };

    /* LOAD PREDICTION */
    const loadPrediction = async () => {
      try {
        const response = await fetch(`${API}/predictions/predict`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to generate prediction."
          );
        }

        setPrediction(data);
      } catch (error) {
        console.error("Dashboard prediction error:", error);
        setPredictionError(
          error.message || "Unable to generate prediction."
        );
      } finally {
        setLoadingPrediction(false);
      }
    };

    /* LOAD PROFILE */
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API}/profile`, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        setPatientProfile(data.profile || null);
      } catch (error) {
        console.error("Dashboard profile error:", error);
      }
    };

    /* LOAD UPCOMING CONSULTATIONS */
    const loadUpcomingConsultation = async () => {
      try {
        const response = await fetch(`${API}/connections/patient`, {
          headers,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load consultation details."
          );
        }

        setUpcomingConsultations(
          data.connected && Array.isArray(data.upcomingConsultations)
            ? data.upcomingConsultations
            : []
        );
      } catch (error) {
        console.error("Dashboard consultation error:", error);
        setUpcomingConsultations([]);
      } finally {
        setLoadingConsultation(false);
      }
    };

    loadHealth();
    loadPrediction();
    loadProfile();
    loadUpcomingConsultation();
  }, [token]);

  /* LOAD LOCAL DASHBOARD DATA */
  useEffect(() => {
    const loadLocalDashboardData = () => {
      /* CONNECTED DOCTOR */
      try {
        const storedDoctor = localStorage.getItem(
          "lifepredict_connected_doctor"
        );

        setDoctor(storedDoctor ? JSON.parse(storedDoctor) : null);
      } catch {
        setDoctor(null);
      }

      /* TODAY'S NUTRITION */
      try {
        const storageKey = getNutritionStorageKey();
        const storedNutrition = localStorage.getItem(storageKey);

        if (!storedNutrition) {
          setConsumedCalories(0);
          return;
        }

        const parsed = JSON.parse(storedNutrition);

        /* ONLY TODAY'S DATA */
        if (
          parsed?.date &&
          parsed.date !== getTodayIndiaDate()
        ) {
          setConsumedCalories(0);
          return;
        }

        const meals = parsed?.meals || {};
        const items = Object.values(meals).flat();

        const total = items.reduce(
          (sum, item) => sum + Number(item?.calories || 0),
          0
        );

        setConsumedCalories(Math.max(0, Math.round(total)));
      } catch (error) {
        console.error("Dashboard nutrition data error:", error);
        setConsumedCalories(0);
      }
    };

    loadLocalDashboardData();

    /* STORAGE EVENT */
    window.addEventListener("storage", loadLocalDashboardData);

    /* FOCUS EVENT */
    window.addEventListener("focus", loadLocalDashboardData);

    /* VISIBILITY CHANGE */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadLocalDashboardData();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    /* NUTRITION UPDATE EVENT */
    window.addEventListener(
      "lifepredict:nutrition-updated",
      loadLocalDashboardData
    );

    return () => {
      window.removeEventListener("storage", loadLocalDashboardData);
      window.removeEventListener("focus", loadLocalDashboardData);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener(
        "lifepredict:nutrition-updated",
        loadLocalDashboardData
      );
    };
  }, []);

  /* LATEST HEALTH RECORD */
  const latestHealth = healthRecords.length
    ? healthRecords[healthRecords.length - 1]
    : null;

  const previousHealth =
    healthRecords.length > 1
      ? healthRecords[healthRecords.length - 2]
      : null;

  /* PREDICTION */
  const predictionInput = prediction?.predictionInput || {};
  const predictionResult = prediction?.prediction || {};

  const risk = getRisk(
    predictionResult.probability_cardio !== undefined
      ? Number(predictionResult.probability_cardio) * 100
      : null
  );

  /* HEALTH VALUES */
  const systolic = numberOrNull(latestHealth?.systolic_bp);
  const diastolic = numberOrNull(latestHealth?.diastolic_bp);
  const weight = numberOrNull(latestHealth?.weight_kg);
  const activity = numberOrNull(
    latestHealth?.physical_activity_minutes
  );

  const sleep = numberOrNull(
    latestHealth?.sleep_hours ??
      latestHealth?.sleep_duration ??
      latestHealth?.sleep
  );

  const glucose = numberOrNull(
    latestHealth?.glucose ??
      latestHealth?.blood_glucose ??
      latestHealth?.glucose_level
  );

  const bmi = numberOrNull(
    predictionInput.BMI ??
      predictionInput.bmi ??
      latestHealth?.bmi
  );

  const calculateAgeFromDob = (dob) => {
    if (!dob) return null;

    const birthDate = new Date(dob);

    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();

    let calculatedAge =
      today.getFullYear() - birthDate.getFullYear();

    const birthdayNotReached =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate());

    if (birthdayNotReached) {
      calculatedAge--;
    }

    return calculatedAge >= 0 ? calculatedAge : null;
  };

  const profileAge = numberOrNull(
    patientProfile?.age ?? patientProfile?.age_years
  );

  const age =
    profileAge !== null && profileAge > 0
      ? profileAge
      : calculateAgeFromDob(
          patientProfile?.dob ??
            patientProfile?.date_of_birth ??
            patientProfile?.dateOfBirth
        ) ??
        numberOrNull(
          predictionInput.age ??
            predictionInput.age_years ??
            predictionInput.Age ??
            latestHealth?.age
        );

  /* HEALTH STATES */
  const bpState = getBpState(systolic, diastolic);
  const sleepState = getSignalState("sleep", sleep);
  const activityState = getSignalState("activity", activity);
  const glucoseState = getSignalState("glucose", glucose);
  const bmiState = getSignalState("bmi", bmi);

  /* NUTRITION CALCULATION */
  const calorieTarget =
    weight !== null && weight > 0 ? Math.round(weight * 24) : 0;

  const remainingCalories =
    calorieTarget > 0
      ? Math.max(calorieTarget - consumedCalories, 0)
      : null;

  const calorieProgress =
    calorieTarget > 0
      ? Math.min((consumedCalories / calorieTarget) * 100, 100)
      : 0;

  /* WEIGHT CHANGE */
  const previousWeight = numberOrNull(previousHealth?.weight_kg);

  const weightChange =
    weight !== null && previousWeight !== null
      ? weight - previousWeight
      : null;

  /* ATTENTION ITEMS */
  const attentionItems = [];

  if (bpState.tone === "attention") {
    attentionItems.push({
      icon: Activity,
      title: "Blood pressure",
      value: `${systolic}/${diastolic} mmHg`,
      text:
        "Your latest reading is worth monitoring across repeated measurements.",
      action: "Review readings",
    });
  }

  if (glucoseState.tone === "attention") {
    attentionItems.push({
      icon: Droplets,
      title: "Blood glucose",
      value: `${glucose} mg/dL`,
      text:
        "Keep the measurement context and repeated readings in view.",
      action: "Review health data",
    });
  }

  if (sleepState.tone === "attention") {
    attentionItems.push({
      icon: Moon,
      title: "Sleep",
      value: `${sleep} hrs`,
      text:
        "Your latest sleep duration is lower than the dashboard target range.",
      action: "Update health data",
    });
  }

  if (activityState.tone === "watch") {
    attentionItems.push({
      icon: Activity,
      title: "Activity",
      value: `${activity} min`,
      text:
        "Your latest activity level is a useful lifestyle signal to track.",
      action: "Update health data",
    });
  }

  if (attentionItems.length === 0) {
    attentionItems.push({
      icon: Sparkles,
      title: "Your data is ready to track",
      value: latestHealth
        ? "Latest check-in available"
        : "Start your profile",
      text: latestHealth
        ? "Keep recording your measurements so LifePredict can identify changes instead of relying on one snapshot."
        : "Add health data to start building your personalized health picture.",
      action: latestHealth ? "View health data" : "Add health data",
    });
  }

  const primaryAttention = attentionItems[0];

  /* PREDICTION FACTORS */
  const predictionFactors = [
    {
      label: "Blood pressure",
      value:
        systolic !== null && diastolic !== null
          ? `${systolic}/${diastolic}`
          : "Not recorded",
    },
    {
      label: "BMI",
      value: bmi !== null ? bmi.toFixed(1) : "Not recorded",
    },
    {
      label: "Activity",
      value: activity !== null ? `${activity} min` : "Not recorded",
    },
    {
      label: "Age",
      value: age !== null ? `${age} yrs` : "Not recorded",
    },
  ];

  /* INSIGHT SIGNALS */
  const insightSignals = [
    {
      icon: Activity,
      title: "Blood pressure",
      value:
        systolic !== null && diastolic !== null
          ? `${systolic}/${diastolic} mmHg`
          : "Not recorded",
      state: bpState.label,
    },
    {
      icon: CircleGauge,
      title: "BMI",
      value: bmi !== null ? bmi.toFixed(1) : "Not recorded",
      state: bmiState.label,
    },
    {
      icon: Activity,
      title: "Activity",
      value: activity !== null ? `${activity} min` : "Not recorded",
      state: activityState.label,
    },
    {
      icon: Moon,
      title: "Sleep",
      value: sleep !== null ? `${sleep} hrs` : "Not recorded",
      state: sleepState.label,
    },
    {
      icon: Droplets,
      title: "Glucose",
      value:
        glucose !== null
          ? `${glucose} mg/dL`
          : "Not recorded",
      state: glucoseState.label,
    },
  ];

  /* RECENT ACTIVITY */
  const recentActivity = [
    latestHealth && {
      icon: CalendarDays,
      title: "Health data updated",
      text: `Latest check recorded on ${formatDate(
        latestHealth.recorded_at
      )}.`,
      path: "/patient/health-data",
    },
    prediction && {
      icon: ShieldCheck,
      title: "Prediction available",
      text: "Your current cardiovascular assessment is ready.",
      path: "/patient/predictions",
    },
    consumedCalories > 0 && {
      icon: Flame,
      title: "Nutrition logged",
      text: `${consumedCalories} kcal logged today.`,
    },
    doctor && {
      icon: HeartPulse,
      title: "Care team connected",
      text: doctor.name
        ? `${doctor.name} is connected to your LifePredict care space.`
        : "A healthcare professional is connected to your care space.",
    },
  ].filter(Boolean);

  /* RENDER */
  return (
    <main className="lp-dashboard">
      {/* HERO */}
      <section className="lp-dashboard-hero">
        <div className="lp-hero-copy">
          <span className="lp-eyebrow">PERSONAL HEALTH SPACE</span>
          <h1>
            {getGreeting()}, {firstName}.
          </h1>
          <p>
            Your health picture at a glance — what looks good, what needs
            attention, and what you can explore next.
          </p>

          {latestHealth?.recorded_at && (
            <div className="lp-last-update">
              <span />
              {formatTimeAgo(latestHealth.recorded_at)}
            </div>
          )}
        </div>

        <button
          type="button"
          className="lp-primary-button"
          onClick={() => navigate("/patient/health-data")}
        >
          <Plus size={16} />
          Add health data
        </button>
      </section>

      {/* MAIN HEALTH SNAPSHOT */}
      <section className="lp-overview-card">
        <div className="lp-overview-main">
          <div className="lp-overview-title-row">
            <div>
              <span className="lp-eyebrow">HEALTH OVERVIEW</span>
              <h2>Your health at a glance</h2>
            </div>

            <div className={`lp-risk-badge ${risk.tone}`}>
              <span />
              {risk.label}
            </div>
          </div>

          <div className="lp-risk-area">
            <div className={`lp-risk-number ${risk.tone}`}>
              {loadingPrediction || risk.value === null
                ? "—"
                : risk.value.toFixed(1)}

              {risk.value !== null && !loadingPrediction && (
                <small>%</small>
              )}
            </div>

            <div className="lp-risk-copy">
              <strong>Cardiovascular risk estimate</strong>
              <p>
                This is a model-estimated signal based on your available
                health and lifestyle data.
              </p>
              <button
                type="button"
                className="lp-text-button"
                onClick={() => navigate("/patient/predictions")}
              >
                Understand this assessment
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="lp-signal-grid">
          <SignalCard
            icon={Activity}
            label="BLOOD PRESSURE"
            value={
              systolic !== null && diastolic !== null
                ? `${systolic}/${diastolic}`
                : "—"
            }
            unit={systolic !== null ? "mmHg" : ""}
            state={bpState}
            onClick={() => navigate("/patient/health-data")}
          />

          <SignalCard
            icon={CircleGauge}
            label="BMI"
            value={bmi !== null ? bmi.toFixed(1) : "—"}
            state={bmiState}
            onClick={() => navigate("/patient/health-data")}
          />

          <SignalCard
            icon={Activity}
            label="ACTIVITY"
            value={activity !== null ? activity : "—"}
            unit={activity !== null ? "min" : ""}
            state={activityState}
            onClick={() => navigate("/patient/health-data")}
          />

          <SignalCard
            icon={Moon}
            label="SLEEP"
            value={sleep !== null ? sleep : "—"}
            unit={sleep !== null ? "hrs" : ""}
            state={sleepState}
            onClick={() => navigate("/patient/health-data")}
          />

          <SignalCard
            icon={Droplets}
            label="GLUCOSE"
            value={glucose !== null ? glucose : "—"}
            unit={glucose !== null ? "mg/dL" : ""}
            state={glucoseState}
            onClick={() => navigate("/patient/health-data")}
          />
        </div>
      </section>

      {/* WHAT YOUR DATA IS SAYING */}
      <section className="lp-insight-grid">
        <div
          className={`lp-attention-card ${
            primaryAttention.icon === Sparkles ? "positive" : ""
          }`}
        >
          <div className="lp-card-heading">
            <div>
              <span className="lp-eyebrow">
                {primaryAttention.icon === Sparkles
                  ? "YOUR CURRENT SIGNAL"
                  : "WHAT NEEDS ATTENTION"}
              </span>
              <h2>{primaryAttention.title}</h2>
            </div>

            <span className="lp-heading-icon">
              <primaryAttention.icon size={19} />
            </span>
          </div>

          <div className="lp-attention-value">
            {primaryAttention.value}
          </div>
          <p>{primaryAttention.text}</p>

          <button
            type="button"
            className="lp-text-button"
            onClick={() => navigate("/patient/health-data")}
          >
            {primaryAttention.action}
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="lp-insight-card">
          <div className="lp-card-heading">
            <div>
              <span className="lp-eyebrow">LIFEPREDICT INSIGHT</span>
              <h2>Look at the pattern, not one number</h2>
            </div>
            <span className="lp-heading-icon">
              <Lightbulb size={19} />
            </span>
          </div>

          <p className="lp-insight-intro">
            Your dashboard becomes more useful when you keep updating
            measurements. That lets LifePredict compare changes in your
            health and lifestyle over time.
          </p>

          <div className="lp-insight-points">
            {insightSignals.slice(0, 3).map((item) => {
              const Icon = item.icon;

              return (
                <div className="lp-insight-point" key={item.title}>
                  <span>
                    <Icon size={14} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.value} · {item.state}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PREDICTION + TODAY */}
      <section className="lp-secondary-grid">
        <div className="lp-prediction-card">
          <div className="lp-card-heading">
            <div>
              <span className="lp-eyebrow">LATEST ASSESSMENT</span>
              <h2>Why this assessment matters</h2>
            </div>
            <span className="lp-heading-icon">
              <ShieldCheck size={19} />
            </span>
          </div>

          <div className="lp-prediction-summary">
            <div className={`lp-prediction-score ${risk.tone}`}>
              {risk.value !== null ? `${risk.value.toFixed(1)}%` : "—"}
            </div>
            <div>
              <strong>
                {risk.value !== null
                  ? "Current cardiovascular risk estimate"
                  : "Assessment not available"}
              </strong>
              <p>
                {prediction
                  ? "These are the main profile inputs currently available to the prediction."
                  : predictionError ||
                    "Add health data to generate your assessment."}
              </p>
            </div>
          </div>

          <div className="lp-factor-grid">
            {predictionFactors.map((factor) => (
              <div className="lp-factor" key={factor.label}>
                <span>{factor.label}</span>
                <strong>{factor.value}</strong>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="lp-outline-button"
            onClick={() => navigate("/patient/predictions")}
          >
            Open full prediction
            <ArrowRight size={14} />
          </button>
        </div>

        {/* TODAY'S NUTRITION */}
        <div className="lp-nutrition-card">
          <div className="lp-card-heading">
            <div>
              <span className="lp-eyebrow">TODAY'S NUTRITION</span>
              <h2>Daily intake</h2>
            </div>
            <span className="lp-heading-icon">
              <Utensils size={18} />
            </span>
          </div>

          <div className="lp-calorie-line">
            <strong>
              {remainingCalories !== null ? remainingCalories : "—"}
            </strong>
            <span>kcal left</span>
          </div>

          <div className="lp-calorie-bar">
            <span style={{ width: `${calorieProgress}%` }} />
          </div>

          <div className="lp-calorie-meta">
            <span>{consumedCalories} kcal logged</span>
            <span>
              {calorieTarget > 0
                ? `${calorieTarget} kcal target`
                : "Target unavailable"}
            </span>
          </div>

          <p className="lp-nutrition-note">
            {calorieTarget > 0
              ? "A quick briefing from what you've logged today — your full nutrition details stay in the Nutrition section."
              : "Add your latest weight in Health Data to calculate your daily calorie target using weight × 24."}
          </p>

          <button
            type="button"
            className="lp-outline-button"
            onClick={() => navigate("/patient/nutrition")}
          >
            <Plus size={10} />
            Continue logging
            <ArrowRight size={10} />
          </button>
        </div>
      </section>

      {/* UPCOMING CONSULTATIONS */}
      <section className="lp-activity-card">
        <div className="lp-card-heading">
          <div>
            <span className="lp-eyebrow">UPCOMING CONSULTATIONS</span>
            <h2>Your scheduled consultations</h2>
          </div>
          <span className="lp-heading-icon">
            <CalendarDays size={18} />
          </span>
        </div>

        {loadingConsultation ? (
          <div className="lp-empty-activity">
            <CalendarDays size={16} />
            Loading consultation details...
          </div>
        ) : upcomingConsultations.length > 0 ? (
          <div className="lp-activity-list lp-consultation-list">
            {upcomingConsultations.map((consultation) => (
              <div
                className="lp-activity-row lp-consultation-row"
                key={consultation.id}
              >
                <span className="lp-activity-icon">
                  <HeartPulse size={15} />
                </span>

                <div className="lp-consultation-content">
                  <strong>
                    Dr. {consultation.doctorName || "Your doctor"}
                  </strong>
                  <p>
                    {consultation.specialization ||
                      "Healthcare consultation"}
                  </p>

                  <div className="lp-consultation-meta">
                    <span>
                      <CalendarDays size={12} />
                      {formatConsultationDate(
                        consultation.scheduled_date
                      )}
                    </span>

                    <span>
                      <Clock3 size={12} />
                      {formatConsultationTime(
                        consultation.start_time
                      )}
                    </span>

                    {consultation.duration_minutes ? (
                      <span>
                        {consultation.duration_minutes} min
                      </span>
                    ) : null}

                    {consultation.consultation_type ? (
                      <span className="lp-consultation-type">
                        {String(consultation.consultation_type)
                          .replace(/[-_]/g, " ")
                          .replace(/\b\w/g, (char) =>
                            char.toUpperCase()
                          )}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lp-empty-activity">
            <CalendarDays size={16} />
            No upcoming consultation is scheduled.
          </div>
        )}
      </section>

      {/* LIFESTYLE MINI SUMMARY */}
      <section className="lp-lifestyle-card">
        <div className="lp-lifestyle-heading">
          <div>
            <span className="lp-eyebrow">YOUR LIFESTYLE PICTURE</span>
            <h2>Small signals add up</h2>
          </div>

          <button
            type="button"
            className="lp-text-button"
            onClick={() => navigate("/patient/health-data")}
          >
            View all health data
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="lp-lifestyle-grid">
          {/* WEIGHT */}
          <div className="lp-lifestyle-item">
            <span className="lp-lifestyle-icon">
              <Weight size={16} />
            </span>
            <div>
              <small>WEIGHT</small>
              <strong>
                {weight !== null ? `${weight.toFixed(1)} kg` : "—"}
              </strong>

              {weightChange !== null && (
                <span
                  className={
                    weightChange < 0
                      ? "lp-change-down"
                      : "lp-change-neutral"
                  }
                >
                  {weightChange > 0 ? "+" : ""}
                  {weightChange.toFixed(1)} kg since previous check
                </span>
              )}
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="lp-lifestyle-item">
            <span className="lp-lifestyle-icon">
              <Activity size={16} />
            </span>
            <div>
              <small>ACTIVITY</small>
              <strong>
                {activity !== null ? `${activity} min` : "—"}
              </strong>
              <span>{activityState.label}</span>
            </div>
          </div>

          {/* SLEEP */}
          <div className="lp-lifestyle-item">
            <span className="lp-lifestyle-icon">
              <Moon size={16} />
            </span>
            <div>
              <small>SLEEP</small>
              <strong>
                {sleep !== null ? `${sleep} hrs` : "—"}
              </strong>
              <span>{sleepState.label}</span>
            </div>
          </div>

          {/* GLUCOSE */}
          <div className="lp-lifestyle-item">
            <span className="lp-lifestyle-icon">
              <Droplets size={16} />
            </span>
            <div>
              <small>GLUCOSE</small>
              <strong>
                {glucose !== null ? `${glucose} mg/dL` : "—"}
              </strong>
              <span>{glucoseState.label}</span>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section className="lp-activity-card">
        <div className="lp-card-heading">
          <div>
            <span className="lp-eyebrow">RECENT ACTIVITY</span>
            <h2>What has changed lately</h2>
          </div>
          <span className="lp-heading-icon">
            <CalendarDays size={18} />
          </span>
        </div>

        {recentActivity.length > 0 ? (
          <div className="lp-activity-list">
            {recentActivity.slice(0, 4).map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  className="lp-activity-row lp-activity-button"
                  key={`${item.title}-${index}`}
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  disabled={!item.path}
                  aria-label={`Open ${item.title}`}
                >
                  <span className="lp-activity-icon">
                    <Icon size={15} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="lp-empty-activity">
            <Sparkles size={16} />
            Start using LifePredict and your recent health activity will
            appear here.
          </div>
        )}
      </section>
    </main>
  );
}

export default PatientDashboard;