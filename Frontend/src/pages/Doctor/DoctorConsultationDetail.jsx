import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Video,
  Stethoscope,
  HeartPulse,
  Activity,
  FileText,
  ArrowUpRight,
  UserRound,
} from "lucide-react";

import "./DoctorConsultationDetail.css";

// =========================================================
// DEMO CONSULTATION DATA
// =========================================================

const consultationData = {
  P001: {
    patientId: "P001",
    initials: "PA",
    name: "Patient A",
    age: 48,
    gender: "Female",

    date: "Today",
    time: "10:30 AM",

    mode: "Video",
    status: "Upcoming",

    type: "Follow-up consultation",
    reason: "Blood pressure review",

    focus:
      "Review the recent increase in blood pressure and assess whether the change requires further follow-up.",

    previousAssessment: "132/86",
    latestAssessment: "148/96",

    risk:
      "Blood pressure has remained elevated across recent readings.",

    activity: "6.2k steps/day",
    sleep: "6.8 hrs/night",

    notes:
      "Recent health data shows an upward blood pressure trend. Review longitudinal readings before deciding on the next intervention.",
  },

  P002: {
    patientId: "P002",
    initials: "PB",
    name: "Patient B",
    age: 56,
    gender: "Male",

    date: "Today",
    time: "12:00 PM",

    mode: "In-person",
    status: "Upcoming",

    type: "Risk assessment review",
    reason: "Cardiovascular risk change",

    focus:
      "Review the change in cardiovascular risk and identify the factors contributing to the updated prediction.",

    previousAssessment: "21%",
    latestAssessment: "34%",

    risk:
      "Estimated cardiovascular risk increased compared with the previous assessment.",

    activity: "5.8k steps/day",
    sleep: "6.2 hrs/night",

    notes:
      "The latest prediction indicates a meaningful increase in estimated cardiovascular risk. Review recent health and lifestyle changes.",
  },

  P003: {
    patientId: "P003",
    initials: "PC",
    name: "Patient C",
    age: 42,
    gender: "Female",

    date: "Today",
    time: "04:30 PM",

    mode: "Video",
    status: "Upcoming",

    type: "Scheduled consultation",
    reason: "Lifestyle follow-up",

    focus:
      "Review recent lifestyle changes and discuss the reduction in physical activity.",

    previousAssessment: "6.2k/day",
    latestAssessment: "5.1k/day",

    risk:
      "Recent activity levels have decreased and recommended follow-up is pending.",

    activity: "5.1k steps/day",
    sleep: "7.1 hrs/night",

    notes:
      "Recent activity data indicates a downward trend. Review lifestyle patterns and determine whether additional support is required.",
  },

  P004: {
    patientId: "P004",
    initials: "PD",
    name: "Patient D",
    age: 51,
    gender: "Male",

    date: "Yesterday",
    time: "09:30 AM",

    mode: "In-person",
    status: "Completed",

    type: "Routine follow-up",
    reason: "Health assessment review",

    focus:
      "Review the latest health assessment and confirm that current indicators remain stable.",

    previousAssessment: "Stable",
    latestAssessment: "Stable",

    risk:
      "Recent assessment shows no major change requiring immediate review.",

    activity: "7.1k steps/day",
    sleep: "7.3 hrs/night",

    notes:
      "Current indicators remain stable. Continue routine monitoring and follow-up as appropriate.",
  },

  P005: {
    patientId: "P005",
    initials: "PE",
    name: "Patient E",
    age: 45,
    gender: "Female",

    date: "Yesterday",
    time: "02:00 PM",

    mode: "Video",
    status: "Completed",

    type: "Health review",
    reason: "Recent health data review",

    focus:
      "Review recently submitted health information and confirm that current risk indicators remain stable.",

    previousAssessment: "Stable",
    latestAssessment: "Stable",

    risk:
      "New health data was reviewed and current risk indicators remain stable.",

    activity: "6.7k steps/day",
    sleep: "7.0 hrs/night",

    notes:
      "Latest assessment completed without a major change in current indicators.",
  },

  P006: {
    patientId: "P006",
    initials: "PF",
    name: "Patient F",
    age: 59,
    gender: "Male",

    date: "28 Sep",
    time: "11:00 AM",

    mode: "Video",
    status: "Cancelled",

    type: "Follow-up consultation",
    reason: "Physical activity trend",

    focus:
      "Review the recent reduction in physical activity and determine whether another consultation should be scheduled.",

    previousAssessment: "6.4k/day",
    latestAssessment: "5.6k/day",

    risk:
      "Lifestyle data suggests a recent reduction in physical activity.",

    activity: "5.6k steps/day",
    sleep: "6.5 hrs/night",

    notes:
      "This consultation was cancelled. The latest lifestyle trend can be reviewed when a new consultation is scheduled.",
  },
};

// =========================================================
// COMPONENT
// =========================================================

function DoctorConsultationDetail() {
  const navigate = useNavigate();
  const { consultationId } = useParams();

  const consultation =
    consultationData[consultationId] || consultationData.P001;

  const isUpcoming = consultation.status === "Upcoming";
  const isCompleted = consultation.status === "Completed";
  const isCancelled = consultation.status === "Cancelled";

  return (
    <main className="doctor-consultation-detail">

      {/* =================================================
          TOP HEADER
      ================================================= */}

      <section className="consultation-detail-header">

        <button
          className="consultation-back-button"
          onClick={() => navigate("/doctor/consultations")}
        >
          <ArrowLeft size={18} />
          Back to consultations
        </button>

        <div className="consultation-heading-row">

          <div>
            <span className="consultation-eyebrow">
              CONSULTATION
            </span>

            <h1>{consultation.type}</h1>

            <p>
              Review the appointment context and patient's latest
              health information before continuing care.
            </p>
          </div>

          <div
            className={`consultation-status consultation-status-${consultation.status
              .toLowerCase()
              .replace(" ", "-")}`}
          >
            {consultation.status}
          </div>

        </div>

      </section>


      {/* =================================================
          PATIENT + APPOINTMENT
      ================================================= */}

      <section className="consultation-patient-bar">

        <div className="consultation-patient-main">

          <div className="consultation-avatar">
            {consultation.initials}
          </div>

          <div>
            <span className="small-label">
              PATIENT
            </span>

            <h2>{consultation.name}</h2>

            <p>
              {consultation.patientId} · {consultation.age} years ·{" "}
              {consultation.gender}
            </p>
          </div>

        </div>


        <div className="consultation-meta-group">

          <div className="consultation-meta">
            <CalendarDays size={18} />

            <div>
              <span className="small-label">
                DATE
              </span>

              <strong>
                {consultation.date}
              </strong>
            </div>
          </div>


          <div className="consultation-meta">
            <Clock3 size={18} />

            <div>
              <span className="small-label">
                TIME
              </span>

              <strong>
                {consultation.time}
              </strong>
            </div>
          </div>


          <div className="consultation-meta">

            {consultation.mode === "Video" ? (
              <Video size={18} />
            ) : (
              <Stethoscope size={18} />
            )}

            <div>
              <span className="small-label">
                MODE
              </span>

              <strong>
                {consultation.mode}
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="consultation-content-grid">

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="consultation-main-column">

          {/* Consultation Focus */}

          <section className="consultation-section">

            <div className="section-heading">

              <div>

                <span className="consultation-eyebrow">
                  CONSULTATION FOCUS
                </span>

                <h2>
                  {consultation.reason}
                </h2>

              </div>

              <HeartPulse size={22} />

            </div>

            <p className="consultation-focus-text">
              {consultation.focus}
            </p>

          </section>


          {/* Latest Clinical Change */}

          <section className="consultation-section">

            <div className="section-heading">

              <div>

                <span className="consultation-eyebrow">
                  LATEST CLINICAL CHANGE
                </span>

                <h2>
                  Assessment comparison
                </h2>

              </div>

              <Activity size={22} />

            </div>


            <div className="assessment-comparison">

              <div className="assessment-value">

                <span>
                  Previous
                </span>

                <strong>
                  {consultation.previousAssessment}
                </strong>

              </div>


              <ArrowUpRight
                className="assessment-arrow"
                size={22}
              />


              <div className="assessment-value">

                <span>
                  Latest
                </span>

                <strong>
                  {consultation.latestAssessment}
                </strong>

              </div>

            </div>


            <div className="clinical-note">

              <strong>
                Clinical briefing
              </strong>

              <p>
                {consultation.risk}
              </p>

            </div>

          </section>


          {/* Consultation Notes */}

          <section className="consultation-section">

            <div className="section-heading">

              <div>

                <span className="consultation-eyebrow">
                  CARE CONTEXT
                </span>

                <h2>
                  Review notes
                </h2>

              </div>

              <FileText size={22} />

            </div>

            <p className="consultation-notes">
              {consultation.notes}
            </p>

          </section>

        </div>


        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <aside className="consultation-side-column">

          {/* Patient Snapshot */}

          <section className="consultation-side-section">

            <span className="consultation-eyebrow">
              PATIENT SNAPSHOT
            </span>

            <h2>
              Current lifestyle
            </h2>


            <div className="snapshot-list">

              <div>
                <span>
                  Physical activity
                </span>

                <strong>
                  {consultation.activity}
                </strong>
              </div>


              <div>
                <span>
                  Sleep
                </span>

                <strong>
                  {consultation.sleep}
                </strong>
              </div>

            </div>

          </section>


          {/* Consultation Actions */}

          <section className="consultation-side-section">

            <span className="consultation-eyebrow">
              CONSULTATION ACTIONS
            </span>

            <h2>
              Next step
            </h2>


            <div className="consultation-actions">

              {isUpcoming && (
                <button
                  className="primary-consultation-action"
                  onClick={() => {
                    alert(
                      "Consultation session will be connected here."
                    );
                  }}
                >
                  {consultation.mode === "Video"
                    ? "Start video consultation"
                    : "Open consultation"}
                </button>
              )}


              {isCompleted && (
                <button
                  className="secondary-consultation-action"
                  onClick={() => {
                    alert(
                      "Follow-up workflow will be connected here."
                    );
                  }}
                >
                  Add follow-up note
                </button>
              )}


              {isCancelled && (
                <button
                  className="secondary-consultation-action"
                  onClick={() => {
                    alert(
                      "Reschedule workflow will be connected here."
                    );
                  }}
                >
                  Reschedule consultation
                </button>
              )}


              <button
                className="secondary-consultation-action"
                onClick={() => {
                  navigate("/doctor/patients");
                }}
              >
                <UserRound size={17} />
                View patient profile
              </button>

            </div>

          </section>

        </aside>

      </section>


      {/* =================================================
          FOOTER NOTE
      ================================================= */}

      <div className="consultation-page-note">

        <HeartPulse size={18} />

        <span>
          Review consultation information together with the
          patient's longitudinal health data before making
          clinical decisions.
        </span>

      </div>

    </main>
  );
}

export default DoctorConsultationDetail;