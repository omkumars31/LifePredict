import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HealthData.css";

const PatientHealthData = () => {
  const navigate = useNavigate();

  const initialFormData = {
    weight: "",
    systolicBP: "",
    diastolicBP: "",
    restingHeartRate: "",

    bloodGlucose: "",
    glucoseType: "",

    totalCholesterol: "",

    physicalActivity: "",
    steps: "",
    sleepHours: "",
    sleepQuality: "",
    stressLevel: "",
    waterIntake: "",

    alcoholToday: "No",
    alcoholDrinks: "",

    smokingToday: "No",
    cigarettesToday: "",
    sedentaryHours: "",

    energyLevel: "",
    mood: "",
    symptoms: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // LOAD TODAY'S SAVED HEALTH RECORD
  // =========================================================
  // IMPORTANT:
  // We intentionally fetch ONLY today's record.
  // If no record exists for today, the form stays blank.
  // This means a new day automatically starts with a fresh form.
  useEffect(() => {
    const loadTodayHealthRecord = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
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
          setError(
            data?.message ||
              "Unable to load today's health check-in."
          );
          return;
        }

        // No record today = fresh blank form.
        if (!data.exists || !data.record) {
          setFormData(initialFormData);
          return;
        }

        const record = data.record;

        // Populate the form ONLY when today's record exists.
        setFormData({
          weight: record.weight_kg ?? "",
          systolicBP: record.systolic_bp ?? "",
          diastolicBP: record.diastolic_bp ?? "",
          restingHeartRate: record.resting_heart_rate ?? "",
          bloodGlucose: record.glucose ?? "",
          glucoseType: record.glucose_reading_type ?? "",
          totalCholesterol: record.cholesterol ?? "",
          physicalActivity: record.physical_activity_minutes ?? "",
          steps: record.steps ?? "",
          sleepHours: record.sleep_hours ?? "",
          sleepQuality: record.sleep_quality ?? "",
          stressLevel: record.stress_level ?? "",
          waterIntake: record.water_intake_litres ?? "",
          alcoholToday:
            Number(record.alcohol_today) === 1 ? "Yes" : "No",
          alcoholDrinks: record.drinks_today ?? "",
          smokingToday:
            Number(record.smoking_today) === 1 ? "Yes" : "No",
          cigarettesToday: record.cigarettes_today ?? "",
          sedentaryHours: record.sedentary_time_hours ?? "",
          energyLevel: record.energy_level ?? "",
          mood: record.mood ?? "",
          symptoms: record.symptoms ?? "",
        });
      } catch (loadError) {
        console.error(
          "Load today's health record error:",
          loadError
        );

        setError(
          "Unable to connect to the server while loading today's check-in."
        );
      }
    };

    loadTodayHealthRecord();
  }, []);

  // =========================================================
  // HANDLE INPUT CHANGES
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear cigarettes when smoking is changed to No
    if (name === "smokingToday" && value === "No") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        cigarettesToday: "",
      }));
    }

    // Clear alcohol drinks when alcohol is changed to No
    if (name === "alcoholToday" && value === "No") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        alcoholDrinks: "",
      }));
    }
  };

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================
  // The backend decides whether to INSERT a new record or UPDATE
  // today's existing record. Therefore, the user can save multiple
  // times on the same day without creating duplicate daily records.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session has expired. Please login again.");
      navigate("/login");
      return;
    }

    // ---------------------------------------------------------
    // REQUIRED FIELD VALIDATION
    // ---------------------------------------------------------
    if (
      formData.weight === "" ||
      formData.systolicBP === "" ||
      formData.diastolicBP === ""
    ) {
      setError(
        "Please enter your weight, systolic BP and diastolic BP."
      );
      return;
    }

    // ---------------------------------------------------------
    // NUMERIC VALIDATION
    // ---------------------------------------------------------
    const weight = Number(formData.weight);
    const systolicBP = Number(formData.systolicBP);
    const diastolicBP = Number(formData.diastolicBP);

    if (
      !Number.isFinite(weight) ||
      !Number.isFinite(systolicBP) ||
      !Number.isFinite(diastolicBP)
    ) {
      setError("Weight and blood pressure values must be valid numbers.");
      return;
    }

    if (weight <= 0) {
      setError("Weight must be greater than zero.");
      return;
    }

    if (systolicBP <= 0 || diastolicBP <= 0) {
      setError("Blood pressure values must be greater than zero.");
      return;
    }

    if (diastolicBP >= systolicBP) {
      setError("Diastolic BP must be lower than systolic BP.");
      return;
    }

    // ---------------------------------------------------------
    // CONDITIONAL VALIDATION
    // ---------------------------------------------------------
    if (
      formData.alcoholToday === "Yes" &&
      formData.alcoholDrinks === ""
    ) {
      setError("Please enter the number of drinks consumed today.");
      return;
    }

    if (
      formData.smokingToday === "Yes" &&
      formData.cigarettesToday === ""
    ) {
      setError("Please enter the number of cigarettes smoked today.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/health-records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            // Core measurements
            weight,
            systolicBP,
            diastolicBP,

            restingHeartRate:
              formData.restingHeartRate !== ""
                ? Number(formData.restingHeartRate)
                : null,

            bloodGlucose:
              formData.bloodGlucose !== ""
                ? Number(formData.bloodGlucose)
                : null,

            glucoseType: formData.glucoseType || null,

            totalCholesterol:
              formData.totalCholesterol !== ""
                ? Number(formData.totalCholesterol)
                : null,

            // Lifestyle
            physicalActivity:
              formData.physicalActivity !== ""
                ? Number(formData.physicalActivity)
                : null,

            steps:
              formData.steps !== ""
                ? Number(formData.steps)
                : null,

            sleepHours:
              formData.sleepHours !== ""
                ? Number(formData.sleepHours)
                : null,

            sleepQuality: formData.sleepQuality || null,
            stressLevel: formData.stressLevel || null,

            waterIntake:
              formData.waterIntake !== ""
                ? Number(formData.waterIntake)
                : null,

            // Daily habits
            alcoholToday: formData.alcoholToday,
            alcoholDrinks:
              formData.alcoholToday === "Yes" &&
              formData.alcoholDrinks !== ""
                ? Number(formData.alcoholDrinks)
                : null,

            smokingToday: formData.smokingToday,
            cigarettesToday:
              formData.smokingToday === "Yes" &&
              formData.cigarettesToday !== ""
                ? Number(formData.cigarettesToday)
                : null,

            sedentaryHours:
              formData.sedentaryHours !== ""
                ? Number(formData.sedentaryHours)
                : null,

            // Daily wellbeing
            energyLevel: formData.energyLevel || null,
            mood: formData.mood || null,
            symptoms:
              formData.symptoms.trim() !== ""
                ? formData.symptoms.trim()
                : null,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Health record response JSON error:", jsonError);
      }

      if (!response.ok || !data?.success) {
        setError(
          data?.message ||
            "Unable to save today's health check-in."
        );
        return;
      }

      // Keep the current values visible and tell the user clearly
      // that the backend has saved/updated today's record.
      setMessage(
        data.message ||
          "Today's health check-in has been saved successfully."
      );

      // Clear any old error after a successful save.
      setError("");
    } catch (error) {
      console.error("Save health record error:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    navigate("/patient/dashboard");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="health-data-page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="health-page-header">


        <div className="page-eyebrow">
          TODAY'S HEALTH
        </div>

        <h1>
          How are you doing today?
        </h1>

        <p>
          Record your latest health measurements and daily
          lifestyle information. Your check-ins help LifePredict
          understand how your health changes over time.
        </p>

      </div>


      {/* =====================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="health-form"
      >

        {/* =====================================================
            1. TODAY'S MEASUREMENTS
        ====================================================== */}

        <section className="health-card">

          <div className="card-heading">

            <div className="card-icon">
              ♥
            </div>

            <div>

              <div className="card-eyebrow">
                MEASUREMENTS
              </div>

              <h2>
                Today's measurements
              </h2>

              <p>
                Enter your latest available health readings.
              </p>

            </div>

          </div>


          <div className="form-grid">

            {/* Weight */}

            <div className="form-group">

              <label htmlFor="weight">
                Weight <span>(kg)</span>
              </label>

              <input
                id="weight"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="e.g. 65.5"
                min="20"
                max="300"
                step="0.1"
              />

            </div>


            {/* Systolic BP */}

            <div className="form-group">

              <label htmlFor="systolicBP">
                Systolic BP <span>(mmHg)</span>
              </label>

              <input
                id="systolicBP"
                type="number"
                name="systolicBP"
                value={formData.systolicBP}
                onChange={handleChange}
                placeholder="e.g. 120"
                min="50"
                max="300"
              />

            </div>


            {/* Diastolic BP */}

            <div className="form-group">

              <label htmlFor="diastolicBP">
                Diastolic BP <span>(mmHg)</span>
              </label>

              <input
                id="diastolicBP"
                type="number"
                name="diastolicBP"
                value={formData.diastolicBP}
                onChange={handleChange}
                placeholder="e.g. 80"
                min="30"
                max="200"
              />

            </div>


            {/* Resting Heart Rate */}

            <div className="form-group">

              <label htmlFor="restingHeartRate">
                Resting heart rate <span>(bpm)</span>
              </label>

              <input
                id="restingHeartRate"
                type="number"
                name="restingHeartRate"
                value={formData.restingHeartRate}
                onChange={handleChange}
                placeholder="e.g. 72"
                min="30"
                max="220"
              />

              <small>
                Your resting pulse, if available.
              </small>

            </div>


            {/* Blood Glucose */}

            <div className="form-group">

              <label htmlFor="bloodGlucose">
                Blood glucose <span>(mg/dL)</span>
              </label>

              <input
                id="bloodGlucose"
                type="number"
                name="bloodGlucose"
                value={formData.bloodGlucose}
                onChange={handleChange}
                placeholder="e.g. 95"
                min="20"
                max="600"
              />

              <small>
                Enter your latest available reading.
              </small>

            </div>


            {/* Glucose Type */}

            <div className="form-group">

              <label htmlFor="glucoseType">
                Glucose reading type
              </label>

              <select
                id="glucoseType"
                name="glucoseType"
                value={formData.glucoseType}
                onChange={handleChange}
              >

                <option value="">
                  Select reading type
                </option>

                <option value="fasting">
                  Fasting
                </option>

                <option value="random">
                  Random
                </option>

              </select>

              <small>
                Choose whether the reading was fasting or random.
              </small>

            </div>


            {/* Total Cholesterol */}

            <div className="form-group">

              <label htmlFor="totalCholesterol">
                Total cholesterol <span>(mg/dL)</span>
              </label>

              <input
                id="totalCholesterol"
                type="number"
                name="totalCholesterol"
                value={formData.totalCholesterol}
                onChange={handleChange}
                placeholder="e.g. 180"
                min="50"
                max="500"
              />

              <small>
                Enter a recent lab value when available.
              </small>

            </div>

          </div>

        </section>


        {/* =====================================================
            2. TODAY'S LIFESTYLE
        ====================================================== */}

        <section className="health-card">

          <div className="card-heading">

            <div className="card-icon">
              ⌁
            </div>

            <div>

              <div className="card-eyebrow">
                LIFESTYLE
              </div>

              <h2>
                Today's lifestyle
              </h2>

              <p>
                Tell LifePredict about your activity, sleep and routine.
              </p>

            </div>

          </div>


          <div className="form-grid">

            {/* Physical Activity */}

            <div className="form-group">

              <label htmlFor="physicalActivity">
                Physical activity <span>(minutes)</span>
              </label>

              <input
                id="physicalActivity"
                type="number"
                name="physicalActivity"
                value={formData.physicalActivity}
                onChange={handleChange}
                placeholder="e.g. 45"
                min="0"
                max="1440"
              />

              <small>
                Approximate active minutes today.
              </small>

            </div>


            {/* Steps */}

            <div className="form-group">

              <label htmlFor="steps">
                Steps <span>(today)</span>
              </label>

              <input
                id="steps"
                type="number"
                name="steps"
                value={formData.steps}
                onChange={handleChange}
                placeholder="e.g. 6500"
                min="0"
                max="100000"
              />

            </div>


            {/* Sleep */}

            <div className="form-group">

              <label htmlFor="sleepHours">
                Sleep <span>(hours)</span>
              </label>

              <input
                id="sleepHours"
                type="number"
                name="sleepHours"
                value={formData.sleepHours}
                onChange={handleChange}
                placeholder="e.g. 7.5"
                min="0"
                max="24"
                step="0.1"
              />

              <small>
                How much did you sleep last night?
              </small>

            </div>


            {/* Sleep Quality */}

            <div className="form-group">

              <label htmlFor="sleepQuality">
                Sleep quality
              </label>

              <select
                id="sleepQuality"
                name="sleepQuality"
                value={formData.sleepQuality}
                onChange={handleChange}
              >

                <option value="">
                  Select sleep quality
                </option>

                <option value="poor">
                  Poor
                </option>

                <option value="fair">
                  Fair
                </option>

                <option value="good">
                  Good
                </option>

                <option value="excellent">
                  Excellent
                </option>

              </select>

            </div>


            {/* Stress */}

            <div className="form-group">

              <label htmlFor="stressLevel">
                Stress level
              </label>

              <select
                id="stressLevel"
                name="stressLevel"
                value={formData.stressLevel}
                onChange={handleChange}
              >

                <option value="">
                  Select stress level
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


            {/* Water */}

            <div className="form-group">

              <label htmlFor="waterIntake">
                Water intake <span>(litres)</span>
              </label>

              <input
                id="waterIntake"
                type="number"
                name="waterIntake"
                value={formData.waterIntake}
                onChange={handleChange}
                placeholder="e.g. 2.0"
                min="0"
                max="15"
                step="0.1"
              />

              <small>
                Approximate water consumed today.
              </small>

            </div>

          </div>

        </section>


        {/* =====================================================
            3. DAILY HABITS
        ====================================================== */}

        <section className="health-card">

          <div className="card-heading">

            <div className="card-icon">
              ↻
            </div>

            <div>

              <div className="card-eyebrow">
                DAILY HABITS
              </div>

              <h2>
                Today's habits
              </h2>

              <p>
                Only record habits that can change from day to day.
              </p>

            </div>

          </div>


          <div className="form-grid">

            {/* Alcohol */}

            <div className="form-group">

              <label htmlFor="alcoholToday">
                Alcohol today?
              </label>

              <select
                id="alcoholToday"
                name="alcoholToday"
                value={formData.alcoholToday}
                onChange={handleChange}
              >

                <option value="No">
                  No
                </option>

                <option value="Yes">
                  Yes
                </option>

              </select>

            </div>


            {/* Smoking */}

            <div className="form-group">

              <label htmlFor="smokingToday">
                Smoking today?
              </label>

              <select
                id="smokingToday"
                name="smokingToday"
                value={formData.smokingToday}
                onChange={handleChange}
              >

                <option value="No">
                  No
                </option>

                <option value="Yes">
                  Yes
                </option>

              </select>

            </div>


            {/* Alcohol Drinks */}

            {formData.alcoholToday === "Yes" && (

              <div className="form-group">

                <label htmlFor="alcoholDrinks">
                  Number of drinks <span>(today)</span>
                </label>

                <input
                  id="alcoholDrinks"
                  type="number"
                  name="alcoholDrinks"
                  value={formData.alcoholDrinks}
                  onChange={handleChange}
                  placeholder="e.g. 2"
                  min="1"
                  max="20"
                />

                <small>
                  Approximate number of alcoholic drinks consumed today.
                </small>

              </div>

            )}


            {/* Cigarettes */}

            {formData.smokingToday === "Yes" && (

              <div className="form-group">

                <label htmlFor="cigarettesToday">
                  Cigarettes today <span>(number)</span>
                </label>

                <input
                  id="cigarettesToday"
                  type="number"
                  name="cigarettesToday"
                  value={formData.cigarettesToday}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  min="1"
                  max="100"
                />

                <small>
                  Approximate number smoked today.
                </small>

              </div>

            )}


            {/* Sedentary */}

            <div className="form-group">

              <label htmlFor="sedentaryHours">
                Sedentary time <span>(hours)</span>
              </label>

              <input
                id="sedentaryHours"
                type="number"
                name="sedentaryHours"
                value={formData.sedentaryHours}
                onChange={handleChange}
                placeholder="e.g. 5"
                min="0"
                max="24"
                step="0.5"
              />

              <small>
                Approximate time spent sitting/inactive.
              </small>

            </div>

          </div>

        </section>


        {/* =====================================================
            4. DAILY WELLBEING
        ====================================================== */}

        <section className="health-card">

          <div className="card-heading">

            <div className="card-icon">
              ✦
            </div>

            <div>

              <div className="card-eyebrow">
                DAILY WELLBEING
              </div>

              <h2>
                How are you feeling?
              </h2>

              <p>
                These optional check-ins help capture how you feel today.
              </p>

            </div>

          </div>


          <div className="form-grid">

            {/* Energy */}

            <div className="form-group">

              <label htmlFor="energyLevel">
                Energy level
              </label>

              <select
                id="energyLevel"
                name="energyLevel"
                value={formData.energyLevel}
                onChange={handleChange}
              >

                <option value="">
                  Select energy level
                </option>

                <option value="low">
                  Low
                </option>

                <option value="average">
                  Average
                </option>

                <option value="good">
                  Good
                </option>

                <option value="excellent">
                  Excellent
                </option>

              </select>

            </div>


            {/* Mood */}

            <div className="form-group">

              <label htmlFor="mood">
                Mood
              </label>

              <select
                id="mood"
                name="mood"
                value={formData.mood}
                onChange={handleChange}
              >

                <option value="">
                  Select mood
                </option>

                <option value="low">
                  Low
                </option>

                <option value="okay">
                  Okay
                </option>

                <option value="good">
                  Good
                </option>

                <option value="very_good">
                  Very good
                </option>

              </select>

            </div>


            {/* Symptoms */}

            <div className="form-group full-width">

              <label htmlFor="symptoms">

                Any unusual symptoms today?

                <span className="optional">
                  Optional
                </span>

              </label>

              <textarea
                id="symptoms"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder="e.g. headache, unusual fatigue, dizziness... or leave blank"
                rows="4"
              />

            </div>

          </div>

        </section>


        {/* =====================================================
            SUCCESS / ERROR MESSAGE
        ====================================================== */}

        {message && (
          <div className="health-success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="health-error-message">
            {error}
          </div>
        )}


        {/* =====================================================
            INFORMATION BOX
        ====================================================== */}

        <div className="checkin-info">

          <div className="info-icon">
            i
          </div>

          <div>

            <strong>
              Your daily check-in
            </strong>

            <p>
              LifePredict uses your health measurements and lifestyle
              history to understand changes over time. Previous
              check-ins are kept as historical records.
            </p>

          </div>

        </div>


        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div className="form-actions">

          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>


          <button
            type="submit"
            className="save-button"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "✓ Save Today's Check-in"}
          </button>

        </div>

      </form>

    </div>
  );
};

export default PatientHealthData;