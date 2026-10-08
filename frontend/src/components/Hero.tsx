import React, { useRef, useState, useEffect } from "react";
import { ArrowRight, Play, ShieldAlert, Target, Workflow, ChevronDown } from "lucide-react";
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
              videoLoaded ? "opacity-85 scale-110" : "opacity-0 scale-115"
            } transform will-change-transform`}
            style={{ transform: "scale(1.10)", transformOrigin: "center" }}
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

        {/* Bottom-right corner watermark mask */}
        <div className="absolute bottom-0 right-0 w-72 h-36 bg-gradient-to-tl from-[#0D0A1F] via-[#0D0A1F]/85 to-transparent pointer-events-none z-10" />
      </div>

      {/* ── Hero Foreground Content ──────────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
        <div className="max-w-3xl flex flex-col items-start text-left">

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
              className="px-8 py-4 text-sm sm:text-base flex items-center justify-center gap-3 rounded-full cursor-pointer group shadow-md"
            >
              <span className="font-bold tracking-wide">Start Your Recovery</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </GradientButton>

            <GradientButton
              variant="variant"
              onClick={scrollToHowItWorks}
              className="px-7 py-4 text-sm sm:text-base flex items-center justify-center gap-2.5 rounded-full cursor-pointer"
            >
              <Play className="w-4 h-4 text-[#FDBA8C] fill-[#FDBA8C]/20" />
              <span>How It Works</span>
            </GradientButton>
          </div>

          {/* Athletic Trust & Validation Badges */}
          <div className="mt-12 pt-8 border-t border-[#7C3AED]/20 grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#FFFDF9]">Symptom Mapping</div>
                <div className="text-[11px] text-[#B8AEC8]">Targeted biomechanics</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#FFFDF9]">Risk Stratification</div>
                <div className="text-[11px] text-[#B8AEC8]">Overuse & strain alerts</div>
              </div>
            </div>

            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 border border-[#A78BFA]/20 flex items-center justify-center text-[#A78BFA] shrink-0">
                <Workflow className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#FFFDF9]">Smart Protocols</div>
                <div className="text-[11px] text-[#B8AEC8]">Personalized drills</div>
              </div>
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
        <ChevronDown className="w-3.5 h-3.5 text-[#FDBA8C] animate-bounce" />
      </GradientButton>
    </section>
  );
};

