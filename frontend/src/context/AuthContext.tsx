import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AthleteProfileData } from "@/services/profile";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: AthleteProfileData | null;
  isProfileComplete: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkProfileCompletion: (currentUser: User) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AthleteProfileData | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check whether a user has completed their profile
  const checkProfileCompletion = useCallback(async (currentUser: User): Promise<boolean> => {
    // 1. Check user metadata first for instant response
    const metadata = currentUser.user_metadata;
    if (metadata?.is_profile_complete === true && metadata?.profile_data) {
      setProfile(metadata.profile_data as AthleteProfileData);
      setIsProfileComplete(true);
      return true;
    }

    // 2. Query Supabase database 'profiles' table if configured
    if (isSupabaseConfigured) {
      try {
        const { data: dbProfile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (!error && dbProfile && dbProfile.primary_sport && dbProfile.activity_level) {
          setProfile(dbProfile as AthleteProfileData);
          setIsProfileComplete(true);
          return true;
        }
      } catch (err) {
        console.warn("Could not query profiles table:", err);
      }
    }

    setProfile(null);
    setIsProfileComplete(false);
    return false;
  }, []);

  // Refresh profile from Supabase
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await checkProfileCompletion(user);
  }, [user, checkProfileCompletion]);

  // Handle Supabase Auth Initialization & Subscription
  useEffect(() => {
    // Clean up any stale local fake token from previous versions
    const existingToken = localStorage.getItem("revora_token") || sessionStorage.getItem("revora_token");
    if (existingToken?.startsWith("local-token-")) {
      localStorage.removeItem("revora_token");
      sessionStorage.removeItem("revora_token");
      localStorage.removeItem("revora_user");
      sessionStorage.removeItem("revora_user");
    }

    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsProfileComplete(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Error retrieving session:", error.message);
        }

        if (isMounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            if (initialSession.access_token) {
              localStorage.setItem("revora_token", initialSession.access_token);
            }
            await checkProfileCompletion(initialSession.user);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsProfileComplete(false);
            localStorage.removeItem("revora_token");
            localStorage.removeItem("revora_user");
            sessionStorage.removeItem("revora_token");
            sessionStorage.removeItem("revora_user");
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          if (newSession.access_token) {
            localStorage.setItem("revora_token", newSession.access_token);
          }
          await checkProfileCompletion(newSession.user);
        } else if (event === "SIGNED_OUT" || !newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsProfileComplete(false);
          localStorage.removeItem("revora_token");
          localStorage.removeItem("revora_user");
          sessionStorage.removeItem("revora_token");
          sessionStorage.removeItem("revora_user");
        }

        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkProfileCompletion]);

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn("Sign out error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsProfileComplete(false);
      localStorage.removeItem("revora_token");
      localStorage.removeItem("revora_user");
      sessionStorage.removeItem("revora_token");
      sessionStorage.removeItem("revora_user");
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isProfileComplete,
        isLoading,
        signOut,
        refreshProfile,
        checkProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
