"""Personalized Recovery Plan Generation Service for REVORA.

Generates structured 4-phase recovery protocols tailored to:
- Athlete profile (primary sport, activity level, training frequency)
- Biomechanical assessment telemetry (targeted body areas, pain severity, duration, movement limitations)
- Daily recovery check-in physiological readiness (ML Recovery Score & tier)
"""

import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.recovery import RecoveryCheckin
from app.services.ml_recovery import is_valid_uuid, predict_recovery_for_checkin


def get_anatomy_category(body_areas: List[str]) -> str:
    """Categorize body areas into primary anatomical regions."""
    if not body_areas:
        return "general"

    joined = " ".join([str(a).lower() for a in body_areas])

    if any(k in joined for k in ["knee", "patella", "quad", "hamstring", "thigh"]):
        return "knee_thigh"
    elif any(k in joined for k in ["ankle", "foot", "calf", "achilles", "shin"]):
        return "lower_leg_ankle"
    elif any(k in joined for k in ["back", "lumbar", "spine", "glute", "hip", "pelvis"]):
        return "lumbar_hip"
    elif any(k in joined for k in ["shoulder", "rotator", "deltoid", "bicep", "tricep", "arm", "scapula"]):
        return "shoulder_arm"
    elif any(k in joined for k in ["neck", "cervical", "trapezius", "upper_back"]):
        return "neck_upper_back"
    else:
        return "kinetic_chain"


def build_phase_activities(
    region: str,
    sport: str,
    pain_level: int,
    readiness_score: float,
) -> List[Dict[str, Any]]:
    """Build evidence-grounded activities for all 4 recovery phases."""

    # ── 1. KNEE & THIGH PROTOCOLS ──────────────────────────────────────────
    if region == "knee_thigh":
        p1 = [
            {
                "id": "kt_p1_1",
                "name": "Sub-Maximal Quad Sets (Towel Roll)",
                "description": "Sit with legs extended, roll a towel beneath the knee. Gently press the knee into the towel to activate the vastus medialis without joint strain.",
                "targetArea": "Quadriceps & Patellar Tendon",
                "duration": "30s holds",
                "sets": 3,
                "repetitions": 10,
                "frequency": "2x daily",
                "difficulty": "gentle",
                "safetyNote": "Avoid locking the joint forcefully; focus on smooth contraction.",
            },
            {
                "id": "kt_p1_2",
                "name": "Prone Passive Knee Flexion Glides",
                "description": "Lie face down and gently flex the knee toward the glute using a towel or strap for gentle passive range of motion.",
                "targetArea": "Hamstrings & Knee Joint Capsule",
                "duration": "45s",
                "sets": 3,
                "repetitions": 8,
                "frequency": "1x daily",
                "difficulty": "gentle",
                "safetyNote": "Stop before any sharp pulling sensation at the anterior knee.",
            },
            {
                "id": "kt_p1_3",
                "name": "Supine Straight Leg Raises (Controlled Tempo)",
                "description": "Engage abdominal brace, lock the knee straight, and raise leg to 45 degrees. Hold for 2 seconds at the top and lower under 3-second control.",
                "targetArea": "Hip Flexors & VMO",
                "duration": "3 mins",
                "sets": 3,
                "repetitions": 12,
                "frequency": "1-2x daily",
                "difficulty": "gentle",
                "safetyNote": "Keep lower back neutral and flat against the mat.",
            },
        ]
        p2 = [
            {
                "id": "kt_p2_1",
                "name": "Wall Sit with Adductor Squeeze",
                "description": "Position back flat against a wall at 60-degree knee flexion with a soft yoga block between knees. Maintain steady diaphragmatic breathing.",
                "targetArea": "Quadriceps, Adductors & Joint Stabilizers",
                "duration": "30-45s holds",
                "sets": 3,
                "repetitions": 4,
                "frequency": "Every other day",
                "difficulty": "moderate",
                "safetyNote": "Ensure knees do not track inward past the second toe.",
            },
            {
                "id": "kt_p2_2",
                "name": "Banded Spanish Squats (Isometric Hold)",
                "description": "Loop a heavy resistance band behind the upper calves anchored to a stable post. Lean back into band support and hold at 45 degrees.",
                "targetArea": "Patellar Tendon & Quad Tendon",
                "duration": "45s hold",
                "sets": 4,
                "repetitions": 3,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Maintains tendon compliance with minimal patellofemoral joint stress.",
            },
            {
                "id": "kt_p2_3",
                "name": "Bilateral Glute Bridge with Resistance Band",
                "description": "Place band above knees, drive through heels to elevate hips, engaging gluteus medius and hamstrings without hyperextending the lumbar spine.",
                "targetArea": "Gluteus Maximus & Medius",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 15,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Maintain constant outward tension on the band throughout the rep.",
            },
        ]
        p3 = [
            {
                "id": "kt_p3_1",
                "name": "Poliquin Step-Downs (Elevated Heel)",
                "description": "Stand on a 4-inch slant board or step. Slowly lower the contralateral heel to touch the floor under 3-second eccentric control.",
                "targetArea": "Vastus Medialis Oblique (VMO) & Ankle Mobility",
                "duration": "5 mins",
                "sets": 3,
                "repetitions": 10,
                "frequency": "3x weekly",
                "difficulty": "moderate",
                "safetyNote": "Keep weight centered over the midfoot; avoid knee valgus collapse.",
            },
            {
                "id": "kt_p3_2",
                "name": "Single-Leg Romanian Deadlift (Bodyweight to Light Dumbbell)",
                "description": "Hinge at the hip on the support leg while extending the opposite leg back. Maintain flat spine and active hamstring engagement.",
                "targetArea": "Posterior Chain & Knee Deceleration",
                "duration": "5 mins",
                "sets": 3,
                "repetitions": 8,
                "frequency": "3x weekly",
                "difficulty": "advanced",
                "safetyNote": "Focus on hip hinge mechanics rather than reaching for the ground.",
            },
        ]
        p4 = [
            {
                "id": "kt_p4_1",
                "name": "Deceleration Catch & Multi-Directional Bounds",
                "description": "Perform forward and lateral low-amplitude hops, landing softly with triple flexion (hip, knee, ankle) absorption.",
                "targetArea": "Reactive Knee Stability & Dynamic Control",
                "duration": "6 mins",
                "sets": 4,
                "repetitions": 6,
                "frequency": "2-3x weekly",
                "difficulty": "advanced",
                "safetyNote": "Ensure silent, spring-like landings with zero lateral wobble.",
            },
            {
                "id": "kt_p4_2",
                "name": f"Sport-Specific Movement Acceleration ({sport or 'Athletic'})",
                "description": "Progressive interval shuttle runs, change-of-direction cuts at 75-90% intensity, tailored to sport demand.",
                "targetArea": "Kinetic Chain Power & Return to Sport",
                "duration": "10 mins",
                "sets": 5,
                "repetitions": 3,
                "frequency": "2x weekly",
                "difficulty": "advanced",
                "safetyNote": "Only advance if previous phase movements were completely symptom-free.",
            },
        ]

    # ── 2. LUMBAR & HIP PROTOCOLS ──────────────────────────────────────────
    elif region == "lumbar_hip":
        p1 = [
            {
                "id": "lh_p1_1",
                "name": "McGill Modified Curl-Up (Spine Neutral)",
                "description": "Lie supine with one knee bent, hands under lumbar arch for feedback. Elevate head and shoulders 1 inch without flexing lumbar spine.",
                "targetArea": "Deep Core Stabilizers & Anterior Kinetic Chain",
                "duration": "10s holds",
                "sets": 3,
                "repetitions": 6,
                "frequency": "2x daily",
                "difficulty": "gentle",
                "safetyNote": "Do not pull on the neck or flatten the lower back into the mat.",
            },
            {
                "id": "lh_p1_2",
                "name": "Cat-Camel Spinal Glides (Pain-Free Arc)",
                "description": "On hands and knees, slowly alternate between gentle spinal flexion and extension within comfortable mid-range motion.",
                "targetArea": "Thoracolumbar Fascia & Segmental Mobility",
                "duration": "2 mins",
                "sets": 2,
                "repetitions": 8,
                "frequency": "2x daily",
                "difficulty": "gentle",
                "safetyNote": "Move gently like a wave; avoid forcing end-range extension.",
            },
            {
                "id": "lh_p1_3",
                "name": "Side-Lying Clamshell with Neutral Spine",
                "description": "Lie on side with knees bent at 90 degrees. Rotate top knee upward while keeping pelvis vertically stacked and quiet.",
                "targetArea": "Gluteus Medius & Pelvic Stabilizers",
                "duration": "3 mins",
                "sets": 3,
                "repetitions": 12,
                "frequency": "1-2x daily",
                "difficulty": "gentle",
                "safetyNote": "Do not let hips roll backward during knee elevation.",
            },
        ]
        p2 = [
            {
                "id": "lh_p2_1",
                "name": "Bird-Dog Pattern with Dynamic Squares",
                "description": "From quadruped position, extend opposite arm and leg straight back. Draw a small square with the fingertips and toe before returning.",
                "targetArea": "Multifidus, Quadratus Lumborum & Glutes",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 8,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Maintain a horizontal glass of water on your lumbar spine.",
            },
            {
                "id": "lh_p2_2",
                "name": "Side Plank Progression (From Knees to Full)",
                "description": "Elevate hips from elbow and knees/feet, creating a straight line from shoulder to ankles. Engage obliques and glute medius.",
                "targetArea": "Lateral Core Chain & Quadratus Lumborum",
                "duration": "20-30s holds",
                "sets": 3,
                "repetitions": 3,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Do not let the top hip rotate forward or drop toward the mat.",
            },
        ]
        p3 = [
            {
                "id": "lh_p3_1",
                "name": "Pallof Press with Anti-Rotation Hold",
                "description": "Stand tall perpendicular to cable or resistance band. Press hands straight out from sternum, resisting rotational torque.",
                "targetArea": "Rotational Core Stability & Pelvic Alignment",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 10,
                "frequency": "3x weekly",
                "difficulty": "moderate",
                "safetyNote": "Keep ribcage locked over pelvis without arching lower back.",
            },
            {
                "id": "lh_p3_2",
                "name": "Suitcase Carry (Unilateral Offset Load)",
                "description": "Hold a kettlebell in one hand and walk 30 meters with upright posture, zero lateral trunk tilt.",
                "targetArea": "Unilateral Core & Hip Stability",
                "duration": "5 mins",
                "sets": 3,
                "repetitions": 3,
                "frequency": "3x weekly",
                "difficulty": "advanced",
                "safetyNote": "Switch sides evenly; stop if lateral spinal deviation occurs.",
            },
        ]
        p4 = [
            {
                "id": "lh_p4_1",
                "name": "Dynamic Hip Hinge & Kettlebell Swings",
                "description": "Perform explosive hip extension swings focusing on posterior chain power and rigid trunk stiffness at terminal extension.",
                "targetArea": "Gluteus Power & Posterior Kinetic Chain",
                "duration": "6 mins",
                "sets": 4,
                "repetitions": 12,
                "frequency": "2x weekly",
                "difficulty": "advanced",
                "safetyNote": "Power comes exclusively from hips snapping forward, not arms lifting.",
            },
            {
                "id": "lh_p4_2",
                "name": f"Multi-Planar Athletic Movement ({sport or 'Dynamic'})",
                "description": "Rotational medicine ball throws and decelerative lunges mimicking real sport mechanics.",
                "targetArea": "Full Kinetic Chain Integration",
                "duration": "8 mins",
                "sets": 3,
                "repetitions": 8,
                "frequency": "2x weekly",
                "difficulty": "advanced",
                "safetyNote": "Ensure core brace remains intact throughout rotational velocities.",
            },
        ]

    # ── 3. SHOULDER & ARM PROTOCOLS ────────────────────────────────────────
    elif region == "shoulder_arm":
        p1 = [
            {
                "id": "sa_p1_1",
                "name": "Pendulum Swings & Gentle Scapular Glides",
                "description": "Lean forward supporting torso with uninvolved arm. Allow affected arm to hang freely and sway in small gentle circles.",
                "targetArea": "Glenohumeral Joint Capsule & Supraspinatus",
                "duration": "2 mins",
                "sets": 2,
                "repetitions": 15,
                "frequency": "2x daily",
                "difficulty": "gentle",
                "safetyNote": "Let gravity do the work; do not use muscular effort to swing.",
            },
            {
                "id": "sa_p1_2",
                "name": "Side-Lying External Rotation (Towel Support)",
                "description": "Lie on unaffected side with towel roll under elbow. Slowly rotate forearm upward against gravity within comfortable range.",
                "targetArea": "Infraspinatus & Teres Minor",
                "duration": "3 mins",
                "sets": 3,
                "repetitions": 10,
                "frequency": "1-2x daily",
                "difficulty": "gentle",
                "safetyNote": "Keep elbow pinned to the towel roll at 90 degrees.",
            },
        ]
        p2 = [
            {
                "id": "sa_p2_1",
                "name": "Prone Y-T-W Scapular Retractions",
                "description": "Lie prone on mat or bench. Raise arms into Y, T, and W positions with thumbs pointing up, squeezing shoulder blades down and back.",
                "targetArea": "Lower Trapezius & Rhomboids",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 8,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Avoid shrugging shoulders toward ears; initiate from lower scapula.",
            },
            {
                "id": "sa_p2_2",
                "name": "Serratus Wall Slides with Foam Roller",
                "description": "Place forearms on a foam roller against wall in staggered stance. Roll upward while pressing forearms gently outward.",
                "targetArea": "Serratus Anterior & Scapulohumeral Rhythm",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 10,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Do not arch lower back as arms reach full upward extension.",
            },
        ]
        p3 = [
            {
                "id": "sa_p3_1",
                "name": "Half-Kneeling Landmine Overhead Press",
                "description": "In half-kneeling stance, press angled barbell upward and forward. Reach tall at top to engage upward scapular rotation.",
                "targetArea": "Anterior Deltoid & Core Anti-Extension",
                "duration": "5 mins",
                "sets": 3,
                "repetitions": 8,
                "frequency": "3x weekly",
                "difficulty": "moderate",
                "safetyNote": "Keep glute squeezed on trailing leg to lock pelvic neutral.",
            },
            {
                "id": "sa_p3_2",
                "name": "Cable Face Pull with External Rotation",
                "description": "Pull rope attachment toward eyes, then rotate hands upward so knuckles face ceiling at peak contraction.",
                "targetArea": "Rear Deltoid & Posterior Rotator Cuff",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 12,
                "frequency": "3x weekly",
                "difficulty": "moderate",
                "safetyNote": "Pause for 1 full second in terminal external rotation.",
            },
        ]
        p4 = [
            {
                "id": "sa_p4_1",
                "name": "Plyometric Medicine Ball Chest Passes & Rebounds",
                "description": "Stand 4 feet from solid wall. Perform rapid chest passes catching on the rebound with smooth decelerative absorption.",
                "targetArea": "Upper Extremity Power & Joint Deceleration",
                "duration": "5 mins",
                "sets": 4,
                "repetitions": 10,
                "frequency": "2x weekly",
                "difficulty": "advanced",
                "safetyNote": "Use a light ball (2-4 kg) and focus on velocity over load.",
            },
        ]

    # ── 4. LOWER LEG & ANKLE PROTOCOLS ─────────────────────────────────────
    elif region == "lower_leg_ankle":
        p1 = [
            {
                "id": "la_p1_1",
                "name": "Ankle Alphabet & Multi-Planar Mobility",
                "description": "Elevate foot and trace the full alphabet with big toe to promote synovial fluid circulation across talocrural and subtalar joints.",
                "targetArea": "Talocrural Joint & Ankle Capsule",
                "duration": "3 mins",
                "sets": 2,
                "repetitions": 1,
                "frequency": "2x daily",
                "difficulty": "gentle",
                "safetyNote": "Move solely from the ankle joint, keeping shin still.",
            },
            {
                "id": "la_p1_2",
                "name": "Banded Isometric Inversion / Eversion",
                "description": "Anchor resistance band and press foot outward and inward against steady light resistance, holding 10 seconds per rep.",
                "targetArea": "Peroneals & Posterior Tibialis",
                "duration": "3 mins",
                "sets": 3,
                "repetitions": 8,
                "frequency": "1x daily",
                "difficulty": "gentle",
                "safetyNote": "Focus on controlled isometric hold rather than explosive range.",
            },
        ]
        p2 = [
            {
                "id": "la_p2_1",
                "name": "Bilateral Eccentric Calf Heel Drops",
                "description": "Rise up on both toes on edge of a step, shift weight, and lower heels below step level under 4-second eccentric descent.",
                "targetArea": "Gastrocnemius & Achilles Tendon",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 12,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Perform with knees straight for gastrocnemius, knees bent for soleus.",
            },
            {
                "id": "la_p2_2",
                "name": "Single-Leg Balance on Foam Pad (Eyes Open/Closed)",
                "description": "Stand on one leg on an unstable surface with slight knee bend. Maintain balance while minimizing ankle tremors.",
                "targetArea": "Somatosensory Ankle Proprioceptors",
                "duration": "30s holds",
                "sets": 3,
                "repetitions": 3,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Position near a wall or chair for light balance support if needed.",
            },
        ]
        p3 = [
            {
                "id": "la_p3_1",
                "name": "Tibialis Anterior Toe Raises (Loaded/Elevated)",
                "description": "Lean back against wall with heels 12 inches away. Pull toes toward shins as high as possible, holding 1 second at top.",
                "targetArea": "Tibialis Anterior & Deceleration Brake",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 15,
                "frequency": "3x weekly",
                "difficulty": "moderate",
                "safetyNote": "Strengthens the primary shock-absorption muscle for foot strike.",
            },
        ]
        p4 = [
            {
                "id": "la_p4_1",
                "name": "Pogo Hops & Multi-Directional Line Drills",
                "description": "Rapid, rhythmic vertical hops on the balls of feet with minimal ground contact time, mimicking Achilles spring mechanics.",
                "targetArea": "Achilles Elastic Energy Recoil & Foot Stiffness",
                "duration": "5 mins",
                "sets": 4,
                "repetitions": 15,
                "frequency": "2-3x weekly",
                "difficulty": "advanced",
                "safetyNote": "Hips and knees stay relatively stiff; bounce comes from ankle spring.",
            },
        ]

    # ── 5. GENERAL KINETIC CHAIN PROTOCOLS ─────────────────────────────────
    else:
        p1 = [
            {
                "id": "kc_p1_1",
                "name": "90/90 Breathing with Diaphragmatic Down-Regulation",
                "description": "Lie supine with feet on a chair at 90-degree hip and knee angles. Inhale through nose for 4s, exhale fully for 6s.",
                "targetArea": "Autonomic Nervous System & Core Baseline",
                "duration": "5 mins",
                "sets": 1,
                "repetitions": 1,
                "frequency": "Daily",
                "difficulty": "gentle",
                "safetyNote": "Promotes parasympathetic nervous system recovery and HRV elevation.",
            },
            {
                "id": "kc_p1_2",
                "name": "World's Greatest Stretch (Thoracic & Hip Mobility)",
                "description": "Step into a deep lunge with hands inside front foot. Rotate torso upward reaching arm toward ceiling, then drive hips back for hamstring stretch.",
                "targetArea": "Thoracic Spine, Hip Flexors & Adductors",
                "duration": "4 mins",
                "sets": 2,
                "repetitions": 6,
                "frequency": "1-2x daily",
                "difficulty": "gentle",
                "safetyNote": "Move smoothly without bouncing at end ranges.",
            },
        ]
        p2 = [
            {
                "id": "kc_p2_1",
                "name": "Deadbug with Opposite Limb Reach",
                "description": "Lie supine with arms pointing up and knees at 90 degrees. Extend opposite arm and leg while maintaining abdominal brace against the floor.",
                "targetArea": "Anterior Core & Cross-Body Kinetic Chain",
                "duration": "4 mins",
                "sets": 3,
                "repetitions": 10,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Do not let the lumbar spine lift off the ground.",
            },
            {
                "id": "kc_p2_2",
                "name": "Half-Kneeling Hip Flexor Stretch with Overhead Reach",
                "description": "Tuck pelvis under (posterior tilt), squeeze glute on trailing leg, and gently reach arm overhead to lengthen psoas without hyperextending back.",
                "targetArea": "Psoas, Rectus Femoris & Anterior Hip Capsule",
                "duration": "45s holds",
                "sets": 3,
                "repetitions": 2,
                "frequency": "1x daily",
                "difficulty": "moderate",
                "safetyNote": "Squeeze the trailing glute actively before shifting forward.",
            },
        ]
        p3 = [
            {
                "id": "kc_p3_1",
                "name": "Goblet Squat with 3-Second Isometric Bottom Pause",
                "description": "Hold a light weight at chest. Squat to comfortable depth, pause for 3 seconds while maintaining tall posture, and drive up smoothly.",
                "targetArea": "Lower Extremity Strength & Core Stability",
                "duration": "5 mins",
                "sets": 3,
                "repetitions": 8,
                "frequency": "3x weekly",
                "difficulty": "moderate",
                "safetyNote": "Keep knees tracking over toes with weight balanced across full foot.",
            },
        ]
        p4 = [
            {
                "id": "kc_p4_1",
                "name": "Medicine Ball Rotational Slams & Reactive Shuttles",
                "description": "Perform explosive overhead and rotational slams followed by 10-meter deceleration agility shuttle runs.",
                "targetArea": "Full Body Power & Return to Training",
                "duration": "8 mins",
                "sets": 4,
                "repetitions": 6,
                "frequency": "2x weekly",
                "difficulty": "advanced",
                "safetyNote": "Ensure clean form throughout high-velocity repetitions.",
            },
        ]

    # Combine into 4 phases structure
    phases = [
        {
            "id": f"phase_{region}_1",
            "phaseNumber": 1,
            "name": "Phase 1",
            "title": "Phase 1",
            "subtitle": "Preparation & Tissue Offloading",
            "status": "active",
            "duration": "Days 1–3",
            "summary": "Focuses on gentle passive and active range of motion, reducing localized tension, and down-regulating the autonomic nervous system.",
            "activities": p1,
        },
        {
            "id": f"phase_{region}_2",
            "phaseNumber": 2,
            "name": "Phase 2",
            "title": "Phase 2",
            "subtitle": "Isometric Activation & Controlled Reload",
            "status": "locked",
            "duration": "Days 4–7",
            "summary": "Introduces low-strain isometric holds, postural stability drills, and joint stabilization to safely recondition muscle fibers.",
            "activities": p2,
        },
        {
            "id": f"phase_{region}_3",
            "phaseNumber": 3,
            "name": "Phase 3",
            "title": "Phase 3",
            "subtitle": "Dynamic Conditioning & Kinetic Strength",
            "status": "locked",
            "duration": "Week 2",
            "summary": "Builds multi-planar movement tolerance, eccentric loading capacity, and kinetic chain coordination under controlled resistance.",
            "activities": p3,
        },
        {
            "id": f"phase_{region}_4",
            "phaseNumber": 4,
            "name": "Phase 4",
            "title": "Phase 4",
            "subtitle": "Sport Reconditioning & Return to Play",
            "status": "locked",
            "duration": "Week 3+",
            "summary": f"Progressive velocity and reactive reload drills calibrated to {sport or 'athletic'} movement demands and ML recovery readiness.",
            "activities": p4,
        },
    ]

    return phases


def generate_personalized_recovery_plan(user_id: str, db: Session) -> Dict[str, Any]:
    """Generate a fully personalized 4-phase recovery plan based on Supabase athlete profile, assessments, and check-ins."""

    # 1. Fetch athlete profile
    profile_data: Dict[str, Any] = {}
    if is_valid_uuid(user_id):
        try:
            p_row = db.execute(
                text("SELECT full_name, primary_sport, custom_sport, activity_level, training_frequency, has_previous_injuries FROM public.profiles WHERE id = :uid"),
                {"uid": str(user_id)},
            ).fetchone()
            if p_row:
                profile_data = {
                    "full_name": p_row[0],
                    "primary_sport": p_row[2] if (p_row[1] == "other" and p_row[2]) else p_row[1],
                    "activity_level": p_row[3],
                    "training_frequency": p_row[4],
                    "has_previous_injuries": p_row[5],
                }
        except Exception as e:
            print("[generate_plan] Profile query error:", e)

    sport = profile_data.get("primary_sport") or "Athletic Training"

    # 2. Fetch latest assessment
    assessment_data: Dict[str, Any] = {}
    if is_valid_uuid(user_id):
        try:
            a_row = db.execute(
                text("SELECT id, activity, body_areas, pain_severity, symptoms, duration, movement_limitation, created_at FROM public.assessments WHERE user_id = :uid ORDER BY created_at DESC LIMIT 1"),
                {"uid": str(user_id)},
            ).fetchone()
            if a_row:
                assessment_data = {
                    "id": str(a_row[0]),
                    "activity": a_row[1],
                    "body_areas": a_row[2] or [],
                    "pain_severity": a_row[3] if a_row[3] is not None else 3,
                    "symptoms": a_row[4] or [],
                    "duration": a_row[5] or "1-3_days",
                    "movement_limitation": a_row[6] or "none",
                }
        except Exception as e:
            print("[generate_plan] Assessment query error:", e)

    body_areas = assessment_data.get("body_areas") or []
    pain_level = assessment_data.get("pain_severity", 3)
    region_category = get_anatomy_category(body_areas)

    # 3. Fetch latest recovery check-in and compute ML score
    latest_checkin = None
    prediction = None
    if is_valid_uuid(user_id):
        try:
            latest_checkin = (
                db.query(RecoveryCheckin)
                .filter(RecoveryCheckin.user_id == str(user_id))
                .order_by(RecoveryCheckin.created_at.desc())
                .first()
            )
            if latest_checkin:
                prediction = predict_recovery_for_checkin(
                    user_id=user_id,
                    sleep_hours=latest_checkin.sleep_hours,
                    resting_heart_rate=latest_checkin.resting_heart_rate,
                    hrv_ms=latest_checkin.hrv_ms,
                    soreness=latest_checkin.soreness,
                    energy_level=latest_checkin.energy_level,
                    db=db,
                )
        except Exception as e:
            print("[generate_plan] Check-in query error:", e)

    readiness_score = prediction["score"] if prediction else 55.0
    readiness_tier = prediction["tier"] if prediction else "moderate"

    # 4. Generate structured 4-phase activities
    phases = build_phase_activities(
        region=region_category,
        sport=sport,
        pain_level=pain_level,
        readiness_score=readiness_score,
    )

    total_activities = sum(len(p["activities"]) for p in phases)

    # 5. Build tailored safety guidelines grounded in real assessment data
    guidelines = [
        f"Perform all exercises in a pain-free envelope (discomfort ≤ {min(2, pain_level)}/10). If pain spikes, regress immediately.",
        f"Calibrate movement tempo to your current {sport} recovery demands: 3s eccentric, 1s isometric pause, smooth concentric.",
        "Ensure adequate systemic hydration (2.5–3L daily) and target 7.5–9.0 hours of uninterrupted sleep for physiological rebuilding.",
        "Consult a licensed physical therapist or sports medicine physician if symptoms persist, worsen, or impede daily ambulation.",
    ]

    plan_id = f"plan_{user_id}_{region_category}" if user_id else f"plan_local_{uuid.uuid4().hex[:8]}"

    return {
        "id": plan_id,
        "user_id": str(user_id),
        "status": "active",
        "currentPhaseNumber": 1,
        "totalPhases": len(phases),
        "overallProgressPct": 0,
        "estimatedDuration": "14–21 Days",
        "primarySport": sport,
        "targetAreas": body_areas if body_areas else ["General Kinetic Chain"],
        "phases": phases,
        "safetyGuidelines": guidelines,
        "recoveryScore": readiness_score,
        "readinessTier": readiness_tier,
        "disclaimer": (
            "REVORA provides evidence-based sports wellness and active recovery protocols. "
            "This is not a clinical medical diagnosis or prescription. Consult a licensed clinician for clinical rehabilitation."
        ),
    }
