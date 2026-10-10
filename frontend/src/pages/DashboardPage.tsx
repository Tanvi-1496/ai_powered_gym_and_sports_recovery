import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  User,
  History,
  Settings,
  Sparkles,
  AlertCircle,
  RefreshCw,
  HeartPulse,
  Flame,
  CheckCircle2,
  ChevronRight,
  Clock,
  Moon,
  Zap,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import type { AthleteProfileData } from "@/services/profile";
import {
  getRecoveryCheckins,
  type RecoveryCheckin,
} from "@/services/recovery";
import { RecoveryForm } from "@/components/RecoveryForm";
import { GradientButton } from "@/components/ui/gradient-button";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, profile: contextProfile, refreshProfile } = useAuth();

  const [profile, setProfile] = useState<AthleteProfileData | null>(contextProfile);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [checkins, setCheckins] = useState<RecoveryCheckin[]>([]);
  const [loadingCheckins, setLoadingCheckins] = useState<boolean>(false);

  // Fetch checkins from backend
  const fetchCheckins = useCallback(async () => {
    try {
      setLoadingCheckins(true);
      const data = await getRecoveryCheckins();
      setCheckins(data);
    } catch (err) {
      console.warn("[Dashboard] Could not fetch recovery checkins:", err);
    } finally {
      setLoadingCheckins(false);
    }
  }, []);

  // Fetch real profile from Supabase PostgreSQL
  const fetchDashboardData = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Supabase credentials are not configured. Please check .env.local.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Unable to retrieve authenticated session. Please log in again.");
      }

      // 2. Retrieve user's profile from public.profiles
      const { data: dbProfile, error: dbError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (dbError) {
        console.error("[Supabase Error] Profile fetch failed:", dbError);
        throw new Error(dbError.message || "Failed to load athlete profile data.");
      }

      if (dbProfile) {
        setProfile(dbProfile as AthleteProfileData);
      } else if (user.user_metadata?.profile_data) {
        // Fallback to metadata if DB row not yet populated
        setProfile(user.user_metadata.profile_data as AthleteProfileData);
      } else {
        // If profile is completely missing, redirect to setup
        navigate("/profile-setup", { replace: true });
        return;
      }
    } catch (err: unknown) {
      console.error("[Dashboard] Error loading data:", err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unable to load your profile. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
    fetchCheckins();
  }, [fetchDashboardData, fetchCheckins]);

  // Sync with context profile if updated
  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile);
    }
  }, [contextProfile]);

  const handleRetry = () => {
    setIsRetrying(true);
    setIsLoading(true);
    refreshProfile();
    fetchDashboardData();
    fetchCheckins();
  };

  const handleCheckinSaved = (newCheckin: RecoveryCheckin) => {
    setCheckins((prev) => [newCheckin, ...prev.filter((c) => c.id !== newCheckin.id)]);
  };

  // Derive First Name from full name
  const fullName =
    profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    "Athlete";

  const firstName = fullName.trim().split(" ")[0] || "Athlete";

  // Format sport & activity details
  const displaySport =
    profile?.primary_sport === "other" && profile?.custom_sport
      ? profile.custom_sport
      : profile?.primary_sport
      ? profile.primary_sport.charAt(0).toUpperCase() + profile.primary_sport.slice(1)
      : "Not specified";

  const displayActivityLevel = profile?.activity_level
    ? profile.activity_level.charAt(0).toUpperCase() + profile.activity_level.slice(1)
    : "Not specified";

  const displayFrequency = profile?.training_frequency || "Not specified";

  // ── Polished Loading State (Skeleton) ──────────────────────────────────
  if (isLoading && !profile) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <div className="h-8 w-64 bg-[#21183A] rounded-xl" />
            <div className="h-4 w-96 bg-[#18132D] rounded-lg" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-64 bg-[#18132D] rounded-3xl border border-[#7C3AED]/20" />
            <div className="lg:col-span-4 h-64 bg-[#18132D] rounded-3xl border border-[#7C3AED]/20" />
            <div className="lg:col-span-6 h-56 bg-[#18132D] rounded-3xl border border-[#7C3AED]/20" />
            <div className="lg:col-span-6 h-56 bg-[#18132D] rounded-3xl border border-[#7C3AED]/20" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        {/* ── Error Banner with Retry ──────────────────────────────────── */}
        {error && (
          <div
            className="p-4 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200"
            role="alert"
          >
            <div className="flex items-center gap-3 text-[#FF6B6B]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Unable to load your profile</p>
                <p className="text-xs text-[#E9E2F5]/80 mt-0.5">{error}</p>
              </div>
            </div>

            <GradientButton
              onClick={handleRetry}
              disabled={isRetrying}
              variant="variant"
              className="min-w-0 px-4 py-2 rounded-xl text-xs font-bold shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRetrying ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </GradientButton>
          </div>
        )}

        {/* ── 4. Dashboard Header ──────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#7C3AED]/15">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                Athlete Telemetry Hub
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
              Welcome back, <span className="text-gradient-coral-peach">{firstName}</span>
            </h1>

            <p className="mt-1 text-sm sm:text-base font-semibold text-[#E9E2F5]">
              Stay consistent. Recover smarter. Train safer.
            </p>

            <p className="mt-1 text-xs sm:text-sm text-[#B8AEC8] max-w-2xl">
              Track your daily recovery metrics, understand your physiological readiness, and optimize training load.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="#daily-recovery-checkin"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#21183A]/90 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/40 text-xs sm:text-sm font-bold text-[#FDBA8C] hover:text-[#FFFDF9] transition-all shadow-md"
            >
              <HeartPulse className="w-4 h-4 text-[#F97368]" />
              <span>Daily Check-in</span>
            </a>

            <GradientButton asChild className="min-w-0 px-5 py-2.5 text-xs sm:text-sm font-bold">
              <Link to="/assessment">
                <Activity className="w-4 h-4 mr-2" />
                <span>New Assessment</span>
              </Link>
            </GradientButton>
          </div>
        </div>

        {/* ── Main Dashboard Cards Grid ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── 5. Primary CTA Card (Hero Assessment Banner) ───────────── */}
          <div className="lg:col-span-8 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#1E1538]/85 via-[#18132D]/80 to-[#120D26]/85 backdrop-blur-md border border-[#8B5CF6]/35 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
            {/* Ambient Background Glows */}
            <div
              className="absolute -top-24 -right-24 w-64 h-64 bg-[#F97368]/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#F97368]/30 transition-all duration-500"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#7C3AED]/25 rounded-full blur-[90px] pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#8B5CF6]/30 text-xs font-bold text-[#FDBA8C]">
                <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
                <span>AI Biomechanical Triage</span>
              </div>

              <div className="space-y-2 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
                  Start New Assessment
                </h2>
                <p className="text-sm sm:text-base text-[#E9E2F5] leading-relaxed">
                  Tell us what you&apos;re experiencing and get a preliminary injury-risk assessment.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#B8AEC8]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  2-Minute Symptom Check
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#F97368]" />
                  Adaptive Risk Scoring
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#FDBA8C]" />
                  Clinical Red Flag Filter
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <GradientButton asChild className="px-6 py-3.5 text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 group/btn">
                <Link to="/assessment">
                  <span>Start New Assessment</span>
                  <ArrowRight className="w-4 h-4 ml-2.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </GradientButton>
            </div>
          </div>

          {/* ── 6. Profile Summary Card (Real Supabase Data) ──────────── */}
          <div className="lg:col-span-4 rounded-3xl p-6 bg-[#18132D]/80 backdrop-blur-md border border-[#7C3AED]/25 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#7C3AED]/15">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                      ATHLETE PROFILE
                    </h3>
                    <p className="text-[11px] text-[#B8AEC8]">Verified Telemetry</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/25">
                  Active
                </span>
              </div>

              {/* Real Profile Fields */}
              <div className="mt-5 space-y-4">
                <div>
                  <span className="text-[11px] font-semibold text-[#B8AEC8] uppercase tracking-wider">
                    Name
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[#FFFDF9] font-display mt-0.5">
                    {fullName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/15">
                    <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
                      Primary Sport
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-[#FFFDF9] mt-1 capitalize truncate">
                      {displaySport}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/15">
                    <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
                      Activity Level
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-[#FDBA8C] mt-1 truncate">
                      {displayActivityLevel}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/15">
                  <span className="text-[10px] font-bold text-[#B8AEC8] uppercase tracking-wider block">
                    Training Frequency
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-[#E9E2F5] mt-1">
                    {displayFrequency}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile CTA */}
            <div className="pt-5 mt-4 border-t border-[#7C3AED]/15">
              <GradientButton
                variant="variant"
                asChild
                className="w-full min-w-0 py-2.5 px-4 font-bold text-xs"
              >
                <Link to="/settings">
                  <span>View Profile</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-2 text-[#F97368]" />
                </Link>
              </GradientButton>
            </div>
          </div>

          {/* ── 7. Daily Recovery Check-in Form ────────────────────────── */}
          <div className="lg:col-span-7">
            <RecoveryForm onSaved={handleCheckinSaved} />
          </div>

          {/* ── 8. Recent Recovery Check-in Telemetry ─────────────────── */}
          <div className="lg:col-span-5 rounded-3xl p-6 sm:p-7 bg-[#18132D]/80 backdrop-blur-md border border-[#7C3AED]/25 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#7C3AED]/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#10B981]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#FFFDF9] font-display">
                      Recent Check-ins
                    </h3>
                    <p className="text-[11px] text-[#B8AEC8]">Historical Daily Metrics</p>
                  </div>
                </div>

                <span className="text-xs font-mono text-[#FDBA8C] font-bold px-2 py-0.5 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30">
                  {checkins.length} {checkins.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Checkin List or Empty State */}
              {loadingCheckins ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED]/30 border-t-[#F97368] animate-spin" />
                  <p className="text-xs text-[#B8AEC8]">Loading recovery telemetry...</p>
                </div>
              ) : checkins.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/20 flex items-center justify-center text-[#F97368]">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-sm font-bold text-[#FFFDF9]">No check-ins yet today</h4>
                    <p className="text-xs text-[#B8AEC8] leading-relaxed">
                      Use the check-in form on the left to record your daily sleep, heart rate, and soreness.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {checkins.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#120D26]/80 border border-[#7C3AED]/20 space-y-2.5 transition-all hover:border-[#7C3AED]/40"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#B8AEC8]">
                        <span className="font-mono text-[#E9E2F5] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#A78BFA]" />
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/25">
                          Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-[#21183A]/60 border border-[#7C3AED]/15">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-[#B8AEC8]">
                            <Moon className="w-3 h-3 text-[#A78BFA]" />
                            <span>Sleep</span>
                          </div>
                          <p className="text-xs font-bold text-[#FFFDF9] mt-0.5">
                            {item.sleep_hours}h
                          </p>
                        </div>

                        <div className="p-2 rounded-xl bg-[#21183A]/60 border border-[#7C3AED]/15">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-[#B8AEC8]">
                            <HeartPulse className="w-3 h-3 text-[#F97368]" />
                            <span>Pulse</span>
                          </div>
                          <p className="text-xs font-bold text-[#FFFDF9] mt-0.5">
                            {item.resting_heart_rate} bpm
                          </p>
                        </div>

                        <div className="p-2 rounded-xl bg-[#21183A]/60 border border-[#7C3AED]/15">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-[#B8AEC8]">
                            <Flame className="w-3 h-3 text-[#F97368]" />
                            <span>Soreness</span>
                          </div>
                          <p className="text-xs font-bold text-[#F97368] mt-0.5">
                            {item.soreness}/10
                          </p>
                        </div>

                        <div className="p-2 rounded-xl bg-[#21183A]/60 border border-[#7C3AED]/15">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-[#B8AEC8]">
                            <Zap className="w-3 h-3 text-[#10B981]" />
                            <span>Energy</span>
                          </div>
                          <p className="text-xs font-bold text-[#10B981] mt-0.5">
                            {item.energy_level}/10
                          </p>
                        </div>
                      </div>

                      {item.prediction && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-[#7C3AED]/15 text-[11px]">
                          <span className="text-[#B8AEC8] flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#F97368]" />
                            <span>ML Recovery Score:</span>
                            <strong className="text-[#FFFDF9] font-mono">{item.prediction.score} / 100</strong>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            item.prediction.tier === "optimal"
                              ? "bg-[#10B981]/15 text-[#10B981]"
                              : item.prediction.tier === "moderate"
                              ? "bg-[#F59E0B]/15 text-[#FDBA8C]"
                              : "bg-[#F97368]/15 text-[#F97368]"
                          }`}>
                            {item.prediction.tier}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-[#7C3AED]/15">
              <GradientButton
                variant="variant"
                asChild
                className="w-full min-w-0 py-2.5 px-4 font-bold text-xs"
              >
                <Link to="/recovery">
                  <span>View Recovery Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2 text-[#F97368]" />
                </Link>
              </GradientButton>
            </div>
          </div>

          {/* ── 9. Quick Actions Section ──────────────────────────────── */}
          <div className="lg:col-span-12 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Action 1: Daily Recovery Check-in */}
              <a
                href="#daily-recovery-checkin"
                className="p-4 rounded-2xl bg-[#18132D]/80 hover:bg-[#21183A]/90 backdrop-blur-md border border-[#7C3AED]/20 hover:border-[#F97368]/40 transition-all duration-200 group shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#F97368] group-hover:scale-105 transition-transform">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#FFFDF9] group-hover:text-[#FDBA8C] transition-colors">
                      Daily Check-in
                    </h4>
                    <p className="text-[11px] text-[#B8AEC8]">Log sleep, HR & readiness</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#B8AEC8]/40 group-hover:text-[#F97368] group-hover:translate-x-1 transition-all" />
              </a>

              {/* Action 2: Start New Assessment */}
              <Link
                to="/assessment"
                className="p-4 rounded-2xl bg-[#18132D]/80 hover:bg-[#21183A]/90 backdrop-blur-md border border-[#7C3AED]/20 hover:border-[#8B5CF6]/40 transition-all duration-200 group shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#FFFDF9] group-hover:text-[#FFFDF9] transition-colors">
                      New Assessment
                    </h4>
                    <p className="text-[11px] text-[#B8AEC8]">Symptom & risk check</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#B8AEC8]/40 group-hover:text-[#A78BFA] group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Action 3: Recovery Plan & History */}
              <Link
                to="/recovery"
                className="p-4 rounded-2xl bg-[#18132D]/80 hover:bg-[#21183A]/90 backdrop-blur-md border border-[#7C3AED]/20 hover:border-[#8B5CF6]/40 transition-all duration-200 group shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#10B981] group-hover:scale-105 transition-transform">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#FFFDF9] group-hover:text-[#FFFDF9] transition-colors">
                      Recovery Plan
                    </h4>
                    <p className="text-[11px] text-[#B8AEC8]">Protocols & history</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#B8AEC8]/40 group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Action 4: Profile & Settings */}
              <Link
                to="/settings"
                className="p-4 rounded-2xl bg-[#18132D]/80 hover:bg-[#21183A]/90 backdrop-blur-md border border-[#7C3AED]/20 hover:border-[#8B5CF6]/40 transition-all duration-200 group shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#FDBA8C] group-hover:scale-105 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#FFFDF9] group-hover:text-[#FFFDF9] transition-colors">
                      Profile Settings
                    </h4>
                    <p className="text-[11px] text-[#B8AEC8]">Manage athlete details</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#B8AEC8]/40 group-hover:text-[#FDBA8C] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          {/* ── 10. Safety / Information Card ─────────────────────────── */}
          <div className="lg:col-span-12 rounded-2xl p-4 sm:p-5 bg-[#18132D]/75 backdrop-blur-md border border-[#7C3AED]/20 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-[#FDBA8C] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#FFFDF9] uppercase tracking-wider font-display">
                Remember
              </h4>
              <p className="text-xs text-[#B8AEC8] leading-relaxed">
                REVORA provides preliminary guidance and does not replace professional medical evaluation. If symptoms are severe, worsening, or concerning, consult a qualified healthcare professional.
              </p>
            </div>
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default DashboardPage;
