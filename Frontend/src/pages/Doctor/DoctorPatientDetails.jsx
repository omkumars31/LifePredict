import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  UserRound,
  Mail,
  CalendarDays,
  Activity,
  HeartPulse,
  Scale,
  Droplets,
  Moon,
  Footprints,
  Brain,
  Cigarette,
  Wine,
  Gauge,
  TrendingUp,
  Clock3,
  AlertCircle,
  RefreshCw,
  Loader2,
  ClipboardList,
  ShieldCheck,
  MessageSquareText,
  CalendarClock,
  Save,
  Pencil,
  CheckCircle2,
  X,
} from "lucide-react";

import "./DoctorPatientDetails.css";

const API_BASE =
  "http://localhost:5001/api";

function DoctorPatientDetails() {
  const { patientId } = useParams();

  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  // =========================================================
  // MAIN STATE
  // =========================================================

  const [patientData, setPatientData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [reviewingPatient, setReviewingPatient] = useState(false);
  const [reviewStatusMessage, setReviewStatusMessage] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showCompletePredictionHistory, setShowCompletePredictionHistory] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState("daily");

  const [reviewForm, setReviewForm] =
    useState({
      category: "general",
      reviewText: "",
    });

  const [editingReviewId, setEditingReviewId] =
    useState(null);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [reviewError, setReviewError] =
    useState("");

  const [reviewMessage, setReviewMessage] =
    useState("");

  // =========================================================
  // CONSULTATION STATE
  // =========================================================

  const [consultationForm, setConsultationForm] =
    useState({
      scheduledDate: "",
      startTime: "",
      durationMinutes: 30,
      consultationType: "general",
      notes: "",
    });

  const [
    editingConsultationId,
    setEditingConsultationId,
  ] = useState(null);

  const [
    consultationLoading,
    setConsultationLoading,
  ] = useState(false);

  const [
    consultationError,
    setConsultationError,
  ] = useState("");

  const [
    consultationMessage,
    setConsultationMessage,
  ] = useState("");

  // =========================================================
  // FETCH PATIENT
  // =========================================================

  const getLocalDateKey = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const isReviewedToday = (value) =>
    Boolean(value) && getLocalDateKey(value) === getLocalDateKey(new Date());

  const syncReviewedStatus = async (loadedData) => {
    const patientUserId =
      loadedData?.patient?.userId ||
      loadedData?.patient?.user_id ||
      loadedData?.userId;

    if (!patientUserId || !token) return;

    // This endpoint is shared with My Patients, so both screens use the same saved status.
    try {
      const response = await fetch(`${API_BASE.replace("/api", "")}/api/connections/patients/reviewed-today`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const result = await response.json();
      const candidates = Array.isArray(result)
        ? result
        : Array.isArray(result?.patients)
        ? result.patients
        : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.reviewedPatients)
        ? result.reviewedPatients
        : [];
      const match = candidates.find((item) =>
        String(item?.userId ?? item?.user_id ?? item?.patientUserId ?? item?.patient_user_id ?? item?.id ?? "") === String(patientUserId)
      );
      const reviewedAt = match?.reviewedAt || match?.reviewed_at || (match ? new Date().toISOString() : null);
      setPatientData((previous) => previous ? ({
        ...previous,
        reviewedAt,
        patient: previous.patient ? { ...previous.patient, reviewedAt } : previous.patient,
      }) : previous);
    } catch (statusError) {
      // Keep the patient page usable if the status refresh is temporarily unavailable.
      console.warn("Unable to refresh patient review status:", statusError);
    }
  };

  const fetchPatient = async () => {
    if (!token) {
      setLoading(false);

      setError(
        "Your session has expired. Please log in again."
      );

      return;
    }

    if (!patientId) {
      setLoading(false);

      setError(
        "Patient ID is missing."
      );

      return;
    }

    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        `${API_BASE}/doctor/patients/${encodeURIComponent(
          patientId
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to load patient details."
        );
      }

      setPatientData(data);
      await syncReviewedStatus(data);
    } catch (error) {
      console.error(
        "Fetch patient details error:",
        error
      );

      setError(
        error.message ||
          "Unable to load patient details."
      );
    } finally {
      setLoading(false);
    }
  };


const markPatientReviewed = async () => {
  const patientUserId =
    patientData?.patient?.userId ||
    patientData?.patient?.user_id ||
    patientData?.userId;

  if (!patientUserId || !token || reviewingPatient) {
    setReviewStatusMessage("Unable to identify this patient. Please refresh the page.");
    return;
  }

  try {
    setReviewingPatient(true);
    setReviewStatusMessage("");

    const response = await fetch(
      `${API_BASE}/connections/patients/${patientUserId}/reviewed`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to mark patient as reviewed."
      );
    }

    const savedReviewedAt = data.reviewedAt || data.reviewed_at || new Date().toISOString();
    setPatientData((previous) => ({
      ...previous,
      reviewedAt: savedReviewedAt,
      patient: previous?.patient
        ? { ...previous.patient, reviewedAt: savedReviewedAt }
        : previous?.patient,
    }));

    setReviewStatusMessage("Patient marked as reviewed today.");
    await syncReviewedStatus({
      ...patientData,
      patient: patientData?.patient,
      reviewedAt: savedReviewedAt,
    });
  } catch (error) {
    console.error("Mark patient reviewed error:", error);
    setReviewStatusMessage(
      error.message || "Unable to mark patient as reviewed."
    );
  } finally {
    setReviewingPatient(false);
  }
};


  // =========================================================
  // REFRESH PATIENT
  // =========================================================

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  // =========================================================
  // DATA
  // =========================================================

  const patient =
    patientData?.patient || {};

  const healthRecords =
    Array.isArray(
      patientData?.healthRecords
    )
      ? patientData.healthRecords
      : [];

  const predictionHistory =
    Array.isArray(
      patientData?.predictionHistory
    )
      ? patientData.predictionHistory
      : [];

  const reviews =
    Array.isArray(
      patientData?.reviews
    )
      ? patientData.reviews
      : [];

  const consultations =
    Array.isArray(
      patientData?.consultations
    )
      ? patientData.consultations
      : [];

  // Show only scheduled consultations dated today or in the future.
  // Past consultations remain stored in the database; they are simply hidden here.
  const upcomingConsultations = useMemo(() => {
    const todayKey = getLocalDateKey(new Date());

    return consultations
      .filter((item) => {
        const scheduledDate = String(item?.scheduled_date || "").slice(0, 10);
        return item?.status === "scheduled" && scheduledDate && scheduledDate >= todayKey;
      })
      .sort((a, b) => {
        const dateCompare = String(a.scheduled_date || "").localeCompare(String(b.scheduled_date || ""));
        if (dateCompare !== 0) return dateCompare;
        return String(a.start_time || "").localeCompare(String(b.start_time || ""));
      });
  }, [consultations]);

  const latestHealthRecord =
    healthRecords[0] || null;

  const latestPrediction =
    predictionHistory[0] || null;

  // =========================================================
  // HELPERS
  // =========================================================

  const calculateAge = (
    dateOfBirth
  ) => {
    if (!dateOfBirth) {
      return "N/A";
    }

    const dob =
      new Date(dateOfBirth);

    if (
      Number.isNaN(
        dob.getTime()
      )
    ) {
      return "N/A";
    }

    const today = new Date();

    let age =
      today.getFullYear() -
      dob.getFullYear();

    const monthDifference =
      today.getMonth() -
      dob.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() <
          dob.getDate()
      )
    ) {
      age--;
    }

    return age >= 0
      ? age
      : "N/A";
  };

  const patientAge =
    calculateAge(
      patient.dateOfBirth
    );

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not available";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not available";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatTime = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not available";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatValue = (
    value,
    fallback = "Not recorded"
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    return value;
  };

  const getPredictionPercentage = (
    probability
  ) => {
    if (
      probability === null ||
      probability === undefined
    ) {
      return null;
    }

    const number =
      Number(probability);

    if (
      Number.isNaN(number)
    ) {
      return null;
    }

    return `${(
      number * 100
    ).toFixed(1)}%`;
  };

  const getBpStatus = (
    systolic,
    diastolic
  ) => {
    const sys =
      Number(systolic);

    const dia =
      Number(diastolic);

    if (
      Number.isNaN(sys) ||
      Number.isNaN(dia)
    ) {
      return "Not available";
    }

    if (
      sys >= 140 ||
      dia >= 90
    ) {
      return "Elevated";
    }

    if (
      sys >= 130 ||
      dia >= 80
    ) {
      return "Above preferred range";
    }

    return "Within recorded range";
  };

  const formatLabel = (
    value
  ) => {
    if (!value) {
      return "General";
    }

    return String(value)
      .replaceAll("-", " ")
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  };

  // =========================================================
  // RISK LEVEL
  // =========================================================

  const riskLevel = useMemo(() => {
    const probability =
      Number(
        latestPrediction?.probability_cardio
      );

    if (
      Number.isNaN(
        probability
      )
    ) {
      return {
        label: "Not available",
        className:
          "not-available",
      };
    }

    if (
      probability >= 0.7
    ) {
      return {
        label:
          "Higher predicted risk",
        className: "high",
      };
    }

    if (
      probability >= 0.4
    ) {
      return {
        label:
          "Moderate predicted risk",
        className:
          "moderate",
      };
    }

    return {
      label:
        "Lower predicted risk",
      className: "low",
    };
  }, [latestPrediction]);

  // =========================================================
  // AI HEALTH INSIGHTS
  // =========================================================

  const aiInsights = useMemo(() => {
    const insights = [];

    // -------------------------------------------------------
    // BLOOD PRESSURE
    // -------------------------------------------------------

    const systolic =
      Number(
        latestHealthRecord?.systolic_bp
      );

    const diastolic =
      Number(
        latestHealthRecord?.diastolic_bp
      );

    if (
      !Number.isNaN(systolic) &&
      !Number.isNaN(diastolic)
    ) {
      if (
        systolic >= 140 ||
        diastolic >= 90
      ) {
        insights.push({
          icon: Gauge,

          title:
            "Blood pressure is high",

          text:
            `The latest recorded blood pressure is ${systolic}/${diastolic} mmHg. This is an area worth monitoring during clinical review.`,

          value:
            `${systolic}/${diastolic} mmHg`,

          tone:
            "attention",
        });
      } else if (
        systolic >= 130 ||
        diastolic >= 80
      ) {
        insights.push({
          icon: Gauge,

          title:
            "Blood pressure is above the preferred range",

          text:
            `The latest recorded blood pressure is ${systolic}/${diastolic} mmHg. Continue monitoring the trend.`,

          value:
            `${systolic}/${diastolic} mmHg`,

          tone: "watch",
        });
      } else {
        insights.push({
          icon: Gauge,

          title:
            "Blood pressure is within the recorded range",

          text:
            `The latest recorded blood pressure is ${systolic}/${diastolic} mmHg.`,

          value:
            `${systolic}/${diastolic} mmHg`,

          tone:
            "positive",
        });
      }
    }

    // -------------------------------------------------------
    // BMI
    // -------------------------------------------------------

    const bmi =
      Number(
        latestPrediction?.bmi
      );

    if (!Number.isNaN(bmi)) {
      if (bmi >= 30) {
        insights.push({
          icon: Scale,

          title:
            "BMI is in the higher range",

          text:
            `The latest prediction used a BMI of ${bmi.toFixed(
              1
            )}. This value is worth considering alongside the patient's broader clinical picture.`,

          value:
            `BMI ${bmi.toFixed(1)}`,

          tone:
            "attention",
        });
      } else if (
        bmi >= 25
      ) {
        insights.push({
          icon: Scale,

          title:
            "BMI is slightly above the usual healthy range",

          text:
            `The latest prediction used a BMI of ${bmi.toFixed(
              1
            )}. This is a factor worth monitoring over time.`,

          value:
            `BMI ${bmi.toFixed(1)}`,

          tone: "watch",
        });
      } else if (
        bmi < 18.5
      ) {
        insights.push({
          icon: Scale,

          title:
            "BMI is below the usual healthy range",

          text:
            `The latest prediction used a BMI of ${bmi.toFixed(
              1
            )}. Review it together with the patient's weight and clinical context.`,

          value:
            `BMI ${bmi.toFixed(1)}`,

          tone: "watch",
        });
      } else {
        insights.push({
          icon: Scale,

          title:
            "BMI is within the usual healthy range",

          text:
            `The latest prediction used a BMI of ${bmi.toFixed(
              1
            )}.`,

          value:
            `BMI ${bmi.toFixed(1)}`,

          tone:
            "positive",
        });
      }
    }

    // -------------------------------------------------------
    // CHOLESTEROL
    // -------------------------------------------------------

    const cholesterol =
      Number(
        latestHealthRecord?.cholesterol ??
          latestPrediction?.cholesterol
      );

    if (
      !Number.isNaN(
        cholesterol
      )
    ) {
      if (
        cholesterol >= 200
      ) {
        insights.push({
          icon: TrendingUp,

          title:
            "Total cholesterol is at or above the desirable threshold",

          text:
            `The latest recorded total cholesterol is ${cholesterol} mg/dL. The trend should be considered during clinical review.`,

          value:
            `${cholesterol} mg/dL`,

          tone:
            "attention",
        });
      } else {
        insights.push({
          icon: TrendingUp,

          title:
            "Total cholesterol is within the desirable threshold",

          text:
            `The latest recorded total cholesterol is ${cholesterol} mg/dL.`,

          value:
            `${cholesterol} mg/dL`,

          tone:
            "positive",
        });
      }
    }

    // -------------------------------------------------------
    // PHYSICAL ACTIVITY
    // -------------------------------------------------------

    const activity =
      Number(
        latestHealthRecord?.physical_activity_minutes
      );

    if (
      !Number.isNaN(activity)
    ) {
      if (
        activity < 30
      ) {
        insights.push({
          icon: Activity,

          title:
            "Recorded physical activity is relatively low",

          text:
            `The latest health record contains ${activity} minutes of physical activity. This can be monitored as part of the patient's lifestyle trend.`,

          value:
            `${activity} min`,

          tone: "watch",
        });
      } else {
        insights.push({
          icon: Activity,

          title:
            "Physical activity is being recorded",

          text:
            `The latest health record contains ${activity} minutes of physical activity.`,

          value:
            `${activity} min`,

          tone:
            "positive",
        });
      }
    }

    // -------------------------------------------------------
    // AGE
    // -------------------------------------------------------

    if (
      patientAge !== "N/A"
    ) {
      insights.push({
        icon: CalendarDays,

        title:
          "Age provides important context",

        text:
          `The patient is ${patientAge} years old. Age should be considered together with the recorded vitals, lifestyle and model estimate.`,

        value:
          `${patientAge} years`,

        tone:
          "context",
      });
    }

    return insights.slice(
      0,
      4
    );
  }, [
    latestHealthRecord,
    latestPrediction,
    patientAge,
  ]);

  // =========================================================
  // PREDICTION HISTORY: ONE LATEST SNAPSHOT PER DISTINCT DATE
  // Raw predictionHistory is never modified or deleted. The default table
  // shows only the latest two dates; the complete view uses all daily snapshots.
  // =========================================================

  const allDailyPredictionHistory = useMemo(() => {
    const byDate = new Map();
    [...predictionHistory]
      .filter((item) => item?.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .forEach((prediction) => {
        const dateKey = getLocalDateKey(prediction.created_at);
        if (dateKey && !byDate.has(dateKey)) {
          const date = new Date(prediction.created_at);
          byDate.set(dateKey, {
            ...prediction,
            dateKey,
            sessionLabel: date.getHours() < 12 ? "Morning" : "Evening",
          });
        }
      });
    return [...byDate.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [predictionHistory]);

  const visiblePredictionHistory = useMemo(
    () => showCompletePredictionHistory ? allDailyPredictionHistory : allDailyPredictionHistory.slice(0, 2),
    [allDailyPredictionHistory, showCompletePredictionHistory]
  );

  const predictionComparisonPeriods = useMemo(() => {
    const ascending = [...allDailyPredictionHistory].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const getAverage = (items, field) => {
      const values = items.map((item) => Number(item[field])).filter(Number.isFinite);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    };
    const toPeriod = (id, label, items) => ({
      id, label, items,
      startDate: items[0]?.created_at,
      endDate: items[items.length - 1]?.created_at,
      cardio: getAverage(items, "probability_cardio"),
      weight: getAverage(items, "weight_kg"),
      systolic: getAverage(items, "systolic_bp"),
      diastolic: getAverage(items, "diastolic_bp"),
      bmi: getAverage(items, "bmi"),
      glucose: getAverage(items, "glucose"),
    });
    if (historyViewMode === "daily") {
      return [...allDailyPredictionHistory].map((item) => toPeriod(getLocalDateKey(item.created_at), formatDate(item.created_at), [item]));
    }
    const groups = new Map();
    ascending.forEach((item) => {
      const date = new Date(item.created_at);
      let key, label;
      if (historyViewMode === "weekly") {
        const firstDate = new Date(ascending[0].created_at);
        firstDate.setHours(0, 0, 0, 0);
        const current = new Date(date);
        current.setHours(0, 0, 0, 0);
        const week = Math.floor((current - firstDate) / 86400000 / 7) + 1;
        key = `week-${week}`;
        label = `Week ${week}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      }
      if (!groups.has(key)) groups.set(key, { label, items: [] });
      groups.get(key).items.push(item);
    });
    return [...groups.entries()].map(([key, group]) => toPeriod(key, group.label, group.items)).reverse();
  }, [allDailyPredictionHistory, historyViewMode]);

  const formatComparisonValue = (value, suffix = "") =>
    value === null || value === undefined || !Number.isFinite(Number(value))
      ? "N/A"
      : `${Number(value).toFixed(1)}${suffix}`;

  // =========================================================
  // REVIEW SUBMIT
  // =========================================================

  const handleReviewSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !reviewForm.reviewText.trim()
      ) {
        setReviewError(
          "Please write a review or suggestion."
        );

        return;
      }

      try {
        setReviewLoading(true);

        setReviewError("");

        setReviewMessage("");

        const isEditing =
          Boolean(
            editingReviewId
          );

        const url =
          isEditing
            ? `${API_BASE}/doctor/patients/${encodeURIComponent(
                patientId
              )}/reviews/${editingReviewId}`
            : `${API_BASE}/doctor/patients/${encodeURIComponent(
                patientId
              )}/reviews`;

        const response =
          await fetch(url, {
            method: isEditing
              ? "PATCH"
              : "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              category:
                reviewForm.category,

              reviewText:
                reviewForm.reviewText.trim(),
            }),
          });

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to save doctor review."
          );
        }

        setReviewForm({
          category:
            "general",

          reviewText:
            "",
        });

        setEditingReviewId(
          null
        );

        setReviewMessage(
          isEditing
            ? "Review updated successfully."
            : "Review saved successfully."
        );

        await fetchPatient();
      } catch (error) {
        console.error(
          "Save doctor review error:",
          error
        );

        setReviewError(
          error.message ||
            "Unable to save doctor review."
        );
      } finally {
        setReviewLoading(
          false
        );
      }
    };

  // =========================================================
  // EDIT REVIEW
  // =========================================================

  const handleEditReview = (
    review
  ) => {
    setEditingReviewId(
      review.id
    );

    setReviewForm({
      category:
        review.category ||
        "general",

      reviewText:
        review.review_text ||
        "",
    });

    setReviewMessage("");

    setReviewError("");
  };

  // =========================================================
  // CANCEL REVIEW EDIT
  // =========================================================

  const handleCancelReviewEdit =
    () => {
      setEditingReviewId(
        null
      );

      setReviewForm({
        category:
          "general",

        reviewText:
          "",
      });

      setReviewMessage("");

      setReviewError("");
    };

  // =========================================================
  // CONSULTATION SUBMIT
  // =========================================================

  const handleConsultationSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !consultationForm.scheduledDate ||
        !consultationForm.startTime
      ) {
        setConsultationError(
          "Please select a date and time."
        );

        return;
      }

      try {
        setConsultationLoading(
          true
        );

        setConsultationError("");

        setConsultationMessage("");

        const isEditing =
          Boolean(
            editingConsultationId
          );

        const url =
          isEditing
            ? `${API_BASE}/doctor/patients/${encodeURIComponent(
                patientId
              )}/consultations/${editingConsultationId}`
            : `${API_BASE}/doctor/patients/${encodeURIComponent(
                patientId
              )}/consultations`;

        const response =
          await fetch(url, {
            method: isEditing
              ? "PATCH"
              : "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              scheduledDate:
                consultationForm.scheduledDate,

              startTime:
                consultationForm.startTime,

              durationMinutes:
                Number(
                  consultationForm.durationMinutes
                ),

              consultationType:
                consultationForm.consultationType,

              notes:
                consultationForm.notes.trim() ||
                null,
            }),
          });

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to save consultation."
          );
        }

        setConsultationForm({
          scheduledDate:
            "",

          startTime:
            "",

          durationMinutes:
            30,

          consultationType:
            "general",

          notes:
            "",
        });

        setEditingConsultationId(
          null
        );

        setConsultationMessage(
          isEditing
            ? "Consultation rescheduled successfully."
            : "Consultation scheduled successfully."
        );

        await fetchPatient();
      } catch (error) {
        console.error(
          "Save consultation error:",
          error
        );

        setConsultationError(
          error.message ||
            "Unable to save consultation."
        );
      } finally {
        setConsultationLoading(
          false
        );
      }
    };

  // =========================================================
  // EDIT / RESCHEDULE
  // =========================================================

  const handleEditConsultation =
    (consultation) => {
      setEditingConsultationId(
        consultation.id
      );

      setConsultationForm({
        scheduledDate:
          consultation.scheduled_date ||
          "",

        startTime:
          consultation.start_time
            ? String(
                consultation.start_time
              ).slice(0, 5)
            : "",

        durationMinutes:
          Number(
            consultation.duration_minutes
          ) || 30,

        consultationType:
          consultation.consultation_type ||
          "general",

        notes:
          consultation.notes ||
          "",
      });

      setConsultationMessage("");

      setConsultationError("");
    };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelConsultationEdit =
    () => {
      setEditingConsultationId(
        null
      );

      setConsultationForm({
        scheduledDate:
          "",

        startTime:
          "",

        durationMinutes:
          30,

        consultationType:
          "general",

        notes:
          "",
      });

      setConsultationMessage("");

      setConsultationError("");
    };

  // =========================================================
  // CANCEL CONSULTATION
  // =========================================================

  const handleCancelConsultation =
    async (
      consultationId
    ) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this consultation?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setConsultationLoading(
          true
        );

        setConsultationError("");

        setConsultationMessage("");

        const response =
          await fetch(
            `${API_BASE}/doctor/patients/${encodeURIComponent(
              patientId
            )}/consultations/${consultationId}`,
            {
              method:
                "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to cancel consultation."
          );
        }

        setConsultationMessage(
          "Consultation cancelled successfully."
        );

        await fetchPatient();
      } catch (error) {
        console.error(
          "Cancel consultation error:",
          error
        );

        setConsultationError(
          error.message ||
            "Unable to cancel consultation."
        );
      } finally {
        setConsultationLoading(
          false
        );
      }
    };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="doctor-patient-details-page">
        <section className="doctor-patient-state-card">
          <Loader2
            size={26}
            className="doctor-patient-spinner"
          />

          <h3>
            Loading patient details
          </h3>

          <p>
            Fetching the patient's
            profile, health records
            and prediction history...
          </p>
        </section>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <main className="doctor-patient-details-page">
        <section className="doctor-patient-state-card">

          <div className="doctor-patient-error-icon">
            <AlertCircle
              size={24}
            />
          </div>

          <h3>
            Unable to load patient
          </h3>

          <p>{error}</p>

          <div className="doctor-patient-state-actions">

            <button
              type="button"
              onClick={
                fetchPatient
              }
            >
              <RefreshCw
                size={15}
              />

              Try again
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/doctor/patients"
                )
              }
            >
              <ArrowLeft
                size={15}
              />

              Back to patients
            </button>

          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="doctor-patient-details-page">

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        className="doctor-patient-back"
        onClick={() =>
          navigate(
            "/doctor/patients"
          )
        }
      >
        <ArrowLeft size={16} />

        Back to My Patients
      </button>


      {/* =====================================================
          PATIENT HEADER
      ===================================================== */}

      <section className="doctor-patient-profile-header">

        <div className="doctor-patient-profile-main">

          <div className="doctor-patient-large-avatar">
            {patient.fullName
              ? patient.fullName
                  .trim()
                  .split(/\s+/)
                  .map(
                    (part) =>
                      part[0]
                  )
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "P"}
          </div>

          <div className="doctor-patient-title">

            <div className="doctor-patient-title-row">

              <h1>
                {patient.fullName ||
                  "Patient"}
              </h1>

              <span className="doctor-patient-connected-badge">
                <ShieldCheck
                  size={13}
                />

                Connected
              </span>

            </div>

            <p className="doctor-patient-id">
              {patient.patientId ||
                "Patient ID unavailable"}
            </p>

            <div className="doctor-patient-basic-info">

              <span>
                <UserRound
                  size={13}
                />

                {patient.gender ||
                  "Gender not recorded"}
              </span>

              <span>
                <CalendarDays
                  size={13}
                />

                {patientAge} years
              </span>

              <span>
                <Mail
                  size={13}
                />

                {patient.email ||
                  "Email not available"}
              </span>

            </div>

          </div>

        </div>

        <div className="doctor-patient-profile-meta">

          <span>
            PROFILE STATUS
          </span>

          <strong
            className={
              patient.profileCompleted
                ? "profile-complete"
                : "profile-incomplete"
            }
          >
            {patient.profileCompleted
              ? "Complete"
              : "Incomplete"}
          </strong>

          <small>
            Connected{" "}
            {formatDate(
              patientData
                ?.connection
                ?.respondedAt
            )}
          </small>

        </div>

      </section>




      {/* =====================================================
          HEALTH SNAPSHOT
      ===================================================== */}

      <section className="doctor-patient-section">

        <div className="doctor-patient-section-heading">

          <div>
            <span>
              HEALTH SNAPSHOT
            </span>

            <h2>
              Latest recorded vitals
            </h2>
          </div>

          <small>
            {latestHealthRecord
              ? `Recorded ${formatDateTime(
                  latestHealthRecord.recorded_at
                )}`
              : "No health record available"}
          </small>

        </div>

        {!latestHealthRecord ? (
          <div className="doctor-patient-empty">

            <ClipboardList
              size={22}
            />

            <p>
              No health records have
              been recorded for this
              patient yet.
            </p>

          </div>
        ) : (
          <div className="doctor-vitals-grid">

            <div className="doctor-vital-card">
              <div className="doctor-vital-icon">
                <Scale size={18} />
              </div>

              <span>
                WEIGHT
              </span>

              <strong>
                {formatValue(
                  latestHealthRecord.weight_kg
                )}
              </strong>

              <small>
                kg
              </small>
            </div>


            <div className="doctor-vital-card">

              <div className="doctor-vital-icon">
                <Gauge size={18} />
              </div>

              <span>
                BLOOD PRESSURE
              </span>

              <strong>
                {formatValue(
                  latestHealthRecord.systolic_bp
                )}
                /
                {formatValue(
                  latestHealthRecord.diastolic_bp
                )}
              </strong>

              <small>
                {getBpStatus(
                  latestHealthRecord.systolic_bp,
                  latestHealthRecord.diastolic_bp
                )}
              </small>

            </div>


            <div className="doctor-vital-card">

              <div className="doctor-vital-icon">
                <HeartPulse
                  size={18}
                />
              </div>

              <span>
                HEART RATE
              </span>

              <strong>
                {formatValue(
                  latestHealthRecord.resting_heart_rate
                )}
              </strong>

              <small>
                bpm
              </small>

            </div>


            <div className="doctor-vital-card">

              <div className="doctor-vital-icon">
                <Droplets
                  size={18}
                />
              </div>

              <span>
                GLUCOSE
              </span>

              <strong>
                {formatValue(
                  latestHealthRecord.glucose
                )}
              </strong>

              <small>
                {formatValue(
                  latestHealthRecord.glucose_reading_type,
                  "mg/dL"
                )}
              </small>

            </div>


            <div className="doctor-vital-card">

              <div className="doctor-vital-icon">
                <TrendingUp
                  size={18}
                />
              </div>

              <span>
                CHOLESTEROL
              </span>

              <strong>
                {formatValue(
                  latestHealthRecord.cholesterol
                )}
              </strong>

              <small>
                mg/dL
              </small>

            </div>


            <div className="doctor-vital-card">

              <div className="doctor-vital-icon">
                <Scale
                  size={18}
                />
              </div>

              <span>
                BMI
              </span>

              <strong>
                {latestPrediction?.bmi
                  ? Number(
                      latestPrediction.bmi
                    ).toFixed(2)
                  : "N/A"}
              </strong>

              <small>
                latest prediction
              </small>

            </div>

          </div>
        )}

      </section>


      {/* =====================================================
          PREDICTIVE HEALTH
      ===================================================== */}

      <section className="doctor-patient-section">

        <div className="doctor-patient-section-heading">

          <div>
            <span>
              PREDICTIVE HEALTH
            </span>

            <h2>
              Cardiovascular risk prediction
            </h2>
          </div>

          <small>
            {latestPrediction
              ? `Generated ${formatDateTime(
                  latestPrediction.created_at
                )}`
              : "No prediction available"}
          </small>

        </div>

        {!latestPrediction ? (
          <div className="doctor-patient-empty">

            <Brain size={22} />

            <p>
              No prediction has been
              generated for this
              patient yet.
            </p>

          </div>
        ) : (
          <div className="doctor-prediction-card">

            <div className="doctor-prediction-main">

              <div className="doctor-prediction-icon">
                <HeartPulse
                  size={23}
                />
              </div>

              <div className="doctor-prediction-copy">

                <span className="prediction-label">
                  MODEL-ESTIMATED
                  CARDIOVASCULAR
                  PROBABILITY
                </span>

                <div className="doctor-prediction-value-row">

                  <strong className="doctor-prediction-value">
                    {getPredictionPercentage(
                      latestPrediction.probability_cardio
                    ) ||
                      "N/A"}
                  </strong>

                  <span
                    className={`doctor-risk-badge ${riskLevel.className}`}
                  >
                    {riskLevel.label}
                  </span>

                </div>

                <h3>
                  {Number(
                    latestPrediction.probability_cardio
                  ) >= 0.7
                    ? "The model estimates a higher cardiovascular risk."
                    : Number(
                        latestPrediction.probability_cardio
                      ) >= 0.4
                    ? "The model estimates a moderate cardiovascular risk."
                    : "The model estimates a lower cardiovascular risk."}
                </h3>

                <div className="doctor-prediction-bar">

                  <div
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            latestPrediction.probability_cardio
                          ) * 100,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>

            </div>


            <div className="doctor-prediction-probabilities">

              <div>
                <span>
                  CARDIOVASCULAR RISK
                </span>

                <strong>
                  {getPredictionPercentage(
                    latestPrediction.probability_cardio
                  ) ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>
                  NO CARDIOVASCULAR RISK
                </span>

                <strong>
                  {getPredictionPercentage(
                    latestPrediction.probability_no_cardio
                  ) ||
                    "N/A"}
                </strong>
              </div>

            </div>


            <div className="doctor-prediction-note">

              <AlertCircle
                size={15}
              />

              <p>
                This is a model-generated
                risk estimate based on
                recorded health inputs.
                It is not a clinical
                diagnosis.
              </p>

            </div>

          </div>
        )}

      </section>


      {/* =====================================================
          AI HEALTH INSIGHTS
      ===================================================== */}

      <section className="doctor-patient-section doctor-ai-section">

        <div className="doctor-patient-section-heading">

          <div>

            <span>
              AI HEALTH INSIGHTS
            </span>

            <h2>
              What the patient's recent
              data is telling you
            </h2>

          </div>

          <small>
            Based on recorded health
            data
          </small>

        </div>


        <div className="doctor-ai-layout">

          <div className="doctor-ai-insights">

            {aiInsights.length ===
            0 ? (
              <div className="doctor-patient-empty">

                <Brain size={22} />

                <p>
                  More recorded health
                  data is needed to
                  generate patient-specific
                  insights.
                </p>

              </div>
            ) : (
              aiInsights.map(
                (
                  insight,
                  index
                ) => {
                  const InsightIcon =
                    insight.icon;

                  return (
                    <article
                      className={`doctor-ai-insight-card ${insight.tone}`}
                      key={`${insight.title}-${index}`}
                    >

                      <div className="doctor-ai-insight-top">

                        <div className="doctor-ai-insight-icon">

                          <InsightIcon
                            size={17}
                          />

                        </div>

                        <span>
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                      </div>

                      <h3>
                        {insight.title}
                      </h3>

                      <p>
                        {insight.text}
                      </p>

                      <strong>
                        {insight.value}
                      </strong>

                    </article>
                  );
                }
              )
            )}

          </div>


          {/* EXPLAINABILITY */}

          <div className="doctor-ai-explainability">

            <div className="doctor-explainability-header">

              <Brain size={17} />

              <div>
                <span>
                  MODEL EXPLAINABILITY
                </span>

                <h3>
                  Prediction inputs
                </h3>
              </div>

            </div>

            {latestPrediction ? (
              <div className="doctor-explainability-list">

                <div>
                  <span>
                    AGE
                  </span>

                  <strong>
                    {formatValue(
                      latestPrediction.age_years
                    )}{" "}
                    years
                  </strong>
                </div>

                <div>
                  <span>
                    BMI
                  </span>

                  <strong>
                    {formatValue(
                      latestPrediction.bmi
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    BLOOD PRESSURE
                  </span>

                  <strong>
                    {formatValue(
                      latestPrediction.systolic_bp
                    )}
                    /
                    {formatValue(
                      latestPrediction.diastolic_bp
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    GLUCOSE
                  </span>

                  <strong>
                    {formatValue(
                      latestPrediction.glucose
                    )}{" "}
                    mg/dL
                  </strong>
                </div>

                <div>
                  <span>
                    CHOLESTEROL
                  </span>

                  <strong>
                    {formatValue(
                      latestPrediction.cholesterol
                    )}{" "}
                    mg/dL
                  </strong>
                </div>

                <div>
                  <span>
                    WEIGHT
                  </span>

                  <strong>
                    {formatValue(
                      latestPrediction.weight_kg
                    )}{" "}
                    kg
                  </strong>
                </div>

              </div>
            ) : (
              <p className="doctor-explainability-empty">
                Prediction inputs will
                appear here after a
                prediction is generated.
              </p>
            )}

            <div className="doctor-explainability-note">
              SHAP contribution values
              are not returned by the
              current prediction API,
              so no artificial feature
              contributions are shown.
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          LIFESTYLE
      ===================================================== */}

      <section className="doctor-patient-section">

        <div className="doctor-patient-section-heading">

          <div>

            <span>
              LIFESTYLE PROFILE
            </span>

            <h2>
              Daily health behaviour
            </h2>

          </div>

        </div>

        {!latestHealthRecord ? (
          <div className="doctor-patient-empty">

            <Activity size={22} />

            <p>
              Lifestyle information
              is not available yet.
            </p>

          </div>
        ) : (
          <div className="doctor-lifestyle-grid">

            <div className="doctor-lifestyle-item">
              <Moon size={17} />

              <div>
                <span>
                  SLEEP
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.sleep_hours
                  )}{" "}
                  hrs
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Moon size={17} />

              <div>
                <span>
                  SLEEP QUALITY
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.sleep_quality
                  )}
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Footprints
                size={17}
              />

              <div>
                <span>
                  STEPS
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.steps
                  )}
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Activity
                size={17}
              />

              <div>
                <span>
                  PHYSICAL ACTIVITY
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.physical_activity_minutes
                  )}{" "}
                  min
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Brain size={17} />

              <div>
                <span>
                  STRESS
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.stress_level
                  )}
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Droplets
                size={17}
              />

              <div>
                <span>
                  WATER
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.water_intake_litres
                  )}{" "}
                  L
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Cigarette
                size={17}
              />

              <div>
                <span>
                  SMOKING TODAY
                </span>

                <strong>
                  {latestHealthRecord.smoking_today
                    ? `${formatValue(
                        latestHealthRecord.cigarettes_today,
                        "Recorded"
                      )} cigarettes`
                    : "No"}
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Wine size={17} />

              <div>
                <span>
                  ALCOHOL TODAY
                </span>

                <strong>
                  {latestHealthRecord.alcohol_today
                    ? `${formatValue(
                        latestHealthRecord.drinks_today,
                        "Recorded"
                      )} drinks`
                    : "No"}
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Clock3
                size={17}
              />

              <div>
                <span>
                  SEDENTARY TIME
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.sedentary_time_hours
                  )}{" "}
                  hrs
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Activity
                size={17}
              />

              <div>
                <span>
                  ENERGY
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.energy_level
                  )}
                </strong>
              </div>
            </div>


            <div className="doctor-lifestyle-item">
              <Brain size={17} />

              <div>
                <span>
                  MOOD
                </span>

                <strong>
                  {formatValue(
                    latestHealthRecord.mood
                  )}
                </strong>
              </div>
            </div>

          </div>
        )}

      </section>


      {/* =====================================================
          MEDICAL BACKGROUND
      ===================================================== */}

      <section className="doctor-patient-section">

        <div className="doctor-patient-section-heading">

          <div>

            <span>
              MEDICAL BACKGROUND
            </span>

            <h2>
              Clinical information
            </h2>

          </div>

        </div>


        <div className="doctor-medical-grid">

          <div className="doctor-medical-box">

            <span>
              EXISTING CONDITIONS
            </span>

            <p>
              {formatValue(
                patient.existingConditions,
                "No conditions recorded"
              )}
            </p>

          </div>


          <div className="doctor-medical-box">

            <span>
              FAMILY HISTORY
            </span>

            <p>
              {formatValue(
                patient.familyHistory,
                "No family history recorded"
              )}
            </p>

          </div>


          <div className="doctor-medical-box">

            <span>
              CURRENT MEDICATIONS
            </span>

            <p>
              {formatValue(
                patient.currentMedications,
                "No medications recorded"
              )}
            </p>

          </div>


          <div className="doctor-medical-box">

            <span>
              PREVIOUS HEALTH ISSUES
            </span>

            <p>
              {formatValue(
                patient.previousHealthIssues,
                "No previous health issues recorded"
              )}
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          PREDICTION HISTORY
      ===================================================== */}

      <section className="doctor-patient-section">

        <div className="doctor-patient-section-heading">

          <div>

            <span>
              HISTORY
            </span>

            <h2>
              Prediction history
            </h2>

          </div>

          <small>
            {allDailyPredictionHistory.length} distinct dates
          </small>

        </div>


        {allDailyPredictionHistory.length > 0 && (
          <div className="doctor-history-toolbar">
            <p>
              {showCompletePredictionHistory
                ? "Complete daily history is shown below. Older records remain saved."
                : "Showing the latest 2 dates with available prediction data."}
            </p>
            <button
              type="button"
              className="doctor-secondary-button doctor-history-toggle"
              onClick={() => setShowCompletePredictionHistory((current) => !current)}
            >
              {showCompletePredictionHistory ? "Show Latest 2 Dates" : "View Complete Prediction History"}
            </button>
          </div>
        )}

        {visiblePredictionHistory.length ===
        0 ? (
          <div className="doctor-patient-empty">

            <Clock3 size={22} />

            <p>
              No prediction history
              is available.
            </p>

          </div>
        ) : (
          <div className="doctor-history-table-wrapper">

            <table className="doctor-history-table">

              <thead>

                <tr>
                  <th>
                    DATE
                  </th>

                  <th>
                    RESULT
                  </th>

                  <th>
                    RISK
                  </th>

                  <th>
                    BP
                  </th>

                  <th>
                    GLUCOSE
                  </th>

                  <th>
                    CHOLESTEROL
                  </th>

                  <th>
                    BMI
                  </th>
                </tr>

              </thead>

              <tbody>

                {visiblePredictionHistory.map(
                  (prediction) => (
                    <tr
                      key={
                        prediction.id
                      }
                    >

                      <td>

                        <div className="prediction-history-date">

                          <strong>
                            {formatDate(
                              prediction.created_at
                            )}
                          </strong>

                          <span>
                            {
                              prediction.sessionLabel
                            }

                            {" · "}

                            {formatTime(
                              prediction.created_at
                            )}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span
                          className={
                            Number(
                              prediction.prediction
                            ) === 1
                              ? "history-result risk"
                              : "history-result safe"
                          }
                        >
                          {Number(
                            prediction.prediction
                          ) === 1
                            ? "Risk predicted"
                            : "No risk predicted"}
                        </span>

                      </td>


                      <td>
                        {getPredictionPercentage(
                          prediction.probability_cardio
                        ) ||
                          "N/A"}
                      </td>


                      <td>
                        {formatValue(
                          prediction.systolic_bp
                        )}
                        /
                        {formatValue(
                          prediction.diastolic_bp
                        )}
                      </td>


                      <td>
                        {formatValue(
                          prediction.glucose
                        )}
                      </td>


                      <td>
                        {formatValue(
                          prediction.cholesterol
                        )}
                      </td>


                      <td>
                        {formatValue(
                          prediction.bmi
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {showCompletePredictionHistory && allDailyPredictionHistory.length > 0 && (
          <div className="doctor-history-comparison">
            <div className="doctor-history-comparison-heading">
              <div>
                <span>HEALTH TREND COMPARISON</span>
                <h3>Compare consecutive periods</h3>
                <p>Daily compares consecutive recorded dates; weekly compares consecutive 7-day groups from the first recorded date; monthly compares consecutive calendar months. Periods without data are not fabricated.</p>
              </div>
              <div className="doctor-history-filter" role="group" aria-label="Prediction history comparison period">
                {["daily", "weekly", "monthly"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={historyViewMode === mode ? "active" : ""}
                    onClick={() => setHistoryViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="doctor-history-comparison-table-wrap">
              <table className="doctor-history-comparison-table">
                <thead><tr><th>PERIOD</th><th>CV RISK</th><th>WEIGHT</th><th>BLOOD PRESSURE</th><th>BMI</th><th>GLUCOSE</th><th>VS PREVIOUS</th></tr></thead>
                <tbody>
                  {[...predictionComparisonPeriods].reverse().map((period, index, chronological) => {
                    const previous = chronological[index - 1];
                    const delta = (field) => previous && period[field] !== null && previous[field] !== null ? period[field] - previous[field] : null;
                    const riskDelta = delta("cardio");
                    return (
                      <tr key={period.id}>
                        <td><strong>{period.label}</strong><small>{period.startDate ? formatDate(period.startDate) : ""}{period.endDate && period.endDate !== period.startDate ? ` – ${formatDate(period.endDate)}` : ""}</small></td>
                        <td>{formatComparisonValue(period.cardio === null ? null : period.cardio * 100, "%")}</td>
                        <td>{formatComparisonValue(period.weight, " kg")}</td>
                        <td>{formatComparisonValue(period.systolic)} / {formatComparisonValue(period.diastolic)} mmHg</td>
                        <td>{formatComparisonValue(period.bmi)}</td>
                        <td>{formatComparisonValue(period.glucose)}</td>
                        <td>{riskDelta === null ? "—" : `${riskDelta > 0 ? "+" : ""}${(riskDelta * 100).toFixed(1)} percentage points`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="doctor-history-comparison-note">Risk values are model estimates, not diagnoses. Averages summarize the records available within each period.</p>
          </div>
        )}

      </section>


      {/* =====================================================
          DOCTOR REVIEW & SUGGESTIONS
      ===================================================== */}

      <section className="doctor-patient-section doctor-review-section">

        <div className="doctor-patient-section-heading">

          <div>

            <span>
              CLINICAL REVIEW
            </span>

            <h2>
              Doctor's Suggestions & Review
            </h2>

          </div>

          <MessageSquareText
            size={18}
          />

        </div>


        <form
          className="doctor-review-form"
          onSubmit={
            handleReviewSubmit
          }
        >

          <div className="doctor-form-field">

            <label htmlFor="review-category">
              REVIEW CATEGORY
            </label>

            <select
              id="review-category"
              value={
                reviewForm.category
              }
              onChange={(
                event
              ) =>
                setReviewForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    category:
                      event.target
                        .value,
                  })
                )
              }
            >

              <option value="general">
                General
              </option>

              <option value="lifestyle">
                Lifestyle
              </option>

              <option value="medication">
                Medication
              </option>

              <option value="follow-up">
                Follow-up
              </option>

              <option value="clinical-review">
                Clinical Review
              </option>

            </select>

          </div>


          <div className="doctor-form-field">

            <label htmlFor="doctor-review-text">
              REVIEW / SUGGESTION
            </label>

            <textarea
              id="doctor-review-text"
              rows={5}
              placeholder="Write your clinical observation, suggestion or follow-up recommendation..."
              value={
                reviewForm.reviewText
              }
              onChange={(
                event
              ) =>
                setReviewForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    reviewText:
                      event.target
                        .value,
                  })
                )
              }
            />

          </div>


          {reviewError && (
            <div className="doctor-form-error">
              {reviewError}
            </div>
          )}


          {reviewMessage && (
            <div className="doctor-form-success">
              {reviewMessage}
            </div>
          )}


          <div className="doctor-form-actions">

            {editingReviewId && (
              <button
                type="button"
                className="doctor-secondary-button"
                onClick={
                  handleCancelReviewEdit
                }
              >
                <X size={14} />

                Cancel edit
              </button>
            )}

            <button
              type="submit"
              className="doctor-primary-button"
              disabled={
                reviewLoading
              }
            >
              {reviewLoading ? (
                <Loader2
                  size={14}
                  className="doctor-patient-spinner"
                />
              ) : (
                <Save size={14} />
              )}

              {editingReviewId
                ? "Update review"
                : "Save review"}
            </button>

          </div>

        </form>


        {/* REVIEW HISTORY */}

        <div className="doctor-review-history">

          <div className="doctor-subsection-heading">

            <span>
              REVIEW HISTORY
            </span>

            <small>
              {reviews.length}{" "}
              review
              {reviews.length ===
              1
                ? ""
                : "s"}
            </small>

          </div>


          {reviews.length ===
          0 ? (
            <div className="doctor-patient-empty compact">

              <MessageSquareText
                size={20}
              />

              <p>
                No doctor reviews have
                been added for this
                patient yet.
              </p>

            </div>
          ) : (
            <div className="doctor-review-list">

              {[...reviews]
                .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                .slice(0, showAllReviews ? 5 : 2)
                .map((review) => (
                  <article
                    className="doctor-review-card"
                    key={
                      review.id
                    }
                  >

                    <div className="doctor-review-card-top">

                      <div>

                        <span className="doctor-review-category">
                          {formatLabel(
                            review.category
                          )}
                        </span>

                        <small>
                          {formatDateTime(
                            review.created_at
                          )}
                        </small>

                      </div>


                      <button
                        type="button"
                        className="doctor-icon-button"
                        onClick={() =>
                          handleEditReview(
                            review
                          )
                        }
                        title="Edit review"
                      >
                        <Pencil
                          size={14}
                        />
                      </button>

                    </div>


                    <p>
                      {
                        review.review_text
                      }
                    </p>

                  </article>
                )
              )}

            </div>
          )}

          {reviews.length > 2 && (
            <button
              type="button"
              className="doctor-secondary-button doctor-review-view-all"
              onClick={() => setShowAllReviews((current) => !current)}
            >
              {showAllReviews ? "Show Latest 2" : `View All (${Math.min(reviews.length, 5)})`}
            </button>
          )}

        </div>

      </section>


      {/* =====================================================
          CONSULTATION
      ===================================================== */}

      <section className="doctor-patient-section doctor-consultation-section">

        <div className="doctor-patient-section-heading">

          <div>

            <span>
              CARE COORDINATION
            </span>

            <h2>
              {editingConsultationId
                ? "Reschedule Consultation"
                : "Schedule Consultation"}
            </h2>

          </div>

          <CalendarClock
            size={18}
          />

        </div>


        <form
          className="doctor-consultation-form"
          onSubmit={
            handleConsultationSubmit
          }
        >

          <div className="doctor-form-grid">

            <div className="doctor-form-field">

              <label htmlFor="consultation-date">
                DATE
              </label>

              <input
                id="consultation-date"
                type="date"
                value={
                  consultationForm.scheduledDate
                }
                min={(() => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
})()}
                onChange={(
                  event
                ) =>
                  setConsultationForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      scheduledDate:
                        event.target
                          .value,
                    })
                  )
                }
              />

            </div>


            <div className="doctor-form-field">

              <label htmlFor="consultation-time">
                TIME
              </label>

              <input
                id="consultation-time"
                type="time"
                value={
                  consultationForm.startTime
                }
                onChange={(
                  event
                ) =>
                  setConsultationForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      startTime:
                        event.target
                          .value,
                    })
                  )
                }
              />

            </div>


            <div className="doctor-form-field">

              <label htmlFor="consultation-duration">
                DURATION
              </label>

              <select
                id="consultation-duration"
                value={
                  consultationForm.durationMinutes
                }
                onChange={(
                  event
                ) =>
                  setConsultationForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      durationMinutes:
                        Number(
                          event.target
                            .value
                        ),
                    })
                  )
                }
              >

                <option value={15}>
                  15 minutes
                </option>

                <option value={30}>
                  30 minutes
                </option>

                <option value={45}>
                  45 minutes
                </option>

                <option value={60}>
                  60 minutes
                </option>

              </select>

            </div>


            <div className="doctor-form-field">

              <label htmlFor="consultation-type">
                TYPE
              </label>

              <select
                id="consultation-type"
                value={
                  consultationForm.consultationType
                }
                onChange={(
                  event
                ) =>
                  setConsultationForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      consultationType:
                        event.target
                          .value,
                    })
                  )
                }
              >

                <option value="general">
                  General Consultation
                </option>

                <option value="follow-up">
                  Follow-up
                </option>

                <option value="risk-review">
                  Risk Review
                </option>

                <option value="lifestyle-review">
                  Lifestyle Review
                </option>

              </select>

            </div>

          </div>


          <div className="doctor-form-field">

            <label htmlFor="consultation-notes">
              NOTES
            </label>

            <textarea
              id="consultation-notes"
              rows={4}
              placeholder="Add any preparation instructions or consultation notes..."
              value={
                consultationForm.notes
              }
              onChange={(
                event
              ) =>
                setConsultationForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    notes:
                      event.target
                        .value,
                  })
                )
              }
            />

          </div>


          {consultationError && (
            <div className="doctor-form-error">
              {consultationError}
            </div>
          )}


          {consultationMessage && (
            <div className="doctor-form-success">
              {consultationMessage}
            </div>
          )}


          <div className="doctor-form-actions">

            {editingConsultationId && (
              <button
                type="button"
                className="doctor-secondary-button"
                onClick={
                  handleCancelConsultationEdit
                }
              >
                <X size={14} />

                Cancel edit
              </button>
            )}


            <button
              type="submit"
              className="doctor-primary-button"
              disabled={
                consultationLoading
              }
            >

              {consultationLoading ? (
                <Loader2
                  size={14}
                  className="doctor-patient-spinner"
                />
              ) : (
                <CalendarClock
                  size={14}
                />
              )}

              {editingConsultationId
                ? "Reschedule consultation"
                : "Schedule consultation"}

            </button>

          </div>

        </form>


        {/* UPCOMING CONSULTATIONS */}

        <div className="doctor-consultation-history">

          <div className="doctor-subsection-heading">

            <span>
              SCHEDULED CONSULTATIONS
            </span>

            <small>
              {
                upcomingConsultations.length
              }{" "}
              upcoming
            </small>

          </div>


          {upcomingConsultations.length ===
          0 ? (
            <div className="doctor-patient-empty compact">

              <CalendarClock
                size={20}
              />

              <p>
                No consultations are
                currently scheduled
                for this patient.
              </p>

            </div>
          ) : (
            <div className="doctor-consultation-list">

              {consultations
                .filter(
                  (item) =>
                    item.status ===
                    "scheduled"
                )
                .map(
                  (
                    consultation
                  ) => (
                    <article
                      className="doctor-consultation-card"
                      key={
                        consultation.id
                      }
                    >

                      <div className="doctor-consultation-main">

                        <div className="doctor-consultation-date">

                          <strong>
                            {formatDate(
                              consultation.scheduled_date
                            )}
                          </strong>

                          <span>
                            {String(
                              consultation.start_time
                            ).slice(
                              0,
                              5
                            )}
                          </span>

                        </div>


                        <div className="doctor-consultation-info">

                          <div className="doctor-consultation-title">

                            <h3>
                              {formatLabel(
                                consultation.consultation_type
                              )}
                            </h3>

                            <span>
                              {
                                consultation.duration_minutes
                              }{" "}
                              min
                            </span>

                          </div>


                          {consultation.notes && (
                            <p>
                              {
                                consultation.notes
                              }
                            </p>
                          )}

                        </div>

                      </div>


                      <div className="doctor-consultation-actions">

                        <button
                          type="button"
                          className="doctor-secondary-button"
                          onClick={() =>
                            handleEditConsultation(
                              consultation
                            )
                          }
                        >
                          <Pencil
                            size={13}
                          />

                          Reschedule
                        </button>


                        <button
                          type="button"
                          className="doctor-danger-button"
                          onClick={() =>
                            handleCancelConsultation(
                              consultation.id
                            )
                          }
                        >
                          <X size={13} />

                          Cancel
                        </button>

                      </div>

                    </article>
                  )
                )}

            </div>
          )}

        </div>

      

      </section>


      {/* =====================================================
          FOOTER DISCLAIMER
      ===================================================== */}

      <div className="doctor-patient-disclaimer">

        <ShieldCheck
          size={16}
        />

        <p>
          Patient information shown
          here is based on the data
          available in LifePredict.
          Predictive outputs are
          decision-support estimates
          and should be interpreted
          by a qualified healthcare
          professional.
        </p>

      </div>

      {/* Review status action stays at the bottom of the patient details page. */}
      <section className="doctor-patient-review-action">
  <button
    type="button"
    className={`doctor-patient-mark-reviewed ${
      isReviewedToday(patientData?.reviewedAt || patientData?.patient?.reviewedAt)
        ? "is-reviewed"
        : ""
    }`}
    onClick={markPatientReviewed}
    disabled={
      reviewingPatient ||
      isReviewedToday(patientData?.reviewedAt || patientData?.patient?.reviewedAt)
    }
  >
    <CheckCircle2 size={18} />
    <span>
      {reviewingPatient
        ? "Saving..."
        : isReviewedToday(patientData?.reviewedAt || patientData?.patient?.reviewedAt)
          ? "Reviewed Today"
          : "Mark as Reviewed"}
    </span>
  </button>

  {reviewStatusMessage && (
    <p className="doctor-patient-review-message">
      {reviewStatusMessage}
    </p>
  )}
</section>

    </main>
  );
}

export default DoctorPatientDetails;