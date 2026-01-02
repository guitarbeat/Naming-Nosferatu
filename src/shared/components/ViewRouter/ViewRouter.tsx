import PropTypes from "prop-types";
import { lazy, Suspense } from "react";
import { useRouting } from "../../../core/hooks/useRouting";
import Login from "../../../features/auth/Login";
// * Import components directly to maintain stability
// * Import components directly to maintain stability
// Note: These are .jsx files, so we need to import them without extensions
import Tournament from "../../../features/tournament/Tournament";
import TournamentSetup from "../../../features/tournament/TournamentSetup";
import Error from "../Error/Error";
import Loading from "../Loading/Loading";

// * Lazy load heavy/hidden components
const Dashboard = lazy(() => import("../../../features/tournament/Dashboard"));
const BongoPage = lazy(() => import("../../../features/bongo/BongoPage"));

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
	onTournamentSetup: (
		names?: import("../../../shared/propTypes").NameItem[],
	) => void;
	onTournamentComplete: (
		finalRatings: Record<
			string,
			{ rating: number; wins?: number; losses?: number }
		>,
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
	const { isRoute, currentRoute } = useRouting();

	// Handle special routes first
	// NOTE: The /bongo route is intentionally hidden and only accessible via direct URL
	// There is no navigation link to this page - users must manually type /bongo in the URL
	if (isRoute("/bongo")) {
		return (
			<Suspense
				fallback={<Loading variant="spinner" text="Loading Bongo..." />}
			>
				<BongoPage isLoggedIn={isLoggedIn} userName={userName} />
			</Suspense>
		);
	}

	if (!isLoggedIn) {
		return <Login onLogin={onLogin} />;
	}

	if (tournament.names === null) {
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
			<TournamentSetup
				onStart={onTournamentSetup as (selectedNames: unknown) => void}
				userName={userName}
				existingRatings={existingRatings}
				onOpenSuggestName={onOpenSuggestName}
				onNameChange={onLogin}
			/>
		);
	}

	// * Show Dashboard (Results + Analysis) if on /results or /analysis routes
	// * Check route path (without query params) to determine if we should show dashboard
	const currentPath =
		typeof window !== "undefined"
			? window.location.pathname
			: currentRoute.split("?")[0].split("#")[0];
	const shouldShowDashboard =
		currentPath === "/results" || currentPath === "/analysis";

	if (shouldShowDashboard) {
		const hasPersonalData = tournament.isComplete && tournament.names !== null;

		// * Check URL for analysis parameter to determine initial view mode
		const urlParams =
			typeof window !== "undefined"
				? new URLSearchParams(window.location.search)
				: new URLSearchParams();
		const isAnalysisMode = urlParams.get("analysis") === "true";

		// * Determine mode: if analysis=true, show global only; if /results, show personal (or both if has data)
		const dashboardMode = isAnalysisMode
			? "global"
			: hasPersonalData
				? "personal"
				: "global";

		return (
			<Suspense
				fallback={<Loading variant="spinner" text="Loading Dashboard..." />}
			>
				<Dashboard
					personalRatings={
						hasPersonalData
							? Object.fromEntries(
									Object.entries(tournament.ratings).map(([key, value]) => [
										key,
										typeof value === "object" &&
										value !== null &&
										"rating" in value
											? (value as any).rating
											: typeof value === "number"
												? value
												: 0,
									]),
								)
							: undefined
					}
					currentTournamentNames={
						hasPersonalData ? tournament.names : undefined
					}
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
		<Error variant="boundary" error={null}>
			<Tournament
				names={tournament.names}
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
						Object.entries(ratings).map(([key, value]) => [
							key,
							{ rating: value },
						]),
					);
					return onTournamentComplete(convertedRatings);
				}}
				userName={userName}
				onVote={onVote}
			/>
		</Error>
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
