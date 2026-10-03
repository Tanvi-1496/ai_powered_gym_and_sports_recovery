import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Activity,
  HeartPulse,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { RevoraLogo } from "@/components/RevoraLogo";
import { useAuth } from "@/context/AuthContext";
import { GradientButton } from "@/components/ui/gradient-button";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  showVideoBackground?: boolean;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  showVideoBackground = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video autoplay assurance
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, []);

  const handleLogout = async () => {
    setMobileSidebarOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Athlete";

  const primarySport =
    profile?.primary_sport === "other" && profile?.custom_sport
      ? profile.custom_sport
      : profile?.primary_sport || "Athlete";

  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "AT";

  const isNavActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen min-h-[100svh] bg-[#0D0A1F] text-[#FFFDF9] flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-[#7C3AED]/40 selection:text-[#FDBA8C]">
      
      {/* ── FULLSCREEN DASHBOARD BACKGROUND VIDEO LAYER ──────────────────── */}
      {showVideoBackground && (
        <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <video
            ref={videoRef}
            src="/videos/dashboard-bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-0"
            aria-hidden="true"
            onLoadedData={() => console.log("REVORA dashboard video loaded")}
            onError={(e) => console.error("REVORA dashboard video error:", e)}
          />

          {/* Dark REVORA Overlay (z-1) - Lighter overlay for vivid visibility */}
          <div
            className="absolute inset-0 z-1 bg-[#0D0A1F]/30"
            style={{ background: "rgba(13, 10, 31, 0.30)" }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 z-1 bg-gradient-to-b from-[#0D0A1F]/50 via-[#120D26]/25 to-[#0D0A1F]/60"
            aria-hidden="true"
          />
        </div>
      )}

      {/* ── Background Atmospheric Ambient Glows ─────────────────────────── */}
      <div
        className="fixed -top-40 -left-40 w-[550px] h-[550px] bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none z-1 animate-subtle-pulse"
        aria-hidden="true"
      />
      <div
        className="fixed -bottom-40 -right-40 w-[550px] h-[550px] bg-[#F97368]/12 rounded-full blur-[140px] pointer-events-none z-1"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/3 right-1/4 w-[400px] h-[400px] bg-[#FDBA8C]/6 rounded-full blur-[160px] pointer-events-none z-1"
        aria-hidden="true"
      />

      {/* ── Mobile Top Header Bar ────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0D0A1F]/90 backdrop-blur-xl border-b border-[#7C3AED]/20 px-4 py-3.5 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none" aria-label="REVORA Dashboard">
          <RevoraLogo variant="dark-bg" size="sm" showTagline={false} />
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#18132D]/90 backdrop-blur-md border border-[#7C3AED]/30 text-xs font-semibold text-[#E9E2F5]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="max-w-[100px] truncate">{displayName}</span>
          </div>

          <GradientButton
            variant="variant"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="min-w-0 w-9 h-9 p-0 rounded-xl text-[#E9E2F5] flex items-center justify-center"
            aria-label="Toggle navigation drawer"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </GradientButton>
        </div>
      </header>

      {/* ── Desktop Sticky Sidebar (Frosted-Glass) ────────────────────────── */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col justify-between bg-[#120D26]/90 backdrop-blur-2xl border-r border-[#7C3AED]/20 p-5 sticky top-0 h-screen z-30 shadow-2xl">
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-1">
          {/* Brand Logo */}
          <div className="pb-6 pt-1 border-b border-[#7C3AED]/15">
            <Link to="/dashboard" className="inline-block focus:outline-none" aria-label="REVORA Dashboard">
              <RevoraLogo variant="dark-bg" size="md" showTagline={true} />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex-1 space-y-6">
            {/* Primary Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]/70 px-3 font-display">
                Main Menu
              </span>

              <Link
                to="/dashboard"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  isNavActive("/dashboard")
                    ? "bg-gradient-to-r from-[#7C3AED]/35 to-[#F97368]/25 border border-[#8B5CF6]/50 text-[#FFFDF9] shadow-sm shadow-[#7C3AED]/25 backdrop-blur-md"
                    : "text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard
                    className={`w-4 h-4 transition-colors ${
                      isNavActive("/dashboard") ? "text-[#F97368]" : "text-[#A78BFA] group-hover:text-[#FFFDF9]"
                    }`}
                  />
                  <span>Dashboard</span>
                </div>
                {isNavActive("/dashboard") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F97368] shadow-sm shadow-[#F97368]/80" />
                )}
              </Link>

              <Link
                to="/assessment"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  isNavActive("/assessment")
                    ? "bg-gradient-to-r from-[#7C3AED]/35 to-[#F97368]/25 border border-[#8B5CF6]/50 text-[#FFFDF9] shadow-sm shadow-[#7C3AED]/25 backdrop-blur-md"
                    : "text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlusCircle
                    className={`w-4 h-4 transition-colors ${
                      isNavActive("/assessment") ? "text-[#F97368]" : "text-[#F97368] group-hover:text-[#FFFDF9]"
                    }`}
                  />
                  <span>New Assessment</span>
                </div>
                <span className="text-[10px] font-bold text-[#FDBA8C] bg-[#F97368]/15 px-2 py-0.5 rounded-full border border-[#F97368]/30">
                  AI
                </span>
              </Link>
            </div>

            {/* Recovery Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]/70 px-3 font-display">
                Recovery Suite
              </span>

              <Link
                to="/results"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  isNavActive("/results")
                    ? "bg-gradient-to-r from-[#7C3AED]/35 to-[#F97368]/25 border border-[#8B5CF6]/50 text-[#FFFDF9] shadow-sm shadow-[#7C3AED]/25 backdrop-blur-md"
                    : "text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity
                    className={`w-4 h-4 transition-colors ${
                      isNavActive("/results") ? "text-[#F97368]" : "text-[#A78BFA] group-hover:text-[#FFFDF9]"
                    }`}
                  />
                  <span>Assessment Results</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#B8AEC8]/40 group-hover:text-[#B8AEC8] transition-colors" />
              </Link>

              <Link
                to="/recovery"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  isNavActive("/recovery")
                    ? "bg-gradient-to-r from-[#7C3AED]/35 to-[#F97368]/25 border border-[#8B5CF6]/50 text-[#FFFDF9] shadow-sm shadow-[#7C3AED]/25 backdrop-blur-md"
                    : "text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <HeartPulse
                    className={`w-4 h-4 transition-colors ${
                      isNavActive("/recovery") ? "text-[#F97368]" : "text-[#A78BFA] group-hover:text-[#FFFDF9]"
                    }`}
                  />
                  <span>Recovery Plan</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#B8AEC8]/40 group-hover:text-[#B8AEC8] transition-colors" />
              </Link>

              <Link
                to="/history"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  isNavActive("/history")
                    ? "bg-gradient-to-r from-[#7C3AED]/35 to-[#F97368]/25 border border-[#8B5CF6]/50 text-[#FFFDF9] shadow-sm shadow-[#7C3AED]/25 backdrop-blur-md"
                    : "text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <History
                    className={`w-4 h-4 transition-colors ${
                      isNavActive("/history") ? "text-[#F97368]" : "text-[#A78BFA] group-hover:text-[#FFFDF9]"
                    }`}
                  />
                  <span>Recovery History</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#B8AEC8]/40 group-hover:text-[#B8AEC8] transition-colors" />
              </Link>
            </div>

            {/* Account & Settings Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]/70 px-3 font-display">
                Account
              </span>

              <Link
                to="/settings"
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                  isNavActive("/settings") || isNavActive("/profile-settings")
                    ? "bg-gradient-to-r from-[#7C3AED]/35 to-[#F97368]/25 border border-[#8B5CF6]/50 text-[#FFFDF9] shadow-sm shadow-[#7C3AED]/25 backdrop-blur-md"
                    : "text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings
                    className={`w-4 h-4 transition-colors ${
                      isNavActive("/settings") || isNavActive("/profile-settings")
                        ? "text-[#F97368]"
                        : "text-[#A78BFA] group-hover:text-[#FFFDF9]"
                    }`}
                  />
                  <span>Profile & Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#B8AEC8]/40 group-hover:text-[#B8AEC8] transition-colors" />
              </Link>
            </div>
          </nav>

          {/* User Info Card & Logout at Bottom */}
          <div className="pt-4 mt-auto border-t border-[#7C3AED]/15 space-y-3">
            <div className="p-3 rounded-2xl bg-[#18132D]/85 backdrop-blur-md border border-[#7C3AED]/25 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#F97368] flex items-center justify-center font-bold text-xs text-[#FFFDF9] shadow-md shadow-[#7C3AED]/30 shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#FFFDF9] truncate font-display">{displayName}</p>
                <p className="text-[11px] text-[#FDBA8C] capitalize truncate">{primarySport}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" title="Active Session" />
            </div>

            <GradientButton
              variant="variant"
              onClick={handleLogout}
              className="w-full min-w-0 py-2.5 px-3.5 rounded-xl text-xs font-semibold text-[#B8AEC8] hover:text-[#FF6B6B] flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </GradientButton>
          </div>
        </div>
      </aside>

      {/* ── Mobile Navigation Drawer Modal ───────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-4/5 max-w-xs bg-[#120D26]/95 backdrop-blur-2xl h-full p-5 flex flex-col justify-between border-r border-[#7C3AED]/30 shadow-2xl overflow-y-auto custom-scrollbar">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#7C3AED]/20">
                <RevoraLogo variant="dark-bg" size="sm" showTagline={true} />
                <GradientButton
                  variant="variant"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="min-w-0 w-8 h-8 p-0 rounded-lg text-[#B8AEC8] hover:text-[#FFFDF9] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </GradientButton>
              </div>

              {/* Links */}
              <nav className="mt-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]/70 px-3">
                    Menu
                  </span>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-[#FFFDF9] bg-[#18132D] border border-[#7C3AED]/30"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#F97368]" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/assessment"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]"
                  >
                    <PlusCircle className="w-4 h-4 text-[#F97368]" />
                    <span>New Assessment</span>
                  </Link>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]/70 px-3">
                    Recovery
                  </span>
                  <Link
                    to="/results"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]"
                  >
                    <Activity className="w-4 h-4 text-[#A78BFA]" />
                    <span>Assessment Results</span>
                  </Link>
                  <Link
                    to="/recovery"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]"
                  >
                    <HeartPulse className="w-4 h-4 text-[#A78BFA]" />
                    <span>Recovery Plan</span>
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]"
                  >
                    <History className="w-4 h-4 text-[#A78BFA]" />
                    <span>Recovery History</span>
                  </Link>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8AEC8]/70 px-3">
                    Account
                  </span>
                  <Link
                    to="/settings"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#18132D]"
                  >
                    <Settings className="w-4 h-4 text-[#A78BFA]" />
                    <span>Profile & Settings</span>
                  </Link>
                </div>
              </nav>
            </div>

            {/* Bottom Section */}
            <div className="pt-4 border-t border-[#7C3AED]/20 space-y-3">
              <div className="p-3 rounded-xl bg-[#18132D]/90 backdrop-blur-md flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#F97368] flex items-center justify-center font-bold text-xs text-[#FFFDF9]">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#FFFDF9] truncate">{displayName}</p>
                  <p className="text-[10px] text-[#FDBA8C] truncate capitalize">{primarySport}</p>
                </div>
              </div>

              <GradientButton
                variant="variant"
                onClick={handleLogout}
                className="w-full min-w-0 py-2.5 rounded-xl text-xs font-bold text-[#FF6B6B] flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </GradientButton>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ── Main Viewport Content ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col relative z-10">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
