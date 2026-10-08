import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Check,
  Sparkles,
  ShieldCheck,
  X,
  Loader2,
  FileText,
} from "lucide-react";
import { RevoraLogo } from "@/components/RevoraLogo";
import { registerUser, saveAuthSession } from "@/services/auth";
import { GradientButton } from "@/components/ui/gradient-button";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Validation & error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Terms modal state
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsModalType, setTermsModalType] = useState<"terms" | "privacy">("terms");

  // Video autoplay assurance
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, []);

  // Validation functions
  const validateName = (val: string): boolean => {
    if (!val.trim()) {
      setNameError("Full name is required.");
      return false;
    }
    if (val.trim().length < 2) {
      setNameError("Please enter your real full name.");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError("Password is required.");
      return false;
    }
    if (val.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (val: string, passVal: string = password): boolean => {
    if (!val) {
      setConfirmPasswordError("Please confirm your password.");
      return false;
    }
    if (val !== passVal) {
      setConfirmPasswordError("Passwords do not match.");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const validateTerms = (val: boolean): boolean => {
    if (!val) {
      setTermsError("You must agree to the Terms of Service & Privacy Policy.");
      return false;
    }
    setTermsError("");
    return true;
  };

  // Email confirmation notice state
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setConfirmationNotice(null);

    const isNameValid = validateName(fullName);
    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, password);
    const isTermsValid = validateTerms(agreeTerms);

    if (!isNameValid || !isEmailValid || !isPassValid || !isConfirmValid || !isTermsValid) {
      return;
    }

    setIsLoading(true);

    try {
      const authData = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (authData.needsEmailConfirmation) {
        setConfirmationNotice(
          "Account created successfully! A confirmation link has been sent to your email. Please verify your email before logging in."
        );
      } else {
        // Session active: Save session and redirect to Profile Setup
        saveAuthSession(authData.token, authData.user, true);
        navigate("/profile-setup", { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : "";
      if (msg.includes("Failed to fetch") || msg.includes("fetch failed") || msg.includes("NetworkError")) {
        setServerError("Connection error: Unable to reach Supabase. Please check your internet connection or verify your Supabase project status.");
      } else if (msg) {
        setServerError(msg);
      } else {
        setServerError("Unable to complete registration. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openLegalModal = (type: "terms" | "privacy") => {
    setTermsModalType(type);
    setIsTermsModalOpen(true);
  };

  return (
    <div className="min-h-screen min-h-[100svh] w-full bg-[#0D0A1F] text-[#FFFDF9] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-[#7C3AED]/40 selection:text-[#FDBA8C]">
      
      {/* ── Background Atmospheric Glows ───────────────────────────────── */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[130px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#F97368]/15 rounded-full blur-[130px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FDBA8C]/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Top Floating Back to Home Link ─────────────────────────────── */}
      <Link
        to="/"
        className="absolute top-4 sm:top-6 left-4 sm:left-8 z-30 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] bg-[#18132D]/70 hover:bg-[#21183A] border border-[#7C3AED]/20 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md transition-all duration-200 group shadow-md"
        aria-label="Back to home page"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#F97368]" />
        <span>Back to Home</span>
      </Link>

      {/* ── Main Authentication Container (1040–1150px) ─────────────────── */}
      <div className="relative z-10 w-full max-w-[1080px] min-h-[640px] rounded-3xl sm:rounded-[32px] overflow-hidden border border-[#8B5CF6]/25 shadow-[0_25px_70px_rgba(0,0,0,0.85)] bg-[#18132D]/95 backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 my-auto mt-12 sm:mt-auto">
        
        {/* ── LEFT COLUMN: Athlete Visual & Official Branding ──────────── */}
        <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[320px] lg:min-h-[680px] flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#7C3AED]/20">
          
          {/* Athlete Video Background */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            <video
              ref={videoRef}
              src="/videos/login-athlete.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover object-center scale-105 transform will-change-transform"
            >
              <source src="/videos/login-athlete.mp4" type="video/mp4" />
            </video>

            {/* Deep Plum & Atmospheric Gradient Overlays */}
            <div className="absolute inset-0 bg-[#0D0A1F]/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A1F] via-[#120D26]/65 to-[#7C3AED]/25" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 via-transparent to-[#F97368]/25" />
          </div>

          {/* Top: Official REVORA Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 rounded-xl" aria-label="REVORA Home">
              <RevoraLogo variant="dark-bg" size="lg" showTagline={true} />
            </Link>
          </div>

          {/* Bottom: Athletic Telemetry Highlight Card */}
          <div className="relative z-10 mt-auto pt-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#120D26]/85 backdrop-blur-md border border-[#8B5CF6]/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F97368] animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                    Recover Smarter. Train Safer.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#A78BFA] bg-[#7C3AED]/20 px-2 py-0.5 rounded border border-[#8B5CF6]/30 font-semibold">
                  AI Tech
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-[#E9E2F5] leading-snug">
                Join elite athletes using personalized biometric recovery algorithms and dynamic symptom triage.
              </p>

              <div className="pt-2 flex items-center gap-4 text-[11px] text-[#B8AEC8] border-t border-[#7C3AED]/15">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
                  Injury Prevention
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FDBA8C]" />
                  Smart Readiness
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Dark Frosted-Glass Register Form Card ────────── */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#18132D]/95">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
              Create your REVORA account
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#B8AEC8] max-w-sm mx-auto">
              Start your recovery journey and train smarter with personalized guidance.
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div
              className="mb-5 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF6B6B]" />
              <div className="flex-1 font-medium">{serverError}</div>
              <GradientButton
                type="button"
                variant="variant"
                onClick={() => setServerError("")}
                className="min-w-0 w-6 h-6 p-0 rounded-lg text-[#FF6B6B] hover:text-[#FFFDF9] flex items-center justify-center"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </GradientButton>
            </div>
          )}

          {/* Email Confirmation Notice Banner */}
          {confirmationNotice && (
            <div
              className="mb-5 p-4 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#FFFDF9] text-xs sm:text-sm space-y-2.5 animate-in fade-in duration-200"
              role="status"
            >
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <p className="flex-1 text-[#E9E2F5] leading-relaxed">{confirmationNotice}</p>
              </div>
              <div className="pt-1 flex justify-end">
                <GradientButton asChild className="min-w-0 px-4 py-1.5 rounded-lg text-xs font-bold">
                  <Link to="/login">
                    Go to Login →
                  </Link>
                </GradientButton>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* ── Full Name Field ─────────────────────────────────────── */}
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="register-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError) validateName(e.target.value);
                  }}
                  onBlur={() => validateName(fullName)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] transition-all duration-200 outline-none ${
                    nameError
                      ? "border border-[#FF6B6B] focus:bg-[#261C43] focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/25"
                      : "border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30"
                  }`}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "fullname-error" : undefined}
                />
              </div>
              {nameError && (
                <div
                  id="fullname-error"
                  className="mt-1 flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{nameError}</span>
                </div>
              )}
            </div>

            {/* ── Email Field ─────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] transition-all duration-200 outline-none ${
                    emailError
                      ? "border border-[#FF6B6B] focus:bg-[#261C43] focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/25"
                      : "border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30"
                  }`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
              </div>
              {emailError && (
                <div
                  id="email-error"
                  className="mt-1 flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* ── Password Field ──────────────────────────────────────── */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                    if (confirmPassword) validateConfirmPassword(confirmPassword, e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className={`w-full rounded-xl pl-10 pr-11 py-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] transition-all duration-200 outline-none ${
                    passwordError
                      ? "border border-[#FF6B6B] focus:bg-[#261C43] focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/25"
                      : "border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30"
                  }`}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <GradientButton
                  type="button"
                  variant="variant"
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-w-0 w-7 h-7 p-0 rounded-lg absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#B8AEC8] hover:text-[#FFFDF9]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </GradientButton>
              </div>
              {passwordError && (
                <div
                  id="password-error"
                  className="mt-1 flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* ── Confirm Password Field ──────────────────────────────── */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) validateConfirmPassword(e.target.value, password);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword, password)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={`w-full rounded-xl pl-10 pr-11 py-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] transition-all duration-200 outline-none ${
                    confirmPasswordError
                      ? "border border-[#FF6B6B] focus:bg-[#261C43] focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/25"
                      : "border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30"
                  }`}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                />
                <GradientButton
                  type="button"
                  variant="variant"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="min-w-0 w-7 h-7 p-0 rounded-lg absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#B8AEC8] hover:text-[#FFFDF9]"
                  aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </GradientButton>
              </div>
              {confirmPasswordError && (
                <div
                  id="confirm-password-error"
                  className="mt-1 flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{confirmPasswordError}</span>
                </div>
              )}
            </div>

            {/* ── Terms & Conditions Checkbox ─────────────────────────── */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (termsError) validateTerms(e.target.checked);
                    }}
                    className="sr-only"
                    id="agree-terms"
                  />
                  <div
                    className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                      agreeTerms
                        ? "bg-[#7C3AED] border-[#8B5CF6] shadow-sm shadow-[#7C3AED]/50"
                        : "bg-[#21183A] border-[#A78BFA]/30 group-hover:border-[#8B5CF6]"
                    }`}
                  >
                    {agreeTerms && <Check className="w-3 h-3 text-[#FFFDF9] stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs text-[#B8AEC8] leading-snug">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openLegalModal("terms");
                    }}
                    className="text-[#A78BFA] hover:text-[#F97368] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openLegalModal("privacy");
                    }}
                    className="text-[#A78BFA] hover:text-[#F97368] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
              {termsError && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{termsError}</span>
                </div>
              )}
            </div>

            {/* ── Submit Button (Violet → Coral Gradient) ─────────────── */}
            <div className="pt-2">
              <GradientButton
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#17102F]" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </GradientButton>
            </div>
          </form>

          {/* ── Bottom Link: Already have an account? Login ──────────── */}
          <div className="mt-6 pt-5 border-t border-[#7C3AED]/15 text-center">
            <p className="text-xs sm:text-sm text-[#B8AEC8]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#FF6B6B] to-[#F97368] hover:opacity-85 transition-opacity inline-block ml-1"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Accessible Terms / Privacy Modal ─────────────────────────── */}
      {isTermsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#18132D] border border-[#7C3AED]/30 shadow-2xl shadow-black/90 max-h-[85vh] flex flex-col">
            {/* Close Button */}
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => setIsTermsModalOpen(false)}
              className="min-w-0 w-8 h-8 p-0 rounded-xl absolute top-4 right-4 flex items-center justify-center text-[#B8AEC8] hover:text-[#FFFDF9]"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </GradientButton>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 id="legal-modal-title" className="text-lg sm:text-xl font-bold text-[#FFFDF9] font-display">
                  {termsModalType === "terms" ? "Terms of Service" : "Privacy Policy"}
                </h2>
                <p className="text-xs text-[#B8AEC8]">REVORA Athlete Platform</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 text-xs sm:text-sm text-[#E9E2F5] leading-relaxed border-y border-[#7C3AED]/20 py-4 custom-scrollbar">
              {termsModalType === "terms" ? (
                <>
                  <p className="font-semibold text-[#FFFDF9]">1. Athletic Guidance & Scope</p>
                  <p className="text-[#B8AEC8]">
                    REVORA provides AI-driven training readiness, biometric symptom triage, and athletic recovery protocols. Our suggestions are designed to complement, not replace, certified medical evaluation.
                  </p>
                  <p className="font-semibold text-[#FFFDF9]">2. User Responsibilities</p>
                  <p className="text-[#B8AEC8]">
                    You agree to input accurate physical readiness data and follow exercises within your personal physiological capabilities. If sharp or radiating pain occurs, cease activity immediately and seek professional clinical care.
                  </p>
                  <p className="font-semibold text-[#FFFDF9]">3. Account Integrity</p>
                  <p className="text-[#B8AEC8]">
                    You are responsible for maintaining the confidentiality of your account credentials.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[#FFFDF9]">1. Data Collection & Privacy</p>
                  <p className="text-[#B8AEC8]">
                    We collect biometric feedback, recovery check-in logs, and symptom inputs exclusively to compute personalized recovery readiness scores and drills.
                  </p>
                  <p className="font-semibold text-[#FFFDF9]">2. Security Standards</p>
                  <p className="text-[#B8AEC8]">
                    All biometric and health telemetry is stored securely and never sold to third parties.
                  </p>
                  <p className="font-semibold text-[#FFFDF9]">3. Your Controls</p>
                  <p className="text-[#B8AEC8]">
                    You retain complete control to export or delete your recovery logs at any time from your account settings.
                  </p>
                </>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <GradientButton
                type="button"
                onClick={() => setIsTermsModalOpen(false)}
                className="min-w-0 px-6 py-2.5 text-xs sm:text-sm font-bold"
              >
                I Understand
              </GradientButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export default RegisterPage;
