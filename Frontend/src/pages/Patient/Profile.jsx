import { useEffect, useState } from "react";

import {
  Save,
  UserRound,
  Loader2,
  Stethoscope,
  Copy,
  Check,
  Link2,
} from "lucide-react";

import "./Profile.css";

const API_URL = "http://localhost:5001";

const conditionOptions = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "High Cholesterol",
  "Obesity",
];

const familyHistoryOptions = [
  "Heart Disease",
  "Diabetes",
  "Hypertension",
  "Stroke",
  "High Cholesterol",
];

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [patientId, setPatientId] = useState("");

  // =====================================================
  // DOCTOR CONNECTION STATE
  // =====================================================

  const [doctorId, setDoctorId] = useState("");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionError, setConnectionError] = useState("");

  const [doctor, setDoctor] = useState(null);
  const [connection, setConnection] = useState(null);

  const [doctorLoading, setDoctorLoading] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
    heightCm: "",
    smokingStatus: "",
    alcoholStatus: "",
    activityLevel: "",
    existingConditions: [],
    familyHistory: [],
    currentMedications: "",
    previousHealthIssues: "",
  });

  // =====================================================
  // FETCH PROFILE + CONNECTION ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    fetchProfile();
    fetchPatientConnection();
  }, []);

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load profile."
        );
      }

      if (data.profileExists && data.profile) {
        const profile = data.profile;

        // Patient ID from MySQL
        setPatientId(profile.patient_id || "");

        setFormData({
          dateOfBirth: profile.date_of_birth
            ? profile.date_of_birth.slice(0, 10)
            : "",

          gender: profile.gender || "",

          heightCm: profile.height_cm || "",

          smokingStatus:
            profile.smoking_status || "",

          alcoholStatus:
            profile.alcohol_status || "",

          activityLevel:
            profile.activity_level || "",

          existingConditions:
            profile.existing_conditions
              ? profile.existing_conditions
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],

          familyHistory:
            profile.family_history
              ? profile.family_history
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],

          currentMedications:
            profile.current_medications || "",

          previousHealthIssues:
            profile.previous_health_issues || "",
        });
      }
    } catch (error) {
      console.error(
        "Fetch profile error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH CURRENT PATIENT-DOCTOR CONNECTION
  // =====================================================

  const fetchPatientConnection = async () => {
    try {
      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/connections/patient`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load doctor connection."
        );
      }

      if (data.connected && data.connection) {
        setConnection(data.connection);

        setDoctorId(
          data.connection.doctor?.doctorId || ""
        );

        setDoctor(
          data.connection.doctor || null
        );
      } else if (data.connection) {
        // Pending / rejected connection
        setConnection(data.connection);

        setDoctorId(
          data.connection.doctor?.doctorId || ""
        );

        setDoctor(
          data.connection.doctor || null
        );
      } else {
        setConnection(null);
        setDoctor(null);
      }
    } catch (error) {
      console.error(
        "Fetch patient connection error:",
        error
      );
    }
  };

  // =====================================================
  // HANDLE NORMAL INPUT CHANGES
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // HANDLE CONDITION / FAMILY HISTORY
  // =====================================================

  const toggleOption = (field, option) => {
    setFormData((previous) => {
      const currentValues = previous[field];

      if (currentValues.includes(option)) {
        return {
          ...previous,
          [field]: currentValues.filter(
            (item) => item !== option
          ),
        };
      }

      return {
        ...previous,
        [field]: [
          ...currentValues,
          option,
        ],
      };
    });
  };

  // =====================================================
  // COPY PATIENT ID
  // =====================================================

  const handleCopyPatientId = async () => {
    if (!patientId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        patientId
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Copy patient ID error:",
        error
      );
    }
  };

  // =====================================================
  // SEARCH DOCTOR + SEND CONNECTION REQUEST
  // =====================================================

  const handleConnectDoctor = async () => {
    setConnectionMessage("");
    setConnectionError("");

    const formattedDoctorId =
      doctorId.trim().toUpperCase();

    // ---------------------------------------------
    // VALIDATE DOCTOR ID
    // ---------------------------------------------

    if (!formattedDoctorId) {
      setConnectionError(
        "Please enter your doctor's LifePredict ID."
      );
      return;
    }

    if (!/^LP-D-\d{6}$/.test(formattedDoctorId)) {
      setConnectionError(
        "Please enter a valid Doctor ID, for example LP-D-000001."
      );
      return;
    }

    // ---------------------------------------------
    // IF ALREADY CONNECTED / PENDING
    // ---------------------------------------------

    if (
      connection &&
      connection.status === "accepted"
    ) {
      setConnectionError(
        "You are already connected to a doctor."
      );
      return;
    }

    if (
      connection &&
      connection.status === "pending" &&
      connection.doctor?.doctorId ===
        formattedDoctorId
    ) {
      setConnectionMessage(
        "Your connection request is already pending."
      );
      return;
    }

    try {
      setDoctorLoading(true);

      // ---------------------------------------------
      // STEP 1: FIND DOCTOR
      // ---------------------------------------------

      const doctorResponse = await fetch(
        `${API_URL}/api/connections/doctor/${formattedDoctorId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const doctorData =
        await doctorResponse.json();

      if (!doctorResponse.ok) {
        throw new Error(
          doctorData.error ||
            doctorData.message ||
            "Doctor not found."
        );
      }

      if (!doctorData.doctor) {
        throw new Error(
          "No doctor was found with this LifePredict ID."
        );
      }

      // Show doctor information
      setDoctor(doctorData.doctor);
      setDoctorId(
        doctorData.doctor.doctorId
      );

      setDoctorLoading(false);
      setConnectionLoading(true);

      // ---------------------------------------------
      // STEP 2: SEND CONNECTION REQUEST
      // ---------------------------------------------

      const requestResponse = await fetch(
        `${API_URL}/api/connections/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            doctorId:
              doctorData.doctor.doctorId,
          }),
        }
      );

      const requestData =
        await requestResponse.json();

      if (!requestResponse.ok) {
        throw new Error(
          requestData.error ||
            requestData.message ||
            "Unable to send connection request."
        );
      }

      setConnectionMessage(
        requestData.message ||
          "Connection request sent successfully."
      );

      // ---------------------------------------------
      // Refresh actual connection state
      // ---------------------------------------------

      await fetchPatientConnection();
    } catch (error) {
      console.error(
        "Connect doctor error:",
        error
      );

      setConnectionError(
        error.message ||
          "Unable to connect to doctor."
      );
    } finally {
      setDoctorLoading(false);
      setConnectionLoading(false);
    }
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!formData.gender || !formData.heightCm) {
      setErrorMessage(
        "Please fill in your gender and height."
      );
      return;
    }

    setSaving(true);

    try {
      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/profile`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            dateOfBirth:
              formData.dateOfBirth || null,

            gender: formData.gender,

            heightCm:
              Number(formData.heightCm),

            smokingStatus:
              formData.smokingStatus || null,

            alcoholStatus:
              formData.alcoholStatus || null,

            activityLevel:
              formData.activityLevel || null,

            existingConditions:
              formData.existingConditions.join(
                ", "
              ),

            familyHistory:
              formData.familyHistory.join(
                ", "
              ),

            currentMedications:
              formData.currentMedications.trim(),

            previousHealthIssues:
              formData.previousHealthIssues.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to save profile."
        );
      }

      if (data.patientId) {
        setPatientId(data.patientId);
      }

      setMessage(
        "Your profile has been saved successfully."
      );
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="profile-loading">
        <Loader2
          size={24}
          className="profile-spinner"
        />

        <span>
          Loading your profile...
        </span>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="profile-page">

      {/* Page Header */}

      <div className="profile-page-header">

        <div>
          <span className="profile-eyebrow">
            MY HEALTH
          </span>

          <h1>My Profile</h1>

          <p>
            Keep your personal and health background
            information up to date.
          </p>
        </div>

        <div className="profile-header-icon">
          <UserRound size={24} />
        </div>

      </div>


      {/* Success Message */}

      {message && (
        <div className="profile-success">
          {message}
        </div>
      )}


      {/* Error Message */}

      {errorMessage && (
        <div className="profile-error">
          {errorMessage}
        </div>
      )}


      {/* Main Profile Form */}

      <form
        className="profile-form"
        onSubmit={handleSubmit}
      >

        {/* =====================================
            PERSONAL INFORMATION
        ====================================== */}

        <section className="profile-section">

          <div className="profile-section-header">

            <div>
              <h2>
                Personal Information
              </h2>

              <p>
                Basic information used to understand
                your health profile.
              </p>
            </div>

          </div>


          <div className="profile-grid">

            {/* Full Name */}

            <div className="profile-field">

              <label>
                Full Name
              </label>

              <input
                type="text"
                value={
                  user?.fullName || ""
                }
                disabled
              />

              <span className="profile-helper">
                Name is linked to your account.
              </span>

            </div>


            {/* Email */}

            <div className="profile-field">

              <label>
                Email
              </label>

              <input
                type="email"
                value={
                  user?.email || ""
                }
                disabled
              />

              <span className="profile-helper">
                Email is linked to your account.
              </span>

            </div>


            {/* Patient ID */}

            <div className="profile-field">

              <label>
                Patient ID
              </label>

              <div className="profile-id-wrapper">

                <input
                  type="text"
                  value={
                    patientId ||
                    "Not available"
                  }
                  disabled
                  className="profile-id-input"
                />

                {patientId && (
                  <button
                    type="button"
                    className="profile-copy-button"
                    onClick={
                      handleCopyPatientId
                    }
                    title="Copy Patient ID"
                  >
                    {copied ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}

              </div>

              <span className="profile-helper">
                Use this ID to identify yourself on
                LifePredict.
              </span>

            </div>


            {/* Date of Birth */}

            <div className="profile-field">

              <label>
                Date of Birth
              </label>

              <input
                type="date"
                name="dateOfBirth"
                value={
                  formData.dateOfBirth
                }
                onChange={handleChange}
              />

            </div>


            {/* Gender */}

            <div className="profile-field">

              <label>
                Gender <span>*</span>
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >

                <option value="">
                  Select gender
                </option>

                <option value="female">
                  Female
                </option>

                <option value="male">
                  Male
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </div>


            {/* Height */}

            <div className="profile-field">

              <label>
                Height (cm) <span>*</span>
              </label>

              <input
                type="number"
                name="heightCm"
                value={
                  formData.heightCm
                }
                onChange={handleChange}
                min="50"
                max="250"
                step="0.1"
                placeholder="e.g. 165"
              />

            </div>

          </div>

        </section>


        {/* =====================================
            LIFESTYLE
        ====================================== */}

        <section className="profile-section">

          <div className="profile-section-header">

            <div>

              <h2>
                Lifestyle Baseline
              </h2>

              <p>
                Tell us about your usual lifestyle habits.
              </p>

            </div>

          </div>


          <div className="profile-grid">

            {/* Smoking */}

            <div className="profile-field">

              <label>
                Smoking
              </label>

              <select
                name="smokingStatus"
                value={
                  formData.smokingStatus
                }
                onChange={handleChange}
              >

                <option value="">
                  Select status
                </option>

                <option value="never">
                  Never
                </option>

                <option value="former">
                  Former smoker
                </option>

                <option value="current">
                  Current smoker
                </option>

              </select>

            </div>


            {/* Alcohol */}

            <div className="profile-field">

              <label>
                Alcohol
              </label>

              <select
                name="alcoholStatus"
                value={
                  formData.alcoholStatus
                }
                onChange={handleChange}
              >

                <option value="">
                  Select frequency
                </option>

                <option value="never">
                  Never
                </option>

                <option value="occasionally">
                  Occasionally
                </option>

                <option value="frequently">
                  Frequently
                </option>

              </select>

            </div>


            {/* Physical Activity */}

            <div className="profile-field">

              <label>
                Physical Activity
              </label>

              <select
                name="activityLevel"
                value={
                  formData.activityLevel
                }
                onChange={handleChange}
              >

                <option value="">
                  Select activity level
                </option>

                <option value="low">
                  Low
                </option>

                <option value="moderate">
                  Moderate
                </option>

                <option value="high">
                  High
                </option>

              </select>

            </div>

          </div>

        </section>


        {/* =====================================
            HEALTH BACKGROUND
        ====================================== */}

        <section className="profile-section">

          <div className="profile-section-header">

            <div>

              <h2>
                Health Background
              </h2>

              <p>
                Select anything that applies to you.
              </p>

            </div>

          </div>


          {/* Existing Conditions */}

          <div className="profile-choice-group">

            <label>
              Existing Conditions
            </label>

            <div className="profile-options">

              {conditionOptions.map(
                (option) => (
                  <button
                    type="button"
                    key={option}
                    className={
                      formData.existingConditions.includes(
                        option
                      )
                        ? "profile-option selected"
                        : "profile-option"
                    }
                    onClick={() =>
                      toggleOption(
                        "existingConditions",
                        option
                      )
                    }
                  >
                    {option}
                  </button>
                )
              )}

            </div>

          </div>


          {/* Family History */}

          <div className="profile-choice-group">

            <label>
              Family History
            </label>

            <div className="profile-options">

              {familyHistoryOptions.map(
                (option) => (
                  <button
                    type="button"
                    key={option}
                    className={
                      formData.familyHistory.includes(
                        option
                      )
                        ? "profile-option selected"
                        : "profile-option"
                    }
                    onClick={() =>
                      toggleOption(
                        "familyHistory",
                        option
                      )
                    }
                  >
                    {option}
                  </button>
                )
              )}

            </div>

          </div>


          <div className="profile-grid">

            {/* Current Medications */}

            <div className="profile-field profile-full">

              <label>
                Current Medications
              </label>

              <textarea
                name="currentMedications"
                value={
                  formData.currentMedications
                }
                onChange={handleChange}
                placeholder="List any current medications, or write None."
                rows="3"
              />

            </div>


            {/* Previous Health Issues */}

            <div className="profile-field profile-full">

              <label>
                Previous Major Health Issues
              </label>

              <textarea
                name="previousHealthIssues"
                value={
                  formData.previousHealthIssues
                }
                onChange={handleChange}
                placeholder="Mention any previous major health issues, surgeries, or hospitalizations."
                rows="3"
              />

            </div>

          </div>

        </section>


        {/* CONNECT TO DOCTOR */}

<section className="profile-section doctor-connect-section">
  <div className="profile-section-header doctor-connect-header">
    <div className="doctor-connect-title-row">
      {/* Heading mein sirf ek stethoscope icon */}
      <div className="doctor-connect-icon">
        <Stethoscope size={20} />
      </div>

      <div>
        <h2>Connect to Your Doctor</h2>
        <p>
          Connect your LifePredict account with your doctor
          using their unique Doctor ID.
        </p>
      </div>
    </div>
  </div>

  <div className="doctor-connect-content">
    {/* CONNECTED DOCTOR */}
    {connection?.status === "accepted" && doctor && (
      <div className="connection-doctor-card">
        <div className="connection-doctor-card-header">
          {/* Initials use kiye hain; extra stethoscope icon nahi */}
          <div className="connection-doctor-avatar doctor-avatar-initials">
            {doctor.fullName?.trim()?.charAt(0)?.toUpperCase() || "D"}
          </div>

          <div>
            <span className="connection-status-label">
              Connected Doctor
            </span>

            <h3>
              {doctor.fullName?.startsWith("Dr.")
                ? doctor.fullName
                : `Dr. ${doctor.fullName || "Connected Doctor"}`}
            </h3>
          </div>
        </div>

        <div className="connection-doctor-details">
          <div>
            <span>Doctor ID</span>
            <strong>{doctor.doctorId || "Not available"}</strong>
          </div>

          {doctor.specialization && (
            <div>
              <span>Specialization</span>
              <strong>{doctor.specialization}</strong>
            </div>
          )}

          {doctor.qualification && (
            <div>
              <span>Qualification</span>
              <strong>{doctor.qualification}</strong>
            </div>
          )}

          {doctor.hospitalClinic && (
            <div>
              <span>Hospital / Clinic</span>
              <strong>{doctor.hospitalClinic}</strong>
            </div>
          )}
        </div>

        <div className="connection-success">
          Your account is connected with this doctor.
        </div>
      </div>
    )}

    {/* PENDING CONNECTION */}
    {connection?.status === "pending" && doctor && (
      <div className="connection-doctor-card">
        <div className="connection-doctor-card-header">
          <div className="connection-doctor-avatar doctor-avatar-initials">
            {doctor.fullName?.trim()?.charAt(0)?.toUpperCase() || "D"}
          </div>

          <div>
            <span className="connection-status-label">
              Connection Request Pending
            </span>

            <h3>
              {doctor.fullName?.startsWith("Dr.")
                ? doctor.fullName
                : `Dr. ${doctor.fullName || "Doctor"}`}
            </h3>
          </div>
        </div>

        <div className="connection-doctor-details">
          <div>
            <span>Doctor ID</span>
            <strong>{doctor.doctorId || "Not available"}</strong>
          </div>

          {doctor.specialization && (
            <div>
              <span>Specialization</span>
              <strong>{doctor.specialization}</strong>
            </div>
          )}
        </div>

        <div className="connection-success">
          Your request has been sent. Waiting for the doctor's approval.
        </div>
      </div>
    )}

    {/* NO CONNECTION OR REJECTED REQUEST */}
    {(!connection || connection.status === "rejected") && (
      <div className="doctor-connect-form">
        <div className="profile-field doctor-id-field">
          <label htmlFor="doctor-life-predict-id">
            Doctor's LifePredict ID
          </label>

          <div className="doctor-id-input-row">
            <div className="doctor-id-input-wrapper">
              <Link2 size={16} />

              <input
                id="doctor-life-predict-id"
                type="text"
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value.toUpperCase());
                  setDoctor(null);
                  setConnectionMessage("");
                  setConnectionError("");
                }}
                placeholder="e.g. LP-D-000001"
                maxLength={13}
              />
            </div>

            <button
              type="button"
              className="doctor-connect-button"
              onClick={handleConnectDoctor}
              disabled={doctorLoading || connectionLoading}
            >
              {doctorLoading || connectionLoading ? (
                <>
                  <Loader2 size={16} className="profile-spinner" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </button>
          </div>

          <span className="profile-helper">
            Enter the unique LifePredict ID provided by your doctor.
          </span>
        </div>

        {connectionMessage && (
          <div className="connection-success">
            {connectionMessage}
          </div>
        )}

        {connectionError && (
          <div className="connection-error">
            {connectionError}
          </div>
        )}

        {doctor && connection?.status !== "accepted" && (
          <div className="connection-doctor-preview">
            <div className="connection-doctor-card-header">
              <div className="connection-doctor-avatar doctor-avatar-initials">
                {doctor.fullName?.trim()?.charAt(0)?.toUpperCase() || "D"}
              </div>

              <div>
                <span className="connection-status-label">
                  Doctor Found
                </span>

                <h3>
                  {doctor.fullName?.startsWith("Dr.")
                    ? doctor.fullName
                    : `Dr. ${doctor.fullName || "Doctor"}`}
                </h3>
              </div>
            </div>

            <div className="connection-doctor-details">
              <div>
                <span>Doctor ID</span>
                <strong>{doctor.doctorId || "Not available"}</strong>
              </div>

              {doctor.specialization && (
                <div>
                  <span>Specialization</span>
                  <strong>{doctor.specialization}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
</section>


        {/* =====================================
            SAVE PROFILE
        ====================================== */}

        <div className="profile-form-footer">

          <span>
            You can update this information whenever
            your health background changes.
          </span>


          <button
            type="submit"
            className="profile-save-button"
            disabled={saving}
          >

            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="profile-spinner"
                />

                Saving...
              </>
            ) : (
              <>
                <Save size={17} />

                Save Profile
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}

export default Profile;