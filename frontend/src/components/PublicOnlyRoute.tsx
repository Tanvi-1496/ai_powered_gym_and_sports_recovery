import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { user, isProfileComplete, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking authorization..." />;
  }

  // If already logged in, redirect away from /login and /register
  if (user) {
    if (!isProfileComplete) {
      return <Navigate to="/profile-setup" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
