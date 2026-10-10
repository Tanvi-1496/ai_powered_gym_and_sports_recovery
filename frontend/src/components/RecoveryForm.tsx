import React, { useState, type FormEvent, useMemo } from "react";
import {
  Moon,
  HeartPulse,
  Activity,
  Flame,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RotateCcw,
  Calendar,
  Info,
} from "lucide-react";
import {
  createRecoveryCheckin,
  type RecoveryCheckin,
  type RecoveryCheckinCreate,
} from "@/services/recovery";
import { GradientButton } from "@/components/ui/gradient-button";

interface RecoveryFormProps {
  onSaved?: (checkin: RecoveryCheckin) => void;
  className?: string;
  compact?: boolean;
}

interface FormState {
  sleep_hours: string;
  resting_heart_rate: string;
  hrv_ms: string;
  soreness: string;
  energy_level: string;
}

const DEFAULT_FORM_STATE: FormState = {
  sleep_hours: "7.5",
  resting_heart_rate: "60",
  hrv_ms: "55",
  soreness: "3",
  energy_level: "8",
};

export const RecoveryForm: React.FC<RecoveryFormProps> = ({
  onSaved,
  className = "",
  compact = false,
}) => {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCheckin, setLastCheckin] = useState<RecoveryCheckin | null>(null);

  // Dynamic current date label
  const currentDateLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Soreness semantic descriptor
  const sorenessLabel = useMemo(() => {
    const val = parseInt(form.soreness, 10);
    if (isNaN(val) || val <= 2) return "None / Minimal";
    if (val <= 4) return "Mild Tightness";
    if (val <= 6) return "Moderate Soreness";
    if (val <= 8) return "High Soreness";
    return "Severe Soreness";
  }, [form.soreness]);

  // Energy semantic descriptor
  const energyLabel = useMemo(() => {
    const val = parseInt(form.energy_level, 10);
    if (isNaN(val) || val <= 2) return "Exhausted";
    if (val <= 4) return "Low Energy";
    if (val <= 6) return "Moderate / Balanced";
    if (val <= 8) return "Good Vitality";
    return "Peak Energy";
  }, [form.energy_level]);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (errorMessage) setErrorMessage(null);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    const sleep = Number(form.sleep_hours);
    if (form.sleep_hours.trim() === "" || isNaN(sleep)) {
      errors.sleep_hours = "Please enter your sleep duration in hours.";
    } else if (sleep < 0 || sleep > 24) {
      errors.sleep_hours = "Sleep duration must be between 0 and 24 hours.";
    }

    const rhr = Number(form.resting_heart_rate);
    if (form.resting_heart_rate.trim() === "" || isNaN(rhr)) {
      errors.resting_heart_rate = "Please enter your resting heart rate.";
    } else if (rhr < 25 || rhr > 240) {
      errors.resting_heart_rate = "Resting heart rate must be between 25 and 240 bpm.";
    }

    if (form.hrv_ms.trim() !== "") {
      const hrv = Number(form.hrv_ms);
      if (isNaN(hrv) || hrv < 0 || hrv > 500) {
        errors.hrv_ms = "HRV must be between 0 and 500 ms (or left empty).";
      }
    }

    const soreness = Number(form.soreness);
    if (isNaN(soreness) || soreness < 1 || soreness > 10) {
      errors.soreness = "Soreness rating must be between 1 and 10.";
    }

    const energy = Number(form.energy_level);
    if (isNaN(energy) || energy < 1 || energy > 10) {
      errors.energy_level = "Energy level rating must be between 1 and 10.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const isValid = validate();
    if (!isValid) {
      return;
    }

    setSaving(true);

    const payload: RecoveryCheckinCreate = {
      sleep_hours: parseFloat(form.sleep_hours),
      resting_heart_rate: parseInt(form.resting_heart_rate, 10),
      hrv_ms: form.hrv_ms.trim() === "" ? null : parseFloat(form.hrv_ms),
      soreness: parseInt(form.soreness, 10),
      energy_level: parseInt(form.energy_level, 10),
    };

    try {
      const response = await createRecoveryCheckin(payload);
      setLastCheckin(response);
      setSuccessMessage("Daily recovery check-in saved successfully!");
      if (onSaved) {
        onSaved(response);
      }
    } catch (err: unknown) {
      console.error("[RecoveryForm] Submit error:", err);
      let msg = "Could not save check-in. Please verify your connection and try again.";
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: unknown } } };
        const detail = axiosErr.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          msg = `${detail[0].loc?.slice(-1)[0] || "Field"}: ${detail[0].msg}`;
        } else if (axiosErr.response?.status === 401) {
          msg = "Session expired or authentication required. Please log in again.";
        }
      } else if (err instanceof Error) {
        if (err.message === "Network Error") {
          msg = "Unable to connect to Revora backend. Please ensure the backend server is running.";
        } else {
          msg = err.message;
        }
      }
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  const handleReset = () => {
    setForm(DEFAULT_FORM_STATE);
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleLogAnother = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div
      className={`rounded-3xl bg-[#18132D] border border-[#7C3AED]/25 shadow-2xl p-6 sm:p-7 relative overflow-hidden text-[#FFFDF9] ${className}`}
      id="daily-recovery-checkin"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 bg-[#F97368]/15 rounded-full blur-[70px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#7C3AED]/20 rounded-full blur-[80px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-6">

        {/* ── CARD HEADING ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#7C3AED]/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/35 flex items-center justify-center text-[#F97368]">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#FFFDF9] font-display tracking-tight">
                Daily Recovery Check-in
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
              Record today&apos;s recovery signals to update your recovery readiness estimate.
            </p>
          </div>

          {/* Dynamic Date Label */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs font-mono text-[#FDBA8C] shrink-0 self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>{currentDateLabel}</span>
          </div>
        </div>

        {/* ── SUCCESS MESSAGE & RECOVERY SCORE RESULT CARD ─────────── */}
        {successMessage && lastCheckin && (
          <div
            className="p-5 rounded-2xl bg-gradient-to-br from-[#1A1435] to-[#120D26] border border-[#10B981]/40 animate-in fade-in zoom-in-95 duration-300 space-y-4 shadow-xl"
            role="status"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#7C3AED]/20">
              <div className="flex items-center gap-2.5 text-[#10B981]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[#FFFDF9]">{successMessage}</p>
                  <p className="text-xs text-[#B8AEC8] mt-0.5">
                    Recorded at{" "}
                    {new Date(lastCheckin.created_at || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    : {lastCheckin.sleep_hours}h sleep • {lastCheckin.resting_heart_rate} bpm pulse
                    {lastCheckin.hrv_ms ? ` • ${lastCheckin.hrv_ms} ms HRV` : ""} • Soreness{" "}
                    {lastCheckin.soreness}/10 • Energy {lastCheckin.energy_level}/10
                  </p>
                </div>
              </div>
            </div>

            {/* Score Result Card */}
            {lastCheckin.prediction ? (
              <div className="p-4 rounded-xl bg-[#21183A]/90 border border-[#7C3AED]/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
                        <span>Recovery Readiness</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          lastCheckin.prediction.tier === "optimal"
                            ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/35"
                            : lastCheckin.prediction.tier === "moderate"
                            ? "bg-[#F59E0B]/15 text-[#FDBA8C] border-[#F59E0B]/35"
                            : "bg-[#F97368]/15 text-[#F97368] border-[#F97368]/35"
                        }`}
                      >
                        {lastCheckin.prediction.tier} readiness
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-[#FFFDF9] font-display">
                      {lastCheckin.prediction.headline}
                    </h4>
                    <p className="text-xs text-[#E9E2F5]/90 leading-relaxed">
                      {lastCheckin.prediction.summary}
                    </p>
                  </div>

                  {/* Large Numeric Score */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 bg-[#120D26] px-4 py-2.5 rounded-xl border border-[#7C3AED]/25">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]">
                      Readiness Score
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black font-display text-gradient-coral-peach">
                        {lastCheckin.prediction.score}
                      </span>
                      <span className="text-xs text-[#B8AEC8] font-mono">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Score Visual Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-[#120D26] h-2.5 rounded-full overflow-hidden border border-[#7C3AED]/20">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        lastCheckin.prediction.score >= 75
                          ? "bg-gradient-to-r from-[#10B981] to-[#34D399]"
                          : lastCheckin.prediction.score >= 50
                          ? "bg-gradient-to-r from-[#F59E0B] to-[#FDBA8C]"
                          : "bg-gradient-to-r from-[#EF4444] to-[#F97368]"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, lastCheckin.prediction.score))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#B8AEC8] font-mono">
                    <span>High Fatigue (&lt;50)</span>
                    <span>Moderate (50-74)</span>
                    <span>Optimal (75-100)</span>
                  </div>
                </div>

                {/* Model limitation note */}
                <div className="p-2.5 rounded-lg bg-[#120D26]/80 border border-[#7C3AED]/20 text-[11px] text-[#B8AEC8] leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#FDBA8C] shrink-0 mt-0.5" />
                  <span>
                    A model-estimated recovery score based on available athlete telemetry. Not a clinical medical diagnosis or injury probability.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#21183A]/60 border border-[#7C3AED]/25 text-xs text-[#B8AEC8]">
                Check-in saved successfully. Recovery score calculation was unavailable for this entry.
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleLogAnother}
                className="text-xs font-bold text-[#FDBA8C] hover:text-[#FFFDF9] underline flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Log another check-in</span>
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ALERT ──────────────────────────────────────────── */}
        {errorMessage && (
          <div
            className="p-4 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/35 flex items-start gap-2.5 text-[#FF6B6B] animate-in fade-in duration-200"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#FFFDF9]">Check-in submission failed</p>
              <p className="text-xs text-[#FF6B6B]/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* ── FORM FIELDS (2-COLUMN GRID ON DESKTOP) ───────────────── */}
        {(!successMessage || !compact) && (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Field 1: Sleep Duration */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkin-sleep-hours"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#E9E2F5]"
                >
                  <Moon className="w-3.5 h-3.5 text-[#A78BFA]" />
                  <span>Sleep Duration</span>
                  <span className="text-[#F97368] font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    id="checkin-sleep-hours"
                    type="number"
                    min="0"
                    max="24"
                    step="0.1"
                    required
                    value={form.sleep_hours}
                    onChange={(e) => updateField("sleep_hours", e.target.value)}
                    className={`block w-full rounded-xl bg-[#120D26]/90 border p-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/50 focus:outline-none transition-all ${
                      fieldErrors.sleep_hours
                        ? "border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                        : "border-[#7C3AED]/30 focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
                    }`}
                    placeholder="e.g. 7.5"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#B8AEC8] pointer-events-none font-mono">
                    hours
                  </span>
                </div>
                {fieldErrors.sleep_hours ? (
                  <p className="text-[11px] text-[#FF6B6B]">{fieldErrors.sleep_hours}</p>
                ) : (
                  <p className="text-[10px] text-[#B8AEC8]">Valid range: 0.0 – 24.0 hours</p>
                )}
              </div>

              {/* Field 2: Resting Heart Rate */}
              <div className="space-y-1.5">
                <label
                  htmlFor="checkin-resting-hr"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#E9E2F5]"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-[#F97368]" />
                  <span>Resting Heart Rate</span>
                  <span className="text-[#F97368] font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    id="checkin-resting-hr"
                    type="number"
                    min="25"
                    max="240"
                    step="1"
                    required
                    value={form.resting_heart_rate}
                    onChange={(e) => updateField("resting_heart_rate", e.target.value)}
                    className={`block w-full rounded-xl bg-[#120D26]/90 border p-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/50 focus:outline-none transition-all ${
                      fieldErrors.resting_heart_rate
                        ? "border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                        : "border-[#7C3AED]/30 focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
                    }`}
                    placeholder="e.g. 60"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#B8AEC8] pointer-events-none font-mono">
                    bpm
                  </span>
                </div>
                {fieldErrors.resting_heart_rate ? (
                  <p className="text-[11px] text-[#FF6B6B]">{fieldErrors.resting_heart_rate}</p>
                ) : (
                  <p className="text-[10px] text-[#B8AEC8]">Valid range: 25 – 240 bpm</p>
                )}
              </div>

              {/* Field 3: Heart Rate Variability (HRV) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="checkin-hrv-ms"
                  className="flex items-center justify-between text-xs font-semibold text-[#E9E2F5]"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#FDBA8C]" />
                    <span>Heart Rate Variability (HRV)</span>
                  </span>
                  <span className="text-[10px] text-[#B8AEC8] italic font-normal">Optional</span>
                </label>
                <div className="relative">
                  <input
                    id="checkin-hrv-ms"
                    type="number"
                    min="0"
                    max="500"
                    step="0.1"
                    value={form.hrv_ms}
                    onChange={(e) => updateField("hrv_ms", e.target.value)}
                    className={`block w-full rounded-xl bg-[#120D26]/90 border p-2.5 text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/50 focus:outline-none transition-all ${
                      fieldErrors.hrv_ms
                        ? "border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B]"
                        : "border-[#7C3AED]/30 focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
                    }`}
                    placeholder="e.g. 55.0 (leave blank if unavailable)"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#B8AEC8] pointer-events-none font-mono">
                    ms
                  </span>
                </div>
                {fieldErrors.hrv_ms ? (
                  <p className="text-[11px] text-[#FF6B6B]">{fieldErrors.hrv_ms}</p>
                ) : (
                  <p className="text-[10px] text-[#B8AEC8]">rMSSD sensor telemetry: 0 – 500 ms</p>
                )}
              </div>

              {/* Field 4: Muscle Soreness */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#120D26]/70 border border-[#7C3AED]/20">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="checkin-soreness"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#E9E2F5]"
                  >
                    <Flame className="w-3.5 h-3.5 text-[#F97368]" />
                    <span>Muscle Soreness</span>
                    <span className="text-[#F97368] font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FDBA8C]">{sorenessLabel}</span>
                    <span className="text-xs font-extrabold text-[#F97368] font-mono px-2 py-0.5 rounded-lg bg-[#F97368]/15 border border-[#F97368]/30">
                      {form.soreness} / 10
                    </span>
                  </div>
                </div>

                <input
                  id="checkin-soreness"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={form.soreness}
                  onChange={(e) => updateField("soreness", e.target.value)}
                  className="w-full h-2 bg-[#21183A] rounded-lg appearance-none cursor-pointer accent-[#F97368]"
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={parseInt(form.soreness, 10)}
                />

                <div className="flex justify-between text-[10px] text-[#B8AEC8]">
                  <span>1 (None)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Severe)</span>
                </div>
                {fieldErrors.soreness && (
                  <p className="text-[11px] text-[#FF6B6B]">{fieldErrors.soreness}</p>
                )}
              </div>

              {/* Field 5: Energy Level */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#120D26]/70 border border-[#7C3AED]/20">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="checkin-energy"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#E9E2F5]"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Energy Level</span>
                    <span className="text-[#F97368] font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#10B981]">{energyLabel}</span>
                    <span className="text-xs font-extrabold text-[#10B981] font-mono px-2 py-0.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30">
                      {form.energy_level} / 10
                    </span>
                  </div>
                </div>

                <input
                  id="checkin-energy"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={form.energy_level}
                  onChange={(e) => updateField("energy_level", e.target.value)}
                  className="w-full h-2 bg-[#21183A] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={parseInt(form.energy_level, 10)}
                />

                <div className="flex justify-between text-[10px] text-[#B8AEC8]">
                  <span>1 (Exhausted)</span>
                  <span>5 (Balanced)</span>
                  <span>10 (Peak Energy)</span>
                </div>
                {fieldErrors.energy_level && (
                  <p className="text-[11px] text-[#FF6B6B]">{fieldErrors.energy_level}</p>
                )}
              </div>

            </div>

            {/* ── FORM ACTIONS (SUBMIT & RESET) ───────────────────────── */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <GradientButton
                type="submit"
                disabled={saving}
                className="w-full sm:flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide uppercase disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#7C3AED]/25"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Check-in...</span>
                  </>
                ) : (
                  <>
                    <HeartPulse className="w-4 h-4" />
                    <span>Submit Check-in</span>
                  </>
                )}
              </GradientButton>

              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#21183A] border border-[#7C3AED]/30 text-xs font-semibold text-[#B8AEC8] hover:text-[#FFFDF9] hover:border-[#7C3AED]/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Inputs</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default RecoveryForm;
