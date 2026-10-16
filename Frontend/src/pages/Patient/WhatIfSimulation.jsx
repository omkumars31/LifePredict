import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Cigarette,
  Droplets,
  Dumbbell,
  HeartPulse,
  Lightbulb,
  Moon,
  Play,
  RotateCcw,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wine,
} from "lucide-react";

import "./WhatIfSimulation.css";

const API_URL = "http://localhost:5001/api/health-records";

const INDIA_TIMEZONE = "Asia/Kolkata";

const EMPTY_HEALTH = {
  id: null,
  recorded_at: null,
  weight: null,
  systolicBP: null,
  diastolicBP: null,
  physicalActivity: null,
  sleepHours: null,
  waterIntake: null,
  smoking: false,
  smokingCigarettes: null,
  alcohol: false,
  alcoholDrinks: null,
};

const EMPTY_SCENARIO = {
  weight: "",
  systolicBP: "",
  diastolicBP: "",
  physicalActivity: "",
  sleepHours: "",
  waterIntake: "",
  smoking: false,
  alcohol: false,
};

function WhatIfSimulation() {
  const navigate = useNavigate();

  const [currentHealth, setCurrentHealth] =
    useState(EMPTY_HEALTH);

  const [scenario, setScenario] =
    useState(EMPTY_SCENARIO);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // =========================================================
  // INDIA DATE HELPER
  // =========================================================

  const getIndiaDateKey = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: INDIA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  // =========================================================
  // FIND LATEST RECORD FROM TODAY ONLY
  //
  // IMPORTANT:
  // 1. First filter records to today's India date.
  // 2. Then sort by recorded_at descending.
  // 3. Pick the newest record.
  //
  // This prevents an older record from becoming the baseline.
  // =========================================================

  const getLatestTodayRecord = (records) => {
    if (!Array.isArray(records)) {
      return null;
    }

    const todayIndia = getIndiaDateKey(new Date());

    const todaysRecords = records
      .filter((record) => {
        if (!record?.recorded_at) {
          return false;
        }

        return (
          getIndiaDateKey(record.recorded_at) ===
          todayIndia
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.recorded_at).getTime();
        const timeB = new Date(b.recorded_at).getTime();

        return timeB - timeA;
      });

    return todaysRecords[0] || null;
  };

  // =========================================================
  // NORMALIZE BACKEND HEALTH RECORD
  // =========================================================

  const normalizeHealthRecord = (record) => {
    const numberOrNull = (value) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const parsed = Number(value);

      return Number.isFinite(parsed)
        ? parsed
        : null;
    };

    return {
      id: record?.id ?? null,

      recorded_at:
        record?.recorded_at ?? null,

      weight: numberOrNull(
        record?.weight_kg
      ),

      systolicBP: numberOrNull(
        record?.systolic_bp
      ),

      diastolicBP: numberOrNull(
        record?.diastolic_bp
      ),

      physicalActivity: numberOrNull(
        record?.physical_activity_minutes
      ),

      sleepHours: numberOrNull(
        record?.sleep_hours
      ),

      waterIntake: numberOrNull(
        record?.water_intake_litres
      ),

      smoking:
        Number(record?.smoking_today) === 1,

      smokingCigarettes:
        numberOrNull(
          record?.cigarettes_today
        ),

      alcohol:
        Number(record?.alcohol_today) === 1,

      alcoholDrinks:
        numberOrNull(
          record?.drinks_today
        ),
    };
  };

  // =========================================================
  // CREATE SCENARIO FROM CURRENT BASELINE
  // =========================================================

  const createScenarioFromCurrent = (health) => {
    return {
      weight: health.weight ?? "",
      systolicBP: health.systolicBP ?? "",
      diastolicBP: health.diastolicBP ?? "",

      physicalActivity:
        health.physicalActivity ?? "",

      sleepHours:
        health.sleepHours ?? "",

      waterIntake:
        health.waterIntake ?? "",

      smoking: health.smoking,
      alcohol: health.alcohol,
    };
  };

  // =========================================================
  // LOAD TODAY'S LATEST HEALTH RECORD
  // =========================================================

  useEffect(() => {
    const loadTodayHealth = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          API_URL,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to load today's health data."
          );
        }

        const records =
          data.records || [];

        // IMPORTANT:
        // Only today's India-timezone records
        // are considered.
        const latestTodayRecord =
          getLatestTodayRecord(records);

        // IMPORTANT:
        // Never fall back to yesterday's data.
        if (!latestTodayRecord) {
          setCurrentHealth(
            EMPTY_HEALTH
          );

          setScenario(
            EMPTY_SCENARIO
          );

          setResult(null);

          return;
        }

        const normalized =
          normalizeHealthRecord(
            latestTodayRecord
          );

        // Read-only actual baseline.
        setCurrentHealth(
          normalized
        );

        // Separate hypothetical scenario.
        setScenario(
          createScenarioFromCurrent(
            normalized
          )
        );

        setResult(null);
      } catch (loadError) {
        console.error(
          "What-if health data error:",
          loadError
        );

        setError(
          loadError.message ||
            "Unable to load today's health data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTodayHealth();
  }, []);

  // =========================================================
  // DATE DISPLAY
  // =========================================================

  const formattedBaselineDate =
    useMemo(() => {
      if (!currentHealth.recorded_at) {
        return "";
      }

      const date =
        new Date(
          currentHealth.recorded_at
        );

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      return new Intl.DateTimeFormat(
        "en-IN",
        {
          timeZone: INDIA_TIMEZONE,
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      ).format(date);
    }, [currentHealth.recorded_at]);

  // =========================================================
  // HELPERS
  // =========================================================

  const hasBaseline =
    currentHealth.weight !== null ||
    currentHealth.systolicBP !== null ||
    currentHealth.diastolicBP !== null;

  const numberValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
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

  const getBPStatus = (
    systolic,
    diastolic
  ) => {
    if (
      systolic === null ||
      diastolic === null
    ) {
      return "Not available";
    }

    if (
      systolic >= 140 ||
      diastolic >= 90
    ) {
      return "Higher range";
    }

    if (
      systolic >= 130 ||
      diastolic >= 80
    ) {
      return "Above ideal";
    }

    return "Currently not flagged";
  };

  const getActivityStatus = (
    minutes
  ) => {
    if (minutes === null) {
      return "Not recorded";
    }

    if (minutes < 30) {
      return "Low today";
    }

    return "Activity recorded";
  };

  const getSleepStatus = (hours) => {
    if (hours === null) {
      return "Not recorded";
    }

    if (hours < 6) {
      return "Needs attention";
    }

    return "Recorded";
  };

  // =========================================================
  // SCENARIO CHANGE
  // =========================================================

  const handleScenarioChange = (
    field,
    value
  ) => {
    setScenario((previous) => ({
      ...previous,
      [field]: value,
    }));

    // Old comparison becomes invalid
    // whenever scenario changes.
    setResult(null);
  };

  // =========================================================
  // RESET SCENARIO
  // =========================================================

  const handleReset = () => {
    if (!hasBaseline) {
      return;
    }

    setScenario(
      createScenarioFromCurrent(
        currentHealth
      )
    );

    setResult(null);
  };

  // =========================================================
  // VALIDATE SCENARIO
  // =========================================================

  const validateScenario = () => {
    const weight =
      numberValue(
        scenario.weight
      );

    const systolicBP =
      numberValue(
        scenario.systolicBP
      );

    const diastolicBP =
      numberValue(
        scenario.diastolicBP
      );

    if (
      weight === null ||
      weight <= 0
    ) {
      return "Please enter a valid scenario weight.";
    }

    if (
      systolicBP === null ||
      systolicBP <= 0
    ) {
      return "Please enter a valid systolic BP.";
    }

    if (
      diastolicBP === null ||
      diastolicBP <= 0
    ) {
      return "Please enter a valid diastolic BP.";
    }

    if (
      diastolicBP >= systolicBP
    ) {
      return "Diastolic BP must be lower than systolic BP.";
    }

    return "";
  };

  // =========================================================
  // BUILD CURRENT → SCENARIO CHANGES
  // =========================================================

  const buildChanges = () => {
    const changes = [];

    // -------------------------
    // WEIGHT
    // -------------------------

    const currentWeight =
      currentHealth.weight;

    const scenarioWeight =
      numberValue(
        scenario.weight
      );

    if (
      currentWeight !== null &&
      scenarioWeight !== null &&
      currentWeight !== scenarioWeight
    ) {
      changes.push({
        label: "Weight",
        current: `${currentWeight} kg`,
        scenario: `${scenarioWeight} kg`,
        direction:
          scenarioWeight <
          currentWeight
            ? "down"
            : "up",
      });
    }

    // -------------------------
    // SYSTOLIC BP
    // -------------------------

    const currentSystolic =
      currentHealth.systolicBP;

    const scenarioSystolic =
      numberValue(
        scenario.systolicBP
      );

    if (
      currentSystolic !== null &&
      scenarioSystolic !== null &&
      currentSystolic !==
        scenarioSystolic
    ) {
      changes.push({
        label: "Systolic BP",
        current: `${currentSystolic} mmHg`,
        scenario: `${scenarioSystolic} mmHg`,
        direction:
          scenarioSystolic <
          currentSystolic
            ? "down"
            : "up",
      });
    }

    // -------------------------
    // DIASTOLIC BP
    // -------------------------

    const currentDiastolic =
      currentHealth.diastolicBP;

    const scenarioDiastolic =
      numberValue(
        scenario.diastolicBP
      );

    if (
      currentDiastolic !== null &&
      scenarioDiastolic !== null &&
      currentDiastolic !==
        scenarioDiastolic
    ) {
      changes.push({
        label: "Diastolic BP",
        current: `${currentDiastolic} mmHg`,
        scenario: `${scenarioDiastolic} mmHg`,
        direction:
          scenarioDiastolic <
          currentDiastolic
            ? "down"
            : "up",
      });
    }

    // -------------------------
    // PHYSICAL ACTIVITY
    // -------------------------

    const currentActivity =
      currentHealth.physicalActivity;

    const scenarioActivity =
      numberValue(
        scenario.physicalActivity
      );

    if (
      currentActivity !== null &&
      scenarioActivity !== null &&
      currentActivity !==
        scenarioActivity
    ) {
      changes.push({
        label: "Physical activity",
        current: `${currentActivity} min`,
        scenario: `${scenarioActivity} min`,
        direction:
          scenarioActivity >
          currentActivity
            ? "up"
            : "down",
      });
    }

    // -------------------------
    // SLEEP
    // -------------------------

    const currentSleep =
      currentHealth.sleepHours;

    const scenarioSleep =
      numberValue(
        scenario.sleepHours
      );

    if (
      currentSleep !== null &&
      scenarioSleep !== null &&
      currentSleep !==
        scenarioSleep
    ) {
      changes.push({
        label: "Sleep",
        current: `${currentSleep} hrs`,
        scenario: `${scenarioSleep} hrs`,
        direction:
          scenarioSleep >
          currentSleep
            ? "up"
            : "down",
      });
    }

    // -------------------------
    // WATER
    // -------------------------

    const currentWater =
      currentHealth.waterIntake;

    const scenarioWater =
      numberValue(
        scenario.waterIntake
      );

    if (
      currentWater !== null &&
      scenarioWater !== null &&
      currentWater !==
        scenarioWater
    ) {
      changes.push({
        label: "Water intake",
        current: `${currentWater} L`,
        scenario: `${scenarioWater} L`,
        direction:
          scenarioWater >
          currentWater
            ? "up"
            : "down",
      });
    }

    // -------------------------
    // SMOKING
    // -------------------------

    if (
      scenario.smoking !==
      currentHealth.smoking
    ) {
      changes.push({
        label: "Smoking",
        current:
          currentHealth.smoking
            ? "Yes"
            : "No",
        scenario:
          scenario.smoking
            ? "Yes"
            : "No",
        direction:
          scenario.smoking
            ? "up"
            : "down",
      });
    }

    // -------------------------
    // ALCOHOL
    // -------------------------

    if (
      scenario.alcohol !==
      currentHealth.alcohol
    ) {
      changes.push({
        label: "Alcohol",
        current:
          currentHealth.alcohol
            ? "Yes"
            : "No",
        scenario:
          scenario.alcohol
            ? "Yes"
            : "No",
        direction:
          scenario.alcohol
            ? "up"
            : "down",
      });
    }

    return changes;
  };

  // =========================================================
  // SCENARIO TAKEAWAYS
  //
  // IMPORTANT:
  // These are input-level observations only.
  // They are NOT ML predictions.
  // =========================================================

  const buildScenarioTakeaways = (
    changes
  ) => {
    const takeaways = [];

    if (!changes.length) {
      return [
        {
          icon: <CheckCircle2 size={16} />,
          text:
            "Your scenario currently matches today's saved health baseline.",
        },
      ];
    }

    changes.forEach((change) => {
      if (
        change.label === "Physical activity" &&
        change.direction === "up"
      ) {
        takeaways.push({
          icon: <Dumbbell size={16} />,
          text:
            "Your scenario increases physical activity compared with today's check-in.",
        });
      }

      if (
        change.label === "Physical activity" &&
        change.direction === "down"
      ) {
        takeaways.push({
          icon: <Dumbbell size={16} />,
          text:
            "Your scenario reduces physical activity compared with today's check-in.",
        });
      }

      if (
        change.label === "Sleep" &&
        change.direction === "up"
      ) {
        takeaways.push({
          icon: <Moon size={16} />,
          text:
            "Your scenario gives you more sleep time than today's recorded value.",
        });
      }

      if (
        change.label === "Sleep" &&
        change.direction === "down"
      ) {
        takeaways.push({
          icon: <Moon size={16} />,
          text:
            "Your scenario gives you less sleep time than today's recorded value.",
        });
      }

      if (
        change.label === "Water intake" &&
        change.direction === "up"
      ) {
        takeaways.push({
          icon: <Droplets size={16} />,
          text:
            "Your scenario increases water intake compared with today's value.",
        });
      }

      if (
        change.label === "Water intake" &&
        change.direction === "down"
      ) {
        takeaways.push({
          icon: <Droplets size={16} />,
          text:
            "Your scenario decreases water intake compared with today's value.",
        });
      }

      if (
        (
          change.label ===
            "Systolic BP" ||
          change.label ===
            "Diastolic BP"
        ) &&
        change.direction === "down"
      ) {
        takeaways.push({
          icon: <HeartPulse size={16} />,
          text:
            `${change.label} is lower in your scenario than today's recorded value.`,
        });
      }

      if (
        (
          change.label ===
            "Systolic BP" ||
          change.label ===
            "Diastolic BP"
        ) &&
        change.direction === "up"
      ) {
        takeaways.push({
          icon: <HeartPulse size={16} />,
          text:
            `${change.label} is higher in your scenario than today's recorded value.`,
        });
      }

      if (
        change.label === "Weight" &&
        change.direction === "down"
      ) {
        takeaways.push({
          icon: <Scale size={16} />,
          text:
            "Your scenario uses a lower weight than today's saved value.",
        });
      }

      if (
        change.label === "Weight" &&
        change.direction === "up"
      ) {
        takeaways.push({
          icon: <Scale size={16} />,
          text:
            "Your scenario uses a higher weight than today's saved value.",
        });
      }

      if (
        change.label === "Smoking" &&
        change.scenario === "No"
      ) {
        takeaways.push({
          icon: <Cigarette size={16} />,
          text:
            "Your scenario removes smoking from today's recorded state.",
        });
      }

      if (
        change.label === "Smoking" &&
        change.scenario === "Yes"
      ) {
        takeaways.push({
          icon: <Cigarette size={16} />,
          text:
            "Your scenario introduces smoking compared with today's recorded state.",
        });
      }

      if (
        change.label === "Alcohol" &&
        change.scenario === "No"
      ) {
        takeaways.push({
          icon: <Wine size={16} />,
          text:
            "Your scenario removes alcohol from today's recorded state.",
        });
      }

      if (
        change.label === "Alcohol" &&
        change.scenario === "Yes"
      ) {
        takeaways.push({
          icon: <Wine size={16} />,
          text:
            "Your scenario introduces alcohol compared with today's recorded state.",
        });
      }
    });

    return takeaways.slice(0, 5);
  };

  // =========================================================
  // SCENARIO SUMMARY
  // =========================================================

  const calculateScenarioSummary = (
    changes
  ) => {
    let positiveSignals = 0;
    let negativeSignals = 0;

    changes.forEach((change) => {
      if (
        change.label === "Weight"
      ) {
        if (
          change.direction === "down"
        ) {
          positiveSignals += 1;
        } else {
          negativeSignals += 1;
        }
      }

      if (
        (
          change.label ===
            "Systolic BP" ||
          change.label ===
            "Diastolic BP"
        )
      ) {
        if (
          change.direction === "down"
        ) {
          positiveSignals += 1;
        } else {
          negativeSignals += 1;
        }
      }

      if (
        change.label ===
        "Physical activity"
      ) {
        if (
          change.direction === "up"
        ) {
          positiveSignals += 1;
        } else {
          negativeSignals += 1;
        }
      }

      if (
        change.label === "Sleep"
      ) {
        if (
          change.direction === "up"
        ) {
          positiveSignals += 1;
        } else {
          negativeSignals += 1;
        }
      }

      if (
        change.label ===
        "Water intake"
      ) {
        if (
          change.direction === "up"
        ) {
          positiveSignals += 1;
        } else {
          negativeSignals += 1;
        }
      }

      if (
        change.label === "Smoking"
      ) {
        if (
          change.scenario === "No"
        ) {
          positiveSignals += 1;
        } else {
          negativeSignals += 1;
        }
      }

      if (
        change.label === "Alcohol"
      ) {
        if (
          change.scenario === "No"
        ) {
          positiveSignals += 1;
        } else {
          negativeSignals += 1;
        }
      }
    });

    if (
      positiveSignals === 0 &&
      negativeSignals === 0
    ) {
      return {
        type: "same",
        title:
          "No meaningful change detected",
        text:
          "Your scenario currently matches today's health baseline.",
      };
    }

    if (
      positiveSignals >
      negativeSignals
    ) {
      return {
        type: "positive",
        title:
          "Several selected factors move in a more favourable direction",
        text:
          "This is an input-level comparison based only on the factors you changed. It is not an ML prediction or medical assessment.",
      };
    }

    if (
      negativeSignals >
      positiveSignals
    ) {
      return {
        type: "negative",
        title:
          "Some selected factors move in a less favourable direction",
        text:
          "This is an input-level comparison based only on the factors you changed. It is not an ML prediction or medical assessment.",
      };
    }

    return {
      type: "mixed",
      title:
        "Your scenario contains mixed changes",
      text:
        "Some selected inputs move in different directions. The page is showing the scenario itself, not predicting a medical outcome.",
    };
  };

  // =========================================================
  // RUN SIMULATION
  // =========================================================

  const runSimulation = () => {
    const validationError =
      validateScenario();

    if (validationError) {
      setResult({
        type: "validation",
        message: validationError,
      });

      return;
    }

    const changes =
      buildChanges();

    const summary =
      calculateScenarioSummary(
        changes
      );

    const takeaways =
      buildScenarioTakeaways(
        changes
      );

    setResult({
      type: "success",
      changes,
      summary,
      takeaways,
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="wif-page">
        <div className="wif-state-card">
          <div className="wif-loader">
            <Activity size={24} />
          </div>

          <h2>
            Loading today's health data
          </h2>

          <p>
            LifePredict is checking your
            latest saved health check-in
            before building the simulation.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="wif-page">
        <button
          type="button"
          className="wif-back"
          onClick={() =>
            navigate(
              "/patient/dashboard"
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="wif-state-card wif-error-state">
          <div className="wif-state-icon">
            <AlertCircle size={24} />
          </div>

          <h2>
            We couldn't load your health data
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="wif-primary-button"
            onClick={() =>
              navigate(
                "/patient/health-data"
              )
            }
          >
            Open Health Data
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // NO TODAY'S RECORD
  // =========================================================

  if (!hasBaseline) {
    return (
      <div className="wif-page">
        <button
          type="button"
          className="wif-back"
          onClick={() =>
            navigate(
              "/patient/dashboard"
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <section className="wif-empty-health">
          <div className="wif-empty-health-icon">
            <HeartPulse size={28} />
          </div>

          <span>
            TODAY'S HEALTH CHECK-IN
          </span>

          <h1>
            Start with today's health data
          </h1>

          <p>
            What-if Simulation uses only
            your latest health check-in
            recorded today. Previous days
            are never used as the baseline.
            Add today's health data first,
            then return here to experiment
            with hypothetical changes.
          </p>

          <button
            type="button"
            className="wif-primary-button"
            onClick={() =>
              navigate(
                "/patient/health-data"
              )
            }
          >
            Add Today's Health Data
          </button>
        </section>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="wif-page">



      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="wif-header">
        <div className="wif-header-content">

          <span className="wif-eyebrow">
            EXPERIMENT WITH YOUR HEALTH
          </span>

          <h1>
            What-if Simulation
          </h1>

          <p className="wif-header-description">
            What-if Simulation lets you
            experiment with hypothetical
            lifestyle or health changes
            without changing today's saved
            health data. Start with today's
            baseline, change the factors you
            want to explore, and compare
            your scenario with your current
            profile.
          </p>

          <div className="wif-how-it-works">

            <div className="wif-how-step">
              <span>01</span>
              <strong>
                Your current health
              </strong>
            </div>

            <div className="wif-how-line" />

            <div className="wif-how-step">
              <span>02</span>
              <strong>
                Change a factor
              </strong>
            </div>

            <div className="wif-how-line" />

            <div className="wif-how-step">
              <span>03</span>
              <strong>
                Compare the scenario
              </strong>
            </div>

          </div>
        </div>
      </header>

      {/* =====================================================
          CURRENT BASELINE
      ====================================================== */}

      <section className="wif-baseline-card">

        <div className="wif-section-heading">

          <div className="wif-heading-left">
            <span>
              TODAY'S HEALTH BASELINE
            </span>

            <h2>
              Your current health profile
            </h2>
          </div>

          <p>
            Latest saved health check-in
            from today
            {formattedBaselineDate
              ? ` • ${formattedBaselineDate}`
              : ""}
          </p>

        </div>

        <div className="wif-baseline-grid">

          <div className="wif-baseline-item">
            <Scale size={18} />

            <div>
              <span>
                Weight
              </span>

              <strong>
                {formatValue(
                  currentHealth.weight
                )}
                {currentHealth.weight !==
                  null &&
                  " kg"}
              </strong>
            </div>
          </div>

          <div className="wif-baseline-item">
            <HeartPulse size={18} />

            <div>
              <span>
                Blood Pressure
              </span>

              <strong>
                {currentHealth.systolicBP !==
                  null &&
                currentHealth.diastolicBP !==
                  null
                  ? `${currentHealth.systolicBP}/${currentHealth.diastolicBP}`
                  : "Not recorded"}
              </strong>

              {currentHealth.systolicBP !==
                null &&
                currentHealth.diastolicBP !==
                  null && (
                  <small>
                    {getBPStatus(
                      currentHealth.systolicBP,
                      currentHealth.diastolicBP
                    )}
                  </small>
                )}
            </div>
          </div>

          <div className="wif-baseline-item">
            <Dumbbell size={18} />

            <div>
              <span>
                Physical Activity
              </span>

              <strong>
                {currentHealth.physicalActivity !==
                null
                  ? `${currentHealth.physicalActivity} min`
                  : "Not recorded"}
              </strong>

              {currentHealth.physicalActivity !==
                null && (
                <small>
                  {getActivityStatus(
                    currentHealth.physicalActivity
                  )}
                </small>
              )}
            </div>
          </div>

          <div className="wif-baseline-item">
            <Moon size={18} />

            <div>
              <span>
                Sleep
              </span>

              <strong>
                {currentHealth.sleepHours !==
                null
                  ? `${currentHealth.sleepHours} hrs`
                  : "Not recorded"}
              </strong>

              {currentHealth.sleepHours !==
                null && (
                <small>
                  {getSleepStatus(
                    currentHealth.sleepHours
                  )}
                </small>
              )}
            </div>
          </div>

          <div className="wif-baseline-item">
            <Cigarette size={18} />

            <div>
              <span>
                Smoking
              </span>

              <strong>
                {currentHealth.smoking
                  ? "Yes"
                  : "No"}
              </strong>
            </div>
          </div>

          <div className="wif-baseline-item">
            <Wine size={18} />

            <div>
              <span>
                Alcohol
              </span>

              <strong>
                {currentHealth.alcohol
                  ? "Yes"
                  : "No"}
              </strong>
            </div>
          </div>

        </div>

        <div className="wif-baseline-note">
          <CheckCircle2 size={15} />

          <span>
            This is a read-only snapshot of
            today's latest saved health
            record. Your scenario values
            remain separate.
          </span>
        </div>

      </section>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="wif-main-grid">

        {/* ===================================================
            SCENARIO INPUT
        =================================================== */}

        <section className="wif-input-card">

          <div className="wif-card-heading">

            <div className="wif-card-icon">
              <Sparkles size={20} />
            </div>

            <div className="wif-card-title">

              <span>
                SIMULATION INPUTS
              </span>

              <h2>
                Change your scenario
              </h2>

            </div>
          </div>

          <p className="wif-helper">
            These values are hypothetical.
            They will not overwrite today's
            health record. Change only the
            factors you want to experiment
            with, then run the scenario.
          </p>

          {/* BODY & VITALS */}

          <div className="wif-subsection">

            <div className="wif-subsection-title">
              <span>
                BODY &amp; VITALS
              </span>

              <small>
                Try a different health state
              </small>
            </div>

            <div className="wif-input-grid">

              <ScenarioNumberField
                icon={
                  <Scale size={15} />
                }
                label="Weight"
                value={scenario.weight}
                unit="kg"
                min="1"
                step="0.1"
                onChange={(value) =>
                  handleScenarioChange(
                    "weight",
                    value
                  )
                }
              />

              <ScenarioNumberField
                icon={
                  <HeartPulse size={15} />
                }
                label="Systolic BP"
                value={
                  scenario.systolicBP
                }
                unit="mmHg"
                min="1"
                onChange={(value) =>
                  handleScenarioChange(
                    "systolicBP",
                    value
                  )
                }
              />

              <ScenarioNumberField
                icon={
                  <HeartPulse size={15} />
                }
                label="Diastolic BP"
                value={
                  scenario.diastolicBP
                }
                unit="mmHg"
                min="1"
                onChange={(value) =>
                  handleScenarioChange(
                    "diastolicBP",
                    value
                  )
                }
              />

            </div>
          </div>

          {/* LIFESTYLE */}

          <div className="wif-subsection">

            <div className="wif-subsection-title">
              <span>
                LIFESTYLE
              </span>

              <small>
                Experiment with daily habits
              </small>
            </div>

            <div className="wif-input-grid">

              <ScenarioNumberField
                icon={
                  <Dumbbell size={15} />
                }
                label="Physical Activity"
                value={
                  scenario.physicalActivity
                }
                unit="min"
                min="0"
                onChange={(value) =>
                  handleScenarioChange(
                    "physicalActivity",
                    value
                  )
                }
              />

              <ScenarioNumberField
                icon={
                  <Moon size={15} />
                }
                label="Sleep"
                value={
                  scenario.sleepHours
                }
                unit="hrs"
                min="0"
                step="0.5"
                onChange={(value) =>
                  handleScenarioChange(
                    "sleepHours",
                    value
                  )
                }
              />

              <ScenarioNumberField
                icon={
                  <Droplets size={15} />
                }
                label="Water Intake"
                value={
                  scenario.waterIntake
                }
                unit="L"
                min="0"
                step="0.1"
                onChange={(value) =>
                  handleScenarioChange(
                    "waterIntake",
                    value
                  )
                }
              />

            </div>
          </div>

          {/* TOGGLES */}

          <div className="wif-options">

            <ScenarioToggle
              icon={
                <Cigarette size={18} />
              }
              title="Smoking"
              description={
                scenario.smoking
                  ? "Scenario includes smoking"
                  : "Scenario includes no smoking"
              }
              active={
                scenario.smoking
              }
              onClick={() =>
                handleScenarioChange(
                  "smoking",
                  !scenario.smoking
                )
              }
            />

            <ScenarioToggle
              icon={
                <Wine size={18} />
              }
              title="Alcohol"
              description={
                scenario.alcohol
                  ? "Scenario includes alcohol"
                  : "Scenario includes no alcohol"
              }
              active={
                scenario.alcohol
              }
              onClick={() =>
                handleScenarioChange(
                  "alcohol",
                  !scenario.alcohol
                )
              }
            />

          </div>

          {/* ACTIONS */}

          <div className="wif-actions">

            <button
              type="button"
              className="wif-reset"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              Reset to Today
            </button>

            <button
              type="button"
              className="wif-run"
              onClick={
                runSimulation
              }
            >
              <Play size={16} />
              Run Simulation
            </button>

          </div>

        </section>

        {/* ===================================================
            RESULT
        =================================================== */}

        <section className="wif-result-card">

          <div className="wif-result-header">

            <span>
              SCENARIO PREVIEW
            </span>

            <h2>
              Scenario comparison
            </h2>

          </div>

          {!result ? (
            <div className="wif-result-empty">

              <div className="wif-result-empty-icon">
                <Lightbulb size={25} />
              </div>

              <h3>
                Build your scenario
              </h3>

              <p>
                Change one or more factors
                on the left. LifePredict will
                compare your hypothetical
                inputs with today's latest
                saved health baseline.
              </p>

              <div className="wif-empty-tip">
                <Sparkles size={15} />

                <span>
                  Your actual health record
                  stays untouched.
                </span>
              </div>

            </div>
          ) : result.type ===
            "validation" ? (
            <div className="wif-validation-result">

              <AlertCircle size={24} />

              <h3>
                Check your scenario
              </h3>

              <p>
                {result.message}
              </p>

            </div>
          ) : (
            <div className="wif-result-content">

              {/* WHAT CHANGED */}

              <div className="wif-result-block">

                <div className="wif-result-block-header">

                  <div>
                    <span>
                      WHAT YOU CHANGED
                    </span>

                    <h3>
                      Current → Scenario
                    </h3>
                  </div>

                  <strong>
                    {result.changes.length}{" "}
                    {result.changes.length ===
                    1
                      ? "change"
                      : "changes"}
                  </strong>

                </div>

                {result.changes.length ===
                0 ? (
                  <div className="wif-no-change">

                    <CheckCircle2 size={18} />

                    <span>
                      Your scenario matches
                      today's health baseline.
                    </span>

                  </div>
                ) : (
                  <div className="wif-change-list">

                    {result.changes.map(
                      (
                        change,
                        index
                      ) => (
                        <div
                          className="wif-change-row"
                          key={`${change.label}-${index}`}
                        >

                          <div className="wif-change-label">
                            <span>
                              {change.label}
                            </span>
                          </div>

                          <div className="wif-change-value">

                            <small>
                              Current
                            </small>

                            <strong>
                              {change.current}
                            </strong>

                          </div>

                          <div className="wif-change-arrow">

                            {change.direction ===
                            "down" ? (
                              <TrendingDown
                                size={17}
                              />
                            ) : (
                              <TrendingUp
                                size={17}
                              />
                            )}

                          </div>

                          <div className="wif-change-value scenario">

                            <small>
                              Scenario
                            </small>

                            <strong>
                              {change.scenario}
                            </strong>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

              {/* SCENARIO TAKEAWAYS */}

              <div className="wif-takeaways-card">

                <div className="wif-takeaways-header">

                  <div className="wif-takeaways-icon">
                    <Sparkles size={18} />
                  </div>

                  <div>
                    <span>
                      SCENARIO TAKEAWAYS
                    </span>

                    <h3>
                      What changed in your inputs?
                    </h3>
                  </div>

                </div>

                <div className="wif-takeaways-list">

                  {result.takeaways.map(
                    (
                      takeaway,
                      index
                    ) => (
                      <div
                        className="wif-takeaway-item"
                        key={index}
                      >

                        <div className="wif-takeaway-icon">
                          {takeaway.icon}
                        </div>

                        <p>
                          {takeaway.text}
                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* SCENARIO DIRECTION */}

              <div
                className={`wif-direction-card ${result.summary.type}`}
              >

                <div className="wif-direction-icon">

                  {result.summary.type ===
                  "positive" ? (
                    <TrendingDown size={20} />
                  ) : result.summary.type ===
                    "negative" ? (
                    <TrendingUp size={20} />
                  ) : (
                    <Sparkles size={20} />
                  )}

                </div>

                <div>

                  <span>
                    SCENARIO SUMMARY
                  </span>

                  <h3>
                    {result.summary.title}
                  </h3>

                  <p>
                    {result.summary.text}
                  </p>

                </div>

              </div>

              {/* MODEL NOTE */}

              <div className="wif-model-note">

                <Lightbulb size={17} />

                <div>

                  <strong>
                    What this means
                  </strong>

                  <p>
                    This page currently
                    compares the inputs you
                    selected with today's
                    saved health profile.
                    It does not generate or
                    display a fake ML prediction.
                    Your actual ML-powered
                    scenario prediction can be
                    connected here later.
                  </p>

                </div>

              </div>

            </div>
          )}

        </section>

      </div>

      {/* =====================================================
          WHY WHAT-IF
      ====================================================== */}

      <section className="wif-insight-card">

        <div className="wif-insight-icon">
          <Sparkles size={21} />
        </div>

        <div>

          <span>
            WHY USE WHAT-IF?
          </span>

          <h2>
            Don't just see your numbers.
            Experiment with what could
            change them.
          </h2>

          <p>
            Your Health Data page tells
            LifePredict what is happening
            today. What-if Simulation lets
            you ask a different question:
            <strong>
              {" "}
              "What might happen if I changed
              this?"
            </strong>{" "}
            You can test a hypothetical
            lifestyle state without changing
            the actual health record saved
            for today.
          </p>

        </div>

      </section>

      {/* =====================================================
          DISCLAIMER
      ====================================================== */}

      <div className="wif-disclaimer">

        <AlertCircle size={16} />

        <p>
          What-if Simulation is designed
          for lifestyle exploration.
          Scenario previews are input
          comparisons, not medical
          diagnoses or medical predictions,
          and should not replace advice
          from a qualified healthcare
          professional.
        </p>

      </div>

    </div>
  );
}

// =============================================================
// REUSABLE NUMBER FIELD
// =============================================================

function ScenarioNumberField({
  icon,
  label,
  value,
  unit,
  min,
  step = "1",
  onChange,
}) {
  return (
    <div className="wif-field">

      <label>
        {icon}
        {label}
      </label>

      <div className="wif-input-unit">

        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="Enter value"
        />

        <span>
          {unit}
        </span>

      </div>

    </div>
  );
}

// =============================================================
// REUSABLE TOGGLE
// =============================================================

function ScenarioToggle({
  icon,
  title,
  description,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`wif-option ${
        active
          ? "is-active"
          : ""
      }`}
      onClick={onClick}
    >

      <div className="wif-option-icon">
        {icon}
      </div>

      <div className="wif-option-content">

        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>

      </div>

      <div className="wif-option-status">
        {active
          ? "ON"
          : "OFF"}
      </div>

    </button>
  );
}

export default WhatIfSimulation;