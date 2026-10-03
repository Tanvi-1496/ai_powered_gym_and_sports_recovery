import React, { useState } from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Dumbbell, 
  Info
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface InjuryZone {
  id: string;
  name: string;
  sportFocus: string;
  severity: "Low" | "Moderate" | "Elevated";
  severityColor: string;
  riskPercentage: number;
  symptoms: string[];
  probableFactor: string;
  recoveryPlan: {
    immediate: string;
    exercises: string[];
    loadAdvice: string;
    estimatedRecoveryDays: string;
  };
}

export const InteractiveAssessmentPreview: React.FC = () => {
  const zones: InjuryZone[] = [
    {
      id: "knee",
      name: "Patellar Tendon / Knee Complex",
      sportFocus: "Runners, Jumpers & Cross-Training",
      severity: "Moderate",
      severityColor: "text-[#FDBA8C] bg-[#FDBA8C]/15 border-[#FDBA8C]/30",
      riskPercentage: 42,
      symptoms: [
        "Anterior knee ache during deceleration or downhill running",
        "Morning stiffness at inferior patella pole",
        "Tenderness after squatting or plyometric impact"
      ],
      probableFactor: "Rapid jump in weekly running volume + reduced quadriceps tendon load tolerance.",
      recoveryPlan: {
        immediate: "Deload high-velocity deceleration. Shift to isometric Spanish Squats.",
        exercises: [
          "Spanish Squat Holds (5 sets x 45s at 70° knee flexion)",
          "Single-Leg Decline Board Isometric Squats",
          "Tibialis Anterior & Calf Eccentric Drops"
        ],
        loadAdvice: "Reduce running cadence intensity by 30% for 4 days. Zero high-impact jumping.",
        estimatedRecoveryDays: "5 - 7 days to baseline load"
      }
    },
    {
      id: "hamstring",
      name: "Proximal Hamstring / Bicep Femoris",
      sportFocus: "Sprinters, Field Athletes & Speed Work",
      severity: "Elevated",
      severityColor: "text-[#F97368] bg-[#F97368]/15 border-[#F97368]/30",
      riskPercentage: 68,
      symptoms: [
        "Sharp twinge during late swing sprint phase",
        "High localized tightness near ischial tuberosity",
        "Pain with active straight leg raise under tension"
      ],
      probableFactor: "High-speed sprinting without adequate posterior chain warmup or pelvis anterior tilt fatigue.",
      recoveryPlan: {
        immediate: "Avoid aggressive passive stretching. Prioritize blood flow and submaximal isometric bridging.",
        exercises: [
          "Isometric Hamstring Bridge on Bench (4 sets x 30s)",
          "Nordic Curls (Slow assisted eccentric phase)",
          "Single-Leg Romanian Deadlift (Light load, tempo 3-1-1)"
        ],
        loadAdvice: "Limit running to sub-maximal strides (below 65% max velocity) for 7 days.",
        estimatedRecoveryDays: "10 - 14 days structured protocol"
      }
    },
    {
      id: "shoulder",
      name: "Rotator Cuff & Subacromial Space",
      sportFocus: "Swimmers, Overhead Athletes & Lifters",
      severity: "Low",
      severityColor: "text-[#34D399] bg-[#34D399]/15 border-[#34D399]/30",
      riskPercentage: 18,
      symptoms: [
        "Mild pinching at top of overhead press or pull-up lockout",
        "Scapular winging or fatigue under prolonged bench press sets",
        "Soreness when sleeping on affected shoulder"
      ],
      probableFactor: "Rotator cuff endurance fatigue and lower trapezius under-recruitment.",
      recoveryPlan: {
        immediate: "Subacromial clearance drills, external rotator activation, and thoracic spine foam rolling.",
        exercises: [
          "Side-Lying Dumbbell External Rotations (3 sets x 15 reps)",
          "Prone Y-T-W Scapular Raises",
          "Thoracic Extension Foam Roll Mobilization"
        ],
        loadAdvice: "Swap barbell overhead presses for neutral-grip dumbbell presses for 1 week.",
        estimatedRecoveryDays: "3 - 5 days active stabilization"
      }
    },
    {
      id: "shin",
      name: "Medial Tibial Stress (Shin Splints)",
      sportFocus: "Distance Runners & Road Athletes",
      severity: "Moderate",
      severityColor: "text-[#FDBA8C] bg-[#FDBA8C]/15 border-[#FDBA8C]/30",
      riskPercentage: 48,
      symptoms: [
        "Diffuse tenderness along inner two-thirds of tibial border",
        "Discomfort during first 10 minutes of run that warms up, then aches post-run",
        "Tightness in soleus and flexor digitorum longus"
      ],
      probableFactor: "Excessive ground reaction force impact + overpronation with worn footwear.",
      recoveryPlan: {
        immediate: "Shift to soft surfaces (grass/track) or cross-train on bike/elliptical. Ice compression post-run.",
        exercises: [
          "Soleus Bent-Knee Calf Raises (Heavy slow resistance)",
          "Toe Walking & Heel Walking Drills (3 x 30 meters)",
          "Short Foot Arch Activation & Band Inversion"
        ],
        loadAdvice: "Decrease mileage by 40%, increase step rate (cadence) by 5-7% to reduce impact shock.",
        estimatedRecoveryDays: "7 - 10 days load modulation"
      }
    }
  ];

  const [selectedZone, setSelectedZone] = useState<InjuryZone>(zones[0]);

  return (
    <section id="interactive-preview" className="relative py-28 bg-[#0D0A1F] overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#F97368]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 mb-4 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-[#F97368]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#FDBA8C] font-display">
              Live Interactive Demonstration
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
            Explore AI Assessment in Real-Time
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#B8AEC8] leading-relaxed">
            Select an athletic symptom zone below to see how our AI evaluates risk probability, pinpoints probable biomechanical factors, and prescribes evidence-based recovery protocols.
          </p>
        </div>

        {/* Zone Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {zones.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            return (
              <GradientButton
                key={zone.id}
                variant={isSelected ? "default" : "variant"}
                onClick={() => setSelectedZone(zone)}
                className={`min-w-0 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2.5 ${
                  isSelected ? "scale-105" : ""
                }`}
              >
                <Activity className={`w-4 h-4 ${isSelected ? "text-[#FFFDF9]" : "text-[#A78BFA]"}`} />
                <span>{zone.name.split("/")[0]}</span>
              </GradientButton>
            );
          })}
        </div>


        {/* Live Triage Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-[#7C3AED]/25 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Triage & Risk Evaluation */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#7C3AED]/20">
                <div>
                  <span className="text-xs text-[#FDBA8C] font-bold tracking-wider font-mono uppercase">SELECTED ATHLETIC ZONE</span>
                  <h3 className="text-2xl font-bold text-[#FFFDF9] font-display mt-0.5">
                    {selectedZone.name}
                  </h3>
                  <p className="text-xs text-[#B8AEC8] font-semibold mt-1">Focus: {selectedZone.sportFocus}</p>
                </div>

                <div className={`px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono ${selectedZone.severityColor}`}>
                  {selectedZone.severity} Risk Level
                </div>
              </div>

              {/* Risk Gauge */}
              <div className="p-4 rounded-2xl bg-[#120D26]/80 border border-[#7C3AED]/20">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-[#FFFDF9]">Biomechanical Strain Probability</span>
                  <span className="font-mono font-bold text-[#F97368]">{selectedZone.riskPercentage}% Calculated Risk</span>
                </div>
                <div className="w-full h-2.5 bg-[#18132D] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#34D399] via-[#FDBA8C] to-[#F97368] rounded-full transition-all duration-500"
                    style={{ width: `${selectedZone.riskPercentage}%` }}
                  />
                </div>
              </div>

              {/* Reported Symptom Flags */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8AEC8] font-mono mb-3">
                  Reported Symptoms & Flags
                </h4>
                <div className="space-y-2">
                  {selectedZone.symptoms.map((symptom, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#E9E2F5] p-3 rounded-xl bg-[#18132D]/80 border border-[#7C3AED]/20">
                      <AlertTriangle className="w-4 h-4 text-[#F97368] shrink-0 mt-0.5" />
                      <span className="font-medium">{symptom}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Cause / Factor */}
              <div className="p-4 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs text-[#E9E2F5]">
                <div className="flex items-center gap-2 text-[#FDBA8C] font-bold mb-1">
                  <Info className="w-4 h-4 text-[#F97368]" />
                  <span>AI Probable Biomechanical Cause</span>
                </div>
                <p className="leading-relaxed text-[#B8AEC8] font-medium">{selectedZone.probableFactor}</p>
              </div>

            </div>

            {/* Right Column: AI Prescription & Recovery Drills */}
            <div className="lg:col-span-6 space-y-6 lg:border-l lg:border-[#7C3AED]/20 lg:pl-8">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#7C3AED]/20">
                <div className="flex items-center gap-2.5">
                  <Dumbbell className="w-5 h-5 text-[#F97368]" />
                  <h4 className="text-lg font-bold text-[#FFFDF9] font-display">
                    Prescribed Recovery Protocol
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#34D399] bg-[#34D399]/15 px-2.5 py-1 rounded-full border border-[#34D399]/30 font-bold">
                  {selectedZone.recoveryPlan.estimatedRecoveryDays}
                </span>
              </div>

              {/* Immediate Action */}
              <div className="p-4 rounded-xl bg-[#F97368]/15 border border-[#F97368]/30">
                <div className="text-xs font-bold text-[#F97368] uppercase tracking-wider mb-1">
                  Immediate 24-48h Strategy
                </div>
                <p className="text-xs sm:text-sm text-[#E9E2F5] font-medium">
                  {selectedZone.recoveryPlan.immediate}
                </p>
              </div>

              {/* Corrective Exercise Prescription */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B8AEC8] font-mono mb-3">
                  Targeted Active Rehab Drills
                </div>
                <div className="space-y-2.5">
                  {selectedZone.recoveryPlan.exercises.map((drill, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#18132D]/80 border border-[#7C3AED]/20">
                      <div className="w-5 h-5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0 mt-0.5 text-[#FDBA8C] text-xs font-bold font-mono">
                        {idx + 1}
                      </div>
                      <span className="text-xs sm:text-sm text-[#E9E2F5] font-semibold">
                        {drill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load Modulation Rule */}
              <div className="p-4 rounded-xl bg-[#120D26]/80 border border-[#7C3AED]/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#FDBA8C]" />
                <div className="text-xs text-[#B8AEC8]">
                  <span className="font-bold text-[#FFFDF9] block mb-0.5">Training Load Management:</span>
                  <span className="font-medium">{selectedZone.recoveryPlan.loadAdvice}</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
