# REVORA — AI-Powered Gym & Sports Recovery Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg?style=flat&logo=three.js&logoColor=white)](https://threejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-ExtraTrees-F7931E.svg?style=flat&logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Symptom%20AI-4285F4.svg?style=flat&logo=google&logoColor=white)](https://ai.google.dev)

**REVORA** is an end-to-end intelligent athletic recovery web platform designed to bridge acute training fatigue, biomechanical strain analysis, clinical triage gating, and evidence-based rehabilitation exercise prescription.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Core Modules & Features](#-core-modules--features)
  - [Module 1: Athlete Recovery Telemetry](#module-1-athlete-recovery-telemetry)
  - [Module 2: Doctor Guidance & Clinical Triage](#module-2-doctor-guidance--clinical-triage)
  - [Module 3: Personalized Exercise Recommendation](#module-3-personalized-exercise-recommendation)
  - [ML Pipeline: Recovery & Strain Prediction](#ml-pipeline-recovery--strain-prediction)
  - [Frontend: 3D Anatomy & Athlete Dashboard](#frontend-3d-anatomy--athlete-dashboard)
- [Team & Contribution Breakdown](#-team--contribution-breakdown)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [Running Automated Tests](#-running-automated-tests)
- [Clinical & Regulatory Notice](#-clinical--regulatory-notice)

---

## 🌟 Overview

Athletes and gym-goers frequently navigate the grey area between normal muscle soreness and early-stage injury. **REVORA** solves this by uniting:
1. **Machine Learning Telemetry:** Continuous daily readiness scoring ($0 - 100$) using trained ExtraTrees regressors on physiological metrics (sleep, resting heart rate, HRV, soreness, energy).
2. **Interactive 3D Biomechanics:** Full 3D human anatomy model visualization in WebGL to localize pain regions and map muscle groups.
3. **Natural Language AI Interpretation:** Gemini-powered symptom parser that translates athlete descriptions ("sharp pinch in front of knee when descending stairs") into canonical anatomical targets and clinical tags.
4. **Clinical Safety Gates (Doctor Guidance):** Strict evidence-based triage that screens emergency red flags, detects conflicting inputs, validates clinician clearances, and generates movement restriction codes.
5. **Personalized Recovery Prescription:** Delivers targeted, evidence-cited recovery exercises filtered against medical restrictions and capped by safe volume/intensity ceilings.

---

## 🏗 System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               REVORA Web Frontend (React)              │
                    │   • Interactive 3D Anatomy Viewer (Three.js WebGL)     │
                    │   • Athlete Daily Check-in & Assessment Flow           │
                    │   • Recovery Readiness Dashboard & Phased Action Plans │
                    └───────────────────────────┬────────────────────────────┘
                                                │ REST API / JWT Auth
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   REVORA Backend (FastAPI)                                      │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────┤
│           Module 1            │            Module 2             │           Module 3            │
│       Recovery Telemetry      │     Doctor Guidance & Triage    │    Exercise Recommendations   │
│ • Daily athlete check-in log  │ • Emergency red-flag overrides  │ • Clinically audited catalog  │
│ • SQLite / Supabase DB sync   │ • Clinician clearance validator │ • Cascade safety filters      │
│ • Feature engineering pipeline│ • Clinical evidence rules (AAOS)│ • Disallowed movement filters │
│ • Rolling average baselines   │ • Restriction codes generation  │ • Volume & intensity capping  │
└───────────────┬───────────────┴────────────────┬────────────────┴───────────────┬───────────────┘
                │                                │                                │
                ▼                                ▼                                ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│     Machine Learning Core     │ │   Gemini Symptom AI Core      │ │      Clinical Database      │
│ • ExtraTrees Regressor        │ │ • Natural language parser     │ │ • Peer-reviewed citations   │
│ • Continuous Recovery Score   │ │ • Anatomical synonym mapping  │ │   (Rio 2015, McGill 2007,   │
│ • Strain Index calculation    │ │ • Deterministic fallback mode │ │    AAOS, Kibler, Beyer)     │
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
```

---

## 🧩 Core Modules & Features

### Module 1: Athlete Recovery Telemetry
* Logs athlete daily metrics: sleep hours, resting heart rate (bpm), heart rate variability (HRV ms), self-reported muscle soreness ($1 - 10$), and energy levels ($1 - 10$).
* Computes rolling 7-day baseline deviations to differentiate acute fatigue from chronic overtraining.
* Stores persistent check-in histories with Supabase authentication and database models.

### Module 2: Doctor Guidance & Clinical Triage
* **Triage Hierarchy:** Categorizes presentations into `standard_monitoring`, `prompt_medical_assessment`, and `emergency`.
* **Emergency Red-Flag Priority:** Critical warning signs (cauda equina symptoms, progressive motor loss, gross deformity, joint sepsis) immediately override prior clearances, withholding exercises and directing emergency care.
* **Clinician Clearance Verification:** Anti-tamper workflow that strictly rejects athlete self-certification and verifies authorized healthcare providers (MD, PT, DO), licenses, jurisdictions, and non-expired ($\le 60$ days) clearances.
* **Medical Restriction Codes:** Translates clinical conditions into standardized codes (`RESTRICT_DEEP_FLEXION`, `RESTRICT_OVERHEAD`, `RESTRICT_AXIAL_LOAD`, `RESTRICT_SPINAL_FLEXION`, `RESTRICT_IMPACT`, `RESTRICT_ECCENTRIC_STRAIN`, `RESTRICT_ROTATION`).
* *Documentation:* See [backend/README_MODULE2.md](./backend/README_MODULE2.md).

### Module 3: Personalized Exercise Recommendation
* **Evidence-Audited Catalog:** Curated database of therapeutic drills ([exercise_catalog.json](./backend/app/data/exercise_catalog.json)) tagged with peer-reviewed medical citations (Rio et al. 2015, Kibler et al. 2013, McGill 2007, Beyer et al. 2015, Jull et al. 2008).
* **Multi-Stage Safety Filter:**
  1. Emergency red flags $\rightarrow$ WITHHOLD.
  2. Prompt assessment flags $\rightarrow$ WITHHOLD.
  3. Severe pain ($\text{VAS} \ge 8/10$) without clearance $\rightarrow$ WITHHOLD.
  4. Severe pain with authorized clearance $\rightarrow$ CONSERVATIVE GENTLE DRILLS ONLY.
  5. Restriction code & disallowed movement tag pruning.
* *Documentation:* See [backend/README_MODULE3.md](./backend/README_MODULE3.md).

### ML Pipeline: Recovery & Strain Prediction
* Trained **ExtraTrees Regressor** on multi-variate athlete telemetry datasets.
* Predicts an interpretable **Recovery Readiness Score** ($0 - 100$) and categorizes athletes into recovery tiers: *Optimal*, *Moderate*, *Low*, and *Needs Rest*.
* Generates a **Biomechanical Strain Index** highlighting probable fatigue contributors.
* *Notebook:* [ml/notebooks/AI_Athlete_Recovery_Regression.ipynb](./ml/notebooks/AI_Athlete_Recovery_Regression.ipynb).

### Frontend: 3D Anatomy & Athlete Dashboard
* **Interactive 3D Anatomy Viewer:** Custom Three.js WebGL canvas rendering human muscular structures, allowing athletes to orbit, pan, search, and click target regions directly on a 3D avatar.
* **Assessment Flow:** Step-by-step interactive questionnaire covering pain severity, symptoms, duration, limitations, and warning signs.
* **Results & Plan Pages:** Displays real-time recovery score gauges, safety guidance banners, clinician clearance submission forms, and daily recovery activity checklists with user-scoped completion storage.

---

## 👥 Team & Contribution Breakdown

| Contributor | Primary Role & Responsibilities | Key Authored Artifacts |
| :--- | :--- | :--- |
| **Shravani** (`shravani492006`) | **Clinical Safety, Medical Triage & Exercise Engine Lead**<br>• Architected Module 2 (Doctor Guidance, Clearance Verification, Conflict Detection).<br>• Architected Module 3 (Personalized Exercise Recommender, Safety Filters, Catalog).<br>• Authored clinical test suites & integration contracts. | `backend/app/services/doctor_guidance.py`<br>`backend/app/services/safety_filters.py`<br>`backend/app/services/exercise_recommender.py`<br>`backend/app/data/exercise_catalog.json`<br>`backend/tests/test_doctor_guidance.py`<br>`backend/tests/test_exercise_safety.py`<br>`backend/README_MODULE2.md`<br>`backend/README_MODULE3.md` |
| **Anushka Gadhave** | **Frontend Architecture, 3D Graphics & Integration Lead**<br>• Engineered React/TypeScript frontend and responsive UI.<br>• Integrated Three.js 3D human anatomy viewer & orbital controls.<br>• Built Supabase Auth & DB connection and Gemini symptom interpretation.<br>• Integrated unified modules into frontend dashboard. | `frontend/src/components/assessment/AnatomyViewer.*`<br>`frontend/src/pages/AssessmentResultsPage.tsx`<br>`frontend/src/pages/RecoveryPlanPage.tsx`<br>`frontend/src/services/api.ts`<br>`backend/app/services/symptom_interpreter.py` |
| **Ankur Kesarkar** | **Machine Learning & Data Science Lead**<br>• Trained and validated athlete recovery ExtraTrees regression models.<br>• Built ML inference pipeline for recovery scores and feature derivation.<br>• Developed exploratory data analysis and model benchmarking notebooks. | `ml/notebooks/AI_Athlete_Recovery_Regression.ipynb`<br>`ml/models/recovery_score_extra_trees.joblib`<br>`backend/app/services/ml_recovery.py` |
| **Tanvi** | **Project Setup & Module 1 Recovery Tracking Lead**<br>• Bootstrapped repository foundation and initial project scaffolding.<br>• Implemented Module 1 athlete check-in API routes, schemas, and models. | `backend/app/api/routes/recovery.py`<br>`backend/app/models/recovery.py`<br>`backend/app/schemas/recovery.py`<br>`frontend/src/components/RecoveryForm.tsx` |

---

## 💻 Tech Stack

* **Backend:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, SQLite / PostgreSQL (Supabase), Pytest, HTTPX, Joblib, Scikit-Learn, Google GenAI SDK.
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Three.js, Lucide Icons, Axios.
* **Auth & Storage:** Supabase Auth (JWT HS256 verification), LocalStorage persistence.
* **Machine Learning:** ExtraTrees Regressor, Pandas, NumPy, Scikit-Learn 1.6+.

---

## 🚀 Getting Started

### Prerequisites
* **Python 3.11+** installed.
* **Node.js 18+** and **npm** installed.
* Git.

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file from template
cp .env.example .env
# Fill in your Supabase and Gemini credentials in backend/.env

# Run development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to frontend in a new terminal
cd frontend

# Install dependencies
npm install

# Create your local environment file
cp .env.example .env.local
# Fill in your VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the full backend test suite covering clinical safety gates, doctor guidance, exercise filtering, and ML telemetry:

```bash
# From workspace root with backend virtual environment active:
# Windows PowerShell:
$env:PYTHONPATH="backend"
backend\.venv\Scripts\python -m pytest backend/tests

# Linux / macOS:
PYTHONPATH=backend pytest backend/tests
```

---

## ⚖️ Clinical & Regulatory Notice

> **IMPORTANT CLINICAL NOTICE:**
> REVORA is designed for athletic performance education, training fatigue tracking, and general exercise recovery guidance. Software unit and integration test passage verifies software contracts and algorithmic logic; it **does NOT constitute formal clinical validation**.
> REVORA does not diagnose medical diseases, structural injuries, or provide medical treatment. For severe trauma, progressive neurological symptoms, unmanageable pain, or suspected fracture, athletes must immediately consult a licensed sports physician or seek emergency medical care.
