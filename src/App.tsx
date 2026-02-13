import { useCallback, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { AnalysisDashboard } from "@/features/analytics/Dashboard";
import TournamentFlow from "@/features/tournament/modes/TournamentFlow";
import Tournament from "@/features/tournament/Tournament";
import { AppLayout } from "@/layout/AppLayout";
import { ErrorComponent, Loading } from "@/layout/FeedbackComponents";
import { useToast } from "@/providers/Providers";
import { coreAPI, tournamentsAPI } from "@/services/supabase-client/client";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";
import type { RatingData } from "@/types/appTypes";
import { initializePerformanceMonitoring } from "@/utils/performance";

// Initialize performance monitoring in dev
initializePerformanceMonitoring();

export default function App() {
	const { showToast, showError } = useToast();

	// Global State
	const user = useAppStore((state) => state.user);
	const tournament = useAppStore((state) => state.tournament);
	const tournamentActions = useAppStore((state) => state.tournamentActions);
	const siteSettingsActions = useAppStore((state) => state.siteSettingsActions);

	// Initialize from storage
	useAppStoreInitialization((name) => {
		coreAPI.setContext({ userName: name });
	});

	// Load site settings once
	useEffect(() => {
		const loadSettings = async () => {
			const { data } = await coreAPI.getCatChosenName();
			siteSettingsActions.setCatChosenName(data);
			siteSettingsActions.markSettingsLoaded();
		};
		loadSettings();
	}, [siteSettingsActions]);

	const handleTournamentComplete = useCallback(
		async (finalRatings: Record<string, RatingData>) => {
			if (!user.name) {
				return;
			}

			tournamentActions.setRatings(finalRatings);
			tournamentActions.setComplete(true);

			// Convert Record<string, RatingData> to the array format expected by saveTournamentRatings
			const ratingsArray = Object.entries(finalRatings).map(([name, data]) => ({
				name,
				rating: data.rating,
				wins: data.wins,
				losses: data.losses,
			}));

			const result = await tournamentsAPI.saveTournamentRatings(user.name, ratingsArray);

			if (result.success) {
				showToast("Tournament saved!", "success");
			} else if (result.offline) {
				showToast("Saved offline (will sync later)", "warning");
			} else {
				showError(result.error || "Failed to save");
			}
		},
		[user.name, tournamentActions, showToast, showError],
	);

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!user.name) {
				return;
			}

			tournamentActions.addVote({
				winnerId,
				loserId,
				timestamp: Date.now(),
			});
		},
		[user.name, tournamentActions],
	);

	return (
		<Routes>
			<Route element={<AppLayout handleTournamentComplete={handleTournamentComplete} />}>
				<Route path="/" element={<TournamentFlow />} />
				<Route
					path="/tournament"
					element={
						tournament.names ? (
							<Tournament
								names={tournament.names}
								onComplete={handleTournamentComplete}
								onVote={handleVote}
							/>
						) : (
							<div className="flex h-full items-center justify-center">
								<Loading text="Preparing tournament..." />
							</div>
						)
					}
				/>
				<Route path="/analysis" element={<AnalysisDashboard />} />
				<Route
					path="*"
					element={
						<div className="flex h-full items-center justify-center">
							<ErrorComponent
								error={new Error("Page not found")}
								resetErrorBoundary={() => window.location.assign("/")}
							/>
						</div>
					}
				/>
			</Route>
		</Routes>
	);
}
