# REVORA — Module 2: Doctor Guidance & Clinical Triage Engine

This module provides evidence-audited clinical triage, authorized clearance verification, and movement restriction guidance for gym and sports recovery. It acts as the safety gate and guidance provider upstream of Module 3 (Personalized Exercise Recommendation).

> **Clinical Scope Notice:**
> Software unit and integration test passage verifies software logic and contract fidelity. It does **not** constitute formal clinical validation. Formal clinical validation remains pending review by a qualified sports physician or licensed physical therapist. REVORA is an educational recovery tool; immediate emergency care must be sought for severe trauma, cauda equina signs, or progressive neurological deficits.

---

## 🏗 Architecture & Clinical Triage Hierarchy

```
Athlete Assessment Presentation + Clinician Clearance Submission
                                 │
                                 ▼
                     [Module 2 Guidance Service]
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
[Emergency Triage]    [Clearance Verification]   [Contradiction & Missing]
• Cauda Equina        • Athlete Self-Report:     • Unassessed screening:
  (NICE NG59)           STRICTLY REJECTED          treated as unverified
• Motor Deficit       • Direct Clinician Entry:  • VAS >= 8 vs "no pain"
  (AAOS Spine)          verified role, license,    flagged as contradiction
• Gross Deformity/      jurisdiction, signed     • Future evaluation dates
  Compound Fracture     declaration, <=60 days     rejected
• Joint Sepsis (BSR)    validity window
        │                        │                        │
        └────────────────────────┬────────────────────────┘
                                 ▼
                [Emergency Priority Resolution]
       (Emergency red flags ALWAYS override prior clearance;
        immediately withhold all exercises and force triage: "emergency")
                                 │
                                 ▼
              [Clinically Audited Guidance Rules]
        ├── Approved Rules (Crossley 2016, AAOS 2019, NASS 2012, etc.)
        │   └── Generate active restriction codes & movement tags
        └── Pending Review Rules
            └── Skipped from automated activation; logged for panel audit
                                 │
                                 ▼
           [GuidanceEvaluationResponse & Module 3 Contract]
        ├── triage_level: 'standard_monitoring' | 'prompt_medical_assessment' | 'emergency'
        ├── warning_signs_status: 'cleared' | 'emergency_detected' | ...
        ├── clearance_validation: ClearanceValidationResult
        ├── active_restriction_codes & disallowed_movement_tags
        └── module3_doctor_guidance: DoctorGuidanceInput (ready for Module 3)
```

---

## 📋 Standardized Restriction Codes (Module 2 ↔ Module 3 Contract)

Module 2 reuses the exact standardized restriction codes and movement tags consumed by Module 3:

| Restriction Code | Disallowed Movement Tags | Primary Clinical Context |
| :--- | :--- | :--- |
| `RESTRICT_OVERHEAD` | `overhead_press`, `overhead_mobility` | Subacromial impingement / rotator cuff irritation (AAOS 2019) |
| `RESTRICT_DEEP_FLEXION` | `deep_knee_flexion`, `partial_flexion` | Patellofemoral compressive overload (Crossley et al. 2016) |
| `RESTRICT_IMPACT` | `impact_load`, `impact_absorption` | Acute ligament sprain / Ottawa acute trauma (Kaminski 2013) |
| `RESTRICT_AXIAL_LOAD` | `axial_load`, `heavy_load` | Lumbar disc compressive de-loading (NASS 2012) |
| `RESTRICT_SPINAL_FLEXION` | `spinal_mobility`, `spinal_flexion` | Flexion-intolerant lumbar radiculopathy (NASS 2012) |
| `RESTRICT_ECCENTRIC_STRAIN` | `eccentric_loading`, `eccentric_stretch` | Acute hamstring strain protection (Askling et al. 2013) |
| `RESTRICT_ROTATION` | `rotational_torque`, `multi_planar_mobility` | Rotational instability / acute facet irritation |

---

## 🔒 Clinician Clearance Workflow Specification

To prevent self-certification risks:
1. **Athlete Self-Report Rejected:** Submissions with `attestation_type: "athlete_self_report"` are strictly rejected (`is_valid: false`, `clinician_clearance_granted: false`, `verification_status: "rejected_athlete_self_report"`).
2. **Authorized Provider Credentials Required:** Provider role must be an authorized medical or therapy role (`sports_physician`, `orthopedic_surgeon`, `physiatrist`, `physical_therapist`, `athletic_trainer`, `general_practitioner`).
3. **Accountability Fields:** Evaluating clinician's legal name, license number, licensing board jurisdiction, and signed declaration (`clinician_declaration_signed: true`) are mandatory.
4. **Validity Windows:** Evaluation dates in the future are rejected (`rejected_future_date`). Clearances older than 60 days are rejected as lapsed (`rejected_expired`).
5. **Emergency Supersedence:** If emergency warning signs are present, all clearances are invalidated with `rejection_reasons: ["EMERGENCY OVERRIDE..."]`.

---

## 🔌 API Endpoints for Integration (Anushka's Guide)

Base prefix: `/api/v1/doctor-guidance`

### 1. `POST /api/v1/doctor-guidance/evaluate`
Comprehensive clinical evaluation endpoint (assessment, triage, clearance audit, rule application, and Module 3 adapter).

#### Request Body (`AthleteClinicalPresentation`):
```json
{
  "body_areas": ["shoulder"],
  "pain_severity": 4,
  "symptoms": ["subacromial impingement", "overhead pain"],
  "duration": "1-3_days",
  "movement_limitations": ["cannot lift arm overhead"],
  "warning_signs_screening": {
    "screening_completed": true,
    "emergency_signs_present": [],
    "prompt_assessment_signs_present": []
  },
  "clearance_submission": null,
  "clinician_prescribed_restrictions": []
}
```

#### Response Body (`GuidanceEvaluationResponse`):
```json
{
  "triage_level": "standard_monitoring",
  "warning_signs_status": "cleared",
  "clearance_validation": {
    "is_valid": false,
    "verification_status": "not_submitted",
    "clinician_clearance_granted": false,
    "medical_clearance_required": false,
    "rejection_reasons": ["No clinician clearance submission provided."],
    "audit_details": { "submitted": false }
  },
  "contradictions_detected": [],
  "active_restriction_codes": ["RESTRICT_OVERHEAD"],
  "active_disallowed_movement_tags": ["overhead_mobility", "overhead_press"],
  "effective_max_intensity": "gentle",
  "applied_guidance_rules": [
    {
      "rule_id": "RULE_ROTATOR_CUFF_OVERHEAD_ARC",
      "name": "Subacromial Impingement Overhead Protection Protocol",
      "target_body_area": "shoulder",
      "review_status": "approved",
      "clinical_citation": "American Academy of Orthopaedic Surgeons (AAOS): Clinical Practice Guideline on the Management of Rotator Cuff Injuries (2019).",
      "evidence_summary": "Avoiding unguided overhead impingement arc (>90 degrees elevation/press) during acute subacromial irritation protects supraspinatus tendon.",
      "restriction_codes": ["RESTRICT_OVERHEAD"],
      "disallowed_movement_tags": ["overhead_press", "overhead_mobility"],
      "max_allowed_intensity": "gentle"
    }
  ],
  "pending_review_rules_skipped": [],
  "module3_doctor_guidance": {
    "restriction_codes": ["RESTRICT_OVERHEAD"],
    "disallowed_movement_tags": ["overhead_mobility", "overhead_press"],
    "medical_clearance_required": false,
    "clinician_clearance_granted": false,
    "max_allowed_intensity": "gentle",
    "clinical_notes": "Standard monitoring: Athlete cleared for tailored recovery exercises. Active restrictions enforced: RESTRICT_OVERHEAD."
  },
  "clinical_summary": "Standard monitoring: Athlete cleared for tailored recovery exercises. Active restrictions enforced: RESTRICT_OVERHEAD.",
  "clinical_validation_notice": "REVORA software evaluation results reflect programmatic rules and do NOT constitute formal institutional clinical validation..."
}
```

### 2. `POST /api/v1/doctor-guidance/safety-check`
Stand-alone safety and red-flag screening endpoint. Evaluates emergency signs, prompt-assessment indicators, contradictions, and clearance status.

### 3. `POST /api/v1/doctor-guidance/clearance/validate`
Stand-alone clearance verification workflow.

#### Request Body (`ClinicianClearanceSubmission`):
```json
{
  "attestation_type": "direct_clinician_entry",
  "clinician_name": "Dr. Marcus Vance, MD",
  "license_number": "MED-CA-892110",
  "licensing_jurisdiction": "California Medical Board",
  "clinician_role": "sports_physician",
  "institution_or_clinic": "Olympic Sports Medicine Center",
  "evaluation_date": "2026-10-08",
  "clinician_declaration_signed": true,
  "clearance_scope": "conservative_rehab_only"
}
```

### 4. `GET /api/v1/doctor-guidance/rules?approved_only=true`
Retrieves all reviewed clinical guidance rules with citations.

### 5. `GET /api/v1/doctor-guidance/restrictions`
Retrieves standardized restriction codes and mapped movement tags.

### 6. `GET /api/v1/doctor-guidance/health`
Module 2 health check returning service operational status and loaded rules count.

---

## 🔗 End-to-End Hand-Off: Module 2 to Module 3

In frontend or orchestration services, the output property `response.module3_doctor_guidance` is a 1-to-1 drop-in for Module 3's `ExerciseAssessmentRequest.doctor_guidance`:

```typescript
// Example frontend / orchestration call:
const guidance = await api.post("/api/v1/doctor-guidance/evaluate", presentationPayload);

// Pass directly to Module 3 recommendation engine:
const recommendations = await api.post("/api/v1/exercises/recommendations", {
  body_areas: presentationPayload.body_areas,
  symptoms: presentationPayload.symptoms,
  pain_severity: presentationPayload.pain_severity,
  duration: presentationPayload.duration,
  movement_limitations: presentationPayload.movement_limitations,
  doctor_guidance: guidance.data.module3_doctor_guidance, // Direct contract mapping!
});
```

---

## 🧪 Automated Test Suite

Run backend test suite:
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest tests/test_doctor_guidance.py
```
Total tests: 45 passed (100% pass rate across Module 2 and Module 3).
