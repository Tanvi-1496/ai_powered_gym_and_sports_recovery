/**
 * textSimplifier.ts
 * Utility functions to translate technical medical and AI terminology into
 * clear, everyday English for athletes and gym users.
 */

/**
 * Simplifies technical contributing factor strings into plain English.
 * e.g., "Restricted sleep (4.0h)" -> "Low sleep: 4 hours"
 * e.g., "High localized soreness (9/10)" -> "High muscle soreness: 9/10"
 * e.g., "Low perceived energy (3/10)" -> "Low energy: 3/10"
 */
export function simplifyFactorText(factor: string): string {
  if (!factor) return "";
  let text = factor.trim();

  // Sleep
  text = text.replace(/restricted sleep\s*\(([0-9.]+)\s*h\)/i, "Low sleep: $1 hours");
  text = text.replace(/optimal sleep duration\s*\(([0-9.]+)\s*h\)/i, "Good sleep: $1 hours");
  text = text.replace(/sleep duration\s*\(([0-9.]+)\s*h\)/i, "Sleep: $1 hours");

  // Soreness
  text = text.replace(/high localized soreness\s*\(([0-9]+)\/10\)/i, "High muscle soreness: $1/10");
  text = text.replace(/minimal muscle soreness\s*\(([0-9]+)\/10\)/i, "Low muscle soreness: $1/10");
  text = text.replace(/severe localized pain\s*\(([0-9]+)\/10\)/i, "Severe pain: $1/10");
  text = text.replace(/moderate localized pain\s*\(([0-9]+)\/10\)/i, "Moderate pain: $1/10");
  text = text.replace(/mild discomfort\s*\(([0-9]+)\/10\)/i, "Mild discomfort: $1/10");

  // Energy
  text = text.replace(/low perceived energy\s*\(([0-9]+)\/10\)/i, "Low energy: $1/10");
  text = text.replace(/high perceived energy\s*\(([0-9]+)\/10\)/i, "High energy: $1/10");

  // Heart rate
  text = text.replace(/low resting heart rate\s*\(([0-9]+)\s*bpm\)/i, "Low resting heart rate: $1 bpm");
  text = text.replace(/elevated resting heart rate\s*\(([0-9]+)\s*bpm\)/i, "Elevated resting heart rate: $1 bpm");

  // HRV
  text = text.replace(/strong parasympathetic hrv tone\s*\(([0-9.]+)\s*ms\)/i, "Good HRV: $1 ms");
  text = text.replace(/depressed hrv\s*\(([0-9.]+)\s*ms\)/i, "Low HRV: $1 ms");

  // Workload / ACWR
  text = text.replace(/elevated acwr ratio\s*\(([0-9.]+)\)/i, "Recent training spike");
  text = text.replace(/under-prepared acwr\s*\(([0-9.]+)\)/i, "Reduced recent training");
  text = text.replace(/high session intensity\s*\(([0-9]+)\/10\)/i, "High workout intensity: $1/10");

  // Movement limitation
  text = text.replace(/movement restriction:\s*yes/i, "Movement is limited");
  text = text.replace(/movement restriction:\s*mild/i, "Mild movement limitation");
  text = text.replace(/movement restriction:\s*([a-zA-Z0-9_\s]+)/i, "Limited movement: $1");

  // Duration
  text = text.replace(/prolonged symptom duration\s*\(([^)]+)\)/i, "Symptoms lasting $1");
  text = text.replace(/<1_day/g, "less than 24 hours");
  text = text.replace(/1-3_days/g, "1–3 days");
  text = text.replace(/4-7_days/g, "4–7 days");
  text = text.replace(/1-2_weeks/g, "1–2 weeks");
  text = text.replace(/>2_weeks/g, "more than 2 weeks");
  text = text.replace(/2\+_weeks/g, "more than 2 weeks");

  return text;
}

/**
 * Maps technical restriction codes (e.g., "RESTRICT_OVERHEAD") to human-friendly phrases.
 */
export function formatRestrictionCode(code: string): string {
  if (!code) return "";
  const upper = code.toUpperCase().trim();
  const map: Record<string, string> = {
    RESTRICT_OVERHEAD: "Avoid overhead lifting",
    RESTRICT_DEEP_FLEXION: "Avoid deep knee bends",
    RESTRICT_IMPACT: "Avoid jumping & high impact",
    RESTRICT_AXIAL_LOAD: "Avoid heavy weights on spine",
    RESTRICT_SPINAL_FLEXION: "Avoid rounding lower back",
    RESTRICT_ECCENTRIC_STRAIN: "Avoid heavy muscle stretching",
    RESTRICT_ROTATION: "Avoid sharp twisting",
  };

  if (map[upper]) {
    return map[upper];
  }

  // Fallback for custom or unknown code: e.g. "RESTRICT_KNEE_STRESS" -> "Avoid knee stress"
  return upper
    .replace(/^RESTRICT_/, "Avoid ")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Rewrites technical anatomical target names into common body parts.
 */
export function formatTargetArea(area?: string): string {
  if (!area) return "General recovery";
  const map: Record<string, string> = {
    "Autonomic Nervous System & Core Baseline": "Relaxation & Core Breathing",
    "Thoracic Spine, Hip Flexors & Adductors": "Upper Back, Hips & Groin",
    "Quadriceps, Adductors & Joint Stabilizers": "Thighs & Knees",
    "Patellar Tendon & Quad Tendon": "Knee Tendons & Thighs",
    "Gluteus Maximus & Medius": "Glutes & Hips",
    "Vastus Medialis Oblique (VMO) & Ankle Mobility": "Inner Knee & Ankles",
    "Posterior Chain & Knee Deceleration": "Hamstrings & Glutes",
    "Reactive Knee Stability & Dynamic Control": "Knee Stability & Landing",
    "Kinetic Chain Power & Return to Sport": "Full Body Movement",
    "Deep Core Stabilizers & Anterior Kinetic Chain": "Core & Abs",
    "Thoracolumbar Fascia & Segmental Mobility": "Back Flexibility & Spine",
    "Gluteus Medius & Pelvic Stabilizers": "Hips & Pelvis",
    "Psoas, Rectus Femoris & Anterior Hip Capsule": "Hip Flexors & Front of Hips",
    "Hip Flexors & VMO": "Hips & Inner Knee",
    "Rotator Cuff (External Rotators) & Scapular Stabilizers": "Shoulders & Upper Back",
    "Glenohumeral Joint Decoupling & Posterior Capsule": "Shoulder Mobility & Relief",
    "Serratus Anterior & Scapular Upward Rotation": "Shoulder Blade Control",
    "Rotator Cuff Dynamic Stability": "Shoulder Stability",
    "Rotator Cuff & Deltoid Deceleration": "Shoulder Endurance & Control",
    "Overhead Kinetic Chain Integration": "Overhead Movement Control",
    "Anterior Core & Cross-Body Kinetic Chain": "Core & Stability",
    "Lower Extremity Strength & Core Stability": "Legs & Core",
    "Full Body Power & Return to Training": "Full Body Strength",
  };

  return map[area] || area.replace(/_/g, " ");
}

/**
 * Rewrites complicated medical exercise purposes or descriptions into simple explanations of why they help.
 */
export function simplifyExerciseBenefit(text?: string): string {
  if (!text) return "Supports healthy movement and recovery.";
  let s = text.trim();

  // Known clinical phrasing replacements
  s = s.replace(/promotes parasympathetic nervous system recovery and hrv elevation\.?/i, "Helps you relax and may support recovery.");
  s = s.replace(/patellar tendon analgesia and quadriceps isometric recruitment with reduced patellofemoral joint shear\.?/i, "Relieves knee pain and strengthens front thigh muscles with low joint pressure.");
  s = s.replace(/quadriceps activation and anterior kinetic chain control without patellofemoral compressive contact pressure\.?/i, "Strengthens thigh muscles safely without placing pressure on the kneecap.");
  s = s.replace(/vastus medialis oblique \(vmo\) recruitment through terminal 0-30 degrees of knee extension\.?/i, "Strengthens inner knee muscles through gentle straightening.");
  s = s.replace(/maintains tendon compliance with minimal patellofemoral joint stress\.?/i, "Supports knee tendon recovery with minimal joint pressure.");
  s = s.replace(/move smoothly without bouncing at end ranges\.?/i, "Move slowly and avoid bouncing.");
  s = s.replace(/perform all exercises in a pain-free envelope \(discomfort ≤ [0-9]+\/10\)\. If pain spikes, regress immediately\.?/i, "Stop or make the movement easier if pain goes above 2/10.");

  return s;
}

/**
 * Simplifies safety tips and notes into clear, short instructions.
 */
export function simplifySafetyNote(note?: string): string {
  if (!note) return "";
  let s = note.trim();

  s = s.replace(/promotes parasympathetic nervous system recovery and hrv elevation\.?/i, "Helps you relax and may support recovery.");
  s = s.replace(/move smoothly without bouncing at end ranges\.?/i, "Move slowly and avoid bouncing.");
  s = s.replace(/perform all exercises in a pain-free envelope \(discomfort ≤ [0-9]+\/10\)\. If pain spikes, regress immediately\.?/i, "Stop or make the movement easier if pain goes above 2/10.");
  s = s.replace(/maintains tendon compliance with minimal patellofemoral joint stress\.?/i, "Builds tendon strength with minimal joint pressure.");
  s = s.replace(/keep shins as vertical as possible to minimize patellofemoral compressive reaction force\.?/i, "Keep your shins upright to reduce pressure on the kneecap.");
  s = s.replace(/do not push into sharp pinching pain; terminate if discomfort exceeds [0-9]+\/10\.?/i, "Stop if you feel sharp pain above 2/10.");

  return s;
}

/**
 * Rewrites exercise instructions into short, easy-to-follow sentences.
 */
export function simplifyInstructions(instructions?: string[] | string): string[] {
  if (!instructions) return [];

  const list: string[] = Array.isArray(instructions)
    ? instructions
    : instructions.split("\n").filter((l) => l.trim().length > 0);

  return list.map((step) => {
    let s = step.trim();
    s = s.replace(/move smoothly without bouncing at end ranges\.?/i, "Move slowly and avoid bouncing.");
    s = s.replace(/maintain steady diaphragmatic breathing\.?/i, "Breathe slowly and deeply.");
    s = s.replace(/breathe rhythmically throughout the hold, then smoothly rise to standing\.?/i, "Breathe steadily during the hold, then slowly stand up.");
    s = s.replace(/lower under control over 2-3 seconds\.?/i, "Lower slowly over 2 to 3 seconds.");
    s = s.replace(/maintain active quadriceps lockout throughout the ascent and descent\.?/i, "Keep your thigh muscle engaged throughout the movement.");
    s = s.replace(/keep lumbar spine neutral against the mat without compensatory arching\.?/i, "Keep your lower back flat and comfortable against the floor.");
    s = s.replace(/ensure silent, spring-like landings with zero lateral wobble\.?/i, "Land softly on your feet without wobbling.");
    s = s.replace(/do not push into sharp pinching pain; terminate if discomfort exceeds [0-9]+\/10\.?/i, "Stop if you feel sharp pain above 2/10.");
    return s;
  });
}

/**
 * Formats triage levels into plain English status banners.
 */
export function formatTriageHeading(urgency: string, triageLevel?: string): { title: string; subtitle: string } {
  if (urgency === "urgent_medical" || triageLevel === "emergency") {
    return {
      title: "Immediate Medical Care Needed",
      subtitle: "Your reported symptoms indicate you should pause exercising and see a healthcare provider right away.",
    };
  }
  if (urgency === "clinical_evaluation" || triageLevel === "prompt_medical_assessment") {
    return {
      title: "Medical Checkup Recommended",
      subtitle: "Having a doctor or physical therapist check your condition is recommended before continuing training.",
    };
  }
  return {
    title: "Standard Guidance — Gentle Exercises Allowed",
    subtitle: "You are cleared for gentle, tailored recovery exercises.",
  };
}

/**
 * Generates an easy-to-understand plain English summary for the Recovery Score.
 * e.g., "Your recovery score is 46/100. Poor sleep, low energy, and muscle soreness may be affecting your recovery."
 */
export function getRecoveryScoreExplanation(score: number, factors?: string[]): string {
  const parts: string[] = [];

  if (factors && factors.length > 0) {
    const simplified = factors.map((f) => simplifyFactorText(f).toLowerCase());
    const negatives = simplified.filter(
      (f) => f.includes("low sleep") || f.includes("high muscle soreness") || f.includes("low energy") || f.includes("elevated resting") || f.includes("low hrv")
    );
    const positives = simplified.filter(
      (f) => f.includes("good sleep") || f.includes("low muscle soreness") || f.includes("high energy") || f.includes("low resting") || f.includes("good hrv")
    );

    if (score < 50 && negatives.length > 0) {
      parts.push(`${negatives.slice(0, 3).join(", ")} may be affecting your recovery.`);
    } else if (score >= 75 && positives.length > 0) {
      parts.push(`${positives.slice(0, 3).join(", ")} indicate your body is well-rested.`);
    } else if (negatives.length > 0) {
      parts.push(`Factors like ${negatives.slice(0, 2).join(" and ")} are influencing your score.`);
    }
  }

  if (parts.length === 0) {
    if (score >= 75) {
      parts.push("Your body appears well-rested and ready for regular training.");
    } else if (score >= 50) {
      parts.push("You have moderate recovery. Warm up thoroughly and listen to your body.");
    } else {
      parts.push("Higher fatigue is present. Consider lighter activity or active rest today.");
    }
  }

  return `Your recovery score is ${score}/100. ${parts.join(" ")}`;
}
