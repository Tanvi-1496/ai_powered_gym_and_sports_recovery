import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  isProfileComplete?: boolean;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  token: string;
  user: UserProfile;
  needsEmailConfirmation: boolean;
}

/**
 * Authenticate user with Email and Password using Supabase Auth.
 * Real login succeeds only when Supabase returns a valid user and session.
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  if (error) {
    const msg = error.message || "";
    const isNetworkErr =
      msg.includes("Failed to fetch") ||
      msg.includes("fetch failed") ||
      msg.includes("NetworkError");
    if (isNetworkErr) {
      throw new Error("Unable to reach authentication server. Please check your internet connection and try again.");
    }
    throw error;
  }

  if (!data?.user || !data?.session) {
    throw new Error("Authentication failed: No active user session was returned.");
  }

  let isProfileComplete = data.user.user_metadata?.is_profile_complete === true;

  if (!isProfileComplete) {
    try {
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("primary_sport, activity_level")
        .eq("id", data.user.id)
        .maybeSingle();

      if (dbProfile?.primary_sport && dbProfile?.activity_level) {
        isProfileComplete = true;
      }
    } catch {
      // Ignore database inspection error
    }
  }

  const fullName =
    data.user.user_metadata?.full_name ||
    data.user.user_metadata?.name ||
    credentials.email.split("@")[0];

  const userProfile: UserProfile = {
    id: data.user.id,
    email: data.user.email || credentials.email,
    fullName,
    isProfileComplete,
  };

  return {
    token: data.session.access_token,
    user: userProfile,
  };
}

/**
 * Register a new user account with Full Name, Email, and Password using Supabase Auth.
 */
export async function registerUser(credentials: RegisterCredentials): Promise<RegisterResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase credentials are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local."
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.fullName.trim(),
        is_profile_complete: false,
      },
    },
  });

  if (error) {
    const msg = error.message || "";
    const isNetworkErr =
      msg.includes("Failed to fetch") ||
      msg.includes("fetch failed") ||
      msg.includes("NetworkError");
    if (isNetworkErr) {
      throw new Error("Unable to reach authentication server. Please check your network connection.");
    }
    throw error;
  }

  if (!data.user) {
    throw new Error("Registration could not be completed. Please try again.");
  }

  const userProfile: UserProfile = {
    id: data.user.id,
    email: data.user.email || credentials.email,
    fullName: credentials.fullName.trim(),
    isProfileComplete: false,
  };

  const hasSession = Boolean(data.session?.access_token);
  const token = data.session?.access_token || "";

  return {
    token,
    user: userProfile,
    needsEmailConfirmation: !hasSession,
  };
}

/**
 * Request password reset email from Supabase Auth.
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase credentials are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local."
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/login`,
  });

  if (error) {
    throw error;
  }

  return { message: "Password reset instructions have been sent to your email." };
}

/**
 * Persist user authentication session based on rememberMe preference.
 */
export function saveAuthSession(token: string, user: UserProfile, remember: boolean = false): void {
  if (!token || token.startsWith("local-token-") || !user || user.id === "00000000-0000-0000-0000-000000000001") {
    return;
  }
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("revora_token", token);
  storage.setItem("revora_user", JSON.stringify(user));
}

/**
 * Retrieve current active user profile from storage.
 */
export function getStoredUser(): UserProfile | null {
  const token = localStorage.getItem("revora_token") || sessionStorage.getItem("revora_token");
  if (!token || token.startsWith("local-token-")) {
    localStorage.removeItem("revora_token");
    sessionStorage.removeItem("revora_token");
    localStorage.removeItem("revora_user");
    sessionStorage.removeItem("revora_user");
    return null;
  }
  const userStr = localStorage.getItem("revora_user") || sessionStorage.getItem("revora_user");
  if (!userStr) return null;
  try {
    const parsed = JSON.parse(userStr) as UserProfile;
    if (!parsed.id || parsed.id === "00000000-0000-0000-0000-000000000001") {
      localStorage.removeItem("revora_user");
      sessionStorage.removeItem("revora_user");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear stored authentication session and sign out from Supabase.
 */
export async function clearAuthSession(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out errors if already unauthenticated
    }
  }
  localStorage.removeItem("revora_token");
  localStorage.removeItem("revora_user");
  sessionStorage.removeItem("revora_token");
  sessionStorage.removeItem("revora_user");
}
