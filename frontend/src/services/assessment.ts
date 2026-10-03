import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AssessmentData {
  activity: string;
  custom_activity?: string;
  activity_context: string;
  onset_type: string;
  body_areas: string[];
  pain_severity: number;
  symptoms: string[];
  custom_symptom?: string;
  duration: string;
  movement_limitation: string;
  additional_details?: string;
}

export type AssessmentInput = AssessmentData;

export interface AssessmentRecord extends AssessmentData {
  id?: string;
  user_id: string;
  created_at: string;
  status?: string;
}

export interface AssessmentResult {
  success: boolean;
  message: string;
  assessmentId?: string;
  assessment: AssessmentRecord;
}

const ACTIVE_ASSESSMENT_KEY = "revora_active_assessment";

/**
 * Cache current assessment data in local session for instant Results view.
 */
export function saveActiveAssessment(data: AssessmentData): void {
  try {
    sessionStorage.setItem(ACTIVE_ASSESSMENT_KEY, JSON.stringify(data));
    localStorage.setItem(ACTIVE_ASSESSMENT_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Retrieve active assessment data from memory/storage.
 */
export function getActiveAssessment(): AssessmentData | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_ASSESSMENT_KEY) || localStorage.getItem(ACTIVE_ASSESSMENT_KEY);
    if (raw) {
      return JSON.parse(raw) as AssessmentData;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Clear cached active assessment.
 */
export function clearActiveAssessment(): void {
  try {
    sessionStorage.removeItem(ACTIVE_ASSESSMENT_KEY);
    localStorage.removeItem(ACTIVE_ASSESSMENT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Submit athlete injury assessment to Supabase PostgreSQL ('assessments' table).
 */
export async function submitAssessment(data: AssessmentData): Promise<AssessmentResult> {
  // Always save to active cache first so results view has immediate access
  saveActiveAssessment(data);

  let userId = "local-athlete";

  // Check Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        userId = user.id;
      }
    } catch {
      // fallback
    }
  }

  const assessmentRecord: AssessmentRecord = {
    id: `assess_${Date.now()}`,
    user_id: userId,
    activity: data.activity,
    custom_activity: data.custom_activity || undefined,
    activity_context: data.activity_context,
    onset_type: data.onset_type,
    body_areas: data.body_areas,
    pain_severity: Number(data.pain_severity),
    symptoms: data.symptoms,
    custom_symptom: data.custom_symptom || undefined,
    duration: data.duration,
    movement_limitation: data.movement_limitation,
    additional_details: data.additional_details || undefined,
    status: "completed",
    created_at: new Date().toISOString(),
  };

  let savedId: string | undefined = assessmentRecord.id;

  if (isSupabaseConfigured && userId !== "local-athlete") {
    // 1. Insert into Supabase PostgreSQL 'assessments' table
    try {
      const { data: dbResult, error: dbError } = await supabase
        .from("assessments")
        .insert([assessmentRecord])
        .select("id")
        .maybeSingle();

      if (!dbError && dbResult?.id) {
        savedId = dbResult.id;
      }
    } catch (err) {
      console.warn("[Supabase] Could not insert into assessments table directly:", err);
    }

    // 2. Persist latest assessment summary in Auth user metadata
    try {
      await supabase.auth.updateUser({
        data: {
          latest_assessment: {
            ...assessmentRecord,
            id: savedId,
          },
        },
      });
    } catch (authErr) {
      console.warn("[Supabase] Could not update Auth user metadata for assessment:", authErr);
    }

    // 3. Save to user-specific session cache
    try {
      const cacheKey = `revora_assessment_${userId}`;
      localStorage.setItem(cacheKey, JSON.stringify(assessmentRecord));
    } catch {
      // ignore
    }
  }

  // Always record to local history cache
  recordAssessmentToLocalHistory(assessmentRecord);

  return {
    success: true,
    message: "Assessment successfully recorded.",
    assessmentId: savedId,
    assessment: assessmentRecord,
  };
}

/**
 * Retrieve the latest assessment for the current athlete.
 */
export async function getLatestAssessment(): Promise<AssessmentRecord | null> {
  // 1. Check active session cache
  const active = getActiveAssessment();
  if (active) {
    return {
      ...active,
      user_id: "current-user",
      created_at: new Date().toISOString(),
    };
  }

  if (!isSupabaseConfigured) return null;

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    // 2. Try querying Supabase PostgreSQL 'assessments' table
    const { data: dbData, error: dbError } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!dbError && dbData) {
      return dbData as AssessmentRecord;
    }

    // 3. Fallback to Supabase Auth user_metadata
    const metadataAssessment = user.user_metadata?.latest_assessment as
      | AssessmentRecord
      | undefined;
    if (metadataAssessment) {
      return metadataAssessment;
    }

    // 4. Fallback to localStorage cache
    const cacheKey = `revora_assessment_${user.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AssessmentRecord;
    }

    return null;
  } catch (err) {
    console.error("[Supabase Error] Fetching latest assessment failed:", err);
    return null;
  }
}

const HISTORY_STORAGE_KEY = "revora_assessment_history";

/**
 * Retrieve full assessment history list for the active athlete.
 */
export async function getAssessmentHistory(): Promise<AssessmentRecord[]> {
  const historyList: AssessmentRecord[] = [];

  // 1. Try querying Supabase PostgreSQL 'assessments' table if configured
  if (isSupabaseConfigured) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user?.id) {
        const { data: dbRows, error: dbError } = await supabase
          .from("assessments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!dbError && dbRows && dbRows.length > 0) {
          return dbRows as AssessmentRecord[];
        }
      }
    } catch (err) {
      console.warn("[Supabase] Could not fetch assessments history:", err);
    }
  }

  // 2. Fallback to local session / local storage records
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as AssessmentRecord[];
      }
    }
  } catch {
    // ignore
  }

  // 3. If active assessment exists, include it as single entry
  const active = getActiveAssessment();
  if (active) {
    historyList.push({
      ...active,
      id: "active_session",
      user_id: "current-user",
      created_at: new Date().toISOString(),
      status: "completed",
    });
  }

  return historyList;
}

/**
 * Append an assessment to the persistent history cache.
 */
export function recordAssessmentToLocalHistory(record: AssessmentRecord): void {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const existing: AssessmentRecord[] = raw ? JSON.parse(raw) : [];
    // Deduplicate by ID
    const filtered = existing.filter((r) => r.id !== record.id);
    filtered.unshift(record);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch {
    // ignore
  }
}
