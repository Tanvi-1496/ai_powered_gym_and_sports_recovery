import React from "react";
import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";

interface RecoverySafetyCardProps {
  customGuidelines?: string[];
}

const DEFAULT_SAFETY_GUIDELINES: string[] = [
  "Maintain all exercises within a pain-free envelope (discomfort ≤ 2/10). Stop immediately if sharp pain occurs.",
  "Avoid aggressive high-velocity or ballistic loading until full range of motion is achieved symmetrically.",
  "Prioritize 7.5–9 hours of sleep and adequate hydration to support muscle repair and autonomic recovery.",
];

export const RecoverySafetyCard: React.FC<RecoverySafetyCardProps> = ({
  customGuidelines,
}) => {
  const guidelines =
    customGuidelines && customGuidelines.length > 0
      ? customGuidelines
      : DEFAULT_SAFETY_GUIDELINES;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-3.5 shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-[#7C3AED]/15">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#FDBA8C]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#FDBA8C] font-display">
            Safety & Movement Guidance
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#10B981] flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Protocol</span>
        </span>
      </div>

      <ul className="space-y-2 text-xs text-[#E9E2F5]">
        {guidelines.map((g, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97368] shrink-0 mt-1.5" />
            <span className="leading-relaxed">{g}</span>
          </li>
        ))}
      </ul>

      <div className="p-3 rounded-xl bg-[#120D26]/80 border border-[#7C3AED]/20 flex items-start gap-2 text-[11px] text-[#B8AEC8]">
        <AlertCircle className="w-3.5 h-3.5 text-[#FDBA8C] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          Discontinue any movement that produces sharp pain or joint instability. Consult a licensed physical therapist or sports medicine physician for clinical rehabilitation.
        </span>
      </div>
    </div>
  );
};
