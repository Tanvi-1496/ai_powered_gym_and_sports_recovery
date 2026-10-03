import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ProfileSetupPage } from "@/pages/ProfileSetupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AssessmentPage } from "@/features/assessment/AssessmentPage";
import { AssessmentResultsPage } from "@/pages/AssessmentResultsPage";
import { RecoveryPlanPage } from "@/pages/RecoveryPlanPage";
import { RecoveryHistoryPage } from "@/pages/RecoveryHistoryPage";
import { ProfileSettingsPage } from "@/pages/ProfileSettingsPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public-Only Routes (Redirects to /dashboard or /profile-setup if already authenticated) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes (Require Authentication) */}
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment"
            element={
              <ProtectedRoute>
                <AssessmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <AssessmentResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment-results"
            element={
              <ProtectedRoute>
                <AssessmentResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery"
            element={
              <ProtectedRoute>
                <RecoveryPlanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery-plan"
            element={
              <ProtectedRoute>
                <RecoveryPlanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <RecoveryHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recovery-history"
            element={
              <ProtectedRoute>
                <RecoveryHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-settings"
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
