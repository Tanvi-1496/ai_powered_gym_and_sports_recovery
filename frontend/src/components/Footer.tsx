import React from "react";
import { ShieldCheck } from "lucide-react";
import { RevoraLogo } from "@/components/RevoraLogo";

export const Footer: React.FC = () => {
  return (
    <footer id="about" className="bg-[#0A0718] border-t border-[#7C3AED]/20 pt-16 pb-12 text-[#B8AEC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#7C3AED]/20">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <RevoraLogo variant="dark-bg" size="md" />

            <p className="text-sm text-[#B8AEC8] leading-relaxed max-w-sm">
              Empowering athletes, runners, and performance lifters with intelligent symptom analysis, biomechanical injury-risk stratification, and science-backed recovery protocols.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#FDBA8C] bg-[#7C3AED]/20 px-3.5 py-1.5 rounded-full border border-[#7C3AED]/30 w-fit font-mono">
              <span className="w-2 h-2 rounded-full bg-[#F97368] animate-pulse" />
              <span>REVORA AI Engine v2.4 • Operational</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFFDF9] font-display">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-sm text-[#E9E2F5]">
              <li>
                <a href="#hero" className="hover:text-[#F97368] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#F97368] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#platform" className="hover:text-[#F97368] transition-colors">
                  Recovery Platform
                </a>
              </li>
              <li>
                <a href="#interactive-preview" className="hover:text-[#F97368] transition-colors">
                  Live Symptom Triage
                </a>
              </li>
              <li>
                <a href="#cta-section" className="hover:text-[#F97368] transition-colors">
                  Start Assessment
                </a>
              </li>
            </ul>
          </div>

          {/* Clinical & Scientific Pillars */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFFDF9] font-display">
              Scientific Principles
            </h4>
            <ul className="space-y-2 text-xs text-[#B8AEC8]">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
                <span>Acute:Chronic Workload Ratio (ACWR) load management</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F97368] shrink-0 mt-0.5" />
                <span>Isometric & eccentric tendon load adaptation</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FDBA8C] shrink-0 mt-0.5" />
                <span>Autonomic recovery via Heart Rate Variability (HRV)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Disclaimer, Attribution & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#8B7F9E]">
          <div className="max-w-2xl text-left leading-relaxed space-y-2">
            <p>
              <span className="font-bold text-[#B8AEC8]">Medical Disclaimer:</span> REVORA is designed for athletic performance optimization, symptom education, and load management guidance. It is not a substitute for professional medical diagnosis, emergency medical evaluation, or physical therapy treatment. Consult a licensed physician for acute trauma or severe symptoms.
            </p>
            <p className="text-[11px] text-[#B8AEC8]/70">
              <span className="font-semibold text-[#B8AEC8]">3D Model Attribution:</span> Source geometry derived from Z-Anatomy (CC BY-SA 4.0, based on BodyParts3D, © The Database Center for Life Science, CC BY-SA 2.1 jp).
            </p>
          </div>

          <p className="text-center md:text-right shrink-0 text-[#8B7F9E]">
            © {new Date().getFullYear()} REVORA AI. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};
