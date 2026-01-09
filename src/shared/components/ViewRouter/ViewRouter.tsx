import PropTypes from "prop-types";
import { lazy, Suspense } from "react";
import { useRouting } from "../../../core/hooks/useRouting";
// * Import components directly to maintain stability
// Note: These are .jsx files, so we need to import them without extensions
import type { NameItem, VoteData } from "../../../types/components";
import { ErrorComponent } from "../Error";
import { Loading } from "../Loading";

// * Lazy load heavy/hidden components
const Dashboard = lazy(() => import("../../../features/tournament/Dashboard"));
const GalleryView = lazy(() => import("../../../features/gallery/GalleryView"));
const Tournament = lazy(() => import("../../../features/tournament/Tournament"));
const TournamentSetup = lazy(
	() => import("../../../features/tournament/components/TournamentSetup"),
);

// Local interface matching store's TournamentState structure
interface TournamentState {
	names: NameItem[] | null;
	ratings: Record<string, { rating: number; wins?: number; losses?: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: VoteData[];
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
			<Suspense fallback={<Loading variant="spinner" text="Loading Setup..." />}>
				<TournamentSetup
					onLogin={onLogin as (name: string) => Promise<boolean>}
					onStart={onTournamentSetup as (selectedNames: unknown) => void}
					userName={userName}
					isLoggedIn={isLoggedIn}
					existingRatings={existingRatings}
					onOpenSuggestName={onOpenSuggestName}
				/>
			</Suspense>
		);
	}

	// * Show Dashboard (Results + Analysis) if on /results or /analysis routes
	// * Check route path (without query params) to determine if we should show dashboard
	const currentPath =
		typeof window !== "undefined" && window.location && window.location.pathname
			? window.location.pathname
			: currentRoute.split("?")[0]?.split("#")[0] || "/";

	if (currentPath === "/gallery") {
		return (
			<Suspense fallback={<Loading variant="spinner" text="Loading Gallery..." />}>
				<GalleryView />
			</Suspense>
		);
	}

	const shouldShowDashboard = currentPath === "/results" || currentPath === "/analysis";

	if (shouldShowDashboard) {
		const hasPersonalData = tournament.isComplete && tournament.names !== null;

		// * Check URL for analysis parameter to determine initial view mode
		const urlParams =
			typeof window !== "undefined"
				? new URLSearchParams(window.location.search)
				: new URLSearchParams();
		const isAnalysisMode = urlParams.get("analysis") === "true";

		// * Determine mode: if analysis path or analysis=true param, show global only
		// * If /results, show personal (or both/global depending on having data)
		const isGlobalAnalysis = currentPath === "/analysis" || isAnalysisMode;
		const dashboardMode = isGlobalAnalysis ? "global" : hasPersonalData ? "personal" : "global";

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
			<Suspense fallback={<Loading variant="spinner" text="Loading Tournament..." />}>
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
			</Suspense>
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
