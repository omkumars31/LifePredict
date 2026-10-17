
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  ChevronDown,
  UsersRound,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import "./MyPatients.css";

const API_BASE = "https://lifepredict-production.up.railway.app/api";

// Return today's date in local YYYY-MM-DD format.
const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Normalize SQL DATETIME and ISO timestamps to a date key.
const getReviewDateKey = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const sqlOrIsoDate = value.match(/^(\d{4}-\d{2}-\d{2})/);

    if (sqlOrIsoDate) {
      return sqlOrIsoDate[1];
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function MyPatients() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  const [reviewingPatientId, setReviewingPatientId] = useState(null);
  const [reviewMessage, setReviewMessage] = useState("");

  // =========================================================
  // AUTH
  // =========================================================

  const getToken = () => localStorage.getItem("token");

  // =========================================================
  // FETCH ACCEPTED PATIENTS
  // =========================================================

  const fetchPatients = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/connections/patients`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to load your patients."
        );
      }

      setPatients(
        Array.isArray(data.patients) ? data.patients : []
      );
    } catch (error) {
      console.error("Fetch doctor patients error:", error);

      setError(error.message || "Unable to load your patients.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // MARK PATIENT AS REVIEWED
  // =========================================================

  const markPatientReviewed = async (patient) => {
    const patientUserId = patient?.userId;

    if (!patientUserId || reviewingPatientId !== null) {
      return;
    }

    const today = getLocalDateKey();
    const alreadyReviewedToday =
      getReviewDateKey(patient.reviewedAt) === today;

    if (alreadyReviewedToday) {
      return;
    }

    const token = getToken();

    if (!token) {
      setReviewMessage("Please log in again.");
      return;
    }

    try {
      setReviewingPatientId(patientUserId);
      setReviewMessage("");

      const response = await fetch(
        `${API_BASE}/connections/patients/${patientUserId}/reviewed`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not mark patient as reviewed."
        );
      }

      // Use the timestamp returned by the backend whenever possible.
      const reviewedAt = data.reviewedAt || new Date().toISOString();

      // Update the original API response structure.
      // This keeps the status when filteredPatients is recalculated.
      setPatients((previousPatients) =>
        previousPatients.map((item) => {
          const patientData = item?.patient || {};
          const currentUserId = patientData.userId ?? item.userId;

          if (Number(currentUserId) !== Number(patientUserId)) {
            return item;
          }

          return {
            ...item,
            reviewedAt,
          };
        })
      );

      setReviewMessage("Patient marked as reviewed.");
    } catch (error) {
      console.error("Mark patient reviewed error:", error);

      setReviewMessage(
        error.message || "Something went wrong."
      );
    } finally {
      setReviewingPatientId(null);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchPatients();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getPatientData = (item) => {
    return item?.patient || {};
  };

  const getInitials = (name = "Patient") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return "P";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (
      parts[0][0] + parts[parts.length - 1][0]
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
      today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
      today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // SEARCH + FILTER + SORT
  // =========================================================

  const filteredPatients = useMemo(() => {
    let result = patients.map((item) => {
      const patient = getPatientData(item);

      return {
        ...item,
        ...patient,
      };
    });

    // SEARCH
    const search = searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter((patient) => {
        const name = patient.fullName?.toLowerCase() || "";
        const patientId = String(patient.patientId ?? "").toLowerCase();
        const email = patient.email?.toLowerCase() || "";

        return (
          name.includes(search) ||
          patientId.includes(search) ||
          email.includes(search)
        );
      });
    }

    // PROFILE FILTER
    if (activeFilter === "complete") {
      result = result.filter(
        (patient) => Boolean(patient.profileCompleted)
      );
    }

    if (activeFilter === "incomplete") {
      result = result.filter(
        (patient) => !Boolean(patient.profileCompleted)
      );
    }

    // SORT
    if (sortBy === "name") {
      result.sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || "")
      );
    }

    if (sortBy === "recent") {
      result.sort((a, b) => {
        const dateA = a.respondedAt
          ? new Date(a.respondedAt).getTime()
          : 0;

        const dateB = b.respondedAt
          ? new Date(b.respondedAt).getTime()
          : 0;

        return dateB - dateA;
      });
    }

    return result;
  }, [patients, searchTerm, activeFilter, sortBy]);

  // =========================================================
  // OPEN PATIENT
  // =========================================================

  const openPatient = (patientId) => {
    if (!patientId) {
      return;
    }

    navigate(`/doctor/patients/${patientId}`);
  };

  // =========================================================
  // FILTERS
  // =========================================================

  const filters = [
    { id: "all", label: "All patients" },
    { id: "complete", label: "Complete profiles" },
    { id: "incomplete", label: "Incomplete profiles" },
  ];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="my-patients-page">
        <section className="patients-state-card">
          <Loader2
            size={25}
            className="patients-state-spinner"
          />

          <h3>Loading your patients</h3>

          <p>
            Fetching patients connected to your
            LifePredict account...
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
      <main className="my-patients-page">
        <section className="patients-state-card">
          <div className="patients-state-icon error">
            <AlertCircle size={24} />
          </div>

          <h3>Unable to load patients</h3>

          <p>{error}</p>

          <button
            type="button"
            className="patients-retry-button"
            onClick={fetchPatients}
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </section>
      </main>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <main className="my-patients-page">
      {/* PAGE HEADER */}
      <section className="my-patients-header">
        <div className="my-patients-heading">
          <span className="my-patients-eyebrow">
            PATIENT CARE
          </span>

          <h1>My Patients</h1>

          <p>
            Review patients who have connected with you
            through LifePredict and open their complete
            profile when needed.
          </p>
        </div>

        <div className="my-patients-count">
          <UsersRound size={18} />

          <div>
            <strong>{patients.length}</strong>
            <span>Assigned patients</span>
          </div>
        </div>
      </section>

      {/* SEARCH + FILTER TOOLBAR */}
      <section className="patient-toolbar">
        <div className="patient-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by patient name, ID or email..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <div className="patient-filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                activeFilter === filter.id
                  ? "patient-filter active"
                  : "patient-filter"
              }
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="patient-sort">
          <button
            type="button"
            className="patient-sort-button"
            onClick={() =>
              setSortOpen((previous) => !previous)
            }
          >
            <SlidersHorizontal size={16} />
            <span>Sort</span>

            <ChevronDown
              size={15}
              className={
                sortOpen ? "sort-chevron open" : "sort-chevron"
              }
            />
          </button>

          {sortOpen && (
            <div className="patient-sort-menu">
              <button
                type="button"
                onClick={() => {
                  setSortBy("recent");
                  setSortOpen(false);
                }}
              >
                Recently connected
              </button>

              <button
                type="button"
                onClick={() => {
                  setSortBy("name");
                  setSortOpen(false);
                }}
              >
                Patient name
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PATIENT DIRECTORY */}
      <section className="patient-list-section">
        <div className="patient-list-header">
          <div>
            <span>PATIENT DIRECTORY</span>
            <h2>Assigned patients</h2>
          </div>

          <p>
            {filteredPatients.length}{" "}
            {filteredPatients.length === 1 ? "patient" : "patients"}{" "}
            shown
          </p>
        </div>

        <div className="patient-list">
          {filteredPatients.length === 0 ? (
            <div className="patient-empty-state">
              <Search size={25} />

              <h3>
                {patients.length === 0
                  ? "No patients connected yet"
                  : "No patients found"}
              </h3>

              <p>
                {patients.length === 0
                  ? "Accepted patient connection requests will appear here."
                  : "Try another name, patient ID, email, or filter."}
              </p>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const age = getAge(patient.dateOfBirth);

              const isReviewing =
                Number(reviewingPatientId) ===
                Number(patient.userId);

              const isReviewedToday =
                getReviewDateKey(patient.reviewedAt) ===
                getLocalDateKey();

              return (
                <article
                  className="patient-list-row real-patient-row"
                  key={
                    patient.connectionId ||
                    patient.patientId ||
                    patient.userId
                  }
                  onClick={() => openPatient(patient.patientId)}
                >
                  {/* PATIENT IDENTITY */}
                  <div className="patient-identity">
                    <div className="patient-avatar">
                      {getInitials(patient.fullName)}
                    </div>

                    <div className="patient-name-block">
                      <div className="patient-name-line">
                        <h3>{patient.fullName || "Patient"}</h3>

                        <span className="patient-id">
                          {patient.patientId || "ID unavailable"}
                        </span>
                      </div>

                      <span className="patient-demographics">
                        {age !== null
                          ? `${age} years`
                          : "Age not available"}

                        {" · "}

                        {patient.gender
                          ? patient.gender.charAt(0).toUpperCase() +
                            patient.gender.slice(1)
                          : "Gender not available"}
                      </span>
                    </div>
                  </div>

                  {/* CONNECTION STATUS */}
                  <div className="patient-connection-status">
                    <span>STATUS</span>

                    <strong>
                      <CheckCircle2 size={13} />
                      Connected
                    </strong>

                    <small>
                      {formatDate(patient.respondedAt)}
                    </small>
                  </div>

                  {/* PATIENT ACTIONS */}
                  <div className="patient-action-buttons">
                    <button
                      type="button"
                      className="patient-open-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openPatient(patient.patientId);
                      }}
                    >
                      <span>View patient</span>
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      className="patient-review-button"
                      disabled={
                        reviewingPatientId !== null ||
                        isReviewedToday ||
                        !patient.userId
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        markPatientReviewed(patient);
                      }}
                    >
                      {isReviewing ? (
                        <Loader2
                          size={16}
                          className="patients-state-spinner"
                        />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}

                      <span>
                        {isReviewing
                          ? "Saving..."
                          : isReviewedToday
                            ? "Reviewed Today"
                            : "Mark as Reviewed"}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* REVIEW FEEDBACK */}
      {reviewMessage && (
        <div
          className="patient-page-note"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={16} />
          <p>{reviewMessage}</p>
        </div>
      )}

      {/* FOOTER NOTE */}
      <div className="patient-page-note">
        <UsersRound size={16} />

        <p>
          Only patients whose connection request has been
          accepted are shown here. Clinical assessments,
          predictions and health history will be displayed
          from their actual health records.
        </p>
      </div>
    </main>
  );
}

export default MyPatients;
