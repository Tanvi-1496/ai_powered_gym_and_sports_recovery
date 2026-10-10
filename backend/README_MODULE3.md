# REVORA — Module 3: Personalized Exercise Recommendation

This module provides clinical, safety-first exercise recommendations for athletes based on injury assessments and doctor-guidance restrictions.

---

## 🏗 Architecture Overview

```
Assessment Input + Doctor Guidance Contract
                    │
                    ▼
          [Safety Filter Service]
          ├── Red-flag check (numbness, inability to bear weight, dislocation) -> WITHHOLD
          ├── Doctor clearance check (medical_clearance_required) -> WITHHOLD
          └── Pain severity >= 8 -> CONSERVATIVE MODE (gentle, unloaded isometrics only)
                    │
                    ▼ (if safe)
         [Clinical Exercise Catalog] (JSON-backed, clinically sourced)
                    │
                    ▼
          [Filtering & Prioritization]
          ├── Filter disallowed movement tags (e.g., deep_knee_flexion, overhead_mobility)
          ├── Filter restriction codes (e.g., RESTRICT_DEEP_FLEXION, RESTRICT_OVERHEAD)
          ├── Cap max intensity ('gentle' vs 'moderate')
          └── Resolve multi-region injuries (e.g., knee + lower back)
                    │
                    ▼
      [ExerciseRecommendationResponse]
      ├── status: 'recommended' | 'conservative_guidance' | 'withheld' | 'no_match'
      ├── activities: list[RecoveryActivity] (matches frontend recovery.ts contract)
      └── clinical_disclaimer & safety_summary
```

---

## 📁 File Structure

```
backend/
├── app/
│   ├── data/
│   │   └── exercise_catalog.json          # Verified clinical catalog with movement tags & sources
│   ├── schemas/
│   │   └── exercises.py                   # Pydantic schemas (Field(default_factory=list))
│   ├── services/
│   │   ├── exercise_catalog.py            # JSON catalog loader and anatomical query engine
│   │   ├── safety_filters.py              # Red flags, conservative handling, and doctor restrictions
│   │   └── exercise_recommender.py        # Core recommend_exercises() Python function & plan adapter
│   └── api/
│       ├── routes/
│       │   └── exercises.py               # REST API endpoints
│       └── router.py                      # Router aggregator (/api/v1/exercises)
├── tests/
│   ├── test_exercises.py                  # Functional tests & API tests
│   └── test_exercise_safety.py           # Safety tests (pain >= 8, red flags, doctor codes)
└── README_MODULE3.md
```

---

## 🔌 Integration Guide

### 1. Direct Python Import (Internal Services)

```python
from app.schemas.exercises import ExerciseAssessmentRequest, DoctorGuidanceInput
from app.services.exercise_recommender import recommend_exercises, build_recovery_plan

# Build assessment request
assessment = ExerciseAssessmentRequest(
    body_areas=["knee", "lower_back"],
    symptoms=["anterior knee tightness", "lumbar soreness"],
    pain_severity=4,
    duration="1-3_days",
    doctor_guidance=DoctorGuidanceInput(
        restriction_codes=["RESTRICT_DEEP_FLEXION"],
        max_allowed_intensity="gentle",
    ),
)

# 1. Get raw exercise recommendations
result = recommend_exercises(assessment)
print(result.status)        # "recommended"
print(len(result.activities))  # 4

# 2. (Optional) Convert to full multi-phase RecoveryPlan for frontend
plan = build_recovery_plan(result, assessment)
print(plan.phases[0].name)  # "Phase 1: Deload & Pain-Free Isometrics"
```

---

### 2. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/exercises/recommendations` | Generate personalized exercise recommendations |
| `POST` | `/api/v1/exercises/recovery-plan` | Generate full multi-phase RecoveryPlan (matching frontend UI) |
| `POST` | `/api/v1/exercises/safety-check` | Standalone triage safety evaluation |
| `GET` | `/api/v1/exercises/catalog` | Get full catalog (supports `?body_area=knee`) |
| `GET` | `/api/v1/exercises/catalog/{exercise_id}` | Get single exercise detail |

#### Example Request: `POST /api/v1/exercises/recommendations`

```json
{
  "body_areas": ["knee"],
  "symptoms": ["patellar tendon ache"],
  "pain_severity": 4,
  "duration": "1-3_days",
  "doctor_guidance": {
    "restriction_codes": ["RESTRICT_DEEP_FLEXION"],
    "disallowed_movement_tags": ["impact_load"],
    "medical_clearance_required": false,
    "max_allowed_intensity": "gentle"
  }
}
```

---

## 🧪 Running Automated Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```
