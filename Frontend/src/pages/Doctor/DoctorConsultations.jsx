import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  ChevronDown,
  ArrowRight,
  Stethoscope,
  RefreshCw,
  Loader2,
  CalendarX2,
} from "lucide-react";
import "./DoctorConsultations.css";
const API_BASE = "https://lifepredict-production.up.railway.app/api";
/* =========================================================
   DATE HELPERS
\========================================================= */
function getLocalDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
/*
  VERY IMPORTANT FIX
  scheduled_date is a MySQL DATE.
  We always prefer the first 10 characters:
  2026-10-07
  2026-10-07T00:00:00.000Z
  This prevents timezone-related date shifting.
*/
function getConsultationDateTime(dateValue, timeValue) {
  const date = normalizeConsultationDate(dateValue);
  if (!date) return null;
  const time = String(timeValue || "00:00:00").trim().slice(0, 8);
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  const parsed = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function normalizeConsultationDate(value) {
  if (!value) return "";
  const raw = String(value).trim();
  const match = raw.match(
    /^(\d{4}-\d{2}-\d{2})/
  );
  if (match) {
    return match[1];
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const year = parsed.getFullYear();
  const month = String(
    parsed.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    parsed.getDate()
  ).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDate(dateValue) {
  if (!dateValue) {
    return "Date unavailable";
  }
  const normalized =
    normalizeConsultationDate(
      dateValue
    );
  if (!normalized) {
    return String(dateValue);
  }
  const date = new Date(
    `${normalized}T00:00:00`
  );
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }
  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
function formatTime(timeValue) {
  if (!timeValue) return "--:--";
  const time = String(
    timeValue
  ).slice(0, 5);
  const [hours, minutes] =
    time.split(":");
  const hourNumber = Number(hours);
  if (Number.isNaN(hourNumber)) {
    return time;
  }
  const period =
    hourNumber >= 12 ? "PM" : "AM";
  const displayHour =
    hourNumber % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
}
function getInitials(name = "Patient") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "P";
  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }
  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}
/* =========================================================
   STATUS
\========================================================= */
function getStatusLabel(status) {
  if (status === "scheduled") {
    return "Upcoming";
  }
  if (status === "completed") {
    return "Completed";
  }
  if (status === "cancelled") {
    return "Cancelled";
  }
  return status || "Unknown";
}
/* =========================================================
   NORMALIZE CONSULTATION
\========================================================= */
function normalizeConsultation(
  consultation,
  patient
) {
  const date =
    normalizeConsultationDate(
      consultation.scheduled_date
    );
  const time =
    consultation.start_time;
  const today = getLocalDateKey();
  const isToday = date === today;
  const scheduledAt = getConsultationDateTime(date, time);
  const hasPassed = Boolean(scheduledAt && scheduledAt.getTime() <= Date.now());
  const storedStatus = String(consultation.status || "scheduled").toLowerCase();
  // Preserve cancellations; treat elapsed scheduled consultations as completed in the UI.
  const effectiveStatus = storedStatus === "cancelled"
    ? "cancelled"
    : storedStatus === "completed" || (storedStatus === "scheduled" && hasPassed)
      ? "completed"
      : storedStatus;
  const isUpcoming = effectiveStatus === "scheduled" && Boolean(scheduledAt) && !hasPassed;
  return {
    ...consultation,
    scheduledDate: date,
    startTime: time,
    date: formatDate(date),
    time: formatTime(time),
    duration: Number(
      consultation.duration_minutes ||
        30
    ),
    type:
      consultation.consultation_type ||
      "General Consultation",
    notes:
      consultation.notes || "",
    status: effectiveStatus,
    statusLabel: getStatusLabel(effectiveStatus),
    isToday,
    isUpcoming,
    patient: {
      fullName:
        patient?.fullName ||
        "Patient",
      patientId:
        patient?.patientId ||
        "ID unavailable",
      gender:
        patient?.gender ||
        "Gender not available",
      initials: getInitials(
        patient?.fullName ||
          "Patient"
      ),
    },
  };
}
/* =========================================================
   COMPONENT
\========================================================= */
function DoctorConsultations() {
  const navigate = useNavigate();
  const [consultations, setConsultations] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState("");
  const [searchTerm, setSearchTerm] =
    useState("");
  const [activeFilter, setActiveFilter] =
    useState("upcoming");
  const [dateFilter, setDateFilter] =
    useState("all");
  const [dateOpen, setDateOpen] =
    useState(false);
  const token =
    localStorage.getItem("token");
  /* =======================================================
     FETCH CONSULTATIONS
  \======================================================= */
  const fetchConsultations = async (
    isBackgroundRefresh = false
  ) => {
    if (!token) {
      setLoading(false);
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }
    try {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      /* ---------------------------------------------------
         GET ACCEPTED PATIENTS
      \--------------------------------------------------- */
      const patientsResponse =
        await fetch(
          `${API_BASE}/connections/patients`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );
      const patientsData =
        await patientsResponse.json();
      if (
        !patientsResponse.ok ||
        !patientsData.success
      ) {
        throw new Error(
          patientsData.message ||
            patientsData.error ||
            "Unable to load connected patients."
        );
      }
      const patients =
        Array.isArray(
          patientsData.patients
        )
          ? patientsData.patients
          : [];
      /* ---------------------------------------------------
         GET CONSULTATIONS FOR ALL PATIENTS
      \--------------------------------------------------- */
      const consultationResults =
        await Promise.all(
          patients.map(
            async (connection) => {
              const patient =
                connection.patient ||
                {};
              if (!patient.patientId) {
                return [];
              }
              try {
                const response =
                  await fetch(
                    `${API_BASE}/doctor/patients/${patient.patientId}/consultations`,
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
                  console.error(
                    `Consultation API failed for ${patient.patientId}:`,
                    data.message
                  );
                  return [];
                }
                const patientConsultations =
                  Array.isArray(
                    data.consultations
                  )
                    ? data.consultations
                    : [];
                return patientConsultations.map(
                  (consultation) =>
                    normalizeConsultation(
                      consultation,
                      patient
                    )
                );
              } catch (
                patientError
              ) {
                console.error(
                  `Unable to load consultations for ${patient.patientId}:`,
                  patientError
                );
                return [];
              }
            }
          )
        );
      /* ---------------------------------------------------
         FLATTEN + SORT BY DATE + TIME
      \--------------------------------------------------- */
      const allConsultations =
        consultationResults
          .flat()
          .sort((a, b) => {
            const first =
              `${a.scheduledDate} ${a.startTime || ""}`;
            const second =
              `${b.scheduledDate} ${b.startTime || ""}`;
            return first.localeCompare(
              second
            );
          });
      setConsultations(
        allConsultations
      );
    } catch (error) {
      console.error(
        "Fetch doctor consultations error:",
        error
      );
      setError(
        error.message ||
          "Unable to load consultations."
      );
      setConsultations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  /* =======================================================
     INITIAL LOAD + AUTO REFRESH
  \======================================================= */
  useEffect(() => {
    fetchConsultations(false);
    const handleFocus = () => {
      fetchConsultations(true);
    };
    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        fetchConsultations(true);
      }
    };
    window.addEventListener(
      "focus",
      handleFocus
    );
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    /*
      Refresh every 30 seconds so newly
      scheduled appointments appear automatically.
    */
    const refreshInterval = setInterval(() => {
      fetchConsultations(true);
    }, 30000);
    const statusInterval = setInterval(() => {
      setConsultations((current) => current.map((item) => normalizeConsultation(item, item.patient)));
    }, 60000);
    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      clearInterval(refreshInterval);
      clearInterval(statusInterval);
    };
  }, []);
  /* =======================================================
     FILTERS
  \======================================================= */
  const filteredConsultations =
    useMemo(() => {
      let result = [
        ...consultations,
      ];
      const search =
        searchTerm
          .trim()
          .toLowerCase();
      /* SEARCH */
      if (search) {
        result = result.filter(
          (consultation) => {
            const patientName =
              consultation.patient?.fullName
                ?.toLowerCase() || "";
            const patientId =
              consultation.patient?.patientId
                ?.toLowerCase() || "";
            const type =
              consultation.type
                ?.toLowerCase() || "";
            const notes =
              consultation.notes
                ?.toLowerCase() || "";
            return (
              patientName.includes(
                search
              ) ||
              patientId.includes(
                search
              ) ||
              type.includes(
                search
              ) ||
              notes.includes(
                search
              )
            );
          }
        );
      }
      /* STATUS FILTER */
      if (
        activeFilter ===
        "upcoming"
      ) {
        result = result.filter(
          (consultation) =>
            consultation.isUpcoming
        );
      }
      if (
        activeFilter ===
        "completed"
      ) {
        result = result.filter(
          (consultation) =>
            consultation.status ===
            "completed"
        );
      }
      if (
        activeFilter ===
        "cancelled"
      ) {
        result = result.filter(
          (consultation) =>
            consultation.status ===
            "cancelled"
        );
      }
      /* DATE FILTER */
      if (
        dateFilter === "today"
      ) {
        result = result.filter(
          (consultation) =>
            consultation.isToday
        );
      }
      if (
        dateFilter === "upcoming"
      ) {
        result = result.filter(
          (consultation) =>
            consultation.isUpcoming
        );
      }
      return result;
    }, [
      consultations,
      searchTerm,
      activeFilter,
      dateFilter,
    ]);
  /* =======================================================
     TODAY'S CONSULTATIONS
  \======================================================= */
  const todaysConsultations =
    useMemo(() => {
      return consultations.filter(
        (consultation) =>
          consultation.isToday &&
          consultation.status ===
            "scheduled"
      );
    }, [consultations]);
  /* =======================================================
     DATE OPTIONS
  \======================================================= */
  const dateOptions = [
    {
      id: "all",
      label: "All dates",
    },
    {
      id: "today",
      label: "Today",
    },
    {
      id: "upcoming",
      label: "Upcoming",
    },
  ];
  /* =======================================================
     LOADING
  \======================================================= */
  if (loading) {
    return (
      <main className="doctor-consultations-page">
        <section className="consultations-state-card">
          <Loader2
            size={30}
            className="consultations-loading-icon"
          />
          <h3>
            Loading consultations
          </h3>
          <p>
            Checking your scheduled
            patient consultations...
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
      <main className="doctor-consultations-page">
        <section className="consultations-state-card">
          <div className="consultations-error-icon">
            <CalendarX2 size={26} />
          </div>
          <h3>
            Unable to load consultations
          </h3>
          <p>
            {error}
          </p>
          <button
            type="button"
            className="consultations-retry-button"
            onClick={() =>
              fetchConsultations(false)
            }
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      </main>
    );
  }
  /* =======================================================
     MAIN
  \======================================================= */
  return (
    <main className="doctor-consultations-page">
      {/* ===================================================
          HEADER
      \=================================================== */}
      <section className="doctor-consultations-header">
        <div>
          <span className="doctor-consultations-eyebrow">
            PATIENT CARE
          </span>
          <h1>
            Consultations
          </h1>
          <p>
            Manage scheduled consultations and
            review upcoming patient appointments.
          </p>
        </div>
        <div className="doctor-consultations-count">
          <CalendarDays size={21} />
          <div>
            <strong>
              {todaysConsultations.length}
            </strong>
            <span>
              Today's consultations
            </span>
          </div>
        </div>
      </section>
      {/* ===================================================
          TOOLBAR
      \=================================================== */}
      <section className="consultation-toolbar">
        {/* SEARCH */}
        <div className="consultation-search">
          <Search size={19} />
          <input
            type="text"
            placeholder="Search patient, ID or consultation..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />
        </div>
        {/* STATUS FILTERS */}
        <div className="consultation-filters">
          <button
            type="button"
            className={
              activeFilter ===
              "upcoming"
                ? "consultation-filter active"
                : "consultation-filter"
            }
            onClick={() =>
              setActiveFilter(
                "upcoming"
              )
            }
          >
            Upcoming
          </button>
          <button
            type="button"
            className={
              activeFilter === "all"
                ? "consultation-filter active"
                : "consultation-filter"
            }
            onClick={() =>
              setActiveFilter("all")
            }
          >
            All consultations
          </button>
          <button
            type="button"
            className={
              activeFilter ===
              "completed"
                ? "consultation-filter active"
                : "consultation-filter"
            }
            onClick={() =>
              setActiveFilter(
                "completed"
              )
            }
          >
            Completed
          </button>
          <button
            type="button"
            className={
              activeFilter ===
              "cancelled"
                ? "consultation-filter active"
                : "consultation-filter"
            }
            onClick={() =>
              setActiveFilter(
                "cancelled"
              )
            }
          >
            Cancelled
          </button>
        </div>
        {/* DATE FILTER */}
        <div className="consultation-date-filter">
          <button
            type="button"
            className="consultation-date-button"
            onClick={() =>
              setDateOpen(
                (previous) =>
                  !previous
              )
            }
          >
            <CalendarDays size={17} />
            <span>
              {
                dateOptions.find(
                  (option) =>
                    option.id ===
                    dateFilter
                )?.label
              }
            </span>
            <ChevronDown
              size={16}
              className={
                dateOpen
                  ? "date-chevron open"
                  : "date-chevron"
              }
            />
          </button>
          {dateOpen && (
            <div className="consultation-date-menu">
              {dateOptions.map(
                (option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={
                      dateFilter ===
                      option.id
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setDateFilter(
                        option.id
                      );
                      setDateOpen(
                        false
                      );
                    }}
                  >
                    {option.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </section>
      {/* ===================================================
          DIRECTORY
      \=================================================== */}
      <section className="consultation-directory">
        <div className="consultation-directory-header">
          <div>
            <span>
              CONSULTATION DIRECTORY
            </span>
            <h2>
              Scheduled consultations
            </h2>
          </div>
          <p>
            {filteredConsultations.length}{" "}
            {filteredConsultations.length ===
            1
              ? "consultation"
              : "consultations"}{" "}
            shown
          </p>
        </div>
        {filteredConsultations.length ===
        0 ? (
          <div className="consultation-empty-state">
            <div className="consultation-empty-icon">
              <CalendarX2 size={28} />
            </div>
            <h3>
              No consultations found
            </h3>
            <p>
              Scheduled consultations created
              from a patient's profile will
              automatically appear here.
            </p>
            <button
              type="button"
              className="consultation-empty-action"
              onClick={() =>
                navigate(
                  "/doctor/patients"
                )
              }
            >
              View my patients
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="consultation-list">
            {filteredConsultations.map(
              (consultation) => {
                const patient =
                  consultation.patient ||
                  {};
                return (
                  <article
                    className="consultation-row"
                    key={`${consultation.id}-${patient.patientId}`}
                  >
                    {/* DATE / TIME */}
                    <div className="consultation-time">
                      <strong>
                        {consultation.time}
                      </strong>
                      <span>
                        {consultation.duration}{" "}
                        min
                      </span>
                      <small>
                        {consultation.date}
                      </small>
                    </div>
                    {/* PATIENT */}
                    <div className="consultation-patient">
                      <div className="consultation-avatar">
                        {patient.initials}
                      </div>
                      <div>
                        <div className="consultation-patient-name">
                          <h3>
                            {patient.fullName}
                          </h3>
                          <span>
                            {patient.patientId}
                          </span>
                        </div>
                        <p>
                          {patient.gender}
                        </p>
                      </div>
                    </div>
                    {/* TYPE */}
                    <div className="consultation-type">
                      <span>
                        CONSULTATION
                      </span>
                      <strong>
                        {consultation.type}
                      </strong>
                      <small>
                        {consultation.notes ||
                          "No additional notes"}
                      </small>
                    </div>
                    {/* MODE */}
                    <div className="consultation-mode">
                      <span>
                        FORMAT
                      </span>
                      <strong>
                        <Stethoscope
                          size={16}
                        />
                        Clinical review
                      </strong>
                    </div>
                    {/* STATUS */}
                    <div className="consultation-status-column">
                      <span>
                        STATUS
                      </span>
                      <strong
                        className={`consultation-status-badge ${consultation.status}`}
                      >
                        {consultation.statusLabel}
                      </strong>
                    </div>
                    {/* ACTION */}
                    <button
                      type="button"
                      className="consultation-open-button"
                      onClick={() =>
                        navigate(
                          `/doctor/patients/${patient.patientId}`
                        )
                      }
                    >
                      View patient
                      <ArrowRight
                        size={16}
                      />
                    </button>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
      {/* ===================================================
          FOOTER NOTE
      \=================================================== */}
      <div className="consultation-page-note">
        <CalendarDays size={17} />
        <p>
          Consultations are loaded from actual
          appointment records. Creating a
          consultation from a patient's profile
          automatically updates this page.
          {refreshing
            ? " Updating..."
            : ""}
        </p>
      </div>
    </main>
  );
}
export default DoctorConsultations;
