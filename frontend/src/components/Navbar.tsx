import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, LogOut, User } from "lucide-react";
import { RevoraLogo } from "@/components/RevoraLogo";
import { useAuth } from "@/context/AuthContext";
import { GradientButton } from "@/components/ui/gradient-button";

interface NavbarProps {
  onStartAssessment?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartAssessment }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate("/");
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Athlete";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0D0A1F]/90 backdrop-blur-xl border-b border-[#7C3AED]/20 shadow-lg shadow-black/40 py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Official REVORA Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center group focus:outline-none"
            aria-label="REVORA Home"
          >
            <RevoraLogo variant="dark-bg" size="md" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => handleNavClick("hero")}
              className="text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick("how-it-works")}
              className="text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick("platform")}
              className="text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] transition-colors cursor-pointer"
            >
              Features
            </button>

            {/* Additional links for Authenticated Users */}
            {user && (
              <button
                onClick={() => navigate("/profile-setup")}
                className="text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-4 h-4 text-[#FDBA8C]" />
                <span>Profile</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Authenticated User Pill Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18132D] border border-[#7C3AED]/30 shadow-sm text-xs font-semibold text-[#E9E2F5]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </div>

                {/* Dashboard CTA */}
                <GradientButton
                  onClick={() => navigate("/dashboard")}
                  className="min-w-0 px-4 py-2 text-xs sm:text-sm flex items-center gap-2 rounded-full font-bold uppercase tracking-wide cursor-pointer"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </GradientButton>

                {/* Logout Button */}
                <GradientButton
                  variant="variant"
                  onClick={handleLogout}
                  className="min-w-0 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Sign out of your account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </GradientButton>
              </>
            ) : (
              <>
                {/* Unauthenticated Buttons: Login & Get Started */}
                <GradientButton
                  variant="variant"
                  onClick={() => navigate("/login")}
                  className="min-w-0 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full cursor-pointer"
                >
                  Login
                </GradientButton>
                <GradientButton
                  onClick={onStartAssessment || (() => handleNavClick("cta-section"))}
                  className="min-w-0 px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 rounded-full font-bold uppercase tracking-wide cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </GradientButton>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <GradientButton
              variant="variant"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-0 w-10 h-10 p-0 rounded-xl flex items-center justify-center text-[#E9E2F5]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </GradientButton>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-4 pb-6 px-4 rounded-2xl bg-[#120D26]/98 backdrop-blur-2xl border border-[#7C3AED]/25 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleNavClick("hero")}
                className="text-left text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] py-2 border-b border-[#21183A]"
              >
                Home
              </button>
              <button
                onClick={() => handleNavClick("how-it-works")}
                className="text-left text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] py-2 border-b border-[#21183A]"
              >
                How It Works
              </button>
              <button
                onClick={() => handleNavClick("platform")}
                className="text-left text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] py-2 border-b border-[#21183A]"
              >
                Features
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/profile-setup");
                    }}
                    className="text-left text-sm font-semibold text-[#E9E2F5] hover:text-[#F97368] py-2 border-b border-[#21183A] flex items-center justify-between"
                  >
                    <span>Profile</span>
                    <User className="w-4 h-4 text-[#FDBA8C]" />
                  </button>

                  <div className="pt-2 flex flex-col gap-2">
                    <div className="text-xs text-[#B8AEC8] px-2 py-1">
                      Signed in as <span className="text-[#FFFDF9] font-semibold">{displayName}</span>
                    </div>
                    <GradientButton
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/dashboard");
                      }}
                      className="w-full min-w-0 text-center py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl uppercase tracking-wide"
                    >
                      <span>Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </GradientButton>
                    <GradientButton
                      variant="variant"
                      onClick={handleLogout}
                      className="w-full min-w-0 text-center py-2.5 rounded-xl text-sm font-bold text-[#FF6B6B] flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </GradientButton>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-3">
                  <GradientButton
                    variant="variant"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full min-w-0 text-center py-2.5 rounded-xl text-sm font-bold text-[#E9E2F5]"
                  >
                    Login
                  </GradientButton>
                  <GradientButton
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onStartAssessment) onStartAssessment();
                      else handleNavClick("cta-section");
                    }}
                    className="w-full min-w-0 text-center py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </GradientButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

