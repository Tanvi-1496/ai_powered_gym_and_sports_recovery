import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getStoredUser, saveAuthSession, type UserProfile } from "./auth";

export interface AthleteProfileData {
  full_name: string;
  date_of_birth: string;
  gender?: string;
  primary_sport: string;
  custom_sport?: string;
  activity_level: "beginner" | "intermediate" | "advanced" | string;
  training_frequency: string;
  has_previous_injuries: boolean;
  injury_history_details?: string;
  current_training_details?: string;
}

export interface ProfileResponse {
  message: string;
  profile: AthleteProfileData;
  user?: UserProfile;
}

/**
 * Save or update athlete profile directly in Supabase PostgreSQL ('profiles' table).
 */
export async function saveAthleteProfile(data: AthleteProfileData): Promise<ProfileResponse> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase credentials are not configured. Please check your .env.local file."
    );
  }

  // 1. Obtain current authenticated Supabase user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication required: No active user session found. Please log in again.");
  }

  console.log("[Supabase] Authenticated User ID for Profile Save:", user.id);

  // 2. Prepare database record mapped to public.profiles schema
  const profileRecord = {
    id: user.id,
    full_name: data.full_name,
    date_of_birth: data.date_of_birth,
    gender: data.gender || null,
    primary_sport: data.primary_sport,
    custom_sport: data.custom_sport || null,
    activity_level: data.activity_level,
    training_frequency: data.training_frequency,
    has_previous_injuries: Boolean(data.has_previous_injuries),
    injury_history_details: data.injury_history_details || null,
    current_training_details: data.current_training_details || null,
    updated_at: new Date().toISOString(),
  };

  // 3. Perform UPSERT into Supabase PostgreSQL 'profiles' table and verify response
  const { data: savedData, error: dbError } = await supabase
    .from("profiles")
    .upsert(profileRecord, { onConflict: "id" })
    .select()
    .single();

  if (dbError) {
    console.error("[Supabase Error] Database upsert failed:", {
      message: dbError.message,
      details: dbError.details,
      hint: dbError.hint,
      code: dbError.code,
    });

    const errorDetails = [
      dbError.message,
      dbError.details,
      dbError.hint ? `Hint: ${dbError.hint}` : null,
    ]
      .filter(Boolean)
      .join(" — ");

    throw new Error(`Database Save Failed [${dbError.code || "PG"}]: ${errorDetails}`);
  }

  console.log("[Supabase] Profile successfully saved to public.profiles table:", savedData);

  // 4. Update Supabase Auth user metadata for immediate client state
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: {
      full_name: data.full_name,
      is_profile_complete: true,
      profile_data: data,
    },
  });

  if (authUpdateError) {
    console.warn("[Supabase] Could not update Auth user metadata:", authUpdateError.message);
  }

  // 5. Update local session cache
  const currentUser = getStoredUser();
  const token =
    localStorage.getItem("revora_token") ||
    sessionStorage.getItem("revora_token") ||
    "";
  const isRemember = !sessionStorage.getItem("revora_token");

  if (currentUser) {
    currentUser.fullName = data.full_name;
    currentUser.isProfileComplete = true;
    saveAuthSession(token, currentUser, isRemember);
  }

  return {
    message: "Profile saved successfully.",
    profile: (savedData as unknown as AthleteProfileData) || data,
  };
}

/**
 * Fetch athlete profile data directly from Supabase PostgreSQL ('profiles' table).
 */
export async function getAthleteProfile(): Promise<AthleteProfileData | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    // 1. Query Supabase PostgreSQL 'profiles' table directly
    const { data: dbProfile, error: dbError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!dbError && dbProfile && dbProfile.primary_sport) {
      return dbProfile as AthleteProfileData;
    }

    // 2. Fallback to Supabase Auth user_metadata
    const metadataProfile = user.user_metadata?.profile_data as
      | AthleteProfileData
      | undefined;
    if (metadataProfile) {
      return metadataProfile;
    }

    return null;
  } catch (err) {
    console.error("[Supabase Error] Error fetching athlete profile:", err);
    return null;
  }
}
