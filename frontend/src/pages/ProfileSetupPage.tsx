import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Activity,
  Trophy,
  Flame,
  AlertCircle,
  Check,
  ArrowRight,
  ShieldCheck,
  X,
  Loader2,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { RevoraLogo } from "@/components/RevoraLogo";
import { useAuth } from "@/context/AuthContext";
import { saveAthleteProfile, type AthleteProfileData } from "@/services/profile";
import { GradientButton } from "@/components/ui/gradient-button";

const SPORT_OPTIONS = [
  "Running",
  "Gym / Strength Training",
  "Football",
  "Cricket",
  "Swimming",
  "Cycling",
  "Other",
];

const ACTIVITY_LEVELS = [
  {
    id: "beginner",
    title: "Beginner",
    description: "Starting out or light routine",
    icon: Flame,
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Consistent training & moderate intensity",
    icon: Dumbbell,
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Competitive or high-volume regimen",
    icon: Trophy,
  },
];

const FREQUENCY_OPTIONS = [
  "1–2 days/week",
  "3–4 days/week",
  "5–6 days/week",
  "Every day",
];

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
];

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [primarySport, setPrimarySport] = useState("");
  const [customSport, setCustomSport] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [trainingFrequency, setTrainingFrequency] = useState("");
  const [hasInjuries, setHasInjuries] = useState<boolean | null>(null);
  const [injuryDetails, setInjuryDetails] = useState("");
  const [currentTrainingDetails, setCurrentTrainingDetails] = useState("");

  // Validation & feedback states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshProfile } = useAuth();

  // Initialize with user name if available
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    } else if (user?.user_metadata?.name) {
      setFullName(user.user_metadata.name);
    }
  }, [user]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Please enter a valid full name.";
    }

    if (!dob) {
      newErrors.dob = "Date of birth is required.";
    }

    if (!primarySport) {
      newErrors.primarySport = "Please select your primary sport or activity.";
    } else if (primarySport === "Other" && !customSport.trim()) {
      newErrors.customSport = "Please specify your activity.";
    }

    if (!activityLevel) {
      newErrors.activityLevel = "Please select your activity level.";
    }

    if (!trainingFrequency) {
      newErrors.trainingFrequency = "Please select your training frequency.";
    }

    if (hasInjuries === null) {
      newErrors.hasInjuries = "Please indicate your injury history status.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }

    setIsLoading(true);

    const payload: AthleteProfileData = {
      full_name: fullName.trim(),
      date_of_birth: dob,
      gender: gender || undefined,
      primary_sport: primarySport === "Other" ? customSport.trim() : primarySport,
      custom_sport: primarySport === "Other" ? customSport.trim() : undefined,
      activity_level: activityLevel,
      training_frequency: trainingFrequency,
      has_previous_injuries: hasInjuries === true,
      injury_history_details: hasInjuries ? injuryDetails.trim() : undefined,
      current_training_details: currentTrainingDetails.trim() || undefined,
    };

    try {
      await saveAthleteProfile(payload);
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setServerError(String((err as { message: unknown }).message));
      } else {
        setServerError("Unable to save profile at this moment. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen min-h-[100svh] w-full bg-[#0D0A1F] text-[#FFFDF9] py-8 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden selection:bg-[#7C3AED]/40 selection:text-[#FDBA8C]">
      
      {/* ── Background Atmospheric Glows ───────────────────────────────── */}
      <div
        className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-[#7C3AED]/18 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 -right-32 w-[450px] h-[450px] bg-[#F97368]/15 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] bg-[#FDBA8C]/10 rounded-full blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Top Brand Bar ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-6 sm:mb-8 relative z-10">
        <RevoraLogo variant="dark-bg" size="md" showTagline={true} />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18132D] border border-[#7C3AED]/30 text-[11px] font-bold uppercase tracking-wider text-[#FDBA8C] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#F97368] animate-pulse" />
          <span>Step 1 of 1 • Profile Setup</span>
        </div>
      </div>

      {/* ── Main Profile Form Card ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto relative z-10 rounded-3xl sm:rounded-[32px] overflow-hidden border border-[#8B5CF6]/25 shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-[#18132D]/95 backdrop-blur-2xl p-6 sm:p-10 lg:p-12">
        
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-[#7C3AED]/15">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
            Tell us about yourself
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#B8AEC8] max-w-xl mx-auto leading-relaxed">
            Help REVORA understand your activity and training habits so we can provide more relevant recovery guidance.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div
            className="mb-6 p-3.5 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF6B6B]" />
            <div className="flex-1 font-medium">{serverError}</div>
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => setServerError("")}
              className="min-w-0 w-6 h-6 p-0 rounded-full text-[#FF6B6B] hover:text-[#FFFDF9] cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </GradientButton>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-7">
          
          {/* ── Section 1: Basic Information ───────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#F97368]" />
              <span>1. Basic Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="profile-fullname"
                  className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5"
                >
                  Full Name <span className="text-[#F97368]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) {
                        setErrors((prev) => ({ ...prev, fullName: "" }));
                      }
                    }}
                    placeholder="Enter your full name"
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] transition-all duration-200 outline-none ${
                      errors.fullName
                        ? "border border-[#FF6B6B] focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/25"
                        : "border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30"
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-[#FF6B6B] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="profile-dob"
                  className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5"
                >
                  Date of Birth <span className="text-[#F97368]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-dob"
                    type="date"
                    value={dob}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (errors.dob) {
                        setErrors((prev) => ({ ...prev, dob: "" }));
                      }
                    }}
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#FFFDF9] bg-[#21183A] transition-all duration-200 outline-none scheme-dark ${
                      errors.dob
                        ? "border border-[#FF6B6B] focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/25"
                        : "border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30"
                    }`}
                  />
                </div>
                {errors.dob && (
                  <p className="mt-1 text-xs text-[#FF6B6B] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.dob}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Gender (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5">
                Gender <span className="text-[10px] text-[#B8AEC8] font-normal normal-case">(Optional)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GENDER_OPTIONS.map((opt) => (
                  <GradientButton
                    key={opt}
                    type="button"
                    variant={gender === opt ? "default" : "variant"}
                    onClick={() => setGender(gender === opt ? "" : opt)}
                    className="min-w-0 py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer text-center"
                  >
                    {opt}
                  </GradientButton>
                ))}
              </div>
            </div>
          </div>

          {/* ── Section 2: Sport & Activity ────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-[#7C3AED]/15">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#F97368]" />
              <span>2. Sport & Training Background</span>
            </h2>

            {/* Primary Sport Options */}
            <div>
              <label className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-2">
                Primary Sport or Activity <span className="text-[#F97368]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {SPORT_OPTIONS.map((sport) => (
                  <GradientButton
                    key={sport}
                    type="button"
                    variant={primarySport === sport ? "default" : "variant"}
                    onClick={() => {
                      setPrimarySport(sport);
                      if (errors.primarySport) {
                        setErrors((prev) => ({ ...prev, primarySport: "" }));
                      }
                    }}
                    className="min-w-0 py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-between"
                  >
                    <span>{sport}</span>
                    {primarySport === sport && (
                      <Check className="w-3.5 h-3.5 text-[#F97368] shrink-0 ml-1" />
                    )}
                  </GradientButton>
                ))}
              </div>
              {errors.primarySport && (
                <p className="mt-1 text-xs text-[#FF6B6B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.primarySport}</span>
                </p>
              )}

              {/* Custom Activity Textbox when "Other" is chosen */}
              {primarySport === "Other" && (
                <div className="mt-3 animate-in fade-in duration-200">
                  <label
                    htmlFor="profile-custom-sport"
                    className="block text-xs font-semibold text-[#E9E2F5] mb-1"
                  >
                    Specify your activity <span className="text-[#F97368]">*</span>
                  </label>
                  <input
                    id="profile-custom-sport"
                    type="text"
                    value={customSport}
                    onChange={(e) => {
                      setCustomSport(e.target.value);
                      if (errors.customSport) {
                        setErrors((prev) => ({ ...prev, customSport: "" }));
                      }
                    }}
                    placeholder="e.g. CrossFit, Martial Arts, Basketball"
                    className="w-full rounded-xl px-4 py-2 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 outline-none"
                  />
                  {errors.customSport && (
                    <p className="mt-1 text-xs text-[#FF6B6B] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.customSport}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Activity Level Cards */}
            <div>
              <label className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-2">
                Activity Level <span className="text-[#F97368]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ACTIVITY_LEVELS.map((lvl) => {
                  const Icon = lvl.icon;
                  const isSelected = activityLevel === lvl.id;
                  return (
                    <GradientButton
                      key={lvl.id}
                      type="button"
                      variant={isSelected ? "default" : "variant"}
                      onClick={() => {
                        setActivityLevel(lvl.id);
                        if (errors.activityLevel) {
                          setErrors((prev) => ({ ...prev, activityLevel: "" }));
                        }
                      }}
                      className="min-w-0 p-4 rounded-2xl text-left cursor-pointer flex flex-col justify-between items-start h-auto"
                    >
                      <div className="w-full flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? "bg-[#F97368] text-[#FFFDF9]"
                              : "bg-[#18132D] text-[#A78BFA]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-[#FFFDF9]" />
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-[#FFFDF9] font-display">
                          {lvl.title}
                        </h3>
                        <p className="text-[11px] text-[#B8AEC8] mt-0.5 leading-snug">
                          {lvl.description}
                        </p>
                      </div>
                    </GradientButton>
                  );
                })}
              </div>
              {errors.activityLevel && (
                <p className="mt-1 text-xs text-[#FF6B6B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.activityLevel}</span>
                </p>
              )}
            </div>

            {/* Training Frequency */}
            <div>
              <label className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-2">
                Training Frequency <span className="text-[#F97368]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FREQUENCY_OPTIONS.map((freq) => (
                  <GradientButton
                    key={freq}
                    type="button"
                    variant={trainingFrequency === freq ? "default" : "variant"}
                    onClick={() => {
                      setTrainingFrequency(freq);
                      if (errors.trainingFrequency) {
                        setErrors((prev) => ({ ...prev, trainingFrequency: "" }));
                      }
                    }}
                    className="min-w-0 py-2.5 px-3 rounded-xl text-xs font-semibold cursor-pointer text-center"
                  >
                    {freq}
                  </GradientButton>
                ))}
              </div>
              {errors.trainingFrequency && (
                <p className="mt-1 text-xs text-[#FF6B6B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.trainingFrequency}</span>
                </p>
              )}
            </div>
          </div>

          {/* ── Section 3: Previous Injury History ──────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-[#7C3AED]/15">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F97368]" />
              <span>3. Injury History & Context</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-2">
                Previous Injury History <span className="text-[#F97368]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GradientButton
                  type="button"
                  variant={hasInjuries === false ? "default" : "variant"}
                  onClick={() => {
                    setHasInjuries(false);
                    setInjuryDetails("");
                    if (errors.hasInjuries) {
                      setErrors((prev) => ({ ...prev, hasInjuries: "" }));
                    }
                  }}
                  className="min-w-0 p-3.5 rounded-2xl text-left cursor-pointer flex items-center justify-between"
                >
                  <span className="text-xs sm:text-sm font-semibold">No previous injuries</span>
                  {hasInjuries === false && (
                    <Check className="w-4 h-4 text-[#F97368]" />
                  )}
                </GradientButton>

                <GradientButton
                  type="button"
                  variant={hasInjuries === true ? "default" : "variant"}
                  onClick={() => {
                    setHasInjuries(true);
                    if (errors.hasInjuries) {
                      setErrors((prev) => ({ ...prev, hasInjuries: "" }));
                    }
                  }}
                  className="min-w-0 p-3.5 rounded-2xl text-left cursor-pointer flex items-center justify-between"
                >
                  <span className="text-xs sm:text-sm font-semibold">Yes, I have had previous injuries</span>
                  {hasInjuries === true && (
                    <Check className="w-4 h-4 text-[#F97368]" />
                  )}
                </GradientButton>
              </div>
              {errors.hasInjuries && (
                <p className="mt-1 text-xs text-[#FF6B6B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.hasInjuries}</span>
                </p>
              )}

              {/* Conditional Injury Details Textarea */}
              {hasInjuries === true && (
                <div className="mt-3 animate-in fade-in duration-200">
                  <label
                    htmlFor="profile-injuries-text"
                    className="block text-xs font-semibold text-[#E9E2F5] mb-1.5"
                  >
                    Tell us about your previous injuries
                  </label>
                  <textarea
                    id="profile-injuries-text"
                    rows={3}
                    value={injuryDetails}
                    onChange={(e) => setInjuryDetails(e.target.value)}
                    placeholder="Example: Previous ankle sprain while playing football, recurring knee soreness after heavy squats..."
                    className="w-full rounded-2xl p-3.5 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 outline-none resize-none transition-all duration-200"
                  />
                </div>
              )}
            </div>

            {/* Current Training Routine Details (Optional) */}
            <div>
              <label
                htmlFor="profile-training-details"
                className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5"
              >
                Current Training Details <span className="text-[10px] text-[#B8AEC8] font-normal normal-case">(Optional)</span>
              </label>
              <textarea
                id="profile-training-details"
                rows={2}
                value={currentTrainingDetails}
                onChange={(e) => setCurrentTrainingDetails(e.target.value)}
                placeholder="Tell us about your current training routine, intensity, or recent changes in volume..."
                className="w-full rounded-2xl p-3.5 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 outline-none resize-none transition-all duration-200"
              />
            </div>
          </div>

          {/* ── Buttons Row ────────────────────────────────────────────── */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[#7C3AED]/15">
            <GradientButton
              type="button"
              variant="variant"
              onClick={handleSkip}
              className="w-full sm:w-auto min-w-[132px] py-3 px-6 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer"
            >
              Skip for now
            </GradientButton>

            <GradientButton
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto min-w-[160px] py-3.5 px-8 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#17102F]" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save Profile</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </GradientButton>
          </div>

          {/* Safety Disclaimer */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#B8AEC8]/80 leading-normal flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FDBA8C] shrink-0" />
              <span>
                REVORA provides training telemetry and recovery guidance. This is not medical diagnosis.
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
