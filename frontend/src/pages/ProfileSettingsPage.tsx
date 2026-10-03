import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Dumbbell,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Save,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { GradientButton } from "@/components/ui/gradient-button";
import { useAuth } from "@/context/AuthContext";
import {
  saveAthleteProfile,
  type AthleteProfileData,
} from "@/services/profile";
import { supabase } from "@/lib/supabase";

const SPORT_OPTIONS = [
  { value: "running", label: "Running" },
  { value: "weightlifting", label: "Weightlifting / Gym" },
  { value: "crossfit", label: "CrossFit / Functional" },
  { value: "basketball", label: "Basketball" },
  { value: "soccer", label: "Soccer / Football" },
  { value: "cycling", label: "Cycling" },
  { value: "swimming", label: "Swimming" },
  { value: "tennis", label: "Tennis / Racket Sports" },
  { value: "other", label: "Other" },
];

const ACTIVITY_LEVELS = [
  { value: "beginner", label: "Beginner (1-2 days/week)" },
  { value: "intermediate", label: "Intermediate (3-4 days/week)" },
  { value: "advanced", label: "Advanced / Competitive (5+ days/week)" },
];

export const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();

  // ── Profile Edit State ────────────────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState<AthleteProfileData>({
    full_name: "",
    date_of_birth: "",
    gender: "prefer_not_to_say",
    primary_sport: "running",
    custom_sport: "",
    activity_level: "intermediate",
    training_frequency: "3-4_days",
    has_previous_injuries: false,
    injury_history_details: "",
    current_training_details: "",
  });

  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // ── Password Change State ─────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // ── Preferences State ─────────────────────────────────────────────────
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem("revora_reduced_motion") === "true";
  });
  const [notifications, setNotifications] = useState<boolean>(() => {
    return localStorage.getItem("revora_notifications_enabled") !== "false";
  });
  const [recoveryReminders, setRecoveryReminders] = useState<boolean>(() => {
    return localStorage.getItem("revora_reminders_enabled") !== "false";
  });

  // Sync profile form when auth profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || user?.user_metadata?.full_name || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "prefer_not_to_say",
        primary_sport: profile.primary_sport || "running",
        custom_sport: profile.custom_sport || "",
        activity_level: profile.activity_level || "intermediate",
        training_frequency: profile.training_frequency || "3-4_days",
        has_previous_injuries: Boolean(profile.has_previous_injuries),
        injury_history_details: profile.injury_history_details || "",
        current_training_details: profile.current_training_details || "",
      });
    } else if (user) {
      setProfileForm((prev) => ({
        ...prev,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Athlete",
      }));
    }
  }, [profile, user]);

  // Handle Reduced Motion preference toggle
  const handleToggleReducedMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    localStorage.setItem("revora_reduced_motion", String(enabled));
    if (enabled) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem("revora_notifications_enabled", String(enabled));
  };

  const handleToggleReminders = (enabled: boolean) => {
    setRecoveryReminders(enabled);
    localStorage.setItem("revora_reminders_enabled", String(enabled));
  };

  // ── Save Profile Handler ──────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      setProfileErrorMsg("Please enter your full name.");
      return;
    }

    setIsSavingProfile(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      await saveAthleteProfile(profileForm);
      await refreshProfile();
      setProfileSuccessMsg("Athlete profile updated successfully.");
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unable to save profile changes. Please try again.";
      setProfileErrorMsg(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Change Password Handler ───────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (newPassword.length < 6) {
      setPasswordErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(error.message);
      }
      setPasswordSuccessMsg("Your password has been changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update password. Please try again.";
      setPasswordErrorMsg(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const displayName =
    profileForm.full_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Athlete";

  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "AT";

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-page-enter pb-16">
        
        {/* ── Top Bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <GradientButton
            type="button"
            variant="variant"
            onClick={() => navigate("/dashboard")}
            className="min-w-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Dashboard</span>
          </GradientButton>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[#FDBA8C]">
              Athlete Account
            </span>
          </div>
        </div>

        {/* ── Profile Header Card ──────────────────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#18132D] via-[#21183A] to-[#18132D] border border-[#7C3AED]/30 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left z-10">
            {/* Avatar Initials Circle */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#F97368] to-[#FDBA8C] p-0.5 shadow-xl shadow-[#7C3AED]/20 shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#120D26] flex items-center justify-center text-2xl font-black font-display text-[#FFFDF9]">
                {userInitials}
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                <span>Active Athlete</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#FFFDF9] tracking-tight">
                {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-[#B8AEC8] font-mono">
                {user?.email || "athlete@revora.app"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 z-10">
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="min-w-0 px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {isEditingProfile ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Edit</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-[#FDBA8C]" />
                  <span>Edit Profile</span>
                </>
              )}
            </GradientButton>
          </div>
        </div>

        {/* ── Success / Error Alerts ────────────────────────────────────── */}
        {profileSuccessMsg && (
          <div className="p-4 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs sm:text-sm text-[#10B981] flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{profileSuccessMsg}</span>
          </div>
        )}
        {profileErrorMsg && (
          <div className="p-4 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 text-xs sm:text-sm text-[#FF6B6B] flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{profileErrorMsg}</span>
          </div>
        )}

        {/* ── SECTION 1: PROFILE DETAILS (Read / Edit Mode) ─────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/15">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#F97368]" />
              <h2 className="text-base sm:text-lg font-bold font-display text-[#FFFDF9]">
                Athlete Biometrics & Sport Profile
              </h2>
            </div>
            <span className="text-xs text-[#B8AEC8]">
              {isEditingProfile ? "Editing Details" : "Verified Telemetry"}
            </span>
          </div>

          {isEditingProfile ? (
            /* ── Edit Profile Form ── */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] focus:outline-none focus:border-[#F97368]/60"
                    placeholder="Athlete Name"
                    required
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileForm.date_of_birth}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, date_of_birth: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] focus:outline-none focus:border-[#F97368]/60"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Gender
                  </label>
                  <select
                    value={profileForm.gender || "prefer_not_to_say"}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, gender: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] focus:outline-none focus:border-[#F97368]/60 cursor-pointer"
                  >
                    <option value="male" className="bg-[#18132D]">Male</option>
                    <option value="female" className="bg-[#18132D]">Female</option>
                    <option value="non_binary" className="bg-[#18132D]">Non-Binary</option>
                    <option value="prefer_not_to_say" className="bg-[#18132D]">Prefer not to say</option>
                  </select>
                </div>

                {/* Primary Sport */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Primary Sport
                  </label>
                  <select
                    value={profileForm.primary_sport}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, primary_sport: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] focus:outline-none focus:border-[#F97368]/60 cursor-pointer"
                  >
                    {SPORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#18132D]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Sport if other */}
                {profileForm.primary_sport === "other" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase text-[#B8AEC8] tracking-wider block">
                      Custom Sport / Modality
                    </label>
                    <input
                      type="text"
                      value={profileForm.custom_sport || ""}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, custom_sport: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] focus:outline-none focus:border-[#F97368]/60"
                      placeholder="e.g., Brazilian Jiu-Jitsu, Rowing, Rock Climbing"
                    />
                  </div>
                )}

                {/* Activity Level */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-[#B8AEC8] tracking-wider block">
                    Training Experience Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ACTIVITY_LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() =>
                          setProfileForm((prev) => ({ ...prev, activity_level: lvl.value }))
                        }
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          profileForm.activity_level === lvl.value
                            ? "bg-[#7C3AED]/25 border-[#F97368]/60 text-[#FFFDF9]"
                            : "bg-[#21183A] border-[#7C3AED]/20 text-[#B8AEC8] hover:text-[#FFFDF9]"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Previous Injuries Toggle */}
                <div className="space-y-1.5 sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileForm.has_previous_injuries}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          has_previous_injuries: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED] accent-[#7C3AED]"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-[#FFFDF9]">
                      I have previous injuries or recurring joint issues
                    </span>
                  </label>

                  {profileForm.has_previous_injuries && (
                    <div className="pt-2">
                      <textarea
                        value={profileForm.injury_history_details || ""}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            injury_history_details: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full p-3 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/60 focus:outline-none focus:border-[#F97368]/60"
                        placeholder="Briefly describe past injuries (e.g., ACL reconstruction 2023, recurring ankle sprains)..."
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#7C3AED]/15">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-[#21183A] text-xs font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] border border-[#7C3AED]/20 cursor-pointer"
                >
                  Cancel
                </button>
                <GradientButton
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                </GradientButton>
              </div>
            </form>
          ) : (
            /* ── Read-Only Profile Overview ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20">
                <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                  Primary Sport
                </span>
                <p className="text-sm font-bold text-[#FFFDF9] mt-0.5 capitalize">
                  {profileForm.primary_sport === "other" && profileForm.custom_sport
                    ? profileForm.custom_sport
                    : profileForm.primary_sport}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20">
                <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                  Activity Level
                </span>
                <p className="text-sm font-bold text-[#FDBA8C] mt-0.5 capitalize">
                  {profileForm.activity_level}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20">
                <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                  Gender
                </span>
                <p className="text-sm font-semibold text-[#FFFDF9] mt-0.5 capitalize">
                  {profileForm.gender ? profileForm.gender.replace(/_/g, " ") : "Not specified"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20">
                <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                  Date of Birth
                </span>
                <p className="text-sm font-semibold text-[#FFFDF9] mt-0.5">
                  {profileForm.date_of_birth || "Not specified"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#21183A]/70 border border-[#7C3AED]/20 col-span-2">
                <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                  Previous Injury History
                </span>
                <p className="text-xs sm:text-sm text-[#E9E2F5] mt-0.5">
                  {profileForm.has_previous_injuries
                    ? profileForm.injury_history_details || "Yes, reported previous injuries"
                    : "No major recurring injury history reported"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: ACCOUNT SETTINGS & PASSWORD ───────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/15">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#A78BFA]" />
              <h2 className="text-base sm:text-lg font-bold font-display text-[#FFFDF9]">
                Account Security & Credentials
              </h2>
            </div>
            <span className="text-xs text-[#B8AEC8]">Supabase Auth</span>
          </div>

          <div className="space-y-4">
            {/* Email display */}
            <div className="p-4 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#B8AEC8] tracking-wider block">
                  Registered Email Address
                </span>
                <p className="text-sm font-mono font-bold text-[#FFFDF9] mt-0.5">
                  {user?.email || "athlete@revora.app"}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-1 rounded-lg border border-[#10B981]/30 self-start sm:self-auto">
                Verified Account
              </span>
            </div>

            {/* Change Password Sub-form */}
            <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display block">
                Update Password
              </span>

              {passwordSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#10B981] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}
              {passwordErrorMsg && (
                <div className="p-3.5 rounded-xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 6 chars)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/60 focus:outline-none focus:border-[#F97368]/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8AEC8] hover:text-[#FFFDF9]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/60 focus:outline-none focus:border-[#F97368]/60"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <GradientButton
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="min-w-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isUpdatingPassword ? "Updating..." : "Change Password"}</span>
                </GradientButton>
              </div>
            </form>
          </div>
        </div>

        {/* ── SECTION 3: APPLICATION PREFERENCES ───────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/15">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FDBA8C]" />
              <h2 className="text-base sm:text-lg font-bold font-display text-[#FFFDF9]">
                Application Preferences
              </h2>
            </div>
            <span className="text-xs text-[#B8AEC8]">Client UI Settings</span>
          </div>

          <div className="space-y-4">
            
            {/* Reduced Motion */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/20">
              <div className="space-y-0.5 max-w-md">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FFFDF9]">
                  <Moon className="w-4 h-4 text-[#A78BFA]" />
                  <span>Reduced Motion Mode</span>
                </div>
                <p className="text-[11px] text-[#B8AEC8] leading-relaxed">
                  Minimize transforms, 3D model inertia, and high-frequency animations throughout REVORA.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => handleToggleReducedMotion(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#120D26] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFDF9] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C3AED] border border-[#7C3AED]/30" />
              </label>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/20">
              <div className="space-y-0.5 max-w-md">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FFFDF9]">
                  <Bell className="w-4 h-4 text-[#F97368]" />
                  <span>Biometric Alerts & Notifications</span>
                </div>
                <p className="text-[11px] text-[#B8AEC8] leading-relaxed">
                  Receive recovery timeline alerts and training readiness notifications.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#120D26] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFDF9] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97368] border border-[#7C3AED]/30" />
              </label>
            </div>

            {/* Recovery Reminders */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#21183A]/70 border border-[#7C3AED]/20">
              <div className="space-y-0.5 max-w-md">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FFFDF9]">
                  <Dumbbell className="w-4 h-4 text-[#10B981]" />
                  <span>Daily Recovery Reminders</span>
                </div>
                <p className="text-[11px] text-[#B8AEC8] leading-relaxed">
                  Scheduled prompts to complete daily mobility and reload protocols.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={recoveryReminders}
                  onChange={(e) => handleToggleReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#120D26] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFDF9] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981] border border-[#7C3AED]/30" />
              </label>
            </div>

          </div>
        </div>

        {/* ── SECTION 4: DANGER ZONE / SIGN OUT ────────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#18132D] border border-[#FF6B6B]/25 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-[#FF6B6B]/15">
            <Shield className="w-4 h-4 text-[#FF6B6B]" />
            <h2 className="text-base sm:text-lg font-bold font-display text-[#FFFDF9]">
              Account Session & Sign Out
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-[#B8AEC8] max-w-md leading-relaxed">
              Logging out will clear your active local athlete session. Your encrypted telemetry and history will remain securely stored in your Supabase account.
            </p>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B6B]/15 hover:bg-[#FF6B6B]/25 text-[#FF6B6B] border border-[#FF6B6B]/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of REVORA</span>
            </button>
          </div>
        </div>

      </div>
    </AuthenticatedLayout>
  );
};

export default ProfileSettingsPage;
