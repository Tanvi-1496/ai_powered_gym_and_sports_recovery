import React, { useState } from "react";
import { 
  ShieldCheck, 
  Dumbbell, 
  Moon, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Clock
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

export const PlatformIntro: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const pillars = [
    {
      id: 0,
      title: "Injury Risk Assessment",
      badge: "AI Triage",
      icon: ShieldCheck,
      iconColor: "text-[#A78BFA]",
      iconBg: "bg-[#7C3AED]/20",
      description:
        "Comprehensive symptom intake evaluating joint load, pain quality, mechanism of strain, and training volume to generate an instant risk stratification.",
      previewTitle: "Acute vs. Overuse Risk Stratification",
      previewData: {
        score: "Low-Medium Risk (24%)",
        zone: "Patellar Tendon / Knee Complex",
        recommendation: "Load modification required. Reduce plyometrics by 40% for 5 days.",
        metrics: [
          { label: "Pain Severity", value: "3/10 (Localized)" },
          { label: "Mobility Deficit", value: "Mild Extension Lag" },
          { label: "Overload Score", value: "1.34 ACWR (Elevated)" },
        ]
      }
    },
    {
      id: 1,
      title: "Guided Recovery & Exercises",
      badge: "Targeted Drills",
      icon: Dumbbell,
      iconColor: "text-[#F97368]",
      iconBg: "bg-[#F97368]/20",
      description:
        "Scientifically curated rehab routines and active recovery drills customized to your specific symptom trigger, equipment availability, and sport.",
      previewTitle: "Customized Active Recovery Routine",
      previewData: {
        score: "Stage 2: Isometric Load Tolerance",
        zone: "Quadriceps & Patellar Tendon",
        recommendation: "Perform Spanish Squats (5x45s holds) + Tibialis Raises + Soft Tissue Flush.",
        metrics: [
          { label: "Protocol Duration", value: "18 Minutes" },
          { label: "Load Intensity", value: "Low / Non-Compensatory" },
          { label: "Rep Progress", value: "3 / 4 Drills Completed" },
        ]
      }
    },
    {
      id: 2,
      title: "Sleep, HRV & Rest Optimization",
      badge: "Physiology",
      icon: Moon,
      iconColor: "text-[#FDBA8C]",
      iconBg: "bg-[#FDBA8C]/20",
      description:
        "Integrate sleep duration, resting heart rate, HRV metrics, and daily energy levels to calculate a daily readiness index and rest timing.",
      previewTitle: "Daily Physiological Readiness & Fatigue",
      previewData: {
        score: "Readiness: 88 / 100 (Optimal)",
        zone: "Autonomic Nervous System",
        recommendation: "Sleep quality restored. Parasympathetic recovery dominant. Safe for aerobic recovery run.",
        metrics: [
          { label: "Sleep Duration", value: "8.2 Hours" },
          { label: "Resting HR", value: "52 bpm (Baseline)" },
          { label: "HRV (RMSSD)", value: "78 ms (+12%)" },
        ]
      }
    },
    {
      id: 3,
      title: "Recovery History & Analytics",
      badge: "Telemetry",
      icon: TrendingUp,
      iconColor: "text-[#8B5CF6]",
      iconBg: "bg-[#8B5CF6]/20",
      description:
        "Log daily check-ins, visualize soreness trajectories over time, track recovery milestones, and confidently know when you are cleared to compete.",
      previewTitle: "Longitudinal Pain & Soreness Curve",
      previewData: {
        score: "7-Day Recovery Trend: -65% Soreness",
        zone: "Bilateral Lower Body",
        recommendation: "Soreness normalized over 6 days. Target load progression enabled for upcoming training block.",
        metrics: [
          { label: "Logged Check-ins", value: "14 Consecutive Days" },
          { label: "Soreness Trajectory", value: "Descending (3.2 → 0.8)" },
          { label: "Return Clearance", value: "On Track (Day 8)" },
        ]
      }
    },
  ];

  const currentPillar = pillars[activeTab];

  return (
    <section id="platform" className="relative py-28 bg-[#0D0A1F] border-y border-[#7C3AED]/20 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#7C3AED]/15 via-[#F97368]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#FDBA8C] font-display">
              Unified Athlete Ecosystem
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
            Your Recovery.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#FF6B6B] to-[#F97368]">
              One Intelligent Platform.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#B8AEC8] leading-relaxed">
            No more fragmented spreadsheets, guessing soreness causes, or disjointed advice. Everything you need to assess symptoms, manage load, and speed up recovery in a single high-performance cockpit.
          </p>
        </div>

        {/* Interactive Platform Cockpit Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: 4 Core Pillar Selectors */}
          <div className="lg:col-span-5 flex flex-col gap-3 justify-between">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              const isSelected = activeTab === pillar.id;

              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActiveTab(pillar.id)}
                  className={`w-full min-w-0 text-left p-5 rounded-2xl border flex items-start justify-start gap-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#21183A] border-[#7C3AED]/70 shadow-lg shadow-[#7C3AED]/15 scale-[1.01]"
                      : "bg-[#18132D] border-[#7C3AED]/20 hover:bg-[#1E1638] hover:border-[#7C3AED]/40"
                  }`}
                >
                  <div className="p-3 rounded-xl bg-[#7C3AED]/15 border border-[#A78BFA]/20 text-[#A78BFA] shrink-0 mt-0.5 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-base font-bold font-display ${isSelected ? "text-[#FFFDF9]" : "text-[#E9E2F5]"}`}>
                        {pillar.title}
                      </h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/25 text-[#FDBA8C] border border-[#7C3AED]/30">
                        {pillar.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#B8AEC8] line-clamp-2 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Live Interactive Cockpit Preview Card */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col justify-between h-full min-h-[440px] border border-[#7C3AED]/25">
              
              {/* Cockpit Card Header */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#7C3AED]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#F97368] animate-pulse" />
                    <div>
                      <span className="text-[11px] font-mono text-[#FDBA8C] font-bold tracking-wider uppercase">
                        AI Telemetry Console
                      </span>
                      <h4 className="text-lg font-bold text-[#FFFDF9] font-display">
                        {currentPillar.previewTitle}
                      </h4>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#7C3AED]/25 text-[#E9E2F5] border border-[#8B5CF6]/40">
                    Live Simulator
                  </span>
                </div>

                {/* Main Status Callout */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#7C3AED]/25 via-[#F97368]/15 to-transparent border border-[#7C3AED]/25">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#B8AEC8]">Analysis Status</span>
                    <span className="text-xs font-bold text-[#FDBA8C]">{currentPillar.previewData.score}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#FFFDF9] mb-1">
                    Target: {currentPillar.previewData.zone}
                  </div>
                  <p className="text-xs text-[#E9E2F5] leading-relaxed flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#F97368] shrink-0 mt-0.5" />
                    <span>{currentPillar.previewData.recommendation}</span>
                  </p>
                </div>

                {/* 3 Metric Chips */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentPillar.previewData.metrics.map((metric, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#120D26]/80 border border-[#7C3AED]/20">
                      <div className="text-[11px] text-[#B8AEC8] uppercase tracking-wider font-semibold">
                        {metric.label}
                      </div>
                      <div className="text-sm font-bold text-[#FFFDF9] font-mono mt-1">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-8 pt-5 border-t border-[#7C3AED]/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#B8AEC8]">
                  <Clock className="w-4 h-4 text-[#FDBA8C]" />
                  <span>Updates dynamically with athlete check-ins</span>
                </div>

                <GradientButton
                  asChild
                  className="min-w-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                >
                  <a href="#interactive-preview" className="inline-flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#17102F]" />
                    <span>Test Sample Triage</span>
                  </a>
                </GradientButton>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

