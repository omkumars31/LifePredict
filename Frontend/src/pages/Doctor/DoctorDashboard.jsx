import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UsersRound,
  AlertTriangle,
  CalendarDays,
  CircleCheck,
  HeartPulse,
  ArrowRight,
  RefreshCw,
  Loader2,
  UserRound,
  Activity,
  Stethoscope,
} from "lucide-react";
import "./DoctorDashboard.css";
const API_BASE = "http://localhost:5001/api";
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
function normalizeConsultationDate(value) {
  if (!value) return "";
  const raw = String(value).trim();
  const dateMatch = raw.match(
    /^(\d{4}-\d{2}-\d{2})/
  );
  if (dateMatch) {
    return dateMatch[1];
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
function formatTime(timeValue) {
  if (!timeValue) return "--:--";
  const time = String(timeValue).slice(0, 5);
  const [hours, minutes] = time.split(":");
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
function DoctorDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [reviewedToday, setReviewedToday] = useState(0);
  const [consultations, setConsultations] =
    useState([]);
  // UNIQUE PATIENTS WITH AT LEAST ONE
  // CRITICAL, REVIEW, OR FOLLOW-UP ALERT
  const [
    clinicalAlertPatientCount,
    setClinicalAlertPatientCount,
  ] = useState(0);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState("");
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );
  const doctorName =
    user?.fullName || "Doctor";
  // Greeting follows the user's local time. Only use greeting phrases.
  // After evening, the next greeting is morning (no "Good night").
  const currentHour = new Date().getHours();
  const greeting =
    currentHour >= 5 && currentHour < 12
      ? "Good morning"
      : currentHour >= 12 && currentHour < 17
      ? "Good afternoon"
      : currentHour >= 17
      ? "Good evening"
      : "Good morning";
  const token =
    localStorage.getItem("token");
  const fetchDashboardData = async (
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
      // =====================================================
      // 1. GET CONNECTED PATIENTS
      // =====================================================
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
            "Unable to load your patients."
        );
      }
      const connectedPatients =
        Array.isArray(
          patientsData.patients
        )
          ? patientsData.patients
          : [];
      setPatients(
        connectedPatients
      );
          // GET PATIENTS REVIEWED TODAY
          let reviewedTodayCount = reviewedToday;
    try {
      const reviewedResponse = await fetch(
        `${API_BASE}/connections/patients/reviewed-today`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const reviewedData = await reviewedResponse.json();
      if (reviewedResponse.ok && reviewedData.success) {
  reviewedTodayCount =
    Number(reviewedData.reviewedToday) || 0;

  setReviewedToday(reviewedTodayCount);
}
    } catch (reviewCountError) {
      console.error(
        "Unable to fetch today's reviewed-patient count:",
        reviewCountError
      );
    }
      // =====================================================
      // 2. GET CONSULTATIONS
      // =====================================================
      const consultationResults =
        await Promise.all(
          connectedPatients.map(
            async (connection) => {
              const patient =
                connection.patient || {};
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
                  return [];
                }
                const records =
                  Array.isArray(
                    data.consultations
                  )
                    ? data.consultations
                    : [];
                return records.map(
                  (consultation) => ({
                    ...consultation,
                    patient: {
                      ...patient,
                      initials:
                        getInitials(
                          patient.fullName ||
                            "Patient"
                        ),
                    },
                  })
                );
              } catch (
                consultationError
              ) {
                console.error(
                  `Dashboard consultation fetch failed for ${patient.patientId}:`,
                  consultationError
                );
                return [];
              }
            }
          )
        );
      const allConsultations =
        consultationResults
          .flat()
          .sort((a, b) => {
            const firstDate =
              normalizeConsultationDate(
                a.scheduled_date
              );
            const secondDate =
              normalizeConsultationDate(
                b.scheduled_date
              );
            const first =
              `${firstDate} ${String(
                a.start_time || ""
              )}`;
            const second =
              `${secondDate} ${String(
                b.start_time || ""
              )}`;
            return first.localeCompare(
              second
            );
          });
      setConsultations(
        allConsultations
      );
      // =====================================================
      // 3. GET DOCTOR ALERTS
      //
      // IMPORTANT:
      // Count UNIQUE PATIENTS with critical,
      // review, or follow-up alerts.
      //
      // A patient with multiple alerts still
      // counts only once.
      // =====================================================
      try {
        const alertsResponse =
          await fetch(
            `${API_BASE}/alerts`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );
        const alertsData =
          await alertsResponse.json();
        if (
          alertsResponse.ok &&
          alertsData.success &&
          Array.isArray(
            alertsData.alerts
          )
        ) {
          const clinicalAlertPatientIds =
            new Set();
          alertsData.alerts.forEach(
            (alert) => {
              const priority =
                String(
                  alert?.priority || ""
                ).toLowerCase();
              // Only clinical alert priorities
              // should contribute to dashboard count.
              if (
                ![
                  "critical",
                  "review",
                  "follow-up",
                ].includes(priority)
              ) {
                return;
              }
              const patient =
                alert?.patient || {};
              const patientId =
                patient.patientId ||
                alert.patientId ||
                patient.userId ||
                alert.userId ||
                alert.patient_id ||
                null;
              if (!patientId) {
                return;
              }
              clinicalAlertPatientIds.add(
                String(patientId)
              );
            }
          );
          // Patients reviewed today should no longer contribute
          // to the dashboard's Need Attention count.
          // The reviewed-today endpoint currently provides a count,
          // so subtract it safely from the unique clinical-alert count.
          setClinicalAlertPatientCount(
  Math.max(
    0,
    clinicalAlertPatientIds.size - reviewedTodayCount
  )
);
        } else {
          setClinicalAlertPatientCount(0);
        }
      } catch (alertError) {
        console.error(
          "Dashboard alerts fetch failed:",
          alertError
        );
        setClinicalAlertPatientCount(0);
      }
    } catch (error) {
      console.error(
        "Doctor dashboard error:",
        error
      );
      setError(
        error.message ||
          "Unable to load dashboard data."
      );
      setPatients([]);
      setConsultations([]);
      setClinicalAlertPatientCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================
  useEffect(() => {
    fetchDashboardData(false);
    const handleFocus = () => {
      fetchDashboardData(true);
    };
    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        fetchDashboardData(true);
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
    const refreshInterval =
      setInterval(() => {
        fetchDashboardData(true);
      }, 30000);
    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      clearInterval(
        refreshInterval
      );
    };
  }, []);
  // =====================================================
  // PATIENT HELPERS
  // =====================================================
  const getPatient = (item) => {
    return item?.patient || {};
  };
  const completeProfiles =
    useMemo(() => {
      return patients.filter(
        (item) =>
          Boolean(
            getPatient(item)
              ?.fullName
          ) &&
          Boolean(
            getPatient(item)
              ?.patientId
          )
      ).length;
    }, [patients]);
  const todayKey =
    getLocalDateKey();
  const todaysConsultations =
    useMemo(() => {
      return consultations.filter(
        (consultation) => {
          const date =
            normalizeConsultationDate(
              consultation.scheduled_date
            );
          return (
            consultation.status ===
              "scheduled" &&
            date === todayKey
          );
        }
      );
    }, [
      consultations,
      todayKey,
    ]);
  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <main className="doctor-dashboard">
        <div className="dashboard-state-card">
          <Loader2
            size={32}
            className="dashboard-loading-icon"
          />
          <h3>
            Loading your dashboard
          </h3>
          <p>
            Fetching your connected patients,
            consultations, and clinical alerts.
          </p>
        </div>
      </main>
    );
  }
  // =====================================================
  // ERROR
  // =====================================================
  if (error) {
    return (
      <main className="doctor-dashboard">
        <div className="dashboard-state-card">
          <div className="dashboard-error-icon">
            <AlertTriangle size={24} />
          </div>
          <h3>
            Unable to load dashboard
          </h3>
          <p>
            {error}
          </p>
          <button
            type="button"
            className="dashboard-retry-button"
            onClick={() =>
              fetchDashboardData(false)
            }
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="doctor-dashboard">
      {/* =================================================
          WELCOME HERO
      ================================================= */}
      <section className="doctor-welcome">
        <div className="doctor-welcome-content">
          <div className="doctor-welcome-eyebrow">
            <span className="doctor-eyebrow-dot" />
            DOCTOR WORKSPACE
          </div>
          <h1>
            {greeting}, Dr. {doctorName}.
          </h1>
          <p>
            Review your connected patients
            and access their health information
            from one place.
          </p>
        </div>
        <div className="doctor-welcome-icon">
          <HeartPulse size={43} />
        </div>
      </section>
      {/* =================================================
          SUMMARY CARDS
      ================================================= */}
      <section className="doctor-summary-grid">
        {/* ASSIGNED PATIENTS */}
        <button
          type="button"
          className="
            doctor-summary-card
            patients-card
            doctor-summary-clickable
          "
          onClick={() =>
            navigate("/doctor/patients")
          }
        >
          <div className="doctor-summary-icon">
            <UsersRound size={22} />
          </div>
          <div className="doctor-summary-info">
            <span>
              Assigned Patients
            </span>
            <strong>
              {patients.length}
            </strong>
            <small>
              Accepted connections
            </small>
          </div>
        </button>
        {/* NEED ATTENTION */}
        <button
          type="button"
          className="
            doctor-summary-card
            attention-card
            doctor-summary-clickable
          "
          onClick={() =>
            navigate("/doctor/alerts")
          }
        >
          <div className="doctor-summary-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="doctor-summary-info">
            <span>
              Need Attention
            </span>
            <strong>
              {clinicalAlertPatientCount}
            </strong>
            <small>
              Patients needing clinical attention
            </small>
          </div>
        </button>
        {/* TODAY'S CARE */}
        <button
          type="button"
          className="
            doctor-summary-card
            consultation-card
            doctor-summary-clickable
          "
          onClick={() =>
            navigate("/doctor/consultations")
          }
        >
          <div className="doctor-summary-icon">
            <CalendarDays size={22} />
          </div>
          <div className="doctor-summary-info">
            <span>
              Today's Care
            </span>
            <strong>
              {todaysConsultations.length}
            </strong>
            <small>
              Scheduled for today
            </small>
          </div>
        </button>
                {/* PATIENTS REVIEWED TODAY */}
        <button
          type="button"
          className="
            doctor-summary-card
            assessment-card
            doctor-summary-clickable
          "
          onClick={() => navigate("/doctor/patients")}
        >
          <div className="doctor-summary-icon">
            <CircleCheck size={22} />
          </div>
          <div className="doctor-summary-info">
            <span>Patients Reviewed Today</span>
            <strong>{reviewedToday}</strong>
            <small>Patients reviewed today</small>
          </div>
        </button>
      </section>
      {/* =================================================
          PATIENTS + TODAY'S CARE
      ================================================= */}
      <section className="doctor-dashboard-grid">
        {/* ASSIGNED PATIENTS */}
        <div className="doctor-panel">
          <div className="doctor-panel-header">
            <div>
              <span>
                PATIENT CARE
              </span>
              <h2>
                Assigned patients
              </h2>
            </div>
            <button
              type="button"
              className="doctor-view-all"
              onClick={() =>
                navigate("/doctor/patients")
              }
            >
              View all
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="doctor-patient-list">
            {patients.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon">
                  <UsersRound size={20} />
                </div>
                <h3>
                  No assigned patients
                </h3>
                <p>
                  Your accepted patient
                  connections will appear here.
                </p>
              </div>
            ) : (
              patients.map((connection) => {
                const patient =
                  getPatient(connection);
                return (
                  <button
                    type="button"
                    className="doctor-patient-row"
                    key={
                      connection.id ||
                      patient.patientId
                    }
                    onClick={() =>
                      navigate(
                        `/doctor/patients/${patient.patientId}`
                      )
                    }
                  >
                    <div className="doctor-patient-avatar">
                      {getInitials(
                        patient.fullName ||
                          "Patient"
                      )}
                    </div>
                    <div className="doctor-patient-info">
                      <div className="doctor-patient-name">
                        <span>
                          {patient.fullName ||
                            "Patient"}
                        </span>
                        <span className="dashboard-patient-id">
                          {patient.patientId ||
                            "ID unavailable"}
                        </span>
                      </div>
                      <strong>
                        {patient.email ||
                          "Email unavailable"}
                      </strong>
                      <p>
                        {patient.gender ||
                          "Gender not available"}
                      </p>
                    </div>
                    <div className="doctor-row-time">
                      Connected
                    </div>
                    <ArrowRight
                      size={17}
                      className="doctor-row-arrow"
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>
        {/* TODAY'S CARE */}
        <div className="doctor-panel">
          <div className="doctor-panel-header">
            <div>
              <span>
                TODAY
              </span>
              <h2>
                Today's care
              </h2>
            </div>
            <button
              type="button"
              className="doctor-view-all"
              onClick={() =>
                navigate(
                  "/doctor/consultations"
                )
              }
            >
              View schedule
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="dashboard-consultation-list">
            {todaysConsultations.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon blue">
                  <CalendarDays size={20} />
                </div>
                <h3>
                  No consultations today
                </h3>
                <p>
                  Scheduled consultations for
                  today will appear here.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/doctor/consultations"
                    )
                  }
                >
                  View consultations
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              todaysConsultations.map(
                (consultation) => {
                  const patient =
                    consultation.patient ||
                    {};
                  return (
                    <button
                      type="button"
                      className="dashboard-consultation-row"
                      key={
                        consultation.id
                      }
                      onClick={() =>
                        navigate(
                          `/doctor/patients/${patient.patientId}`
                        )
                      }
                    >
                      <div className="dashboard-consultation-time">
                        <strong>
                          {formatTime(
                            consultation.start_time
                          )}
                        </strong>
                        <span>
                          {Number(
                            consultation.duration_minutes ||
                              30
                          )}{" "}
                          min
                        </span>
                      </div>
                      <div className="dashboard-consultation-info">
                        <div className="dashboard-consultation-patient">
                          <div className="dashboard-consultation-avatar">
                            {getInitials(
                              patient.fullName ||
                                "Patient"
                            )}
                          </div>
                          <div>
                            <strong>
                              {patient.fullName ||
                                "Patient"}
                            </strong>
                            <span>
                              {patient.patientId ||
                                "ID unavailable"}
                            </span>
                          </div>
                        </div>
                        <div className="dashboard-consultation-type">
                          <Stethoscope size={15} />
                          {consultation.consultation_type ||
                            "General Consultation"}
                        </div>
                      </div>
                      <ArrowRight
                        size={17}
                        className="dashboard-consultation-arrow"
                      />
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      </section>
      {/* LOWER INFORMATION */}
      <section className="doctor-dashboard-info-grid">
        {/* ALERTS */}
        <div className="doctor-dashboard-info-card">
          <div className="doctor-dashboard-info-icon">
            <Activity size={21} />
          </div>
          <div>
            <span>
              CLINICAL ALERTS
            </span>
            <h3>
              {clinicalAlertPatientCount}{" "}
              {clinicalAlertPatientCount === 1
                ? "patient needs"
                : "patients need"}{" "}
              clinical attention
            </h3>
            <p>
              Review meaningful clinical
              concerns and risk changes from
              your connected patients.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate("/doctor/alerts")
            }
          >
            Open alerts
            <ArrowRight size={15} />
          </button>
        </div>
        {/* PATIENT PROFILES */}
        <div className="doctor-dashboard-info-card">
          <div className="doctor-dashboard-info-icon green">
            <UserRound size={21} />
          </div>
          <div>
            <span>
              PATIENT PROFILES
            </span>
            <h3>
              {completeProfiles} of{" "}
              {patients.length} profiles
              complete
            </h3>
            <p>
              Profile completion is based
              on the information currently
              available in connected patient
              profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(
                "/doctor/patients"
              )
            }
          >
            View patients
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
      {/* FOOTER NOTE */}
      <div className="doctor-dashboard-note">
        <HeartPulse size={17} />
        <p>
          Today's Care shows only scheduled
          consultations whose appointment date
          matches today's date. Future appointments
          remain in Consultations → Upcoming until
          their scheduled day.
          {refreshing
            ? " Updating..."
            : ""}
        </p>
      </div>
    </main>
  );
}
export default DoctorDashboard;
