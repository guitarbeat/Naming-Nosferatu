import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { Loading } from "./Loading";

// Lazy load pages for better performance
const HomePage = React.lazy(() => import("../../pages/HomePage"));
const TournamentPage = React.lazy(() => import("../../pages/TournamentPage"));
const ProfilePage = React.lazy(() => import("../../pages/ProfilePage"));
const LoginPage = React.lazy(() => import("../../pages/LoginPage"));

interface ProtectedRouteProps {
	children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <Loading variant="spinner" text="Loading..." />;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export const AppRouter: React.FC = () => {
	return (
		<BrowserRouter>
			<Suspense fallback={<Loading variant="spinner" text="Loading page..." />}>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<HomePage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/tournament/:id?"
						element={
							<ProtectedRoute>
								<ErrorBoundary context="Tournament Page">
									<TournamentPage />
								</ErrorBoundary>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<ProfilePage />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
};
