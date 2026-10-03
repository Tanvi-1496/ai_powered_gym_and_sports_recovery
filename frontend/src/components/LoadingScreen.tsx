import React from "react";
import { RevoraLogo } from "@/components/RevoraLogo";
import { Loader2 } from "lucide-react";

export const LoadingScreen: React.FC<{ message?: string }> = ({
  message = "Loading athlete session...",
}) => {
  return (
    <div className="min-h-screen min-h-[100svh] w-full bg-[#0D0A1F] text-[#FFFDF9] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[#7C3AED]/40 selection:text-[#FDBA8C]">
      {/* Ambient Glows */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#F97368]/15 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <RevoraLogo variant="dark-bg" size="lg" showTagline={true} />

        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#18132D] border border-[#7C3AED]/30 shadow-xl">
          <Loader2 className="w-4 h-4 text-[#F97368] animate-spin" />
          <span className="text-xs font-semibold text-[#E9E2F5] tracking-wide">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
