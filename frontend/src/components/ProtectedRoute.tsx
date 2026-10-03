import React, { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompleteProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireCompleteProfile = false,
}) => {
  const { user, isProfileComplete, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Verifying athlete authorization..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If this route strictly requires a complete profile and user profile is incomplete
  if (requireCompleteProfile && !isProfileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
