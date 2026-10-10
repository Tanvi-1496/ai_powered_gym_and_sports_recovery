# REVORA — Module 3: Personalized Exercise Recommendation

This module provides evidence-based, safety-audited exercise recommendations for gym and sports recovery, integrating clinician guidance and rigorous triage filters.

> **Notice Regarding Clinical Scope:**
> Automated unit test passage does **not** constitute clinical validation. REVORA provides educational exercise guidance based on published clinical guidelines; it does not diagnose injuries or replace licensed medical/physical therapy evaluation.

---

## 🏗 Architecture & Clinical Triage Hierarchy

```
Assessment Input + Doctor Guidance Contract
                    │
                    ▼
          [Safety Filter Service]
          ├── 1. Emergency Warning Signs Check
          │      (cauda equina, gross deformity, acute dislocation, joint sepsis)
          │      └── WITHHOLD -> triage_level: "emergency"
          │
          ├── 2. Prompt Assessment Signs Check
          │      (inability to bear weight, peripheral numbness, mechanical locking, worsening symptoms)
          │      └── WITHHOLD -> triage_level: "prompt_medical_assessment"
          │
          ├── 3. Doctor Guidance Clearance Check
          │      (medical_clearance_required == True)
          │      └── WITHHOLD -> triage_level: "prompt_medical_assessment"
          │
          ├── 4. Severe Pain Triage (VAS >= 8/10)
          │      ├── Without Clinician Clearance:
          │      │   └── WITHHOLD -> triage_level: "prompt_medical_assessment"
          │      │       (Does not blindly assume isometrics are safe; does not stamp as emergency solely on score)
          │      └── With Clinician Clearance (clinician_clearance_granted == True):
          │          └── CONSERVATIVE GUIDANCE (unloaded gentle drills under clinical oversight)
          │
          ▼ (if cleared for recommendations)
   [Clinically Audited Exercise Catalog]
   ├── Excludes unverified / 'pending_review' entries from automated recommendations
   ├── Filters disallowed movement tags (e.g. overhead_mobility, deep_knee_flexion)
   ├── Filters restriction codes (e.g. RESTRICT_DEEP_FLEXION)
   └── Caps intensity ('gentle' vs 'moderate')
          │
          ▼
   [ExerciseRecommendationResponse]
   ├── status: 'recommended' | 'conservative_guidance' | 'withheld' | 'no_match'
   ├── triage_level: 'standard_monitoring' | 'prompt_medical_assessment' | 'emergency'
   ├── activities: list[RecoveryActivity] (reviewStatus, verifiedSources, sourceUrls)
   └── clinical_disclaimer & safety_summary
```

---

## 📋 Audited Exercise Catalog Status

Exercises in [`backend/app/data/exercise_catalog.json`](./app/data/exercise_catalog.json) are explicitly tagged with `review_status`:

| Exercise ID | Body Area | Clinical Source & Evidence | Status |
| :--- | :--- | :--- | :--- |
| `knee-spanish-squat-iso` | Knee | Rio et al. (2015), Br J Sports Med | **Approved** |
| `knee-straight-leg-raise` | Knee | AAOS Patellofemoral Pain Syndrome Guide | **Approved** |
| `shoulder-prone-ytw` | Shoulder | Kibler et al. (2013), Br J Sports Med | **Approved** |
| `shoulder-side-external-rotation` | Shoulder | Reinold et al. (2004), JOSPT | **Approved** |
| `lower-back-bird-dog` | Lower Back | McGill SM (2007), Low Back Disorders | **Approved** |
| `lower-back-mcgill-curlup` | Lower Back | McGill SM (1998), Physical Therapy | **Approved** |
| `lower-back-glute-bridge-iso` | Lower Back | AAOS Spine Conditioning Program | **Approved** |
| `ankle-soleus-bent-knee-raises` | Ankle | Beyer et al. (2015), Am J Sports Med | **Approved** |
| `ankle-alphabet-mobilization` | Ankle | Kaminski et al. (2013), NATA Position Statement | **Approved** |
| `neck-chin-tucks` | Neck | Jull et al. (2008), Spine | **Approved** |
| *Other 10 catalog entries* | Various | Pending formal institutional physical therapy clinical panel dosage validation | **Pending Review** *(Excluded from automatic recommendations until approved)* |

---

## 🔌 Integration Guide

### 1. Python In-Memory Call

```python
from app.schemas.exercises import ExerciseAssessmentRequest, DoctorGuidanceInput
from app.services.exercise_recommender import recommend_exercises

assessment = ExerciseAssessmentRequest(
    body_areas=["knee"],
    symptoms=["patellar tendon ache"],
    pain_severity=4,
    duration="1-3_days",
    doctor_guidance=DoctorGuidanceInput(
        restriction_codes=["RESTRICT_DEEP_FLEXION"],
        max_allowed_intensity="gentle",
    ),
)

response = recommend_exercises(assessment)
print(response.status)       # "recommended"
print(response.triage_level) # "standard_monitoring"
```

---

## 🧪 Running Automated Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```
