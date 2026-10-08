import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
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
} from "lucide-react";
import { RevoraLogo } from "@/components/RevoraLogo";
import { loginUser, saveAuthSession, requestPasswordReset } from "@/services/auth";
import { GradientButton } from "@/components/ui/gradient-button";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation & feedback states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

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

  // Email format validator
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

  // Password validator
  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError("Password is required.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Handle Login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);

    if (!isEmailValid || !isPassValid) {
      return;
    }

    setIsLoading(true);

    try {
      const authData = await loginUser({
        email: email.trim(),
        password,
        rememberMe,
      });

      // Save token and user info
      saveAuthSession(authData.token, authData.user, rememberMe);

      // Determine routing based on profile completeness
      if (authData.user.isProfileComplete === false) {
        navigate("/profile-setup");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : "";
      if (msg.includes("Failed to fetch") || msg.includes("fetch failed") || msg.includes("NetworkError")) {
        setServerError("Connection error: Unable to reach Supabase. Please check your internet connection or verify your Supabase project status.");
      } else if (msg) {
        setServerError(msg);
      } else {
        setServerError("Unable to complete sign in. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotStatus(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail.trim()) {
      setForgotError("Email is required.");
      return;
    }
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotError("Enter a valid email address.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await requestPasswordReset(forgotEmail.trim());
      setForgotStatus(res.message || "Password reset instructions sent if account exists.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setForgotError(err.message);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        setForgotError(String((err as { message: unknown }).message));
      } else {
        setForgotError("Could not process request at this time.");
      }
    } finally {
      setIsForgotLoading(false);
    }
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
        <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[320px] lg:min-h-[660px] flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#7C3AED]/20">
          
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

          {/* Bottom: Athletic Tech Telemetry Card */}
          <div className="relative z-10 mt-auto pt-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#120D26]/85 backdrop-blur-md border border-[#8B5CF6]/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F97368] animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                    AI Sports Tech
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#A78BFA] bg-[#7C3AED]/20 px-2 py-0.5 rounded border border-[#8B5CF6]/30 font-semibold">
                  v2.4
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-[#E9E2F5] leading-snug">
                Precision athlete recovery algorithms, biometric triage, and dynamic training readiness.
              </p>

              <div className="pt-2 flex items-center gap-4 text-[11px] text-[#B8AEC8] border-t border-[#7C3AED]/15">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
                  Smart Triage
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FDBA8C]" />
                  Adaptive Drills
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Dark Frosted-Glass Login Form Card ─────────── */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-[#18132D]/95">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
              Welcome back
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#B8AEC8]">
              Sign in to your REVORA account
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div
              className="mb-6 p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
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

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* ── Email Field ─────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] transition-all duration-200 outline-none ${
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
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* ── Password Field ──────────────────────────────────────── */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full rounded-xl pl-10 pr-11 py-3 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] transition-all duration-200 outline-none ${
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
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* ── Remember Me & Forgot Password Row ───────────────────── */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                    id="remember-me"
                  />
                  <div
                    className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                      rememberMe
                        ? "bg-[#7C3AED] border-[#8B5CF6] shadow-sm shadow-[#7C3AED]/50"
                        : "bg-[#21183A] border-[#A78BFA]/30 group-hover:border-[#8B5CF6]"
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 text-[#FFFDF9] stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-[#B8AEC8] group-hover:text-[#E9E2F5] transition-colors">
                  Remember me
                </span>
              </label>

              <GradientButton
                type="button"
                variant="variant"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError("");
                  setForgotStatus(null);
                  setIsForgotModalOpen(true);
                }}
                className="min-w-0 px-2.5 py-1 text-xs sm:text-sm font-semibold text-[#A78BFA] hover:text-[#F97368] rounded-lg"
              >
                Forgot password?
              </GradientButton>
            </div>

            {/* ── Submit Button (Violet → Coral Gradient) ─────────────── */}
            <div className="pt-2">
              <GradientButton
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#17102F]" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </GradientButton>
            </div>
          </form>

          {/* ── Bottom Link: Don't have an account? Create an account ─── */}
          <div className="mt-8 pt-6 border-t border-[#7C3AED]/15 text-center">
            <p className="text-xs sm:text-sm text-[#B8AEC8]">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#FF6B6B] to-[#F97368] hover:opacity-85 transition-opacity inline-block ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Accessible Forgot Password Modal ──────────────────────────── */}
      {isForgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#18132D] border border-[#7C3AED]/30 shadow-2xl shadow-black/90">
            {/* Close Button */}
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => setIsForgotModalOpen(false)}
              className="min-w-0 w-8 h-8 p-0 rounded-xl absolute top-4 right-4 flex items-center justify-center text-[#B8AEC8] hover:text-[#FFFDF9]"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </GradientButton>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA] mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 id="forgot-modal-title" className="text-xl font-bold text-[#FFFDF9] font-display">
                Reset Password
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-[#B8AEC8]">
                Enter your account email to receive recovery instructions.
              </p>
            </div>

            {forgotStatus ? (
              <div className="p-4 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#FFFDF9] text-sm text-center space-y-3">
                <div className="flex items-center justify-center text-[#10B981]">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#E9E2F5]">{forgotStatus}</p>
                <GradientButton
                  type="button"
                  variant="variant"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full min-w-0 py-2.5 rounded-xl font-semibold text-xs text-[#FFFDF9]"
                >
                  Return to Login
                </GradientButton>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-semibold text-[#E9E2F5] uppercase tracking-wider mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B8AEC8]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="athlete@revora.com"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/70 bg-[#21183A] border border-[#A78BFA]/20 focus:bg-[#261C43] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <GradientButton
                    type="button"
                    variant="variant"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 min-w-0 py-3 rounded-xl font-semibold text-xs sm:text-sm text-[#B8AEC8] hover:text-[#FFFDF9]"
                  >
                    Cancel
                  </GradientButton>
                  <GradientButton
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 min-w-0 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    {isForgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Send Link"
                    )}
                  </GradientButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};


export default LoginPage;
