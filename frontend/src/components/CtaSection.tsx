import React from "react";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Activity } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface CtaSectionProps {
  onStartAssessment?: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onStartAssessment }) => {
  const handleAction = () => {
    if (onStartAssessment) {
      onStartAssessment();
      return;
    }
    const preview = document.getElementById("interactive-preview");
    if (preview) {
      preview.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="cta-section" className="relative py-28 bg-[#0D0A1F] overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-r from-[#7C3AED]/20 via-[#F97368]/20 to-[#FDBA8C]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Main CTA Card */}
        <div className="rounded-3xl p-8 sm:p-14 border border-[#7C3AED]/30 bg-gradient-to-br from-[#18132D] via-[#21183A] to-[#120D26] shadow-2xl relative overflow-hidden text-[#FFFDF9]">
          
          {/* Subtle Accent Glow Rings */}
          <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#7C3AED]/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-[#F97368]/30 rounded-full blur-2xl pointer-events-none" />

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/25 border border-[#7C3AED]/30 mb-6 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-[#F97368]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#FDBA8C] font-display">
              Join Leading Athletes & Runners
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#FFFDF9] tracking-tight font-display max-w-2xl mx-auto">
            Ready to train smarter?
          </h2>

          {/* Supporting text */}
          <p className="mt-5 text-base sm:text-xl text-[#E9E2F5] max-w-xl mx-auto leading-relaxed font-medium">
            Start your recovery journey and make every step count.
          </p>

          {/* Action Button */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <GradientButton
              onClick={handleAction}
              className="px-10 py-4 text-base sm:text-lg flex items-center justify-center gap-3 rounded-full group shadow-lg cursor-pointer"
            >
              <span className="font-extrabold tracking-wide uppercase">Start Assessment</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </GradientButton>
          </div>

          {/* Feature Micro-Badges */}
          <div className="mt-10 pt-8 border-t border-[#7C3AED]/25 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#E9E2F5]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F97368]" />
              <span>Biomechanical Risk Screening</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#A78BFA]" />
              <span>Personalized Active Rehab</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FDBA8C]" />
              <span>Instant AI Protocol Generation</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

