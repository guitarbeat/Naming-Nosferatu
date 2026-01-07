import PropTypes from "prop-types";
import { lazy, Suspense } from "react";
import { useRouting } from "../../../core/hooks/useRouting";
import CombinedLoginTournamentSetup from "../../../features/tournament/CombinedLoginTournamentSetup";
// * Import components directly to maintain stability
// Note: These are .jsx files, so we need to import them without extensions
import Tournament from "../../../features/tournament/Tournament";
import { ErrorComponent, Loading } from "../CommonUI";
import type { NameItem } from "../../../types/components";

// * Lazy load heavy/hidden components
const Dashboard = lazy(() => import("../../../features/tournament/Dashboard"));

import type { TournamentName } from "../../../types/store";

interface TournamentState {
	names: TournamentName[] | null;
	ratings: Record<string, { rating: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: unknown[];
	currentView: string;
}

interface ViewRouterProps {
	isLoggedIn: boolean;
	onLogin: (userName: string) => void;
	tournament: TournamentState;
	userName?: string;
	onStartNewTournament: () => void;
	onUpdateRatings: (
		ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => undefined | Promise<boolean>;
	onTournamentSetup: (names?: import("../../../types/components").NameItem[]) => void;
	onTournamentComplete: (
		finalRatings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => Promise<void>;
	onVote: (vote: unknown) => void;
	onOpenSuggestName?: () => void;
}

export default function ViewRouter({
	isLoggedIn,
	onLogin,
	tournament,
	userName,
	onStartNewTournament,
	onUpdateRatings,
	onTournamentSetup,
	onTournamentComplete,
	onVote,
	onOpenSuggestName,
}: ViewRouterProps) {
	const { currentRoute } = useRouting();

	if (!isLoggedIn || tournament.names === null) {
		// Convert ratings from Record<string, { rating: number }> to Record<string, number>
		const existingRatings = Object.fromEntries(
			Object.entries(tournament.ratings).map(([key, value]) => [
				key,
				typeof value === "object" && value !== null && "rating" in value
					? value.rating
					: typeof value === "number"
						? value
						: 0,
			]),
		);
		return (
			<CombinedLoginTournamentSetup
				onLogin={onLogin as (name: string) => Promise<boolean>}
				onStart={onTournamentSetup as (selectedNames: unknown) => void}
				userName={userName}
				isLoggedIn={isLoggedIn}
				existingRatings={existingRatings}
				onOpenSuggestName={onOpenSuggestName}
			/>
		);
	}

	// * Show Dashboard (Results + Analysis) if on /results or /analysis routes
	// * Check route path (without query params) to determine if we should show dashboard
	const currentPath =
		typeof window !== "undefined" && window.location
			? (window.location as Location).pathname
			: currentRoute.split("?")[0].split("#")[0];
	const shouldShowDashboard = currentPath === "/results" || currentPath === "/analysis";

	if (shouldShowDashboard) {
		const hasPersonalData = tournament.isComplete && tournament.names !== null;

		// * Check URL for analysis parameter to determine initial view mode
		const urlParams =
			typeof window !== "undefined"
				? new URLSearchParams(window.location.search)
				: new URLSearchParams();
		const isAnalysisMode = urlParams.get("analysis") === "true";

		// * Determine mode: if analysis=true, show global only; if /results, show personal (or both if has data)
		const dashboardMode = isAnalysisMode ? "global" : hasPersonalData ? "personal" : "global";

		return (
			<Suspense fallback={<Loading variant="spinner" text="Loading Dashboard..." />}>
				<Dashboard
					personalRatings={
						hasPersonalData
							? Object.fromEntries(
									Object.entries(tournament.ratings).map(([key, value]) => [
										key,
										typeof value === "object" && value !== null && "rating" in value
											? (value as any).rating
											: typeof value === "number"
												? value
												: 0,
									]),
								)
							: undefined
					}
					currentTournamentNames={hasPersonalData ? tournament.names : undefined}
					voteHistory={hasPersonalData ? tournament.voteHistory : undefined}
					onStartNew={onStartNewTournament}
					onUpdateRatings={onUpdateRatings as any}
					userName={userName || ""}
					mode={dashboardMode}
				/>
			</Suspense>
		);
	}

	return (
		<ErrorComponent variant="boundary" error={null}>
			<Tournament
				names={tournament.names as NameItem[]}
				existingRatings={Object.fromEntries(
					Object.entries(tournament.ratings).map(([key, value]) => [
						key,
						typeof value === "object" && value !== null && "rating" in value
							? value.rating
							: typeof value === "number"
								? value
								: 0,
					]),
				)}
				onComplete={(ratings: Record<string, number>) => {
					const convertedRatings = Object.fromEntries(
						Object.entries(ratings).map(([key, value]) => [key, { rating: value }]),
					);
					return onTournamentComplete(convertedRatings);
				}}
				userName={userName}
				onVote={onVote}
			/>
		</ErrorComponent>
	);
}

ViewRouter.propTypes = {
	isLoggedIn: PropTypes.bool.isRequired,
	onLogin: PropTypes.func.isRequired,
	tournament: PropTypes.shape({
		names: PropTypes.arrayOf(PropTypes.object),
		ratings: PropTypes.object.isRequired,
		isComplete: PropTypes.bool.isRequired,
		voteHistory: PropTypes.array.isRequired,
		currentView: PropTypes.string.isRequired,
	}).isRequired,
	userName: PropTypes.string,
	onStartNewTournament: PropTypes.func.isRequired,
	onUpdateRatings: PropTypes.func.isRequired,
	onTournamentSetup: PropTypes.func.isRequired,
	onTournamentComplete: PropTypes.func.isRequired,
	onVote: PropTypes.func.isRequired,
	onOpenSuggestName: PropTypes.func,
};
