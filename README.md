# LifePredict

**An AI-powered healthcare predictive analytics platform** that combines patient health data, lifestyle factors, and machine learning to generate health-risk predictions and personalized insights, built as a full-stack, multi-service web application.

> **Disclaimer:** LifePredict is a portfolio and learning project. It is **not** a clinically validated medical diagnostic system, and its predictions must not be treated as a substitute for professional medical advice.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Database](#database)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Current Status](#current-status)
- [Security Considerations](#security-considerations)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Health information is often scattered across records, and patients can struggle to see how their habits relate to potential health risks. Doctors, meanwhile, need organized access to relevant patient information.

LifePredict brings health-data management, ML-based predictions, explainability, prediction history, nutrition information, and doctor–patient interaction into a single web application. The goal is to demonstrate how machine learning models can be integrated into a complete software product rather than used as standalone scripts.

| Problem | LifePredict's approach |
|---|---|
| Patient health information needs to be organized | Health-data management pages |
| Users need a way to explore potential health risks | ML models generate predictions from submitted information |
| Predictions are hard to interpret | SHAP-based explainability |
| Users need access to previous predictions | Prediction-history functionality |
| Patients and doctors need to interact | Doctor profiles, patient connections, consultations, alerts |
| Health information is hard to explore | Nutrition information and health-insight interfaces |

---

## Features

### Authentication and Account Management
- Registration / signup and login
- Email verification and resending verification emails
- Forgot-password and password-reset flows
- Password hashing with `bcryptjs` and JWT-based authentication

### Patient Features
- **Profile and health-data management**: enter and update health and lifestyle information
- **ML health predictions**: XGBoost and Random Forest models served through a Python service
- **Explainable AI**: SHAP feature-contribution explanations for model outputs
- **Prediction history**: review previously stored predictions
- **What-if simulations**: compare model outputs when selected inputs change
- **Nutrition and meals**: explore meal and nutrition information
- **Patient dashboard**: a central hub tying these features together

### Doctor Features
- Doctor dashboard and professional profile
- Patient connections and patient detail views
- Consultations and alerts

> **Interpretation notes:** SHAP values describe how the *model* uses its inputs, not what *causes* a medical outcome. Likewise, what-if output changes do not prove a behavior change will cause the same change in a real person's health.

---

## Tech Stack

| Technology | Responsibility |
|---|---|
| React.js + Vite | Frontend UI, dev tooling, production builds |
| Node.js + Express.js | Backend HTTP server and API layer |
| MySQL + `mysql2` | Persistent storage and database access |
| Python + FastAPI | Machine learning inference service |
| XGBoost, Random Forest | Predictive models for tabular data |
| SHAP | Model explainability |
| `bcryptjs`, JWT | Password hashing and token-based authentication |
| Nodemailer | Email delivery via a configured SMTP transport |
| Vercel | Frontend hosting |
| Railway | Backend and MySQL hosting |

---

## Architecture

LifePredict is a multi-component system: frontend, application backend, ML service, and database.

```
Patient
   |
   v
React.js Frontend
   |  Prediction request
   v
Node.js / Express Backend  <------>  MySQL Database
   |  ML inference request
   v
Python / FastAPI Service
   |
   v
Input Validation and Preprocessing
   |
   v
Trained ML Model (XGBoost / Random Forest)
   |
   v
Prediction Result --> Backend API Response --> React Prediction Page
```

**Design principles**

- The frontend never queries the database directly; the backend is the API boundary.
- Sensitive authorization decisions are enforced by the backend, not the frontend.
- ML inference is isolated in its own service so it can use Python-specific dependencies independently of the Node.js backend.

---

## Repository Structure

```
LifePredict/
├── Backend/
│   ├── server.js
│   ├── package.json
│   ├── config/
│   └── scripts/
├── Frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── src/
│       └── pages/
│           ├── Auth/
│           ├── Doctor/
│           └── Patient/
├── ML-service/
├── Database/
│   └── lifepredict_schema.sql
└── nixpacks.toml
```

| Directory | Contents |
|---|---|
| `Backend/` | Express application, configuration, supporting scripts |
| `Frontend/` | React/Vite application, pages, and frontend configuration |
| `ML-service/` | Python/FastAPI inference service |
| `Database/` | SQL schema and supporting database resources |
| `nixpacks.toml` | Build configuration for deploying the backend on Railway |

> The backend imports a database module from the root-level `Database/` directory, so deployments must preserve the repository's directory structure.

---

## Database

The MySQL schema contains seven tables:

| Table | Responsibility |
|---|---|
| `users` | Application user records |
| `patient_profiles` | Patient-specific profile information |
| `doctor_profiles` | Doctor-specific profile information |
| `doctor_patient_connections` | Doctor–patient relationships |
| `patient_health_data` | Patient health-data records |
| `health_records` | Health-related records |
| `prediction_history` | Stored prediction results |

See `Database/lifepredict_schema.sql` for exact columns, keys, and constraints.

---

## Getting Started

> Commands below are typical for this stack. Adjust scripts, ports, and file names to match the repository.

### Prerequisites

- Node.js (LTS) and npm
- Python 3.9+ and pip
- MySQL 8+ (local or hosted)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd LifePredict
```

### 2. Set up the database

```bash
mysql -u <user> -p < Database/lifepredict_schema.sql
```

If your hosted database has a fixed name (for example `railway` on Railway MySQL), adapt the schema import to use that database.

### 3. Run the ML service

```bash
cd ML-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Run the backend

```bash
cd Backend
npm install
npm start
```

### 5. Run the frontend

```bash
cd Frontend
npm install
npm run dev
```

Build for production with `npm run build` (output in `dist/`).

---

## Environment Variables

Never commit secrets to GitHub or embed them in frontend code.

**Backend**

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
JWT_SECRET=
ML_SERVICE_URL=
# SMTP settings for Nodemailer (host, port, user, password, from address)
```

**Frontend**

```env
VITE_API_URL=<your backend public URL>
```

---

## Deployment

| Component | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Build command `npm run build`, output directory `dist`; `vercel.json` rewrite supports client-side routing (e.g. `/login`) |
| Backend | Railway | Deployed from GitHub; configured via `nixpacks.toml` |
| Database | Railway MySQL | Schema imported; seven tables confirmed |
| ML service | Not yet confirmed | Separate Python service that must be deployed and reachable from the backend |

Live links: [Frontend](https://life-predict.vercel.app/) · Backend: URL not provided

---

## Current Status

| Component | Status |
|---|---|
| React/Vite frontend | Production build completed |
| Vercel deployment | Deployed; login route loads |
| Node.js/Express backend | Deployed on Railway; health endpoint responds |
| Railway MySQL | Schema imported; 7 tables confirmed |
| Frontend-to-backend URL config | Updated to the Railway backend URL |
| Login and signup | Not yet fully working in production |
| Email verification | Failing; SMTP configuration needs fixing |
| Database CRUD operations | Need end-to-end verification |
| ML-service production connectivity | Not yet confirmed |
| End-to-end prediction workflow | Needs production testing |

**Known issue:** the deployed backend logged `ECONNREFUSED ::1:587`, meaning it tried to reach a local SMTP server. Configure a reachable SMTP provider (or another supported email service) through environment variables to fix email verification.

---

## Security Considerations

- Enforce authentication and authorization on the backend (e.g. a patient must not access another patient's records by changing an ID).
- Hash passwords and validate all inputs: types, required fields, ranges, and supported values, especially data passed to ML models.
- Keep credentials in environment variables or a secrets manager.
- Handle database and inference errors safely; manage schema changes consistently across environments.
- Do not present model outputs as medical facts. Real clinical use would require validation, calibration, bias evaluation, and clinical assessment.

---

## Roadmap

- [ ] Fix SMTP configuration and verify the email-verification flow
- [ ] Verify login/signup end to end in production
- [ ] Test database CRUD operations in production
- [ ] Deploy the FastAPI ML service and connect it to the backend
- [ ] Test the full prediction workflow, including SHAP explanations
- [ ] Document the prediction targets and report evaluation metrics from the training code
- [ ] Review and confirm doctor-side access-control rules

---

## Author

Built by **Om Kumar Singh**: [github.com/omkumars31](https://github.com/omkumars31)

No license has been specified for this repository.
