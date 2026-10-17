import { useEffect, useState } from "react";

import {
  UserRound,
  Mail,
  ShieldCheck,
  Copy,
  Check,
  BriefcaseMedical,
  GraduationCap,
  Building2,
  Clock3,
  UsersRound,
  UserPlus,
  Pencil,
  X,
  Save,
} from "lucide-react";

import "./DoctorProfile.css";

const API_BASE = "https://lifepredict-production.up.railway.app/api";

function safeParse(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function DoctorProfile() {
  // ==========================================
  // STATE
  // ==========================================

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");

  const [editing, setEditing] = useState(false);

  const [copied, setCopied] = useState(false);

  // ==========================================
  // CONNECTION REQUEST STATE
  // ==========================================

  const [requests, setRequests] = useState([]);

  const [requestsLoading, setRequestsLoading] = useState(true);

  const [requestError, setRequestError] = useState("");

  const [respondingTo, setRespondingTo] = useState(null);

  // ==========================================
  // FORM
  // ==========================================

  const [form, setForm] = useState({
    specialization: "",
    qualification: "",
    experienceYears: "",
    hospitalClinic: "",
  });

  // ==========================================
  // AUTH
  // ==========================================

  const token = localStorage.getItem("token");

  const localUser = safeParse(
    localStorage.getItem("user"),
    {}
  );

  // ==========================================
  // FETCH DOCTOR PROFILE
  // ==========================================

  const fetchDoctorProfile = async () => {
    if (!token) {
      setLoading(false);
      setError("You are not logged in.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/doctor-profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load doctor profile."
        );
      }

      const doctorProfile = data.profile || {};

      setProfile(doctorProfile);

      setForm({
        specialization:
          doctorProfile.specialization || "",

        qualification:
          doctorProfile.qualification || "",

        experienceYears:
          doctorProfile.experienceYears ?? "",

        hospitalClinic:
          doctorProfile.hospitalClinic || "",
      });
    } catch (error) {
      console.error(
        "Doctor profile loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load doctor profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH PATIENT CONNECTION REQUESTS
  // ==========================================

  const fetchConnectionRequests = async () => {
    if (!token) {
      setRequestsLoading(false);
      setRequestError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setRequestsLoading(true);
      setRequestError("");

      const response = await fetch(
        `${API_BASE}/connections/requests`,
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
            "Unable to load patient connection requests."
        );
      }

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : []
      );
    } catch (error) {
      console.error(
        "Fetch connection requests error:",
        error
      );

      setRequestError(
        error.message ||
          "Unable to load patient connection requests."
      );

      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchDoctorProfile();
    fetchConnectionRequests();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // UPDATE DOCTOR PROFILE
  // ==========================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage("");
      setError("");

      const response = await fetch(
        `${API_BASE}/doctor-profile`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            specialization:
              form.specialization.trim(),

            qualification:
              form.qualification.trim(),

            experienceYears:
              form.experienceYears === ""
                ? null
                : Number(form.experienceYears),

            hospitalClinic:
              form.hospitalClinic.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save doctor profile."
        );
      }

      // Fetch fresh DB data after saving.
      await fetchDoctorProfile();

      setEditing(false);

      setSaveMessage(
        "Professional details updated successfully."
      );

      setTimeout(() => {
        setSaveMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Doctor profile save error:",
        error
      );

      setError(
        error.message ||
          "Unable to save doctor profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CANCEL EDITING
  // ==========================================

  const handleCancelEdit = () => {
    setForm({
      specialization:
        profile?.specialization || "",

      qualification:
        profile?.qualification || "",

      experienceYears:
        profile?.experienceYears ?? "",

      hospitalClinic:
        profile?.hospitalClinic || "",
    });

    setEditing(false);

    setError("");

    setSaveMessage("");
  };

  // ==========================================
  // COPY DOCTOR ID
  // ==========================================

  const handleCopyDoctorId = async () => {
    if (!profile?.doctorId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        profile.doctorId
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Unable to copy Doctor ID:",
        error
      );
    }
  };

  // ==========================================
  // ACCEPT / REJECT CONNECTION REQUEST
  // ==========================================

  const handleRespondToRequest = async (
    connectionId,
    action
  ) => {
    if (!token) {
      setRequestError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setRespondingTo(connectionId);
      setRequestError("");

      const response = await fetch(
        `${API_BASE}/connections/requests/${connectionId}`,
        {
          method: "PATCH",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            `Unable to ${
              action === "accepted"
                ? "accept"
                : "reject"
            } the request.`
        );
      }

      // Remove the handled request from pending list.
      setRequests((previous) =>
        previous.filter(
          (request) =>
            request.connectionId !== connectionId
        )
      );
    } catch (error) {
      console.error(
        "Respond to connection request error:",
        error
      );

      setRequestError(
        error.message ||
          "Unable to update the connection request."
      );
    } finally {
      setRespondingTo(null);
    }
  };

  // ==========================================
  // DISPLAY VALUES
  // ==========================================

  const doctorName =
    profile?.fullName ||
    localUser?.fullName ||
    "Doctor";

  const doctorEmail =
    profile?.email ||
    localUser?.email ||
    "—";

  const doctorId =
    profile?.doctorId || "—";

  const specialization =
    profile?.specialization || "—";

  const qualification =
    profile?.qualification || "—";

  const experience =
    profile?.experienceYears !== null &&
    profile?.experienceYears !== undefined &&
    profile?.experienceYears !== ""
      ? `${profile.experienceYears} ${
          Number(profile.experienceYears) === 1
            ? "Year"
            : "Years"
        }`
      : "—";

  const hospital =
    profile?.hospitalClinic || "—";

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="doctor-profile-page">
        <section className="doctor-profile-loading">
          <div className="doctor-loading-icon">
            <UserRound size={24} />
          </div>

          <h3>Loading doctor profile</h3>

          <p>
            Fetching your professional information...
          </p>
        </section>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !profile) {
    return (
      <div className="doctor-profile-page">
        <section className="doctor-profile-loading">
          <div className="doctor-loading-icon">
            <UserRound size={24} />
          </div>

          <h3>Unable to load profile</h3>

          <p>{error}</p>

          <button
            type="button"
            className="doctor-retry-button"
            onClick={fetchDoctorProfile}
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="doctor-profile-page">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <section className="doctor-profile-header">
        <div>
          <span className="doctor-profile-eyebrow">
            ACCOUNT
          </span>

          <h1>Doctor Profile</h1>

          <p>
            Manage your professional information
            and patient connections from one place.
          </p>
        </div>

        <div className="doctor-profile-header-icon">
          <UserRound size={27} />
        </div>
      </section>


      {/* ==========================================
          SUCCESS MESSAGE
      ========================================== */}

      {saveMessage && (
        <div className="doctor-profile-success">
          <Check size={16} />
          <span>{saveMessage}</span>
        </div>
      )}


      {/* ==========================================
          ERROR MESSAGE
      ========================================== */}

      {error && profile && (
        <div className="doctor-profile-error">
          {error}
        </div>
      )}


      {/* ==========================================
          DOCTOR INFORMATION CARD
      ========================================== */}

      <section className="doctor-profile-card">

        {/* CARD HEADER */}

        <div className="doctor-profile-card-header">
          <div>
            <span className="doctor-profile-section-label">
              PROFESSIONAL PROFILE
            </span>

            <h2>Doctor information</h2>
          </div>

          <div className="doctor-profile-status">
            <Check size={14} />

            <span>Active</span>
          </div>
        </div>


        {/* DOCTOR IDENTITY */}

        <div className="doctor-profile-identity">

          <div className="doctor-profile-avatar">
            {doctorName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="doctor-profile-name">
            <h3>
              Dr. {doctorName}
            </h3>

            <span>
              Doctor
            </span>
          </div>

        </div>


        {/* ==========================================
            PROFESSIONAL DETAILS
        ========================================== */}

        <div className="doctor-professional-grid">

          {/* SPECIALIZATION */}

          <div className="doctor-detail-box">
            <div className="doctor-detail-icon">
              <BriefcaseMedical size={18} />
            </div>

            <div className="doctor-detail-content">
              <span>
                SPECIALIZATION
              </span>

              <strong>
                {specialization}
              </strong>
            </div>
          </div>


          {/* QUALIFICATION */}

          <div className="doctor-detail-box">
            <div className="doctor-detail-icon">
              <GraduationCap size={18} />
            </div>

            <div className="doctor-detail-content">
              <span>
                QUALIFICATION
              </span>

              <strong>
                {qualification}
              </strong>
            </div>
          </div>


          {/* EXPERIENCE */}

          <div className="doctor-detail-box">
            <div className="doctor-detail-icon">
              <Clock3 size={18} />
            </div>

            <div className="doctor-detail-content">
              <span>
                EXPERIENCE
              </span>

              <strong>
                {experience}
              </strong>
            </div>
          </div>


          {/* HOSPITAL */}

          <div className="doctor-detail-box">
            <div className="doctor-detail-icon">
              <Building2 size={18} />
            </div>

            <div className="doctor-detail-content">
              <span>
                HOSPITAL / CLINIC
              </span>

              <strong>
                {hospital}
              </strong>
            </div>
          </div>

        </div>


        {/* ==========================================
            ACCOUNT INFORMATION
        ========================================== */}

        <div className="doctor-account-grid">

          {/* EMAIL */}

          <div className="doctor-account-box">
            <div className="doctor-account-icon">
              <Mail size={18} />
            </div>

            <div className="doctor-account-content">
              <span>
                EMAIL ADDRESS
              </span>

              <strong>
                {doctorEmail}
              </strong>
            </div>
          </div>


          {/* DOCTOR ID */}

          <div className="doctor-account-box">
            <div className="doctor-account-icon">
              <ShieldCheck size={18} />
            </div>

            <div className="doctor-account-content">
              <span>
                LIFEPREDICT DOCTOR ID
              </span>

              <strong>
                {doctorId}
              </strong>
            </div>

            <button
              className="doctor-copy-button"
              onClick={handleCopyDoctorId}
              type="button"
              disabled={!profile?.doctorId}
            >
              {copied ? (
                <>
                  <Check size={15} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copy
                </>
              )}
            </button>
          </div>

        </div>

      </section>


      {/* ==========================================
          UPDATE DETAILS BUTTON / FORM
      ========================================== */}

      {!editing ? (

        <section className="doctor-update-section">

          <div className="doctor-update-copy">

            <div className="doctor-update-icon">
              <Pencil size={17} />
            </div>

            <div>
              <h3>
                Keep your professional profile updated
              </h3>

              <p>
                Add or update your specialization,
                qualification, experience, and
                hospital or clinic information.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="doctor-update-button"
            onClick={() => {
              setEditing(true);
              setError("");
              setSaveMessage("");
            }}
          >
            <Pencil size={16} />
            Update Details
          </button>

        </section>

      ) : (

        <section className="doctor-edit-card">

          <div className="doctor-edit-header">

            <div>
              <span className="doctor-profile-section-label">
                EDIT PROFILE
              </span>

              <h2>
                Update professional details
              </h2>

              <p>
                These details will be saved to your
                LifePredict profile and remain available
                until you change them.
              </p>
            </div>

            <button
              type="button"
              className="doctor-edit-close"
              onClick={handleCancelEdit}
              disabled={saving}
              aria-label="Close"
            >
              <X size={18} />
            </button>

          </div>


          <form
            className="doctor-edit-form"
            onSubmit={handleSaveProfile}
          >

            {/* SPECIALIZATION */}

            <div className="doctor-form-field">
              <label htmlFor="specialization">
                Specialization
              </label>

              <input
                id="specialization"
                name="specialization"
                type="text"
                value={form.specialization}
                onChange={handleChange}
                placeholder="e.g. Cardiologist"
                maxLength={100}
              />
            </div>


            {/* QUALIFICATION */}

            <div className="doctor-form-field">
              <label htmlFor="qualification">
                Qualification
              </label>

              <input
                id="qualification"
                name="qualification"
                type="text"
                value={form.qualification}
                onChange={handleChange}
                placeholder="e.g. MBBS, MD"
                maxLength={255}
              />
            </div>


            {/* EXPERIENCE */}

            <div className="doctor-form-field">
              <label htmlFor="experienceYears">
                Experience
              </label>

              <div className="doctor-input-with-suffix">

                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.experienceYears}
                  onChange={handleChange}
                  placeholder="e.g. 8"
                />

                <span>
                  years
                </span>

              </div>
            </div>


            {/* HOSPITAL / CLINIC */}

            <div className="doctor-form-field">
              <label htmlFor="hospitalClinic">
                Hospital / Clinic
              </label>

              <input
                id="hospitalClinic"
                name="hospitalClinic"
                type="text"
                value={form.hospitalClinic}
                onChange={handleChange}
                placeholder="Enter hospital or clinic name"
                maxLength={255}
              />
            </div>


            {/* ACTIONS */}

            <div className="doctor-edit-actions">

              <button
                type="button"
                className="doctor-cancel-button"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="doctor-save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Details
                  </>
                )}
              </button>

            </div>

          </form>

        </section>

      )}


      {/* ==========================================
          PATIENT CONNECTION REQUESTS
      ========================================== */}

      <section className="doctor-connection-card">

        <div className="doctor-connection-header">

          <div>
            <span className="doctor-profile-section-label">
              PATIENT CARE
            </span>

            <h2>
              Patient connection requests
            </h2>

            <p>
              Review patients who want to connect
              with you before adding them to your
              care list.
            </p>
          </div>


          {/* REAL REQUEST COUNT */}

          <div className="doctor-request-count">
            <UserPlus size={18} />

            <span>
              {requests.length}
            </span>
          </div>

        </div>


        {/* ==========================================
            REQUEST ERROR
        ========================================== */}

        {requestError && (
          <div className="doctor-profile-error">
            {requestError}
          </div>
        )}


        {/* ==========================================
            LOADING
        ========================================== */}

        {requestsLoading ? (

          <div className="doctor-empty-state">

            <div className="doctor-empty-icon">
              <UsersRound size={22} />
            </div>

            <h3>
              Loading requests...
            </h3>

            <p>
              Checking for new patient connection
              requests.
            </p>

          </div>

        ) : requests.length === 0 ? (

          /* ==========================================
              NO REQUESTS
          ========================================== */

          <div className="doctor-empty-state">

            <div className="doctor-empty-icon">
              <UsersRound size={22} />
            </div>

            <h3>
              No pending requests
            </h3>

            <p>
              Patient connection requests will
              appear here when patients request
              to connect with you.
            </p>

          </div>

        ) : (

          /* ==========================================
              REQUEST LIST
          ========================================== */

          <div className="doctor-request-list">

            {requests.map((request) => {

              const patient =
                request.patient || {};

              const patientName =
                patient.fullName ||
                "Patient";

              const patientInitial =
                patientName
                  .charAt(0)
                  .toUpperCase();

              const isResponding =
                respondingTo ===
                request.connectionId;

              return (
                <div
                  className="doctor-request-item"
                  key={request.connectionId}
                >

                  {/* PATIENT IDENTITY */}

                  <div className="doctor-request-patient">

                    <div className="doctor-request-avatar">
                      {patientInitial}
                    </div>

                    <div>
                      <h3>
                        {patientName}
                      </h3>

                      <span>
                        {patient.patientId ||
                          "Patient ID unavailable"}
                      </span>
                    </div>

                  </div>


                  {/* PATIENT DETAILS */}

                  <div className="doctor-request-details">

                    <div>
                      <span>
                        EMAIL
                      </span>

                      <strong>
                        {patient.email ||
                          "Not available"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        GENDER
                      </span>

                      <strong>
                        {patient.gender ||
                          "Not available"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        ACTIVITY
                      </span>

                      <strong>
                        {patient.activityLevel ||
                          "Not available"}
                      </strong>
                    </div>

                  </div>


                  {/* REQUEST ACTIONS */}

                  <div className="doctor-request-actions">

                    <button
                      type="button"
                      className="doctor-request-reject"
                      disabled={isResponding}
                      onClick={() =>
                        handleRespondToRequest(
                          request.connectionId,
                          "rejected"
                        )
                      }
                    >
                      {isResponding
                        ? "Processing..."
                        : "Decline"}
                    </button>


                    <button
                      type="button"
                      className="doctor-request-accept"
                      disabled={isResponding}
                      onClick={() =>
                        handleRespondToRequest(
                          request.connectionId,
                          "accepted"
                        )
                      }
                    >
                      {isResponding
                        ? "Processing..."
                        : "Accept"}
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </section>


      {/* ==========================================
          PROFILE FOOTER NOTE
      ========================================== */}

      <div className="doctor-profile-note">

        <ShieldCheck size={17} />

        <span>
          Your LifePredict Doctor ID is unique
          to your account and can be shared with
          patients who want to connect with you.
        </span>

      </div>

    </div>
  );
}

export default DoctorProfile;