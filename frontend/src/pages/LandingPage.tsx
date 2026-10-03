import React from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { PlatformIntro } from "@/components/PlatformIntro";
import { InteractiveAssessmentPreview } from "@/components/InteractiveAssessmentPreview";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";

export const LandingPage: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0A1F] text-[#FFFDF9] flex flex-col selection:bg-[#7C3AED]/40 selection:text-[#FDBA8C]">
      {/* Navigation Bar */}
      <Navbar onStartAssessment={() => scrollToSection("interactive-preview")} />

      {/* Main Landing Page Content */}
      <main className="flex-grow">
        {/* Cinematic Video Hero */}
        <Hero 
          onStartRecovery={() => scrollToSection("interactive-preview")}
          onHowItWorks={() => scrollToSection("how-it-works")}
        />

        {/* How It Works (01 Assess, 02 Understand, 03 Recover) */}
        <HowItWorks />

        {/* Platform Overview (Your Recovery. One Intelligent Platform.) */}
        <PlatformIntro />

        {/* Live Interactive Symptom Triage Demo */}
        <InteractiveAssessmentPreview />

        {/* Final Call to Action */}
        <CtaSection onStartAssessment={() => scrollToSection("interactive-preview")} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
