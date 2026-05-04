import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  requireApproved?: boolean;
  requireAdmin?: boolean;
}

export const RequireAuth = ({ children, requireApproved, requireAdmin }: Props) => {
  const { user, profile, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <span className="font-display text-xl italic">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireApproved && profile?.status !== "approved" && !isAdmin) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};