import { useEffect, useMemo, useState } from "react";
import {
  History,
  HeartPulse,
  Activity,
  Scale,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Info,
} from "lucide-react";

import "./PatientPredictionHistory.css";

function PatientPredictionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("daily");

  // ---------------------------------------------------------
  // FETCH HISTORY
  // ---------------------------------------------------------

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await fetch(
        "https://lifepredict-production.up.railway.app/api/predictions/history",
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
        throw new Error(
          data.message || "Unable to fetch prediction history."
        );
      }

      setHistory(data.history || []);
    } catch (err) {
      console.error("Prediction history error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ---------------------------------------------------------
  // DATE HELPERS
  // ---------------------------------------------------------

  const getDateKey = (date) => {
    if (!date) return null;

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return null;

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatShortDate = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPeriodDate = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ---------------------------------------------------------
  // NUMBER HELPERS
  // ---------------------------------------------------------

  const safeNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  };

  const average = (values) => {
    const validValues = values.filter(
      (value) => value !== null && Number.isFinite(value)
    );

    if (!validValues.length) return null;

    return (
      validValues.reduce((sum, value) => sum + value, 0) /
      validValues.length
    );
  };

  // ---------------------------------------------------------
  // SORT RAW HISTORY
  // ---------------------------------------------------------

  const sortedHistory = useMemo(() => {
    return [...history]
      .filter((item) => item && item.created_at)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
  }, [history]);

  // ---------------------------------------------------------
  // DAILY SNAPSHOTS
  //
  // Multiple predictions on the same day:
  // keep latest prediction only.
  // ---------------------------------------------------------

  const dailySnapshots = useMemo(() => {
    const grouped = {};

    sortedHistory.forEach((item) => {
      const dateKey = getDateKey(item.created_at);

      if (!dateKey) return;

      grouped[dateKey] = item;
    });

    return Object.values(grouped).sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
  }, [sortedHistory]);

  // ---------------------------------------------------------
  // CREATE HEALTH SNAPSHOT
  // ---------------------------------------------------------

  const createHealthSnapshot = (item) => {
    if (!item) return null;

    const cardioRaw = safeNumber(item.probability_cardio);

    const cardioProbability =
      cardioRaw !== null ? cardioRaw * 100 : null;

    const noCardioRaw = safeNumber(
      item.probability_no_cardio
    );

    const noCardioProbability =
      noCardioRaw !== null
        ? noCardioRaw * 100
        : cardioProbability !== null
        ? 100 - cardioProbability
        : null;

    const systolic = safeNumber(item.systolic_bp);
    const diastolic = safeNumber(item.diastolic_bp);
    const weight = safeNumber(item.weight_kg);
    const bmi = safeNumber(item.bmi);
    const age = safeNumber(item.age_years);

    return {
      id: item.id,

      date: new Date(item.created_at),

      dateKey: getDateKey(item.created_at),

      raw: item,

      cardioProbability,

      noCardioProbability,

      weight,

      systolic,

      diastolic,

      bmi,

      age,

      prediction: Number(item.prediction) === 1,
    };
  };

  const dailyHealthSnapshots = useMemo(() => {
    return dailySnapshots
      .map(createHealthSnapshot)
      .filter(Boolean);
  }, [dailySnapshots]);

  // ---------------------------------------------------------
  // WEEKLY GROUPING
  // ---------------------------------------------------------

  const weeklyData = useMemo(() => {
    if (!dailyHealthSnapshots.length) return [];

    const ascending = [...dailyHealthSnapshots].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const firstDate = new Date(ascending[0].date);

    firstDate.setHours(0, 0, 0, 0);

    const groups = {};

    ascending.forEach((snapshot) => {
      const currentDate = new Date(snapshot.date);

      currentDate.setHours(0, 0, 0, 0);

      const difference =
        currentDate.getTime() - firstDate.getTime();

      const dayIndex = Math.floor(
        difference / (1000 * 60 * 60 * 24)
      );

      const weekNumber =
        Math.floor(dayIndex / 7) + 1;

      if (!groups[weekNumber]) {
        groups[weekNumber] = [];
      }

      groups[weekNumber].push(snapshot);
    });

    return Object.entries(groups)
      .map(([weekNumber, snapshots]) => {
        const sorted = [...snapshots].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );

        return {
          id: `week-${weekNumber}`,

          label: `Week ${weekNumber}`,

          startDate: sorted[0].date,

          endDate: sorted[sorted.length - 1].date,

          daysTracked: sorted.length,

          cardioProbability: average(
            sorted.map(
              (item) => item.cardioProbability
            )
          ),

          noCardioProbability: average(
            sorted.map(
              (item) => item.noCardioProbability
            )
          ),

          weight: average(
            sorted.map((item) => item.weight)
          ),

          systolic: average(
            sorted.map((item) => item.systolic)
          ),

          diastolic: average(
            sorted.map((item) => item.diastolic)
          ),

          bmi: average(
            sorted.map((item) => item.bmi)
          ),

          latestSnapshot:
            sorted[sorted.length - 1],
        };
      })
      .sort(
        (a, b) =>
          b.startDate.getTime() -
          a.startDate.getTime()
      );
  }, [dailyHealthSnapshots]);

  // ---------------------------------------------------------
  // MONTHLY GROUPING
  // ---------------------------------------------------------

  const monthlyData = useMemo(() => {
    if (!dailyHealthSnapshots.length) return [];

    const groups = {};

    dailyHealthSnapshots.forEach((snapshot) => {
      const date = snapshot.date;

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }

      groups[monthKey].push(snapshot);
    });

    return Object.entries(groups)
      .map(([monthKey, snapshots]) => {
        const sorted = [...snapshots].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );

        const firstDate = sorted[0].date;

        const monthLabel =
          firstDate.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          });

        return {
          id: `month-${monthKey}`,

          label: monthLabel,

          startDate: sorted[0].date,

          endDate: sorted[sorted.length - 1].date,

          daysTracked: sorted.length,

          cardioProbability: average(
            sorted.map(
              (item) => item.cardioProbability
            )
          ),

          noCardioProbability: average(
            sorted.map(
              (item) => item.noCardioProbability
            )
          ),

          weight: average(
            sorted.map((item) => item.weight)
          ),

          systolic: average(
            sorted.map((item) => item.systolic)
          ),

          diastolic: average(
            sorted.map((item) => item.diastolic)
          ),

          bmi: average(
            sorted.map((item) => item.bmi)
          ),

          latestSnapshot:
            sorted[sorted.length - 1],
        };
      })
      .sort(
        (a, b) =>
          b.startDate.getTime() -
          a.startDate.getTime()
      );
  }, [dailyHealthSnapshots]);

  // ---------------------------------------------------------
  // CURRENT DISPLAY DATA
  // ---------------------------------------------------------

  const displayData = useMemo(() => {
    if (viewMode === "weekly") {
      return weeklyData;
    }

    if (viewMode === "monthly") {
      return monthlyData;
    }

    return dailyHealthSnapshots;
  }, [
    viewMode,
    dailyHealthSnapshots,
    weeklyData,
    monthlyData,
  ]);

  // ---------------------------------------------------------
  // GET PREVIOUS PERIOD
  // ---------------------------------------------------------

  const getPreviousPeriod = (index) => {
    if (index >= displayData.length - 1) {
      return null;
    }

    return displayData[index + 1];
  };

  // ---------------------------------------------------------
  // GET METRIC VALUE
  // ---------------------------------------------------------

  const getMetricValue = (item, metric) => {
    if (!item) return null;

    if (metric === "cardio") {
      return item.cardioProbability;
    }

    if (metric === "weight") {
      return item.weight;
    }

    if (metric === "systolic") {
      return item.systolic;
    }

    if (metric === "diastolic") {
      return item.diastolic;
    }

    if (metric === "bmi") {
      return item.bmi;
    }

    return null;
  };

  // ---------------------------------------------------------
  // FORMAT COMPARISON VALUE
  // ---------------------------------------------------------

  const formatComparisonValue = (
    value,
    metric,
    unit = ""
  ) => {
    if (value === null || value === undefined) {
      return "--";
    }

    if (metric === "cardio") {
      return `${value.toFixed(1)}%`;
    }

    if (metric === "weight") {
      return `${value.toFixed(1)} kg`;
    }

    if (metric === "bmi") {
      return value.toFixed(1);
    }

    if (
      metric === "systolic" ||
      metric === "diastolic"
    ) {
      return `${Math.round(value)} mmHg`;
    }

    return `${value.toFixed(1)}${unit}`;
  };

  // ---------------------------------------------------------
  // COMPARE TWO PERIODS
  //
  // IMPORTANT:
  // We now store:
  // - previousValue
  // - currentValue
  // - difference
  // - display text
  //
  // This allows the UI to clearly show:
  // Previous → Current
  // and
  // Change
  // ---------------------------------------------------------

  const compareMetric = (
    current,
    previous,
    metric,
    label,
    unit = ""
  ) => {
    const currentValue = getMetricValue(
      current,
      metric
    );

    const previousValue = getMetricValue(
      previous,
      metric
    );

    if (
      currentValue === null ||
      previousValue === null
    ) {
      return null;
    }

    const difference =
      currentValue - previousValue;

    const isSame =
      Math.abs(difference) < 0.01;

    let status = "same";

    if (!isSame) {
      /*
       * Lower cardiovascular probability,
       * weight, BMI and BP are treated as
       * a positive direction.
       */
      status =
        difference < 0
          ? "improved"
          : "increased";
    }

    let changeText = "No meaningful change";

    if (!isSame) {
      const absoluteDifference =
        Math.abs(difference);

      if (metric === "cardio") {
        changeText =
          difference < 0
            ? `↓ ${absoluteDifference.toFixed(
                1
              )} percentage points`
            : `↑ ${absoluteDifference.toFixed(
                1
              )} percentage points`;
      } else {
        changeText =
          difference < 0
            ? `↓ ${absoluteDifference.toFixed(
                1
              )}${unit}`
            : `↑ ${absoluteDifference.toFixed(
                1
              )}${unit}`;
      }
    }

    return {
      label,

      metric,

      status,

      previousValue,

      currentValue,

      difference,

      previousDisplay:
        formatComparisonValue(
          previousValue,
          metric,
          unit
        ),

      currentDisplay:
        formatComparisonValue(
          currentValue,
          metric,
          unit
        ),

      changeText,
    };
  };

  // ---------------------------------------------------------
  // HEALTH COMPARISON
  // ---------------------------------------------------------

  const getComparison = (
    current,
    previous
  ) => {
    if (!current || !previous) {
      return {
        available: false,
        changes: [],
        overall: "first",
      };
    }

    const cardio = compareMetric(
      current,
      previous,
      "cardio",
      "Cardiovascular probability",
      "%"
    );

    const weight = compareMetric(
      current,
      previous,
      "weight",
      "Weight",
      " kg"
    );

    const bmi = compareMetric(
      current,
      previous,
      "bmi",
      "BMI",
      ""
    );

    const systolic = compareMetric(
      current,
      previous,
      "systolic",
      "Systolic BP",
      " mmHg"
    );

    const diastolic = compareMetric(
      current,
      previous,
      "diastolic",
      "Diastolic BP",
      " mmHg"
    );

    const changes = [
      cardio,
      weight,
      bmi,
      systolic,
      diastolic,
    ].filter(Boolean);

    let improvementScore = 0;

    changes.forEach((change) => {
      if (change.status === "improved") {
        improvementScore += 1;
      }

      if (change.status === "increased") {
        improvementScore -= 1;
      }
    });

    let overall = "same";

    if (improvementScore > 0) {
      overall = "improved";
    } else if (improvementScore < 0) {
      overall = "declined";
    }

    return {
      available: true,
      changes,
      overall,
    };
  };

  // ---------------------------------------------------------
  // PERIOD LABEL
  // ---------------------------------------------------------

  const getPeriodTitle = (item) => {
    if (viewMode === "daily") {
      return formatShortDate(item.date);
    }

    return item.label;
  };

  const getPeriodSubtitle = (item) => {
    if (viewMode === "daily") {
      return `Latest health snapshot for ${formatShortDate(
        item.date
      )}`;
    }

    return `${formatPeriodDate(
      item.startDate
    )} – ${formatPeriodDate(item.endDate)}`;
  };

  // ---------------------------------------------------------
  // RENDER LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="prediction-history-page">
        <div className="prediction-history-header">
          <div>
            <span className="page-eyebrow">
              YOUR HEALTH JOURNEY
            </span>

            <h1>Prediction History</h1>

            <p>
              Loading your health progress...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER ERROR
  // ---------------------------------------------------------

  if (error) {
    return (
      <div className="prediction-history-page">
        <div className="prediction-history-header">
          <div>
            <span className="page-eyebrow">
              YOUR HEALTH JOURNEY
            </span>

            <h1>Prediction History</h1>

            <p>{error}</p>
          </div>

          <button
            className="history-refresh-button"
            onClick={fetchHistory}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER PAGE
  // ---------------------------------------------------------

  return (
    <div className="prediction-history-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="prediction-history-header">
        <div>
          <span className="page-eyebrow">
            YOUR HEALTH JOURNEY
          </span>

          <h1>Health Progress</h1>

          <p>
            See how your health indicators are changing
            over time and understand what improved or
            changed.
          </p>
        </div>

        <button
          className="history-refresh-button"
          onClick={fetchHistory}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* =====================================================
          VIEW FILTER
      ====================================================== */}

      {history.length > 0 && (
        <div className="history-view-section">

          <div className="history-view-heading">

            <div>
              <span className="history-section-eyebrow">
                PROGRESS VIEW
              </span>

              <h2>
                Track your health over time
              </h2>

              <p>
                Daily comparison is your default view.
                Switch to weekly or monthly summaries
                when you want to see longer-term progress.
              </p>
            </div>

            <div className="history-filter">

              <button
                className={
                  viewMode === "daily"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setViewMode("daily")
                }
              >
                Daily
              </button>

              <button
                className={
                  viewMode === "weekly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setViewMode("weekly")
                }
              >
                Weekly
              </button>

              <button
                className={
                  viewMode === "monthly"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setViewMode("monthly")
                }
              >
                Monthly
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {history.length === 0 ? (
        <div className="history-empty-state">

          <div className="history-empty-icon">
            <History size={30} />
          </div>

          <h2>No predictions yet</h2>

          <p>
            Your health progress will appear here after
            you generate your first health prediction.
          </p>

        </div>
      ) : displayData.length === 0 ? (
        <div className="history-empty-state">

          <div className="history-empty-icon">
            <BarChart3 size={30} />
          </div>

          <h2>Not enough data yet</h2>

          <p>
            Keep using LifePredict and your progress
            will appear here.
          </p>

        </div>
      ) : (
        <>

          {/* =================================================
              DATA SUMMARY
          ================================================== */}

          <div className="history-summary-strip">

            <div className="history-summary-item">
              <span>Days tracked</span>

              <strong>
                {dailyHealthSnapshots.length}
              </strong>
            </div>

            <div className="history-summary-item">
              <span>Current view</span>

              <strong>
                {viewMode === "daily"
                  ? "Daily"
                  : viewMode === "weekly"
                  ? "Weekly"
                  : "Monthly"}
              </strong>
            </div>

            <div className="history-summary-item">
              <span>Predictions recorded</span>

              <strong>
                {history.length}
              </strong>
            </div>

            <div className="history-summary-item">
              <span>Unique health snapshots</span>

              <strong>
                {dailyHealthSnapshots.length}
              </strong>
            </div>

          </div>

          {/* =================================================
              DAILY CONSOLIDATION INFO
          ================================================== */}

          {viewMode === "daily" &&
            history.length >
              dailyHealthSnapshots.length && (
              <div className="history-info-banner">

                <Info size={18} />

                <div>
                  <strong>
                    Your daily view has been simplified.
                  </strong>

                  <p>
                    You have generated multiple predictions
                    on some days. Instead of showing repeated
                    entries, LifePredict uses the latest
                    prediction from each day for your daily
                    progress.
                  </p>
                </div>

              </div>
            )}

          {/* =================================================
              WEEKLY INFO
          ================================================== */}

          {viewMode === "weekly" && (
            <div className="history-info-banner">

              <BarChart3 size={18} />

              <div>
                <strong>
                  Weekly progress
                </strong>

                <p>
                  Each week combines the health snapshots
                  recorded during that 7-day period.
                  Week 2 can then be compared directly
                  with Week 1, Week 3 with Week 2, and so on.
                </p>
              </div>

            </div>
          )}

          {/* =================================================
              MONTHLY INFO
          ================================================== */}

          {viewMode === "monthly" && (
            <div className="history-info-banner">

              <BarChart3 size={18} />

              <div>
                <strong>
                  Monthly progress
                </strong>

                <p>
                  Each month combines your recorded daily
                  snapshots so you can see how your current
                  month compares with the previous month.
                </p>
              </div>

            </div>
          )}

          {/* =================================================
              HISTORY / PROGRESS CARDS
          ================================================== */}

          <div className="prediction-history-list">

            {displayData.map((item, index) => {

              const previousPeriod =
                getPreviousPeriod(index);

              const comparison =
                getComparison(
                  item,
                  previousPeriod
                );

              const cardioProbability =
                item.cardioProbability;

              const noCardioProbability =
                item.noCardioProbability;

              const prediction =
                viewMode === "daily"
                  ? item.prediction
                  : item.latestSnapshot?.prediction;

              return (
                <div
                  className="prediction-history-card progress-card"
                  key={item.id || index}
                >

                  {/* =========================================
                      CARD HEADER
                  ========================================== */}

                  <div className="history-card-top">

                    <div className="history-date">

                      <CalendarDays size={17} />

                      <div>

                        <strong>
                          {getPeriodTitle(item)}
                        </strong>

                        <span>
                          {getPeriodSubtitle(item)}
                        </span>

                      </div>

                    </div>

                    <div
                      className={
                        prediction
                          ? "history-result positive"
                          : "history-result negative"
                      }
                    >
                      <HeartPulse size={16} />

                      <span>
                        {prediction
                          ? "Model prediction: positive"
                          : "Model prediction: negative"}
                      </span>
                    </div>

                  </div>

                  {/* =========================================
                      WEEKLY / MONTHLY TRACKING
                  ========================================== */}

                  {viewMode !== "daily" && (
                    <div className="period-tracking-line">

                      <Activity size={15} />

                      <span>
                        {item.daysTracked}{" "}
                        {item.daysTracked === 1
                          ? "day"
                          : "days"}{" "}
                        tracked in this period
                      </span>

                    </div>
                  )}

                  {/* =========================================
                      MAIN PROBABILITY
                  ========================================== */}

                  <div className="history-probability">

                    <span>
                      {viewMode === "daily"
                        ? "Model-estimated cardiovascular probability"
                        : "Average cardiovascular probability"}
                    </span>

                    <strong>
                      {cardioProbability !== null
                        ? `${cardioProbability.toFixed(
                            1
                          )}%`
                        : "--"}
                    </strong>

                  </div>

                  <div className="history-bar">

                    <div
                      style={{
                        width: `${Math.min(
                          Math.max(
                            cardioProbability || 0,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  {/* =========================================
                      HEALTH METRICS
                  ========================================== */}

                  <div className="history-snapshot">

                    <div>
                      <Scale size={17} />

                      <span>
                        {viewMode === "daily"
                          ? "Weight"
                          : "Avg. Weight"}
                      </span>

                      <strong>
                        {item.weight !== null
                          ? `${item.weight.toFixed(
                              1
                            )} kg`
                          : "--"}
                      </strong>
                    </div>

                    <div>
                      <Activity size={17} />

                      <span>
                        {viewMode === "daily"
                          ? "Blood Pressure"
                          : "Avg. Blood Pressure"}
                      </span>

                      <strong>
                        {item.systolic !== null &&
                        item.diastolic !== null
                          ? `${Math.round(
                              item.systolic
                            )}/${Math.round(
                              item.diastolic
                            )}`
                          : "--"}
                      </strong>
                    </div>

                    <div>
                      <HeartPulse size={17} />

                      <span>
                        {viewMode === "daily"
                          ? "BMI"
                          : "Avg. BMI"}
                      </span>

                      <strong>
                        {item.bmi !== null
                          ? item.bmi.toFixed(1)
                          : "--"}
                      </strong>
                    </div>

                    <div>

                      <span>
                        {viewMode === "daily"
                          ? "Age"
                          : "Days tracked"}
                      </span>

                      <strong>
                        {viewMode === "daily"
                          ? item.age != null
                            ? `${Math.round(
                                item.age
                              )} years`
                            : "--"
                          : item.daysTracked}
                      </strong>

                    </div>

                  </div>

                  {/* =========================================
                      PROBABILITY BREAKDOWN
                  ========================================== */}

                  <div className="history-probability-breakdown">

                    <span>
                      No cardiovascular disease
                    </span>

                    <strong>
                      {noCardioProbability !== null
                        ? `${noCardioProbability.toFixed(
                            1
                          )}%`
                        : "--"}
                    </strong>

                    <span>
                      Cardiovascular disease
                    </span>

                    <strong>
                      {cardioProbability !== null
                        ? `${cardioProbability.toFixed(
                            1
                          )}%`
                        : "--"}
                    </strong>

                  </div>

                  {/* =========================================
                      WHAT CHANGED
                  ========================================== */}

                  {comparison.available && (
                    <div className="health-comparison">

                      <div className="comparison-header">

                        <div>
                          <span className="comparison-eyebrow">
                            {viewMode === "daily"
                              ? "DAY-TO-DAY CHANGE"
                              : viewMode === "weekly"
                              ? "WEEK-TO-WEEK CHANGE"
                              : "MONTH-TO-MONTH CHANGE"}
                          </span>

                          <h3>
                            What changed?
                          </h3>

                          <p className="comparison-subtitle">
                            Previous period compared with
                            the current period.
                          </p>
                        </div>

                        <div
                          className={`comparison-status ${comparison.overall}`}
                        >
                          {comparison.overall ===
                            "improved" && (
                            <>
                              <TrendingDown size={16} />
                              Improving
                            </>
                          )}

                          {comparison.overall ===
                            "declined" && (
                            <>
                              <TrendingUp size={16} />
                              Needs attention
                            </>
                          )}

                          {comparison.overall ===
                            "same" && (
                            <>
                              <Minus size={16} />
                              Stable
                            </>
                          )}
                        </div>

                      </div>

                      {/* =====================================
                          COMPARISON CARDS
                      ====================================== */}

                      <div className="comparison-grid">

                        {comparison.changes.map(
                          (change, changeIndex) => (
                            <div
                              className={`comparison-item ${change.status}`}
                              key={`${change.label}-${changeIndex}`}
                            >

                              <div className="comparison-item-top">

                                <div className="comparison-item-icon">

                                  {change.status ===
                                    "improved" && (
                                    <TrendingDown
                                      size={15}
                                    />
                                  )}

                                  {change.status ===
                                    "increased" && (
                                    <TrendingUp
                                      size={15}
                                    />
                                  )}

                                  {change.status ===
                                    "same" && (
                                    <Minus
                                      size={15}
                                    />
                                  )}

                                </div>

                                <span>
                                  {change.label}
                                </span>

                              </div>

                              {/* PREVIOUS → CURRENT */}

                              <div className="comparison-values">

                                <div>
                                  <small>
                                    Previous
                                  </small>

                                  <strong>
                                    {change.previousDisplay}
                                  </strong>
                                </div>

                                <ArrowRight
                                  size={15}
                                  className="comparison-arrow"
                                />

                                <div>
                                  <small>
                                    Current
                                  </small>

                                  <strong>
                                    {change.currentDisplay}
                                  </strong>
                                </div>

                              </div>

                              {/* CHANGE */}

                              <div
                                className={`comparison-change ${change.status}`}
                              >
                                {change.changeText}
                              </div>

                            </div>
                          )
                        )}

                      </div>

                      {/* =====================================
                          PERIOD REFERENCE
                      ====================================== */}

                      <div className="comparison-reference">

                        <span>
                          Compared with
                        </span>

                        <strong>
                          {viewMode === "daily"
                            ? formatShortDate(
                                previousPeriod.date
                              )
                            : previousPeriod.label}
                        </strong>

                        <ArrowRight size={15} />

                        <span>
                          Current
                        </span>

                        <strong>
                          {getPeriodTitle(item)}
                        </strong>

                      </div>

                    </div>
                  )}

                  {/* =========================================
                      FIRST PERIOD MESSAGE
                  ========================================== */}

                  {!comparison.available && (
                    <div className="first-period-message">

                      <div>
                        <CheckCircle2 size={18} />
                      </div>

                      <div>

                        <strong>
                          First recorded{" "}
                          {viewMode === "daily"
                            ? "day"
                            : viewMode === "weekly"
                            ? "week"
                            : "month"}
                        </strong>

                        <p>
                          This is your baseline. Once you
                          have another{" "}
                          {viewMode === "daily"
                            ? "day"
                            : viewMode === "weekly"
                            ? "week"
                            : "month"}{" "}
                          of data, LifePredict will show
                          how your health indicators changed
                          compared with this period.
                        </p>

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        </>
      )}
    </div>
  );
}

export default PatientPredictionHistory;