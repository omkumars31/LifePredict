import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cigarette,
  Droplets,
  Footprints,
  HeartPulse,
  Info,
  Moon,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Wine,
} from "lucide-react";
import "./Predictions.css";
/* =========================================================
   SMALL HELPERS
========================================================= */

function numeric(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}


function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return "Not available";
  return Number(value).toFixed(decimals);
}


function normalizeAnswer(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isNegativeLifestyleAnswer(value) {
  return ["no", "false", "never", "0"].includes(
    normalizeAnswer(value)
  );
}

function isPositiveLifestyleAnswer(value) {
  return ["yes", "true", "1"].includes(
    normalizeAnswer(value)
  );
}

function firstNumeric(...values) {
  for (const value of values) {
    const parsed = numeric(value);

    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

/* ========================================================
   BMI PERSONALIZED ANALYSIS
========================================================= */

function getBmiAnalysis(bmi, weight, activity, sleep, cholesterol, systolic) {
  if (bmi === null) return null;
  const value = bmi.toFixed(1);
  if (bmi < 18.5) {
    return {
      type: "watch",
      title: "BMI is below the usual healthy range",
      summary: `Your BMI is ${value}. At this value, your BMI falls below the usual 18.5 threshold.`,
      why: `At a BMI of ${value}, your current value is below the range commonly used to describe the usual healthy BMI range. BMI is only one measure, so nutrition, activity, medical history and your other health measurements also matter.`,
      contributing:
        weight !== null
          ? `Your current recorded weight is ${weight.toFixed(
              1
            )} kg. Weight, height, nutrition, activity, sleep and other individual factors can influence BMI, but this value alone cannot identify the reason for your result.`
          : "BMI can be influenced by body weight, height, nutrition, activity, sleep and other individual factors. The BMI value alone cannot identify the cause.",
      next: "Focus on balanced nutrition, regular activity and your overall health pattern rather than trying to change one number in isolation.",
    };
  }

  if (bmi < 25) {
    return {
      type: "positive",
      title: "BMI is within the usual healthy range",
      summary: `Your BMI is ${value}. This places your current BMI within the 18.5–24.9 range.`,
      why: `A BMI of ${value} is currently within the usual healthy BMI range. That is a positive signal in your current profile, although BMI should still be considered alongside your other health measurements.`,
      contributing:
        activity !== null && activity < 30
          ? `Your BMI is currently in this range, while your recorded activity is ${activity} minutes. Body weight is only one part of the picture, so LifePredict also considers your lifestyle pattern.`
          : "BMI reflects the relationship between your recorded weight and height. Nutrition, physical activity, sleep and other individual factors can influence how it changes over time.",
      next: "Continue the habits supporting your current range and keep tracking your measurements so LifePredict can recognize meaningful changes.",
    };
  }

  if (bmi < 27) {
    return {
      type: "watch",
      title: "BMI is slightly above the usual healthy range",
      summary: `Your BMI is ${value}. This places your current BMI in the 25.0–26.9 range.`,
      why: `At ${value}, your BMI is only moderately above the usual healthy range. This is better interpreted as one part of your overall profile rather than as a conclusion about your health by itself.`,
      contributing:
        weight !== null && activity !== null
          ? `Your recorded weight is ${weight.toFixed(
              1
            )} kg and your activity is ${activity} minutes. These values provide additional context, while nutrition, sleep, stress and other factors can also influence body weight.`
          : "Body weight can be influenced by nutrition, physical activity, sleep, stress, genetics and other health factors.",
      next: "Focus on sustainable food, movement and sleep habits and watch how your BMI changes over time rather than reacting to a single measurement.",
    };
  }
  if (bmi < 30) {
    return {
      type: "watch",
      title: "BMI is in the overweight range",
      summary: `Your BMI is ${value}. At this value, your BMI falls within the 27.0–29.9 range.`,
      why: `At ${value}, your BMI is above the usual healthy range. In your current profile, this may be relevant when considered alongside your weight, activity, blood pressure and other available measurements.`,
      contributing:
        weight !== null && activity !== null
          ? `Your current weight is ${weight.toFixed(
              1
            )} kg and your recorded activity is ${activity} minutes. These provide context, but they do not establish the cause of your BMI.`
          : "Body weight can be influenced by nutrition, activity, sleep, stress, genetics, medications and other health factors. BMI alone cannot identify which factor is responsible.",
      next:
        systolic !== null && systolic >= 130
          ? `Because your BMI is ${value} and your blood pressure is also being monitored, focus on sustainable food, movement and sleep habits and track both measurements over time.`
          : "Focus on sustainable food, movement and sleep habits and monitor how your measurements change over time.",
    };
  }
  if (bmi < 35) {
    return {
      type: "attention",
      title: "BMI is in the obesity range",
      summary: `Your BMI is ${value}. At this value, your BMI falls within the 30.0–34.9 obesity range.`,
      why: `At ${value}, your BMI is above the usual healthy range and is an important part of your current health profile. It becomes more meaningful when interpreted alongside measurements such as blood pressure, cholesterol, activity and sleep.`,
      contributing:
  activity !== null && sleep !== null
    ? `Your current BMI is ${value}, with ${activity} minutes of recorded activity and ${sleep} hours of sleep. Activity and sleep provide useful context for understanding your current health profile.`
    : weight !== null
      ? `Your recorded weight is ${weight.toFixed(
          1
        )} kg. Nutrition, physical activity, sleep, stress, genetics, medications and other health factors can influence body weight. BMI alone cannot identify which factor is responsible.`
      : "Nutrition, physical activity, sleep, stress, genetics, medications and other health factors can influence body weight.",
next:
  cholesterol !== null && cholesterol > 200
    ? `Your BMI is ${value} and your total cholesterol is ${cholesterol} mg/dL. Rather than focusing on weight alone, consider your complete health profile and how these measurements change over time.`
    : "Work toward gradual, sustainable lifestyle changes and track how your weight, activity, sleep and other health measurements change over time."
    };
  }
  return {
    type: "attention",
    title: "BMI is in a higher obesity range",
    summary: `Your BMI is ${value}. At this value, your BMI is 35.0 or higher.`,
    why: `At ${value}, your BMI is substantially above the usual healthy range and is an important part of your overall health profile. Its meaning is strongest when considered together with your other measurements.`,
    contributing:
      weight !== null && activity !== null
        ? `Your recorded weight is ${weight.toFixed(
            1
          )} kg and your activity is ${activity} minutes. These provide context, while nutrition, sleep, stress, genetics, medications and underlying health factors may also influence body weight.`
        : "Body weight can be influenced by nutrition, physical activity, sleep, stress, genetics, medications and underlying health conditions. BMI alone cannot establish the cause.",
    next: "Use gradual, sustainable changes and your complete health profile rather than focusing on BMI as an isolated number. Persistent concerns should be discussed with a qualified healthcare professional.",
  };
}

/* =========================================================
   BLOOD PRESSURE PERSONALIZED ANALYSIS
========================================================= */

function getBpAnalysis(systolic, diastolic, bmi, cholesterol, activity) {
  if (systolic === null || diastolic === null) return null;
  const value = `${systolic}/${diastolic}`;
  if (systolic >= 180 || diastolic >= 120) {
    return {
      type: "attention",
      title: "Blood pressure is in a very high range",
      summary: `Your recorded blood pressure is ${value} mmHg. Both the systolic and diastolic values should be taken seriously at this level.`,
      why: `Your current reading of ${value} mmHg is substantially elevated. A single reading does not establish a diagnosis, but readings in this range warrant prompt attention, especially if they persist or are accompanied by concerning symptoms.`,
      contributing:
        "Blood pressure can be influenced by sodium intake, activity, stress, sleep, alcohol, smoking, medications, genetics and underlying health conditions. One reading cannot identify the cause.",
      next: "Repeat the measurement correctly after resting and seek prompt medical guidance, particularly if a very high reading persists or you have concerning symptoms.",
    };
  }
  if (systolic >= 140 || diastolic >= 90) {

    return {
      type: "attention",
      title: "Blood pressure is high",
      summary: `Your recorded blood pressure is ${value} mmHg. One or both values are above the range LifePredict flags for closer monitoring.`,
      why: `At ${value} mmHg, your current reading is elevated enough to deserve closer attention, particularly if similar readings occur repeatedly.`,
      contributing:
        bmi !== null && bmi >= 25
          ? `Your BMI is ${bmi.toFixed(
              1
            )}, which gives additional context alongside this reading. Other possible contributors include sodium intake, physical activity, alcohol, smoking, stress, sleep, medications and underlying health conditions.`
          : "Possible contributors include sodium intake, physical activity, alcohol, smoking, stress, sleep, medications and underlying health conditions. One reading cannot establish the cause.",
      next:
        cholesterol !== null && cholesterol > 200
          ? `Your blood pressure is ${value} mmHg and your total cholesterol is ${cholesterol} mg/dL. Repeat blood-pressure measurements under consistent conditions and discuss persistent elevation with a qualified healthcare professional.`
          : "Repeat measurements under consistent conditions and look at the pattern over time rather than relying on one reading. Persistent elevation should be discussed with a qualified healthcare professional.",
    };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      type: "watch",
      title: "Blood pressure is worth monitoring",
      summary: `Your recorded blood pressure is ${value} mmHg. One or both values are above the lower range LifePredict uses for routine monitoring.`,
      why: `At ${value} mmHg, your reading is not in the most elevated range, but it is useful to watch the trend if similar values continue to appear.`,
      contributing:
        bmi !== null && bmi >= 25
          ? `Your BMI is ${bmi.toFixed(
              1
            )}, providing additional context. Activity, sodium intake, alcohol, stress, sleep, medications and other factors may also influence blood pressure.`
          : "Blood pressure can vary with activity, sodium intake, stress, sleep, alcohol, medications and other factors. A single reading cannot identify the cause.",
      next:
        activity !== null && activity < 30
          ? `Your current activity record is ${activity} minutes. Keep recording blood pressure consistently while gradually building a more active routine if appropriate for you.`
          : "Keep recording blood pressure consistently under similar conditions so changes can be interpreted as a trend.",
    };
  }
  return {

    type: "positive",
    title: "Blood pressure is currently in a lower range",
    summary: `Your recorded blood pressure is ${value} mmHg. Neither value is currently flagged by LifePredict's monitoring rule.`,
    why: `Your current reading of ${value} mmHg is not currently flagged by the rule used on this page. This is a positive signal in your current profile, while continued tracking can show how it changes over time.`,
    contributing:
      "Blood pressure is influenced by activity, nutrition, sleep, stress, medications, genetics and individual health conditions.",
    next: "Continue recording readings consistently so LifePredict can identify meaningful changes in your personal trend.",
  };
}
/* =========================================================
   CHOLESTEROL PERSONALIZED ANALYSIS
========================================================= */
function getCholesterolAnalysis(cholesterol, bmi, activity) {
  if (cholesterol === null) return null;
  const value = cholesterol.toFixed(0);
  const above = cholesterol - 200;
  if (cholesterol >= 240) {
    return {
      type: "attention",
      title: "Total cholesterol is well above the desirable range",
      summary: `Your recorded total cholesterol is ${value} mg/dL, which is well above the 200 mg/dL desirable threshold.`,
      why: `At ${value} mg/dL, your total cholesterol is substantially above the desirable threshold. Total cholesterol is only one part of a lipid profile and should be interpreted alongside other measurements when available.`,
      contributing:
        bmi !== null && activity !== null
          ? `Your BMI is ${bmi.toFixed(
              1
            )} and your recorded activity is ${activity} minutes. Food pattern, physical activity, body weight, genetics and metabolic factors can all influence cholesterol.`
          : "Food pattern, physical activity, genetics, body weight and metabolic conditions can influence cholesterol. Total cholesterol alone cannot identify the cause.",
      next: "Track your lipid measurements over time and consider the complete lipid profile rather than total cholesterol alone.",
    };
  }
  if (cholesterol > 200) {
    return {
      type: "watch",
      title: "Total cholesterol is above the desirable range",
      summary: `Your recorded total cholesterol is ${value} mg/dL, which is ${above} mg/dL above the 200 mg/dL desirable threshold.`,
      why: `At ${value} mg/dL, your total cholesterol is above the desirable threshold. The degree of elevation matters, but total cholesterol becomes much more useful when interpreted with your other measurements and the rest of your lipid profile.`,
      contributing:
        bmi !== null && bmi >= 25
          ? `Your BMI is ${bmi.toFixed(
              1
            )}, providing additional context. Food pattern, activity, genetics, body weight and metabolic factors may all influence cholesterol.`
          : "Food pattern, physical activity, genetics, body weight and metabolic conditions can influence cholesterol.",
      next:
        activity !== null && activity < 30
          ? `Your recorded activity is ${activity} minutes. Focus on sustainable food and activity habits and look at your full lipid profile rather than treating total cholesterol as an isolated number.`
          : "Focus on sustainable food and activity habits and look at your full lipid profile rather than treating total cholesterol as an isolated number.",
    };
  }
  if (cholesterol >= 180) {
    return {
      type: "watch",
      title: "Total cholesterol is within the desirable threshold",
      summary: `Your recorded total cholesterol is ${value} mg/dL. It is currently below the 200 mg/dL threshold, but is worth following over time.`,
      why: `At ${value} mg/dL, your total cholesterol is below the 200 mg/dL threshold used on this page. Tracking the trend is still useful because cholesterol can change with lifestyle and other health factors.`,
      contributing:
        bmi !== null && bmi >= 25
          ? `Your BMI is ${bmi.toFixed(
              1
            )}, which provides additional context. Food pattern, activity, body weight, genetics and metabolic factors can influence cholesterol over time.`
          : "Food pattern, activity, genetics, body weight and metabolic factors can influence cholesterol over time.",
      next: "Continue sustainable food and activity habits and monitor your lipid profile when measurements are available.",
    };
  }

  return {
    type: "positive",
    title: "Total cholesterol is within the desirable range",
    summary: `Your recorded total cholesterol is ${value} mg/dL, which is below the 200 mg/dL desirable threshold.`,
    why: `At ${value} mg/dL, your total cholesterol is not currently flagged by LifePredict's monitoring rule. This is a positive signal in your current profile.`,
    contributing:
      "Cholesterol is influenced by food pattern, activity, genetics, body weight and metabolic factors.",
    next: "Continue your current healthy habits and keep tracking your lipid measurements when they are available.",
  };
}

/* =========================================================
   ACTIVITY PERSONALIZED ANALYSIS
========================================================= */
function getActivityAnalysis(activity, sleep, bmi) {
  if (activity === null) return null;
  if (activity === 0) {
    return {
      type: "attention",
      title: "Daily activity could be stronger",
      summary: "Your current health record contains 0 minutes of physical activity for this day.",
      why: "Your current activity record shows no recorded movement for this day. Regular physical activity supports cardiovascular fitness and can contribute to healthy weight and blood-pressure management.",
      contributing:
        sleep !== null && sleep < 6
          ? `Your recorded sleep is ${sleep} hours, which provides additional lifestyle context. Low activity can also occur with limited exercise time, fatigue, a busy routine or other individual factors.`
          : bmi !== null && bmi >= 30
          ? `Your BMI is ${bmi.toFixed(
              1
            )}, so activity is an especially useful variable to track alongside your other measurements. The activity value alone cannot identify the reason for low movement.`
          : "Low activity can reflect limited exercise time, a sedentary routine, fatigue or other individual factors. The activity value alone cannot identify the reason.",
      next: "Start with realistic, sustainable movement that fits your routine and keep recording your activity so LifePredict can recognize changes over time.",
    };
  }

  if (activity < 15) {
    return {
      type: "attention",
      title: "Daily activity is currently very low",
      summary: `You recorded ${activity} minutes of physical activity today.`,
      why: `Your current activity record of ${activity} minutes is relatively limited. Activity is one of the lifestyle variables worth tracking alongside your other health measurements.`,
      contributing:
        sleep !== null && sleep < 6
          ? `You recorded ${sleep} hours of sleep. Low activity can be related to limited exercise time, fatigue, sleep pattern or an inconsistent routine, but your activity record alone cannot identify the reason.`
          : "Low activity can reflect limited exercise time, a sedentary routine, fatigue or an inconsistent schedule.",
      next: `Look for sustainable ways to increase movement from your current ${activity} minutes and monitor how your routine changes over time.`,
    };
  }
  if (activity < 30) {
    return {
      type: "watch",
      title: "Daily activity is currently limited",
      summary: `You recorded ${activity} minutes of physical activity today.`,
      why: `At ${activity} minutes, your current activity is present but still relatively limited. Tracking the trend will give LifePredict better context than a single day's value.`,
      contributing:
        bmi !== null && bmi >= 25
          ? `Your BMI is ${bmi.toFixed(
              1
            )}. Activity is one modifiable lifestyle factor that can be considered alongside body weight, sleep and other measurements.`
          : "Activity can vary with your schedule, exercise opportunities, sleep, fatigue and other individual factors.",
      next: `Gradually build from your current ${activity} minutes in a sustainable way and keep recording your activity.`,
    };
  }
  if (activity < 60) {
    return {
      type: "positive",
      title: "Physical activity is currently recorded",
      summary: `You recorded ${activity} minutes of physical activity today.`,
      why: `Your current activity record of ${activity} minutes is a positive lifestyle signal. Regular activity can support cardiovascular fitness and healthy weight and blood-pressure management.`,
      contributing:
        sleep !== null && sleep >= 7
          ? `You also recorded ${sleep} hours of sleep, giving LifePredict useful context around your current lifestyle pattern.`
          : "Your activity value tells LifePredict how much activity was recorded today, but not the intensity or type of exercise.",
      next: "Keep your activity consistent and continue recording it so LifePredict can identify your longer-term pattern.",
    };
  }

  return {
    type: "positive",
    title: "Physical activity is currently strong",
    summary: `You recorded ${activity} minutes of physical activity today.`,
    why: `Your current activity record of ${activity} minutes is a positive signal in your lifestyle profile. Regular activity supports cardiovascular fitness and can contribute to healthy weight and blood-pressure management.`,
    contributing:
      "The activity value tells LifePredict how much activity was recorded, but not the intensity or type of exercise.",
    next: "Maintain a sustainable activity routine and continue recording it so LifePredict can identify your longer-term pattern.",
  };
}
/* ========================================================
   AGE PERSONALIZED ANALYSIS
========================================================= */
function getAgeAnalysis(age, bmi, systolic, cholesterol) {
  if (age === null) return null;
  if (age < 30) {
    return {
      type: "info",
      title: "Your age provides important context",
      summary: `Your recorded age is ${age} years.`,
      why: `At ${age} years, age itself provides useful context but does not cancel out other cardiovascular or lifestyle measurements.`,
      contributing:
        bmi !== null && systolic !== null
          ? `Your current BMI is ${bmi.toFixed(
              1
            )} and your blood pressure is ${systolic} mmHg systolic. These measurements provide more specific context than age alone.`
          : "Blood pressure, cholesterol, body weight, activity, sleep, family history and other health factors can still matter at a younger age.",
      next: "Use your current age as an opportunity to identify and improve modifiable lifestyle factors early and build a consistent health history.",
    };
  }
  if (age < 45) {
    return {
      type: "info",
      title: "Your age adds useful health context",
      summary: `Your recorded age is ${age} years.`,
      why: `At ${age} years, age is one part of your overall health picture and becomes more useful when interpreted alongside your current measurements.`,
      contributing:
        cholesterol !== null && cholesterol > 200
          ? `Your current total cholesterol is ${cholesterol} mg/dL, so age is being considered alongside a measurement that LifePredict is also monitoring.`
          : "Lifestyle, body weight, blood pressure, cholesterol, activity, sleep and family history can all provide additional context.",
      next: "Continue building a consistent health history so LifePredict can track how your measurements change over time.",
    };
  }
  if (age < 60) {
    return {
      type: "info",
      title: "Your age is part of your overall health context",
      summary: `Your recorded age is ${age} years.`,
      why: `At ${age} years, age provides useful background for interpreting your current health measurements, but it should not be viewed in isolation.`,
      contributing:
        "Your current blood pressure, cholesterol, body weight, activity, sleep and other available measurements provide additional context.",
      next: "Continue regular health tracking and focus on the factors you can meaningfully monitor and improve.",
    };
  }
  return {
    type: "info",
    title: "Age provides important health context",
    summary: `Your recorded age is ${age} years.`,
    why: `At ${age} years, age is an important part of your overall health context and should be interpreted together with your current measurements and lifestyle pattern.`,
    contributing:
      "Blood pressure, cholesterol, body weight, activity, sleep, medications, family history and other health factors can all contribute to the broader picture.",
    next: "Continue regular health tracking and discuss persistent or changing measurements with a qualified healthcare professional when appropriate.",
  };
}



/* =======================================================
   MAIN COMPONENT
========================================================= */
function PatientPredictions() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorConnection, setDoctorConnection] = useState(null);
  const [doctorConnectionLoading, setDoctorConnectionLoading] = useState(true);
  const [doctorConnectionError, setDoctorConnectionError] = useState("");
  const [doctorReviewHistory, setDoctorReviewHistory] = useState([]);
  const [loadingDoctorHistory, setLoadingDoctorHistory] = useState(false);
  const [showAllDoctorHistory, setShowAllDoctorHistory] = useState(false);
  const [todayHealthRecord, setTodayHealthRecord] = useState(null);

  // Fetch the complete review history once. The latest review is shown in the
  // Latest Feedback card; two older reviews appear below it by default.
  async function fetchDoctorReviewHistory(token) {
    try {
      setLoadingDoctorHistory(true);

      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/connections/patient/reviews?all=true",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch doctor review history.");
      }

      setDoctorReviewHistory(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (err) {
      // History failure must not hide successfully loaded doctor details.
      console.error("Doctor review history error:", err);
      setDoctorReviewHistory([]);
    } finally {
      setLoadingDoctorHistory(false);
    }
  }

  async function fetchDoctorConnection() {
    try {
      setDoctorConnectionLoading(true);
      setDoctorConnectionError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setDoctorConnection(null);
        setDoctorConnectionError("Please log in to view your doctor.");
        setDoctorReviewHistory([]);
        return;
      }

      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/connections/patient",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
     console.log("DOCTOR CONNECTION API:", data);
     console.log("LATEST DOCTOR REVIEW:", data.latestDoctorReview);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch doctor connection.");
      }

      setDoctorConnection(data);

      if (data.connected && data.connection?.status === "accepted") {
        setShowAllDoctorHistory(false);
        await fetchDoctorReviewHistory(token);
      } else {
        setDoctorReviewHistory([]);
        setShowAllDoctorHistory(false);
      }
    } catch (err) {
      console.error("Doctor connection error:", err);
      setDoctorConnection(null);
      setDoctorConnectionError(
        err.message || "Unable to load your doctor details. Please try again."
      );
    } finally {
      setDoctorConnectionLoading(false);
    }
  }
  function handleToggleDoctorHistory() {
   setShowAllDoctorHistory((current) => !current);
  }
  async function fetchPrediction() {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }
      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/predictions/predict",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
console.log("PREDICTION API RESPONSE:", data);
console.log("PREDICTION INPUT:", data.predictionInput);
console.log("PREDICTION RESULT:", data.prediction);
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to generate prediction."
        );
      }
      setPrediction(data);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(
        err.message || "Unable to generate prediction."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayHealthRecord() {
  try {
    const token = localStorage.getItem("token");

    if (!token) return;

    const response = await fetch(
      "https://lifepredict-production.up.railway.app/api/health-records/today",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.message || "Unable to load today's health record."
      );
    }

    setTodayHealthRecord(
      data.exists && data.record ? data.record : null
    );
  } catch (err) {
    console.error("Today's health record error:", err);
    setTodayHealthRecord(null);
  }
}

useEffect(() => {
  async function loadPageData() {
    await fetchTodayHealthRecord();

    fetchPrediction();
    fetchDoctorConnection();
  }

  loadPageData();
}, []);



  /* =======================================================
     LOADING
  ======================================================= */
  if (loading) {
    return (
      <div className="prediction-page">
        <div className="prediction-loading">
          <div className="prediction-loading-icon">
            <RefreshCw
              size={28}
              className="loading-spin"
            />
          </div>
          <h2>Analyzing your health data</h2>
          <p>
            LifePredict is analyzing your latest health and
            lifestyle information to generate your
            personalized health assessment.
          </p>
        </div>
      </div>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */
  if (error) {
    return (
      <div className="prediction-page">
        <div className="prediction-error">
          <div className="prediction-error-icon">
            <AlertCircle size={28} />
          </div>
          <h2>Unable to generate prediction</h2>
          <p>{error}</p>
          <button
            type="button"
            className="prediction-retry"
            onClick={fetchPrediction}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (!prediction) {
    return null;
  }


  /* =======================================================
     RESPONSE DATA
  ======================================================= */
  
const input = prediction.predictionInput || {};
const result = prediction.prediction || {};

const systolic = numeric(input.ap_hi ?? input.systolic);
const diastolic = numeric(input.ap_lo ?? input.diastolic);

const bmi = numeric(input.BMI ?? input.bmi);
const weight = numeric(input.weight ?? input.weight_kg);

const cholesterol = numeric(
  input.totalCholesterol ??
  input.total_cholesterol ??
  input.cholesterol
);

const activity = firstNumeric(
  input.physicalActivityMinutes,
  input.physical_activity_minutes,
  input.activityMinutes,
  input.activity_minutes,
  input.physicalActivity,
  input.physical_activity,
  input.activity,
  todayHealthRecord?.physical_activity_minutes
);

const sleep = firstNumeric(
  input.sleepHours,
  input.sleep_hours,
  input.sleepDuration,
  input.sleep_duration,
  todayHealthRecord?.sleep_hours
);


const age = numeric(input.age_years ?? input.age);

const stress =
  input.stressLevel ?? input.stress_level;

const smoking =
  todayHealthRecord?.smoking_today ??
  input.smokingToday ??
  input.smoking_today ??
  input.smoking ??
  input.smoke;

const alcohol =
  todayHealthRecord?.alcohol_today ??
  input.alcoholToday ??
  input.alcohol_today ??
  input.alcohol ??
  input.alco;


console.log("PREDICTION INPUT:", input);
console.log("INPUT KEYS:", Object.keys(input));
console.log("FULL INPUT:", JSON.stringify(input, null, 2));
console.log("ACTIVITY VALUE:", activity);
console.log("SLEEP VALUE:", sleep);
console.log("BMI VALUE:", bmi);
console.log("CHOLESTEROL VALUE:", cholesterol);


const cardioProbability =
  Number(result.probability_cardio ?? 0) * 100;

const noCardioProbability =
  Number(result.probability_no_cardio ?? 0) * 100;

const predictedPositive =
  Number(result.prediction) === 1;


  /* =======================================================
     PERSONALIZED ANALYSES
  ======================================================= */
  const bmiAnalysis = getBmiAnalysis(
    bmi,
    weight,
    activity,
    sleep,
    cholesterol,
    systolic
  );
  const bpAnalysis = getBpAnalysis(
    systolic,
    diastolic,
    bmi,
    cholesterol,
    activity
  );
  const cholesterolAnalysis =
    getCholesterolAnalysis(
      cholesterol,
      bmi,
      activity
    );
  const activityAnalysis =
    getActivityAnalysis(
      activity,
      sleep,
      bmi
    );
  const ageAnalysis = getAgeAnalysis(
    age,
    bmi,
    systolic,
    cholesterol
  );


  /* =======================================================
     HEALTH STORY CARDS
  ======================================================= */
  const healthStoryCards = [];
  if (bpAnalysis) {
    healthStoryCards.push({
      id: "bp",
      icon: HeartPulse,
      ...bpAnalysis,
      value:
        systolic !== null && diastolic !== null
          ? `${systolic}/${diastolic} mmHg`
          : "—",
    });
  }
  if (bmiAnalysis) {
    healthStoryCards.push({
      id: "bmi",
      icon: Scale,
      ...bmiAnalysis,
      value:
        bmi !== null
          ? `BMI ${bmi.toFixed(1)}${
              weight !== null
                ? ` • ${weight.toFixed(1)} kg`
                : ""
            }`
          : "—",
    });
  }
  if (cholesterolAnalysis) {
    healthStoryCards.push({
      id: "cholesterol",
      icon: Activity,
      ...cholesterolAnalysis,
      value:
        cholesterol !== null
          ? `${cholesterol} mg/dL`
          : "—",
    });
  }
  if (activityAnalysis) {
    healthStoryCards.push({
      id: "activity",
      icon: Footprints,
      ...activityAnalysis,
      value:
        activity !== null
          ? `${activity} min`
          : "—",
    });
  }
  if (ageAnalysis) {
    healthStoryCards.push({
      id: "age",
      icon: Target,
      ...ageAnalysis,
      value:
        age !== null
          ? `${age} years`
          : "—",
    });
  }


  /* =======================================================
     HEALTH PROFESSIONAL REVIEW
  ======================================================= */
  const professionalReviewItems = healthStoryCards
    .filter(
      (card) =>
        card.type === "attention" ||
        card.type === "watch"
    )
    .slice(0, 3)
    .map((card) => ({
      id: card.id,
      icon: card.icon,
      title: card.title,
      text: card.next,
      value: card.value,
    }));




/* =======================================================
   POSITIVE SIGNALS — INDEPENDENT OR CONDITIONS
======================================================= */

const positiveSignals = [];

// Each condition is independent.
// One matching condition is enough to display its card.

// Activity
if (activity !== null && activity >= 30) {
  positiveSignals.push({
    id: "activity",
    icon: Footprints,
    title: "You're making time for physical activity",
    text: `You've recorded ${activity} minutes of activity. Keep building a consistent routine.`,
  });
}

// Sleep
if (sleep !== null && sleep >= 7 && sleep <= 9) {
  positiveSignals.push({
    id: "sleep",
    icon: Moon,
    title: "Your sleep duration is in a healthy range",
    text: `You've recorded ${sleep} hours of sleep. Maintaining a regular schedule can support wellbeing.`,
  });
}

// BMI
if (bmi !== null && bmi >= 18.5 && bmi < 25) {
  positiveSignals.push({
    id: "bmi",
    icon: Scale,
    title: "Your BMI is within the usual healthy range",
    text: `Your recorded BMI is ${bmi.toFixed(1)}.`,
  });
}

// Cholesterol
if (cholesterol !== null && cholesterol >= 0 && cholesterol <= 200) {
  positiveSignals.push({
    id: "cholesterol",
    icon: Activity,
    title: "Your total cholesterol is within the desirable range",
    text: `Your recorded total cholesterol is ${cholesterol} mg/dL.`,
  });
}

// Smoking: show a positive signal for an explicit "no"
if (isNegativeLifestyleAnswer(smoking)) {
  positiveSignals.push({
    id: "smoking",
    icon: CheckCircle2,
    title: "You're making a positive choice for your health",
    text: "Your current record indicates no smoking.",
  });
}

// Alcohol: show a positive signal for an explicit "no"
if (isNegativeLifestyleAnswer(alcohol)) {
  positiveSignals.push({
    id: "alcohol",
    icon: CheckCircle2,
    title: "A positive lifestyle signal",
    text: "Your current record indicates no alcohol use.",
  });
}

// Positive factors returned by the prediction API
const apiFactors = [
  ...(Array.isArray(result.factors) ? result.factors : []),
  ...(Array.isArray(prediction.factors) ? prediction.factors : []),
];

apiFactors.forEach((factor, index) => {
  const isPositive =
    normalizeAnswer(factor.type) === "positive" ||
    normalizeAnswer(factor.status) === "positive";

  if (!isPositive) return;

  const name = String(factor.factor ?? "Health habit");

  // Prevent duplicate cards for the same factor
  const alreadyExists = positiveSignals.some(
    (signal) =>
      signal.id === `api-${normalizeAnswer(name)}` ||
      normalizeAnswer(signal.title) ===
        normalizeAnswer(`${name} is a positive signal`)
  );

  if (alreadyExists) return;

  positiveSignals.push({
    id: `api-${normalizeAnswer(name) || index}`,
    icon: CheckCircle2,
    title: `${name} is a positive signal`,
    text: `${name}: ${factor.value ?? factor.status}. Keep maintaining healthy habits.`,
  });
});

  /* =======================================================
     CONNECTED INTERPRETATION
  ======================================================= */
  const connectedValues = [];
  if (bpAnalysis) {
    connectedValues.push(
      `blood pressure (${systolic}/${diastolic} mmHg)`
    );
  }
  if (bmi !== null) {
    connectedValues.push(
    `BMI (${bmi.toFixed(1)})`
    );
  }
  if (cholesterol !== null) {
    connectedValues.push(
      `total cholesterol (${cholesterol} mg/dL)`
    );
  }
  if (activity !== null) {
    connectedValues.push(
      `physical activity (${activity} min)`
    );
  }
  const elevated = [];
  if (
    bpAnalysis &&
    bpAnalysis.type === "attention"
  ) {
    elevated.push("blood pressure");
  }
  if (
    bmiAnalysis &&
    bmiAnalysis.type === "attention"
  ) {
    elevated.push("BMI");
  }
  if (
    cholesterolAnalysis &&
    cholesterolAnalysis.type === "attention"
  ) {
    elevated.push("cholesterol");
  }
  if (
    activityAnalysis &&
    activityAnalysis.type === "attention"
  ) {
    elevated.push("activity");
  }
  let connectedText;
  if (connectedValues.length === 0) {
    connectedText =
      "LifePredict uses the health information available to build a broader picture rather than treating one measurement as the whole story.";
  } else if (elevated.length >= 2) {
    connectedText = `Your current profile shows ${connectedValues.join(
      ", "
    )}. LifePredict is highlighting ${elevated.join(
      " and "
    )} because these measurements can provide related cardiovascular and lifestyle context when considered together. This does not mean that one measurement caused another, and it does not turn the model estimate into a personal diagnosis.`;
  } else {
    connectedText = `Your current profile includes ${connectedValues.join(
      ", "
    )}. LifePredict considers these measurements together rather than treating one number as the complete picture. The current assessment reflects the information available at this check-in.`;
  }


  /* =======================================================
     LIFESTYLE SIGNALS
  ======================================================= */
  const lifestyleSignals = [];
 
if (
  isPositiveLifestyleAnswer(smoking) ||
  isNegativeLifestyleAnswer(smoking)
) {
  const smokingYes = isPositiveLifestyleAnswer(smoking);

  lifestyleSignals.push({
    type: smokingYes ? "watch" : "positive",
    icon: Cigarette,
    title: smokingYes
      ? "Smoking is recorded"
      : "No smoking recorded",
    text: smokingYes
      ? "Smoking is included as part of your current lifestyle context."
      : "Your current record indicates no smoking.",
  });
}

if (
  isPositiveLifestyleAnswer(alcohol) ||
  isNegativeLifestyleAnswer(alcohol)
) {
  const alcoholYes = isPositiveLifestyleAnswer(alcohol);

  lifestyleSignals.push({
    type: alcoholYes ? "watch" : "positive",
    icon: Wine,
    title: alcoholYes
      ? "Alcohol use is recorded"
      : "No alcohol use is recorded",
    text: alcoholYes
      ? "Alcohol can provide additional lifestyle context, particularly when intake is frequent or high."
      : "Your current record indicates no alcohol use.",
  });
}

  if (stress) {
    const stressText =
      String(stress).toLowerCase();
    lifestyleSignals.push({
      type: stressText.includes("high")
        ? "watch"
        : "info",
      icon: Brain,
      title: `Stress is recorded as ${stressText}`,
      text:
        "Stress can be reviewed alongside sleep, activity and other health measurements as your history develops.",
    });
  }
  if (sleep !== null) {
    lifestyleSignals.push({
      type: sleep < 6 ? "watch" : "info",
      icon: Moon,
      title: `${sleep} hours of sleep recorded`,
      text:
        sleep < 6
          ? "Your current sleep duration is relatively low and is worth tracking alongside your other lifestyle factors."
          : "Continuing to track sleep can help LifePredict understand changes in your lifestyle pattern.",
    });
  }


  /* =======================================================
     HEALTH FACTORS
  ======================================================= */
  const healthFactors = [];
  if (
    systolic !== null &&
    diastolic !== null
  ) {
    healthFactors.push({
      icon: HeartPulse,
      name: "Blood pressure",
      value: `${systolic}/${diastolic} mmHg`,
    });
  }
  if (bmi !== null) {
    healthFactors.push({
      icon: Scale,
      name: "BMI / body weight",
      value:
        weight !== null
          ? `${bmi.toFixed(1)} • ${weight.toFixed(1)} kg`
          : bmi.toFixed(1),
    });
  }
  if (cholesterol !== null) {
    healthFactors.push({
      icon: Activity,
      name: "Cholesterol",
      value: `${cholesterol} mg/dL`,
    });
  }
  if (age !== null) {
    healthFactors.push({
      icon: Target,
      name: "Age",
      value: `${age} years`,
    });
  }
  if (activity !== null) {
    healthFactors.push({
      icon: Footprints,
      name: "Physical activity",
      value: `${activity} min`,
    });
  }
  if (sleep !== null) {
    healthFactors.push({
      icon: Moon,
      name: "Sleep",
      value: `${sleep} hrs`,
    });
  }


  /* =======================================================
     RENDER
  ====================================================== */
  return (
    <div className="prediction-page">
      {/* HEADER */}
      <div className="prediction-header">
        <div>
          <span className="prediction-eyebrow">
            PERSONALIZED HEALTH ANALYSIS
          </span>
          <h1>Health Predictions</h1>
          <p>
            Understand what your current health data may
            mean, what may be influencing your
            model-estimated cardiovascular result, and
            which areas you can monitor next.
          </p>
        </div>
        <button
          type="button"
          className="prediction-refresh"
          onClick={fetchPrediction}
        >
          <RefreshCw size={17} />
          Refresh Analysis
        </button>
      </div>
      {/* MAIN RISK CARD */}
      <section className="prediction-main-card">
        <div className="prediction-main-left">
          <div className="prediction-card-icon">
            <HeartPulse size={26} />
          </div>
          <div className="prediction-main-content">
            <span className="prediction-card-label">
              MODEL-ESTIMATED CARDIOVASCULAR PROBABILITY
            </span>
            <div className="prediction-risk-line">
              <h2>
                {cardioProbability.toFixed(1)}%
              </h2>
              <span
                className={`risk-badge ${
                  predictedPositive
                    ? "risk-attention"
                    : "risk-normal"
                }`}
              >
                {predictedPositive ? (
                  <AlertCircle size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {predictedPositive
                  ? "Attention recommended"
                  : "No elevated model flag"}
              </span>
            </div>
            <h3>
              This is a model result — not a diagnosis
            </h3>
            <p>
              LifePredict's machine-learning model produces
              this estimate from the health information
              currently available. It should not be
              interpreted as your personal probability of
              having a specific medical event.
            </p>
          </div>
        </div>
        <div className="prediction-result">
          <div className="prediction-result-header">
            <span>MODEL PROBABILITY</span>
            <strong>
              {cardioProbability.toFixed(1)}%
            </strong>
          </div>
          <div className="prediction-bar">
            <div
              className="prediction-bar-fill"
              style={{
                width: `${Math.min(
                  Math.max(cardioProbability, 0),
                  100
              )}%`,
              }}
            />
          </div>
          <div className="prediction-bar-labels">
            <span>0%</span>
            <span>Model estimate</span>
            <span>100%</span>
          </div>
          <div className="prediction-status-line">
            <Info size={17} />
            <span>
              This percentage comes from the trained
              cardiovascular model and depends on the
              health information supplied to it.
            </span>
          </div>
        </div>
      </section>
      {/* AI INSIGHTS + DOCTOR INSIGHT */}
      <section className="prediction-section insights-doctor-section">
        <div className="insights-doctor-grid">
          {/* AI HEALTH INSIGHTS CARD */}
          <div className="insight-panel ai-insight-panel">
            <div className="insight-panel-heading">
              <span>AI HEALTH INSIGHTS</span>
              <h2>What your recent data is telling you</h2>
              <p>
                LifePredict looks across your current health information to
                highlight patterns, measurements worth monitoring, and positive
                changes worth continuing.
              </p>
            </div>
            <div className="ai-insights-grid">
              {healthStoryCards.length > 0 ? (
                healthStoryCards.slice(0, 4).map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      className={`ai-insight-card ${card.type}`}
                      key={card.id}
                    >
                      <div className="ai-insight-top">
                        <div className="ai-insight-icon">
                          <Icon size={19} />
                        </div>
                        <span className="ai-insight-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.summary}</p>
                      <span className="ai-insight-value">
                        {card.value}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="empty-ai-card">
                  <Info size={19} />
                  <p>
                    More health information is needed to generate personalized
                    insights.
                  </p>
                </div>
              )}
            </div>
          </div>
{/* DOCTOR INSIGHT CARD */}
<div className="insight-panel doctor-insight-panel">
  <div className="insight-panel-heading">
    <span>HEALTH PROFESSIONAL REVIEW</span>
    <h2>Reviews From The Doctor Connected</h2>
    <p>
      Review and guidance shared by your connected healthcare professional.
    </p>
  </div>
  {doctorConnectionLoading ? (
    <div className="doctor-review-area doctor-review-loading">
      <div className="doctor-review-status">
        <Stethoscope size={22} />
      </div>
      <div className="doctor-review-copy">
        <span>DOCTOR INSIGHT</span>
        <h3>Checking your doctor connection...</h3>
        <p>Please wait while we retrieve your latest review.</p>
      </div>
    </div>
  ) : doctorConnectionError ? (
    <div className="doctor-review-area">
      <div className="doctor-review-status">
        <Stethoscope size={22} />
      </div>
      <div className="doctor-review-copy">
        <span>DOCTOR INSIGHT</span>
        <h3>Unable to load doctor details</h3>
        <p>{doctorConnectionError}</p>
      </div>
    </div>
  ) : doctorConnection?.connected &&
    doctorConnection?.connection?.doctor ? (
    <>
      {/* COMPACT CONNECTED DOCTOR */}
      <div className="connected-doctor-compact">
        <div className="doctor-review-status">
          <Stethoscope size={22} />
        </div>
        <div className="connected-doctor-info">
          <span>DOCTOR CONNECTED</span>
          <h3>
           {`Dr. ${ doctorConnection.connection.doctor.fullName || "Connected Doctor"}`}
          </h3>
          <p>Your health reviews and recommendations appear below.</p>
        </div>
        <span className="doctor-connected-badge">Connected</span>
      </div>
      {/* LATEST DOCTOR REVIEW */}
      <div className="doctor-review-feedback doctor-latest-review">
        <div className="doctor-review-feedback-heading">
          <div>
            <span className="doctor-review-eyebrow">LATEST FEEDBACK</span>
          </div>
          {doctorConnection.latestDoctorReview?.createdAt ||
          doctorConnection.latestDoctorReview?.updatedAt ? (
            <span className="doctor-review-date">
              {new Date(
                doctorConnection.latestDoctorReview.updatedAt ||
                  doctorConnection.latestDoctorReview.createdAt
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ) : null}
        </div>
        {doctorConnection.latestDoctorReview ? (
          <>
            {doctorConnection.latestDoctorReview.category ? (
              <span className="doctor-review-category">
                {String(
                  doctorConnection.latestDoctorReview.category
                ).replace(/-/g, " ")}
              </span>
            ) : null}
            <p className="doctor-review-text">
              {doctorConnection.latestDoctorReview.reviewText ||
                "Your doctor has shared a review, but no comment is available."}
            </p>
          </>
        ) : (
          <div className="doctor-review-empty">
            <Info size={18} />
            <p>
              Your doctor is connected successfully, but no review has been
              shared yet. Your doctor's feedback will appear here when available.
            </p>
          </div>
        )}
      </div>

{/* DOCTOR REVIEW HISTORY */}
{doctorConnection?.connected && (
  <div className="doctor-review-history">
    <div className="doctor-review-history-heading">
      <div>
        <span className="doctor-review-eyebrow">
          DOCTOR REVIEW HISTORY
        </span>
      </div>
    </div>

    {loadingDoctorHistory ? (
      <p className="doctor-review-history-message">
        Loading doctor reviews...
      </p>
    ) : doctorReviewHistory.length <= 1 ? (
      <p className="doctor-review-history-message">
        No previous doctor reviews available yet.
      </p>
    ) : (
      <>
        {/* All previous reviews inside ONE container */}
        <div className="doctor-review-history-list">
          {doctorReviewHistory
            .slice(1, showAllDoctorHistory ? undefined : 3)
            .map((review, index) => (
              <div
                className="doctor-review-history-item"
                key={review.id || index}
              >
                
<div className="doctor-review-history-item-top">
  <span className="doctor-review-date">
    {new Date(
      review.createdAt || review.updatedAt
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}
  </span>
</div>

<p className="doctor-review-history-line">
  <span className="doctor-review-history-category">
    {(review.category || "General review").replace(/-/g, " ")}
  </span>
  <span className="doctor-review-history-separator"> — </span>
  <span>
    {review.reviewText || "No comment provided."}
  </span>
</p>

              </div>
            ))}
        </div>

        {doctorReviewHistory.length > 3 && (
          <button
            type="button"
            className="doctor-review-history-button"
            onClick={handleToggleDoctorHistory}
          >
            {showAllDoctorHistory
              ? "Show Less"
              : "View Previous Reviews"}
          </button>
        )}
      </>
    )}
  </div>
)}

</>
) : (
    /* KEEP THE EXISTING EMPTY STATE WHEN NO DOCTOR IS CONNECTED */
    <div className="doctor-review-area">
      <div className="doctor-review-status">
        <Stethoscope size={22} />
      </div>
      <div className="doctor-review-copy">
        <span>DOCTOR INSIGHT</span>
        <h3>No doctor is connected to your profile yet</h3>
        <p>
          Connect with a healthcare professional from your Profile page to
          receive doctor reviews and health guidance here.
        </p>
      </div>
    </div>
  )}
  <div className="doctor-review-note">
    <Info size={15} />
    <span>
      LifePredict's AI insights are not a substitute for a doctor's review
      or medical advice.
    </span>
  </div>
</div>
      </div> 
      </section>
      {/* HEALTH STORY */}
      <section className="prediction-section">
        <SectionHeading
          icon={<Sparkles size={18} />}
          eyebrow="YOUR HEALTH STORY"
          title="What your numbers may mean"
          description="These explanations are generated from your actual recorded values. The wording changes when your measurements move into a different range."
        />
        <div className="health-story-grid">
          {healthStoryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                className={`story-card ${card.type}`}
                key={card.id}
              >
                <div className="story-card-top">
                  <div className="story-icon">
                    <Icon size={20} />
                  </div>
                  <span
                    className={`story-status ${card.type}`}
                  >
                    {card.type === "attention"
                      ? "NEEDS ATTENTION"
                      : card.type === "watch"
                      ? "WORTH MONITORING"
                      : card.type === "positive"
                      ? "POSITIVE"
                      : "CONTEXT"}
                  </span>
                </div>
                <div className="story-title-row">
                  <h3>{card.title}</h3>
                  <strong>
                    {card.value}
                  </strong>
                </div>
                <p className="story-summary">
                  {card.summary}
                </p>
                <div className="story-divider" />
                <StoryDetail
                  label="WHY THIS MATTERS"
                  text={card.why}
                />
                <StoryDetail
                  label="WHAT MAY BE CONTRIBUTING"
                  text={card.contributing}
                />
                <StoryDetail
                  label="WHAT YOU CAN DO NEXT"
                  text={card.next}
                />
              </div>
            );
          })}
        </div>
      </section>
      {/* COMPACT POSITIVE + LIFESTYLE HIGHLIGHTS */}
      <div className="prediction-highlights-layout">
        {/* LEFT CARD: POSITIVE HEALTH SIGNALS */}
        <section className="prediction-highlight-card positive-highlight-panel">
          <SectionHeading
            icon={<CheckCircle2 size={18} />}
            eyebrow="WHAT YOU ARE DOING WELL"
            title="Your positive health signals"
            description="LifePredict should not only tell you what needs attention. These are the things in your current data that are moving in a positive direction."
          />

          <div className="highlight-pointer-list">
            {positiveSignals.length > 0 ? (
              positiveSignals.map((signal, index) => {
                const Icon = signal.icon;

                return (
                  <div className="highlight-pointer" key={signal.id || index}>
                    <div className="highlight-pointer-icon positive-pointer-icon">
                      <Icon size={17} />
                    </div>

                    <div className="highlight-pointer-content">
                      <h3>{signal.title}</h3>
                      <p>{signal.text}</p>
                    </div>

                    <CheckCircle2
                      className="highlight-pointer-check"
                      size={16}
                    />
                  </div>
                );
              })
            ) : (
              <div className="highlight-empty-state">
                Continue recording your health data so LifePredict can identify
                positive changes over time.
              </div>
            )}
          </div>
        </section>

        {/* RIGHT CARD: LIFESTYLE CONTEXT */}
        <section className="prediction-highlight-card lifestyle-highlight-panel">
          <SectionHeading
            icon={<Droplets size={18} />}
            eyebrow="LIFESTYLE CONTEXT"
            title="Small factors can add to the bigger picture"
            description="These signals are included only when the relevant information is available in your health data."
          />

          <div className="highlight-pointer-list lifestyle-pointer-list">
            {lifestyleSignals.length > 0 ? (
              lifestyleSignals.map((signal, index) => {
                const Icon = signal.icon;

                return (
                  <div
                    className={`highlight-pointer lifestyle-pointer ${signal.type || ""}`}
                    key={`${signal.title}-${index}`}
                  >
                    <div className="highlight-pointer-icon lifestyle-pointer-icon">
                      <Icon size={17} />
                    </div>

                    <div className="highlight-pointer-content">
                      <h3>{signal.title}</h3>
                      <p>{signal.text}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="highlight-empty-state">
                Lifestyle context will appear here when the relevant
                information is available in your health data.
              </div>
            )}
          </div>
        </section>
      </div>
      {/* MODEL EXPLANATION */}
      <section className="prediction-section">

        <SectionHeading
          icon={<Brain size={18} />}
          eyebrow="MODEL EXPLANATION"
          title="Why LifePredict may be flagging your profile"
          description="These are the health variables connected to the current assessment. Actual SHAP values are shown only when they are returned by the trained model."
        />
        <div className="model-explanation-grid">
          <div className="model-factors-card">
            <div className="model-card-heading">
              <div className="model-heading-icon">
                <Target size={20} />
              </div>
              <div>
                <h3>
                  Health factors connected to the result
                </h3>
                <p>
                  LifePredict considers multiple
                  measurements together rather than treating
                  one number as the whole story.
                </p>
              </div>
            </div>
            <div className="model-factor-list">
              {healthFactors.map(
                (factor, index) => {
                  const Icon = factor.icon;
                  return (
                    <div
                      className="model-factor-item"
                      key={index}
                    >
                      <Icon size={19} />
                      <div>
                        <strong>
                          {factor.name}
                        </strong>
                        <span>
                          Your recorded value is{" "}
                          {factor.value}.
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
          <div className="shap-card">
            <div className="shap-header">
              <div>
                <span>
                  SHAP EXPLAINABILITY
                </span>
                <h3>
                  Feature contribution
                </h3>
              </div>
              <span className="shap-badge">
                SHAP
              </span>
            </div>
            <p>
              SHAP explains how individual model features
              contribute to the model output. Positive
              contributions push the prediction upward;
              negative contributions push it downward.
            </p>
            <div className="shap-unavailable">
              <Info size={19} />
              <div>
                <strong>
                  SHAP values are not available yet
                </strong>
                <p>
                  The current prediction API does not return
                  feature-level SHAP values. Once the backend
                  returns the actual contribution for each
                  feature, this section can display those
                  real values automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* WHAT IF */}
      <section className="prediction-section">
        <div className="what-if-card">
          <div className="what-if-icon">
            <Sparkles size={23} />
          </div>
          <div className="what-if-content">
            <span>NEXT STEP</span>
            <h2>
              Want to see what could change?
            </h2>
            <p>
              Your current prediction shows where your
              profile stands today. What-if Simulation lets
              you change lifestyle inputs such as weight,
              activity, sleep and other available factors
              and compare the simulated outcome.
            </p>
          </div>
          <button

            type="button"
            className="what-if-button"
            onClick={() => {
  window.location.href = "/patient/what-if";
}}
          >
            Open What-if Simulation
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
      {/* DISCLAIMER */}
      <div className="prediction-note">
        <AlertCircle size={19} />
        <div>
          <strong>Important</strong>
          <p>
            LifePredict provides a machine-learning based
            risk estimation, not a medical diagnosis. A model
            probability is not the same as an individual
            prediction of a heart attack or another medical
            event. Results depend on the information available
            to LifePredict and should not replace professional
            medical evaluation.
          </p>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   SECTION HEADING
   IMPORTANT: FULLY CENTERED
========================================================= */
function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="prediction-section-heading">
      <span>{eyebrow}</span>
      <div className="section-heading-title-row">
        <h2>{title}</h2>
      </div>
      {description && (
        <p className="section-description">
          {description}
        </p>
      )}
    </div>
  );
}


/* =========================================================
   STORY DETAIL
========================================================= */
function StoryDetail({ label, text }) {
  return (
    <div className="story-detail">
      <span>{label}</span>
      <p>{text}</p>
    </div>
  );
}


/* =========================================================
   PROBABILITY ROW
========================================================= */
function ProbabilityRow({
  label,
  value,
  className,
}) {
  const safeValue = Math.min(
    Math.max(Number(value) || 0, 0),
    100
  );
  return (
    <div className="probability-row">
      <div className="probability-row-header">
        <span>{label}</span>
        <strong>
          {safeValue.toFixed(1)}%
        </strong>
      </div>
      <div className="probability-track">
        <div
          className={`probability-fill ${className}`}
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>
    </div>
  );
}
export default PatientPredictions;