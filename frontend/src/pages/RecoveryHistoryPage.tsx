import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Flame,
  History,
  Layers,
  PlusCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  getAssessmentHistory,
  type AssessmentRecord,
} from "@/services/assessment";
import { getAnatomyLabel } from "@/data/anatomyManifest";
import { ALL_BODY_REGIONS } from "@/features/assessment/BodyMapStep";
import { RecoveryHistorySummaryCards } from "@/components/recovery/RecoveryHistorySummaryCards";
import { RecoveryHistoryItemModal } from "@/components/recovery/RecoveryHistoryItemModal";

export const RecoveryHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      const historyList = await getAssessmentHistory();
      setAssessments(historyList);
      setLoading(false);
    }
    loadHistory();
  }, []);

  // Filtered and sorted assessments
  const filteredAssessments = useMemo(() => {
    return assessments
      .filter((item) => {
        // Status match
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        // Search match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const activityMatch =
            item.activity?.toLowerCase().includes(q) ||
            item.custom_activity?.toLowerCase().includes(q);
          const symptomsMatch = item.symptoms?.some((s) => s.toLowerCase().includes(q));
          const areasMatch = item.body_areas?.some((area) => {
            const label = getAnatomyLabel(area).toLowerCase();
            return label.includes(q) || area.toLowerCase().includes(q);
          });
          if (!activityMatch && !symptomsMatch && !areasMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [assessments, searchQuery, statusFilter, sortOrder]);

  const formatActivityName = (item: AssessmentRecord) => {
    if (item.activity === "other" && item.custom_activity) {
      return item.custom_activity;
    }
    return item.activity
      ? item.activity.charAt(0).toUpperCase() + item.activity.slice(1)
      : "Not specified";
  };

  const formatDuration = (d?: string) => {
    switch (d) {
      case "<1_day": return "< 24 hours";
      case "1-3_days": return "1–3 days";
      case "4-7_days": return "4–7 days";
      case "1-2_weeks": return "1–2 weeks";
      case ">2_weeks": return "> 2 weeks";
      default: return d || "Not specified";
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-page-enter pb-16">
        
        {/* ── Top Bar & Actions ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GradientButton
              type="button"
              variant="variant"
              onClick={() => navigate("/dashboard")}
              className="min-w-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#F97368]" />
              <span>Dashboard</span>
            </GradientButton>

            <span className="text-xs text-[#B8AEC8] font-mono flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Recovery Timeline</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <GradientButton
              type="button"
              onClick={() => navigate("/assessment")}
              className="min-w-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </GradientButton>
          </div>
        </div>

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
            <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Telemetry History</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-[#FFFDF9] tracking-tight">
            Recovery History
          </h1>
          <p className="text-sm sm:text-base text-[#B8AEC8]">
            Track your previous assessments and recovery progress over time.
          </p>
        </div>

        {/* ── Summary Statistics Cards ─────────────────────────────────── */}
        <RecoveryHistorySummaryCards assessments={assessments} />

        {/* ── Filter & Search Control Panel ────────────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 space-y-3 shadow-lg">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#B8AEC8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by activity, symptom, or anatomical area..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#21183A] border border-[#7C3AED]/25 text-xs sm:text-sm text-[#FFFDF9] placeholder-[#B8AEC8]/60 focus:outline-none focus:border-[#F97368]/60 transition-colors"
              />
            </div>

            {/* Filter by Status & Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              
              <div className="flex items-center gap-1.5 bg-[#21183A] px-3 py-1.5 rounded-xl border border-[#7C3AED]/25 text-xs text-[#B8AEC8]">
                <Filter className="w-3.5 h-3.5 text-[#FDBA8C]" />
                <span className="font-bold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-[#FFFDF9] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#18132D]">All</option>
                  <option value="completed" className="bg-[#18132D]">Completed</option>
                  <option value="active" className="bg-[#18132D]">Active</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#21183A] px-3 py-1.5 rounded-xl border border-[#7C3AED]/25 text-xs text-[#B8AEC8]">
                <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span className="font-bold">Sort:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  className="bg-transparent text-[#FFFDF9] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-[#18132D]">Newest First</option>
                  <option value="oldest" className="bg-[#18132D]">Oldest First</option>
                </select>
              </div>

            </div>

          </div>
        </div>

        {/* ── Assessments History List ─────────────────────────────────── */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full border-4 border-[#7C3AED]/30 border-t-[#F97368] animate-spin" />
            <p className="text-xs text-[#B8AEC8]">Loading your assessment history...</p>
          </div>
        ) : filteredAssessments.length > 0 ? (
          <div className="space-y-3">
            {filteredAssessments.map((item, idx) => {
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              const primaryArea =
                item.body_areas && item.body_areas.length > 0
                  ? getAnatomyLabel(item.body_areas[0]) ||
                    ALL_BODY_REGIONS[item.body_areas[0]] ||
                    item.body_areas[0]
                  : "General Area";

              return (
                <div
                  key={item.id || `hist_${idx}`}
                  className="p-5 rounded-2xl bg-[#18132D] border border-[#7C3AED]/25 hover:border-[#7C3AED]/50 transition-all duration-300 shadow-lg hover:-translate-y-0.5 space-y-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-[#FDBA8C] font-bold bg-[#7C3AED]/15 px-2.5 py-0.5 rounded-lg border border-[#7C3AED]/25">
                          {formattedDate}
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified Triage</span>
                        </span>

                        {item.pain_severity !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#F97368]/15 text-[#F97368] border border-[#F97368]/30">
                            <Flame className="w-3 h-3" />
                            <span>Pain {item.pain_severity}/10</span>
                          </span>
                        )}
                      </div>

                      <div className="pt-1">
                        <h3 className="text-base sm:text-lg font-bold text-[#FFFDF9] flex items-center gap-2">
                          <span>{formatActivityName(item)}</span>
                          <span className="text-xs text-[#B8AEC8] font-normal">•</span>
                          <span className="text-xs sm:text-sm text-[#E9E2F5] font-semibold">
                            {primaryArea}
                            {item.body_areas && item.body_areas.length > 1
                              ? ` (+${item.body_areas.length - 1} more)`
                              : ""}
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <GradientButton
                        type="button"
                        variant="variant"
                        onClick={() => setSelectedRecord(item)}
                        className="min-w-0 px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#FDBA8C]" />
                        <span>View Details</span>
                      </GradientButton>
                    </div>

                  </div>

                  {/* Badges footer */}
                  <div className="flex items-center gap-4 text-[11px] text-[#B8AEC8] pt-2 border-t border-[#7C3AED]/15 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#A78BFA]" />
                      <span>{formatDuration(item.duration)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#F97368]" />
                      <span>{(item.symptoms || []).length} Reported Symptoms</span>
                    </span>
                    <span className="hidden sm:inline-block text-[#B8AEC8]/60">
                      ID: {item.id || "assess_local"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Empty State ────────────────────────────────────────────── */
          <div className="p-10 sm:p-14 rounded-3xl bg-[#18132D] border border-[#7C3AED]/30 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#21183A] border border-[#7C3AED]/40 flex items-center justify-center shadow-lg">
              <History className="w-8 h-8 text-[#F97368]" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs font-bold uppercase tracking-wider text-[#FDBA8C]">
                <span>No Records Found</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#FFFDF9] tracking-tight">
                No recovery history yet
              </h3>
              <p className="text-xs sm:text-sm text-[#B8AEC8] leading-relaxed">
                Complete your first assessment to start building your recovery timeline and biomechanical history.
              </p>
            </div>

            <div className="pt-2">
              <GradientButton
                type="button"
                onClick={() => navigate("/assessment")}
                className="px-6 py-3.5 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Assessment</span>
              </GradientButton>
            </div>
          </div>
        )}

      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      {selectedRecord && (
        <RecoveryHistoryItemModal
          assessment={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </AuthenticatedLayout>
  );
};

export default RecoveryHistoryPage;
