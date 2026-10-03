import React, { useRef, useState, useEffect } from "react";
import { ArrowRight, Play, ShieldAlert, Sparkles, Activity, CheckCircle2, ChevronDown } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface HeroProps {
  onStartRecovery?: () => void;
  onHowItWorks?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartRecovery, onHowItWorks }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setVideoLoaded(true);
    };

    const handleError = () => {
      console.warn("Hero video failed to load, falling back to gradient background.");
      setVideoError(true);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);

    // Ensure muted autoplay kicks off reliably across modern browsers
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy fallback: keep muted and retry on first user interaction
        video.muted = true;
        video.play().catch(() => {});
      });
    }

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
    };
  }, []);

  const scrollToHowItWorks = () => {
    if (onHowItWorks) {
      onHowItWorks();
      return;
    }
    const element = document.getElementById("how-it-works");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleStartRecovery = () => {
    if (onStartRecovery) {
      onStartRecovery();
      return;
    }
    const element = document.getElementById("interactive-preview");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden bg-[#0D0A1F]"
    >
      {/* ── Background Video Layer ────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {!videoError ? (
          <video
            ref={videoRef}
            src="/videos/revora-athlete.mp4"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            preload="auto"
            className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
              videoLoaded ? "opacity-85 scale-100" : "opacity-0 scale-105"
            } transform will-change-transform`}
          >
            <source src="/videos/revora-athlete.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0D0A1F] via-[#17102F] to-[#120D26]" />
        )}

        {/* Ambient Sports-Tech Lighting & Contrast Masks */}
        {/* Soft violet, coral & peach atmospheric glow blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-[#F97368]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-[#FDBA8C]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top gradient for seamless navbar blending with deep plum tint */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#0D0A1F] via-[#0D0A1F]/80 to-transparent" />
        
        {/* Left readable scrim with subtle deep-plum tint for typography clarity */}
        <div className="absolute inset-y-0 left-0 w-full md:w-4/5 lg:w-3/5 bg-gradient-to-r from-[#0D0A1F]/95 via-[#0D0A1F]/80 to-transparent z-10" />

        {/* Bottom smooth fade to next section */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0D0A1F] via-[#0D0A1F]/80 to-transparent z-10" />
      </div>

      {/* ── Hero Foreground Content ──────────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Copy Column */}
          <div className="lg:col-span-8 flex flex-col items-start text-left">
            
            {/* AI-POWERED ATHLETE RECOVERY Label */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 backdrop-blur-md shadow-sm mb-6 group cursor-default">
              <span className="w-2 h-2 rounded-full bg-[#F97368] animate-ping" />
              <span className="w-2 h-2 -ml-4 rounded-full bg-[#F97368]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
                AI-POWERED ATHLETE RECOVERY
              </span>
              <span className="text-[10px] text-[#B8AEC8] hidden sm:inline pl-1 border-l border-[#7C3AED]/25">
                v2.4 Live Engine
              </span>
            </div>

            {/* Main Headline: Recover Smarter. Train Safer. */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#FFFDF9] tracking-tight leading-[1.05] font-display max-w-3xl drop-shadow-sm">
              Recover Smarter.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#FF6B6B] to-[#F97368] block sm:inline">
                Train Safer.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-6 text-base sm:text-lg md:text-xl text-[#E9E2F5] font-medium leading-relaxed max-w-2xl">
              Understand your symptoms, explore personalized recovery guidance, and keep track of your recovery journey.
            </p>

            {/* CTAs */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <GradientButton
                onClick={handleStartRecovery}
                className="px-8 py-4 text-sm sm:text-base flex items-center justify-center gap-3 rounded-full cursor-pointer group shadow-xl"
              >
                <span className="font-bold tracking-wide">Start Your Recovery</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>

              <GradientButton
                variant="variant"
                onClick={scrollToHowItWorks}
                className="px-7 py-4 text-sm sm:text-base flex items-center justify-center gap-2.5 rounded-full cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#F97368] fill-[#F97368]/20" />
                <span>How It Works</span>
              </GradientButton>
            </div>

            {/* Athletic Trust & Validation Badges */}
            <div className="mt-12 pt-8 border-t border-[#7C3AED]/20 grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA] shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#FFFDF9]">Symptom Mapping</div>
                  <div className="text-[11px] text-[#B8AEC8]">Targeted biomechanics</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F97368]/15 border border-[#F97368]/30 flex items-center justify-center text-[#F97368] shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#FFFDF9]">Risk Stratification</div>
                  <div className="text-[11px] text-[#B8AEC8]">Overuse & strain alerts</div>
                </div>
              </div>

              <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-[#FDBA8C]/15 border border-[#FDBA8C]/30 flex items-center justify-center text-[#FDBA8C] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#FFFDF9]">Smart Protocols</div>
                  <div className="text-[11px] text-[#B8AEC8]">Personalized drills</div>
                </div>
              </div>
            </div>

          </div>

          {/* Floating Sports-Tech Telemetry Widget (Desktop Only) */}
          <div className="hidden lg:col-span-4 lg:flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-2xl shadow-2xl transition-all duration-300 hover:border-[#F97368]/40">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-xs font-bold text-[#FFFDF9] font-display tracking-wider">ATHLETIC READINESS</span>
                </div>
                <span className="text-xs font-mono text-[#FDBA8C] font-bold bg-[#7C3AED]/25 px-2 py-0.5 rounded-md border border-[#8B5CF6]/40">
                  OPTIMAL
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-[#E9E2F5] mb-1">
                    <span>Muscle Recovery Index</span>
                    <span className="font-mono text-[#FFFDF9] font-semibold">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#120D26] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7C3AED] via-[#FF6B6B] to-[#F97368] rounded-full w-[92%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#E9E2F5] mb-1">
                    <span>Injury Risk Probability</span>
                    <span className="font-mono text-[#34D399] font-semibold">Low (8%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#120D26] rounded-full overflow-hidden">
                    <div className="h-full bg-[#34D399] rounded-full w-[8%]" />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-[#B8AEC8] border-t border-white/10">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FDBA8C]" />
                    Recommended: Active Flush & Mobility
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Live Protocol Badge */}
            <div className="glass-panel px-4 py-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#F97368] flex items-center justify-center text-[#FFFDF9] font-extrabold text-[10px] shadow-sm">
                  AI
                </div>
                <div className="text-xs">
                  <p className="text-[#FFFDF9] font-semibold">Athlete Movement Symmetry</p>
                  <p className="text-[10px] text-[#B8AEC8]">97.8% Balanced Dynamic Load</p>
                </div>
              </div>
              <span className="text-[10px] text-[#F97368] font-mono font-bold bg-[#F97368]/15 px-2 py-0.5 rounded border border-[#F97368]/30">
                LIVE
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Subtle Scroll Down Prompt */}
      <GradientButton
        variant="variant"
        onClick={scrollToHowItWorks}
        aria-label="Scroll down to How It Works"
        className="min-w-0 absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-xs group"
      >
        <span className="text-[11px] uppercase font-bold tracking-wider text-[#B8AEC8] group-hover:text-[#FFFDF9] transition-colors">
          Explore Platform
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#F97368] animate-bounce" />
      </GradientButton>
    </section>
  );
};

