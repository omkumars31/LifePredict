import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Plus,
  X,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HeartPulse,
} from "lucide-react";
import "./DoctorAlerts.css";
const API_BASE = "https://lifepredict-production.up.railway.app/api";
/* =========================================================
   PRIORITY HELPERS
\========================================================= */
const PRIORITY_ORDER = {
  critical: 1,
  review: 2,
  "follow-up": 3,
};
const getPriorityLabel = (priority) => {
  switch (priority) {
    case "critical":
      return "Critical";
    case "review":
      return "Needs review";
    case "follow-up":
      return "Follow-up";
    default:
      return "Alert";
  }
};
const getPriorityIcon = (priority) => {
  switch (priority) {
    case "critical":
      return AlertTriangle;
    case "review":
      return HeartPulse;
    case "follow-up":
      return CalendarClock;
    default:
      return Bell;
  }
};
/* =========================================================
   GENERAL HELPERS
\========================================================= */
const getInitials = (name = "Patient") => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return "P";
  }
  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }
  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};
const getAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null;
  }
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }
  const today = new Date();
  let age =
    today.getFullYear() -
    birthDate.getFullYear();
  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() <
        birthDate.getDate())
  ) {
    age--;
  }
  return age >= 0 ? age : null;
};
const getAlertTimestamp = (alert) => alert?.createdAt || alert?.created_at || alert?.timestamp || alert?.updatedAt || alert?.updated_at || alert?.date || null;
const getAlertPatientId = (alert) => {
  const patient = alert?.patient && typeof alert.patient === "object" ? alert.patient : {};
  return patient.userId || patient.user_id || patient.patient_user_id || patient.patientId || patient.id || alert?.patientUserId || alert?.patient_user_id || alert?.userId || alert?.user_id || alert?.patientId || alert?.patient_id || null;
};
const getLocalDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const keepLatestDatePerPatient = (items = []) => {
  const latestByPatient = new Map();
  items.forEach((item) => {
    const id = getAlertPatientId(item);
    const dateKey = getLocalDateKey(getAlertTimestamp(item));
    if (id == null || !dateKey) return;
    const previous = latestByPatient.get(String(id));
    if (!previous || dateKey > previous) latestByPatient.set(String(id), dateKey);
  });
  return items.filter((item) => {
    const id = getAlertPatientId(item);
    const dateKey = getLocalDateKey(getAlertTimestamp(item));
    if (id == null || !dateKey) return true;
    return latestByPatient.get(String(id)) === dateKey;
  });
};
const formatTimestamp = (value) => {
  if (!value) {
    return "Recently";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};
/* =========================================================
   COMPONENT
\========================================================= */
function DoctorAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [manualDoctorAlerts, setManualDoctorAlerts] = useState([]);
const [showAllManualAlerts, setShowAllManualAlerts] = useState({});
  const [activeFilter, setActiveFilter] =
    useState("all");
  const [sortOrder, setSortOrder] =
    useState("priority");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [manualAlertMessage, setManualAlertMessage] = useState("");
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [showManualAlertForm, setShowManualAlertForm] =
  useState(false);
const [manualAlert, setManualAlert] = useState({
  patientId: "",
  title: "",
  description: "",
  priority: "review",
});
const [manualAlerts, setManualAlerts] = useState([]);
const patientOptions = useMemo(() => {
  const patients = new Map();
  alerts.forEach((alert) => {
    const patient = alert?.patient || {};
    const id =
  patient.userId ||
  alert.userId ||
  alert.patient_user_id ||
  patient.patient_user_id ||
  patient.patientId ||
  alert.patientId ||
  alert.patient_id ||
  null;
    if (!id) return;
    const name =
      patient.fullName ||
      patient.full_name ||
      patient.name ||
      alert.patientName ||
      alert.patient_name ||
      (typeof alert.patient === "string" ? alert.patient : null) ||
      "Patient";
    const key = String(id);
    if (!patients.has(key)) {
      patients.set(key, {
        id: key,
        name,
      });
    }
  });
  return Array.from(patients.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}, [alerts]);
  const token =
    localStorage.getItem("token");
  /* =======================================================
     FETCH ALERTS
  \======================================================= */
  const fetchAlerts = async () => {
    if (!token) {
      setLoading(false);
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `${API_BASE}/alerts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
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
            "Unable to load alerts."
        );
      }
      setAlerts(
        Array.isArray(data.alerts)
          ? data.alerts
          : []
      );
      const manualResponse = await fetch(
  `${API_BASE}/alerts/manual/doctor`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const manualData = await manualResponse.json();
if (!manualResponse.ok || !manualData.success) {
  throw new Error(
    manualData.message || "Unable to load manual doctor alerts."
  );
}
setManualDoctorAlerts(
  Array.isArray(manualData.alerts) ? manualData.alerts : []
);
    } catch (fetchError) {
      console.error(
        "Fetch doctor alerts error:",
        fetchError
      );
      setAlerts([]);
      setError(
        fetchError.message ||
          "Unable to load alerts."
      );
    } finally {
      setLoading(false);
    }
  };
const handleCreateManualAlert = async (event) => {
  event.preventDefault();
  if (!token) {
    setManualAlertMessage("Your session has expired. Please log in again.");
    return;
  }
  const patientUserId = Number(manualAlert.patientId);
  const title = manualAlert.title.trim();
  const message = manualAlert.description.trim();
  const priority = manualAlert.priority;
  if (!Number.isInteger(patientUserId) || patientUserId <= 0) {
    setManualAlertMessage("Please select a valid patient.");
    return;
  }
  if (!title || !message) {
    setManualAlertMessage("Please enter an alert title and description.");
    return;
  }
  try {
    setIsCreatingAlert(true);
    setManualAlertMessage("");
    setError("");
    const response = await fetch(`${API_BASE}/alerts/manual`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    patientUserId: Number(manualAlert.patientId),
    title: manualAlert.title.trim(),
    message: manualAlert.description.trim(),
    priority: manualAlert.priority,
  }),
});
const data = await response.json();
if (!response.ok || !data.success) {
  throw new Error(data.message || "Unable to create manual alert.");
}
    setManualAlertMessage("Manual alert saved successfully.");
    setManualAlert({
      patientId: "",
      title: "",
      description: "",
      priority: "review",
    });
    // Reload the alert data from the backend.
    await fetchAlerts();
    setShowManualAlertForm(false);
  } catch (submitError) {
    console.error("Create manual alert error:", submitError);
    setManualAlertMessage(
      submitError.message || "Unable to save the manual alert."
    );
  } finally {
    setIsCreatingAlert(false);
  }
};
  useEffect(() => {
    fetchAlerts();
  }, []);
  /* =======================================================
     GROUP RAW ALERTS BY PATIENT
     One patient = one card.
     All alerts for that patient remain inside the card.
  \======================================================= */
  const latestPatientAlerts = useMemo(() => keepLatestDatePerPatient(alerts), [alerts]);
  const latestManualDoctorAlerts = useMemo(() => keepLatestDatePerPatient(manualDoctorAlerts), [manualDoctorAlerts]);
  const patientAlertGroups = useMemo(() => {
    const groups = new Map();
    const ensureGroup = (patientId, patientName, age = null) => {
      const key = String(patientId);
      if (!groups.has(key)) {
        groups.set(key, { patientId, patientName, age, initials: getInitials(patientName), alerts: [], manualAlerts: [], highestPriority: "follow-up", latestCreatedAt: null });
      }
      return groups.get(key);
    };
    latestPatientAlerts.forEach((alert) => {
      const patient = alert?.patient && typeof alert.patient === "object" ? alert.patient : {};
      const patientId = getAlertPatientId(alert) || patient.patientId || alert.patientId || patient.id || "unknown-patient";
      const patientName = patient.fullName || patient.full_name || patient.name || alert.patientName || alert.patient_name || (typeof alert.patient === "string" ? alert.patient : null) || "Patient";
      const age = patient.age ?? alert.age ?? getAge(patient.dateOfBirth) ?? getAge(patient.date_of_birth);
      const group = ensureGroup(patientId, patientName, age);
      group.alerts.push(alert);
      const currentPriority = PRIORITY_ORDER[group.highestPriority] || 99;
      const incomingPriority = PRIORITY_ORDER[alert.priority] || 99;
      if (incomingPriority < currentPriority) group.highestPriority = alert.priority;
      const timestamp = getAlertTimestamp(alert);
      if (timestamp && (!group.latestCreatedAt || new Date(timestamp).getTime() > new Date(group.latestCreatedAt).getTime())) group.latestCreatedAt = timestamp;
    });
    latestManualDoctorAlerts.forEach((alert) => {
      const patientId = getAlertPatientId(alert);
      if (patientId == null) return;
      const patientName = alert.patientName || alert.patient_name || alert.patient?.fullName || alert.patient?.full_name || alert.patient?.name || "Patient";
      const group = ensureGroup(patientId, patientName, alert.age ?? null);
      group.manualAlerts.push(alert);
      const priority = String(alert.priority || "review").toLowerCase();
      if ((PRIORITY_ORDER[priority] || 99) < (PRIORITY_ORDER[group.highestPriority] || 99)) group.highestPriority = priority;
      const timestamp = getAlertTimestamp(alert);
      if (timestamp && (!group.latestCreatedAt || new Date(timestamp).getTime() > new Date(group.latestCreatedAt).getTime())) group.latestCreatedAt = timestamp;
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      alerts: group.alerts.sort((a, b) => {
        const priorityDifference = (PRIORITY_ORDER[a.priority] || 99) - (PRIORITY_ORDER[b.priority] || 99);
        if (priorityDifference) return priorityDifference;
        return new Date(getAlertTimestamp(b) || 0).getTime() - new Date(getAlertTimestamp(a) || 0).getTime();
      }),
      manualAlerts: group.manualAlerts.sort((a, b) => new Date(getAlertTimestamp(b) || 0).getTime() - new Date(getAlertTimestamp(a) || 0).getTime()),
    })).sort((a, b) => new Date(b.latestCreatedAt || 0).getTime() - new Date(a.latestCreatedAt || 0).getTime());
  }, [latestPatientAlerts, latestManualDoctorAlerts]);
  /* =======================================================
     SUMMARY
     Critical:
       Unique patients with critical priority.
     Needs review:
       RAW review alerts.
     Follow-up:
       RAW follow-up alerts.
     Total:
       Unique patients.
  \======================================================= */
  // =======================================================
// PATIENT-LEVEL SUMMARY
//
// IMPORTANT:
// Counts UNIQUE PATIENTS, NOT RAW ALERTS.
//
// Example:
//
// Hiral:
//   BP       -> critical
//   Glucose  -> review
//   BMI      -> review
//
// Hiral = 1 Critical patient
// Hiral = 1 Needs Review patient
//
// Even if Hiral has 10 review alerts,
// Needs Review still counts Hiral only ONCE.
// =======================================================
const summary = useMemo(() => {
  const criticalPatients = patientAlertGroups.filter(
    (group) =>
      group.alerts?.some(
        (alert) => alert?.priority === "critical"
      )
  ).length;
  const reviewPatients = patientAlertGroups.filter(
    (group) =>
      group.alerts?.some(
        (alert) => alert?.priority === "review"
      )
  ).length;
  const followUpPatients = patientAlertGroups.filter(
    (group) =>
      group.alerts?.some(
        (alert) => alert?.priority === "follow-up"
      )
  ).length;
  return {
    critical: criticalPatients,
    review: reviewPatients,
    followUp: followUpPatients,
    total: patientAlertGroups.length,
  };
}, [patientAlertGroups]);
  /* =======================================================
     FILTER PATIENT GROUPS
     IMPORTANT FIX:
     Filter checks whether the patient HAS an alert
     of that priority.
     Previously it checked only highestPriority.
     That meant a patient with Critical + Review
     disappeared from the Review filter.
  \======================================================= */
  const filteredPatientGroups =
    useMemo(() => {
      let result = [
        ...patientAlertGroups,
      ];
      if (activeFilter === "manual") {
        result = result.filter((group) => group.manualAlerts?.length > 0);
      } else if (activeFilter !== "all") {
        result = result.filter((group) =>
          group.alerts?.some((alert) => String(alert?.priority || "").toLowerCase() === activeFilter) ||
          group.manualAlerts?.some((alert) => String(alert?.priority || "").toLowerCase() === activeFilter)
        );
      }
      if (
        sortOrder === "priority"
      ) {
        result.sort(
          (a, b) =>
            (PRIORITY_ORDER[
              a.highestPriority
            ] || 99) -
            (PRIORITY_ORDER[
              b.highestPriority
            ] || 99)
        );
      }
      if (
        sortOrder === "recent"
      ) {
        result.sort((a, b) => {
          const dateA =
            a.latestCreatedAt
              ? new Date(
                  a.latestCreatedAt
                ).getTime()
              : 0;
          const dateB =
            b.latestCreatedAt
              ? new Date(
                  b.latestCreatedAt
                ).getTime()
              : 0;
          return dateB - dateA;
        });
      }
      return result;
    }, [
      patientAlertGroups,
      activeFilter,
      sortOrder,
    ]);
  /* =======================================================
     LOADING
  \======================================================= */
  if (loading) {
    return (
      <main className="doctor-alerts-page">
        <section className="doctor-alerts-container doctor-alerts-state">
          <Bell size={30} />
          <h3>
            Loading alerts
          </h3>
          <p>
            Checking your connected
            patients for meaningful
            health updates...
          </p>
        </section>
      </main>
    );
  }
  /* =======================================================
     ERROR
  \======================================================= */
  if (error) {
    return (
      <main className="doctor-alerts-page">
        <section className="doctor-alerts-container doctor-alerts-state error">
          <AlertTriangle size={30} />
          <h3>
            Unable to load alerts
          </h3>
          <p>{error}</p>
          <button
            type="button"
            className="doctor-alert-retry"
            onClick={fetchAlerts}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }
  /* =======================================================
     PAGE
  \======================================================= */
  return (
    <main className="doctor-alerts-page">
      {/* PAGE HEADER */}
<section className="doctor-alerts-header">
  <div className="doctor-alerts-heading">
    <span className="doctor-alerts-eyebrow">
      PATIENT CARE
    </span>
    <h1>Alerts</h1>
    <p>
      Review meaningful patient changes, risk updates, and
      follow-up needs from one place.
    </p>
  </div>
  <button
    type="button"
    className="doctor-alerts-new-button"
    onClick={() => setShowManualAlertForm((previous) => !previous)}
    aria-expanded={showManualAlertForm}
  >
    <Plus size={18} />
    {showManualAlertForm ? "Close Form" : "Add Manual Alert"}
  </button>
</section>
{/* MANUAL ALERT FORM */}
{showManualAlertForm && (
  <section
    className="doctor-manual-alert-form"
    aria-labelledby="doctor-manual-alert-title"
  >
    <div className="doctor-manual-alert-form-header">
      <div>
        <span className="doctor-manual-alert-eyebrow">
          DOCTOR ACTION
        </span>
        <h2 id="doctor-manual-alert-title">
          Create a manual alert
        </h2>
        <p>
          Add a patient concern, clinical note, or follow-up reminder.
        </p>
      </div>
      <button
        type="button"
        className="doctor-manual-alert-close"
        aria-label="Close manual alert form"
        onClick={() => setShowManualAlertForm(false)}
      >
        <X size={19} />
      </button>
    </div>
    <form onSubmit={handleCreateManualAlert}>
      <label className="doctor-manual-alert-field">
        <span>Patient</span>
        <select
          required
          value={manualAlert.patientId}
          onChange={(event) =>
            setManualAlert((previous) => ({
              ...previous,
              patientId: event.target.value,
            }))
          }
        >
          <option value="">Select a patient</option>
          {patientOptions.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name} — {patient.id}
            </option>
          ))}
        </select>
        {patientOptions.length === 0 && (
          <small>
            No patient names are available in the loaded alerts.
          </small>
        )}
      </label>
      <label className="doctor-manual-alert-field">
        <span>Alert title</span>
        <input
          required
          maxLength={120}
          value={manualAlert.title}
          placeholder="e.g. Schedule blood pressure follow-up"
          onChange={(event) =>
            setManualAlert((previous) => ({
              ...previous,
              title: event.target.value,
            }))
          }
        />
      </label>
      <label className="doctor-manual-alert-field doctor-manual-alert-description">
        <span>Description</span>
        <textarea
          required
          rows={2}
          maxLength={1000}
          value={manualAlert.description}
          placeholder="Describe the concern or recommended follow-up..."
          onChange={(event) =>
            setManualAlert((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
        />
      </label>
      <label className="doctor-manual-alert-field">
        <span>Priority</span>
        <select
          value={manualAlert.priority}
          onChange={(event) =>
            setManualAlert((previous) => ({
              ...previous,
              priority: event.target.value,
            }))
          }
        >
          <option value="critical">Critical</option>
          <option value="review">Needs review</option>
          <option value="follow-up">Follow-up</option>
        </select>
      </label>
      <div className="doctor-manual-alert-form-actions">
        <button
          type="button"
          className="doctor-manual-alert-cancel"
          onClick={() => {
            setShowManualAlertForm(false);
            setManualAlert({
              patientId: "",
              title: "",
              description: "",
              priority: "review",
            });
          }}
        >
          Cancel
        </button>
        <button
  type="submit"
  className="doctor-alerts-new-button"
  disabled={isCreatingAlert}
>
  {isCreatingAlert ? "Saving..." : "Create Alert"}
</button>
      </div>
      <p className="doctor-manual-alert-note" role="status" aria-live="polite">
  {manualAlertMessage}
</p>
    </form>
  </section>
)}
      {/* SUMMARY CARDS */}
      <section className="doctor-alerts-summary">
        {/* CRITICAL */}
        <div className="doctor-alert-summary-card critical">
          <div className="doctor-alert-summary-icon">
            <AlertTriangle size={19} />
          </div>
          <div>
            <span>
              Critical
            </span>
            <strong>
              {summary.critical}
            </strong>
            <small>
              Patients requiring prompt review
            </small>
          </div>
        </div>
        {/* NEEDS REVIEW */}
        <div className="doctor-alert-summary-card review">
          <div className="doctor-alert-summary-icon">
            <HeartPulse size={19} />
          </div>
          <div>
            <span>
              Needs review
            </span>
            <strong>
              {summary.review}
            </strong>
            <small>
              Active concerns needing clinical review
            </small>
          </div>
        </div>
        {/* FOLLOW-UP */}
        <div className="doctor-alert-summary-card followup">
          <div className="doctor-alert-summary-icon">
            <CalendarClock size={19} />
          </div>
          <div>
            <span>
              Follow-up
            </span>
            <strong>
              {summary.followUp}
            </strong>
            <small>
              Active follow-up alerts
            </small>
          </div>
        </div>
        {/* TOTAL PATIENTS */}
        <div className="doctor-alert-summary-card total">
          <div className="doctor-alert-summary-icon">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <span>
              Patients with alerts
            </span>
            <strong>
              {summary.total}
            </strong>
            <small>
              Unique patients needing attention
            </small>
          </div>
        </div>
      </section>
      {/* FILTER BAR */}
      <section className="doctor-alerts-toolbar">
        <div className="doctor-alert-filters">
          <button
            type="button"
            className={
              activeFilter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveFilter("all")
            }
          >
            All alerts
          </button>
          <button
            type="button"
            className={
              activeFilter === "critical"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveFilter(
                "critical"
              )
            }
          >
            Critical
          </button>
          <button
            type="button"
            className={
              activeFilter === "review"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveFilter(
                "review"
              )
            }
          >
            Needs review
          </button>
          <button
            type="button"
            className={activeFilter === "follow-up" ? "active" : ""}
            onClick={() => setActiveFilter("follow-up")}
          >
            Follow-up
          </button>
          <button
            type="button"
            className={activeFilter === "manual" ? "active" : ""}
            onClick={() => setActiveFilter("manual")}
          >
            Doctor-added
          </button>
        </div>
        <div className="doctor-alert-sort">
          <span>
            Sort by
          </span>
          <div className="doctor-alert-sort-select">
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
            >
              <option value="priority">
                Priority
              </option>
              <option value="recent">
                Most recent
              </option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
      </section>
      {/* PATIENT ALERT LIST */}
      <section className="doctor-alerts-container">
        <div className="doctor-alerts-list-header">
          <div>
            <span>
              ALERT CENTER
            </span>
            <h2>
              Patient alerts
            </h2>
          </div>
          <p>
            {filteredPatientGroups.length}{" "}
            {filteredPatientGroups.length ===
            1
              ? "patient"
              : "patients"}{" "}
            shown
          </p>
        </div>
        <div className="doctor-alert-list">
          {/* EMPTY STATE */}
          {filteredPatientGroups.length ===
          0 ? (
            <div className="doctor-alert-empty">
              <CheckCircle2 size={34} />
              <h3>
                {alerts.length === 0 && manualDoctorAlerts.length === 0
                  ? "No alerts available"
                  : "No patients in this category"}
              </h3>
              <p>
                {alerts.length === 0 && manualDoctorAlerts.length === 0
                  ? "There are currently no clinical alerts or doctor-added alerts for your connected patients."
                  : activeFilter === "manual"
                    ? "There are no doctor-added alerts matching this view."
                    : "There are no patients matching the selected alert category."}
              </p>
            </div>
          ) : (
            filteredPatientGroups.map(
              (group) => {
                const visibleAlerts = activeFilter === "manual" ? [] : (group.alerts || []).filter((alert) => activeFilter === "all" || String(alert?.priority || "").toLowerCase() === activeFilter);
                const visibleManualAlerts = (group.manualAlerts || []).filter((alert) => activeFilter === "all" || activeFilter === "manual" || String(alert?.priority || "").toLowerCase() === activeFilter);
                const displayPriority = activeFilter !== "all" && activeFilter !== "manual" ? activeFilter : group.highestPriority;
                const PatientIcon =
                  getPriorityIcon(
                    displayPriority
                  );
                return (
                  <article
                    className={`doctor-alert-item patient-alert-group ${displayPriority}`}
                    key={
                      group.patientId
                    }
                  >
                    {/* MAIN PATIENT AREA */}
                    <div className="doctor-alert-main">
                      <div className="doctor-alert-icon">
                        <PatientIcon
                          size={20}
                          strokeWidth={1.8}
                        />
                      </div>
                      <div className="doctor-alert-content">
                        {/* PATIENT HEADER */}
                        <div className="doctor-alert-top">
                          <div className="doctor-alert-patient">
                            <div className="doctor-alert-avatar">
                              {group.initials}
                            </div>
                            <div>
                              <strong>
                                {group.patientName}
                              </strong>
                              <span>
                                {group.patientId}
                                {group.age !==
                                  null &&
                                group.age !==
                                  undefined
                                  ? ` · ${group.age} years`
                                  : ""}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`doctor-alert-badge ${displayPriority}`}
                          >
                            {activeFilter === "manual" ? "Doctor-added" : getPriorityLabel(displayPriority)}
                          </span>
                        </div>
                        {/* PATIENT SUMMARY */}
                        {activeFilter !== "manual" && <div className="doctor-alert-patient-summary">
                          <span className="doctor-alert-type">
                            PATIENT ALERT SUMMARY
                          </span>
                          <h3>
                            {group.alerts.length}{" "}
                            {group.alerts.length ===
                            1
                              ? "active concern"
                              : "active concerns"}
                          </h3>
                          <p>
                            The following
                            health findings
                            require attention
                            for this patient.
                          </p>
                        </div>}
                        {/* ONLY ALERTS MATCHING THE SELECTED FILTER */}
                        {activeFilter !== "manual" && <div className="doctor-alert-issues">
                          {visibleAlerts.map(
                            (
                              alert,
                              index
                            ) => {
                              const IssueIcon =
                                getPriorityIcon(
                                  alert.priority
                                );
                              return (
                                <div
                                  className="doctor-alert-issue"
                                  key={
                                    alert.id ||
                                    `${group.patientId}-${alert.createdAt || alert.created_at || index}`
                                  }
                                >
                                  <div
                                    className={`doctor-alert-issue-icon ${alert.priority || ""}`}
                                  >
                                    <IssueIcon
                                      size={17}
                                      strokeWidth={
                                        1.8
                                      }
                                    />
                                  </div>
                                  <div className="doctor-alert-issue-content">
                                    <div className="doctor-alert-issue-heading">
                                      <span className="doctor-alert-issue-type">
                                        {alert.type ||
                                          "Health update"}
                                      </span>
                                      <span
                                        className={`doctor-alert-issue-badge ${alert.priority || ""}`}
                                      >
                                        {getPriorityLabel(
                                          alert.priority
                                        )}
                                      </span>
                                    </div>
                                    <h4>
                                      {alert.title ||
                                        "Patient health update"}
                                    </h4>
                                    <p>
                                      {alert.description ||
                                        "A new health update is available for clinical review."}
                                    </p>
                                    {alert.previous !==
                                      null &&
                                    alert.previous !==
                                      undefined ? (
                                      <div className="doctor-alert-change">
                                        <div>
                                          <span>
                                            Previous
                                          </span>
                                          <strong>
                                            {
                                              alert.previous
                                            }
                                          </strong>
                                        </div>
                                        <ArrowRight
                                          size={17}
                                          className="doctor-alert-change-arrow"
                                        />
                                        <div>
                                          <span>
                                            Latest
                                          </span>
                                          <strong>
                                            {alert.current ??
                                              "—"}
                                          </strong>
                                        </div>
                                        {alert.change && (
                                          <span className="doctor-alert-change-value">
                                            {
                                              alert.change
                                            }
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="doctor-alert-simple-value">
                                        <span>
                                          Current status
                                        </span>
                                        <strong>
                                          {alert.current ||
                                            "Review required"}
                                        </strong>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>}
                    {/* DOCTOR MANUALLY RAISED ALERTS FOR THIS PATIENT */}
                    {(activeFilter === "all" || activeFilter === "manual" || visibleManualAlerts.length > 0) && <section className="alerts-section patient-manual-alerts">
                      <div className="alerts-section-header">
                        <div>
                          <p className="section-eyebrow">DOCTOR-RECORDED ALERTS</p>
                          <h2>Manually Raised Alerts</h2>
                          <p>Manual alerts recorded for {group.patientName}.</p>
                        </div>
                      </div>
                      {visibleManualAlerts.length === 0 ? (
                        <div className="empty-alerts patient-manual-empty">
                          <p>No manual alerts for this patient on the latest alert date.</p>
                        </div>
                      ) : (
                        <div className="manual-alert-list">
                          {visibleManualAlerts.map((alert, index) => (
                            <article className="manual-alert-card" key={alert.id || `${group.patientId}-manual-${index}`}>
                              <div className="manual-alert-top">
                                <span className="manual-alert-patient">{alert.patientName || alert.patient_name || group.patientName}</span>
                                <span className={`alert-priority ${alert.priority || "review"}`}>
                                  {String(alert.priority || "review").toLowerCase() === "review" ? "Needs review" : String(alert.priority || "follow-up").toLowerCase() === "follow-up" ? "Follow-up" : getPriorityLabel(String(alert.priority).toLowerCase())}
                                </span>
                              </div>
                              <h3>{alert.title || "Doctor-recorded alert"}</h3>
                              <p>{alert.message || alert.description || "No additional description provided."}</p>
                              <small>{formatTimestamp(getAlertTimestamp(alert))}</small>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>}
                    </div>
                    </div>
                    {/* RIGHT SIDE */}
                    <div className="doctor-alert-action">
                      <span className="doctor-alert-time">
                        <Clock3
                          size={14}
                        />
                        {formatTimestamp(
                          group.latestCreatedAt
                        )}
                      </span>
                      <button
                        type="button"
                        className="doctor-alert-action-button"
                        onClick={() => {
                          if (
                            !group.patientId
                          ) {
                            return;
                          }
                          navigate(
                            `/doctor/patients/${encodeURIComponent(
                              group.patientId
                            )}`
                          );
                        }}
                      >
                        Review patient
                        <ArrowRight
                          size={16}
                        />
                      </button>
                    </div>
                  </article>
                );
              }
            )
          )}
        </div>
      </section>
      {/* CLINICAL INSIGHT */}
      <section className="doctor-alerts-insight">
        <div className="doctor-alerts-insight-icon">
          <HeartPulse size={22} />
        </div>
        <div>
          <span>
            LIFE PREDICT CLINICAL INSIGHT
          </span>
          <h3>
            Review changes in context,
            not isolated readings.
          </h3>
          <p>
            Alerts are generated from
            the health information and
            prediction data currently
            available for your connected
            patients.
          </p>
        </div>
      </section>
    </main>
  );
}
export default DoctorAlerts;
