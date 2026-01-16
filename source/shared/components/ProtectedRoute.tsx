/**
 * @module ProtectedRoute
 * @description Centralized route protection component that enforces authentication
 * and tournament state requirements for protected routes.
 */

import { Navigate, Outlet } from "react-router-dom";
import useAppStore from "../../core/store/useAppStore";

interface ProtectedRouteProps {
  requireTournamentComplete?: boolean;
}

/**
 * ProtectedRoute Component
 * Wraps route definitions to enforce access control based on:
 * 1. User authentication (isLoggedIn)
 * 2. Tournament completion status (optional)
 *
 * @param requireTournamentComplete - If true, user must have completed a tournament to access
 * @returns Outlet if authorized, Navigate to "/" if not
 */
export function ProtectedRoute({
  requireTournamentComplete = false,
}: ProtectedRouteProps) {
  const { user, tournament } = useAppStore();

  // Check authentication
  if (!user.isLoggedIn) {
    return <Navigate to="/" replace={true} />;
  }

  // Check tournament completion if required
  if (requireTournamentComplete && !tournament.isComplete) {
    return <Navigate to="/tournament" replace={true} />;
  }

  // User is authorized, render the nested routes
  return <Outlet />;
}
