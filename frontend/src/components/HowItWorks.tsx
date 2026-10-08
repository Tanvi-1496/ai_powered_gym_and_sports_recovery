import React from "react";
import { Target, ShieldAlert, Workflow, ArrowRight, Check } from "lucide-react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Assess",
      headline: "Tell us where it hurts and describe your symptoms.",
      description:
        "Input pain location, onset trigger, movement limitations, and current training load through our intuitive athlete symptom mapper.",
      icon: Target,
      iconBg: "bg-[#7C3AED]/20",
      iconColor: "text-[#A78BFA]",
      badgeBg: "bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30",
      accentBorder: "hover:border-[#7C3AED]/50",
      numberColor: "text-[#261C43] group-hover:text-[#7C3AED]/40",
      badge: "Symptom & Pain Mapping",
      bulletPoints: ["Targeted muscle & joint locator", "Pain intensity & mechanism rating", "Sport-specific movement screen"],
    },
    {
      number: "02",
      title: "Understand",
      headline: "Get a preliminary injury-risk assessment based on your inputs.",
      description:
        "Our AI engine cross-references biomechanical stress models and athletic recovery data to estimate risk level and likely factors.",
      icon: ShieldAlert,
      iconBg: "bg-[#7C3AED]/20",
      iconColor: "text-[#A78BFA]",
      badgeBg: "bg-[#F97368]/15 text-[#F97368] border-[#F97368]/30",
      accentBorder: "hover:border-[#F97368]/50",
      numberColor: "text-[#261C43] group-hover:text-[#F97368]/40",
      badge: "AI Risk Stratification",
      bulletPoints: ["Acute vs. chronic load analysis", "Overuse & strain risk probability", "Clinical caution thresholds"],
    },
    {
      number: "03",
      title: "Recover",
      headline: "Follow personalized recovery guidance, exercises and rest recommendations.",
      description:
        "Receive structured active recovery protocols, targeted mobility routines, load management strategies, and return-to-train milestones.",
      icon: Workflow,
      iconBg: "bg-[#7C3AED]/20",
      iconColor: "text-[#A78BFA]",
      badgeBg: "bg-[#FDBA8C]/15 text-[#FDBA8C] border-[#FDBA8C]/30",
      accentBorder: "hover:border-[#FDBA8C]/50",
      numberColor: "text-[#261C43] group-hover:text-[#FDBA8C]/40",
      badge: "Actionable Protocols",
      bulletPoints: ["Targeted corrective exercises", "Sleep, rest & recovery timing", "Interactive daily progress check-in"],
    },
  ];

  return (
    <section id="how-it-works" className="relative py-28 bg-[#120D26] overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 -left-48 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-48 w-96 h-96 bg-[#F97368]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97368]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#FDBA8C] font-display">
              Streamlined Recovery Flow
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
            How It Works
          </h2>
          
          <p className="mt-4 text-base sm:text-lg text-[#B8AEC8] leading-relaxed">
            A scientifically designed 3-step protocol engineered to help athletes diagnose early warning signs, prevent severe injuries, and accelerate safe return to performance.
          </p>
        </div>

        {/* 3 Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Subtle connecting progression line for desktop: Violet -> Coral -> Peach */}
          <div className="hidden md:block absolute top-28 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[#7C3AED]/50 via-[#F97368]/50 to-[#FDBA8C]/50 z-0 pointer-events-none" />

          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.number}
                className={`group relative glass-panel-hover rounded-3xl p-8 flex flex-col justify-between border border-[#7C3AED]/20 z-10 ${step.accentBorder}`}
              >
                {/* Step Top Bar */}
                <div>
                  <div className="flex items-center justify-between mb-8">
                    {/* Step Icon Badge */}
                    <div className="w-14 h-14 rounded-2xl bg-[#18132D] border border-[#7C3AED]/30 flex items-center justify-center group-hover:scale-105 group-hover:border-[#A78BFA]/50 transition-all duration-300 shadow-md">
                      <IconComponent className={`w-7 h-7 ${step.iconColor}`} />
                    </div>

                    {/* Number Stamp */}
                    <span className={`text-4xl sm:text-5xl font-extrabold font-display ${step.numberColor} transition-colors select-none`}>
                      {step.number}
                    </span>
                  </div>

                  {/* Title & Tag */}
                  <div className="mb-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${step.badgeBg}`}>
                      {step.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-[#FFFDF9] mt-3 font-display">
                      {step.number} — {step.title}
                    </h3>
                  </div>

                  {/* Headline */}
                  <p className="text-base font-bold text-[#E9E2F5] mt-2">
                    {step.headline}
                  </p>

                  {/* Body description */}
                  <p className="mt-3 text-sm text-[#B8AEC8] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bullet Points */}
                <div className="mt-8 pt-6 border-t border-[#7C3AED]/20 space-y-2.5">
                  {step.bulletPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#E9E2F5]">
                      <div className="w-4 h-4 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-[#FDBA8C]" />
                      </div>
                      <span className="font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Bottom Quick Link */}
        <div className="mt-14 text-center">
          <a
            href="#interactive-preview"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#F97368] hover:text-[#FDBA8C] transition-colors group"
          >
            <span>Preview live symptom triage & assessment in action</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

      </div>
    </section>
  );
};
