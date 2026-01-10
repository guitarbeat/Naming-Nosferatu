import PropTypes from "prop-types";
import { lazy, Suspense, useMemo } from "react";
import { getRouteConfig, ROUTES, type ViewState } from "../../../core/config/routeConfig";
import { useRouting } from "../../../core/hooks/useRouting";
import { normalizeRoutePath } from "../../../shared/utils";
import type { NameItem, VoteData } from "../../../types/components";
import { ErrorComponent } from "../ErrorComponent";
import { Loading } from "../Loading";

// Lazy load heavy/hidden components
const Dashboard = lazy(() => import("../../../features/tournament/Dashboard"));
const GalleryView = lazy(() => import("../../../features/gallery/GalleryView"));
const Tournament = lazy(() => import("../../../features/tournament/Tournament"));
const TournamentSetup = lazy(
	() => import("../../../features/tournament/components/TournamentSetup"),
);
const Explore = lazy(() => import("../../../features/explore/Explore"));

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
	onTournamentSetup: (names?: NameItem[]) => void;
	onTournamentComplete: (
		finalRatings: Record<string, { rating: number; wins?: number; losses?: number }>,
	) => Promise<void>;
	onVote: (vote: unknown) => void;
	onOpenSuggestName?: () => void;
}

/**
 * Convert tournament ratings to simple number format
 */
function ratingsToNumbers(
	ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
): Record<string, number> {
	return Object.fromEntries(
		Object.entries(ratings).map(([key, value]) => [
			key,
			typeof value === "object" && value !== null && "rating" in value
				? value.rating
				: typeof value === "number"
					? value
					: 0,
		]),
	);
}

/**
 * Get current view from route path
 */
function getViewFromRoute(
	path: string,
	isLoggedIn: boolean,
	isTournamentComplete: boolean,
): ViewState {
	const normalizedPath = normalizeRoutePath(path);
	const routeConfig = getRouteConfig(normalizedPath);

	// Not logged in - always show login/setup
	if (!isLoggedIn) {
		return "login";
	}

	// Use route config if available
	if (routeConfig) {
		// Special handling: results route when tournament is not complete
		if (routeConfig.view === "results" && !isTournamentComplete) {
			return "tournament";
		}
		return routeConfig.view;
	}

	// Default to tournament
	return "tournament";
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
	const normalizedPath = useMemo(() => normalizeRoutePath(currentRoute), [currentRoute]);

	// Determine current view from route
	const currentView = useMemo(
		() => getViewFromRoute(normalizedPath, isLoggedIn, tournament.isComplete),
		[normalizedPath, isLoggedIn, tournament.isComplete],
	);

	// Convert ratings to simple format
	const existingRatings = useMemo(() => ratingsToNumbers(tournament.ratings), [tournament.ratings]);

	// Check URL for analysis parameter
	const isAnalysisMode = useMemo(() => {
		if (typeof window !== "undefined") {
			const urlParams = new URLSearchParams(window.location.search);
			return urlParams.get("analysis") === "true" || normalizedPath.startsWith(ROUTES.ANALYSIS);
		}
		return false;
	}, [normalizedPath]);

	// Render based on current view
	switch (currentView) {
		case "login":
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

		case "gallery":
		case "photos":
			return (
				<Suspense fallback={<Loading variant="spinner" text="Loading Gallery..." />}>
					<GalleryView />
				</Suspense>
			);

		case "results":
		case "analysis": {
			const hasPersonalData = tournament.isComplete && tournament.names !== null;
			const dashboardMode =
				currentView === "analysis" || isAnalysisMode
					? "global"
					: hasPersonalData
						? "personal"
						: "global";

			return (
				<Suspense fallback={<Loading variant="spinner" text="Loading Dashboard..." />}>
					<Dashboard
						personalRatings={hasPersonalData ? existingRatings : undefined}
						currentTournamentNames={
							hasPersonalData && tournament.names ? tournament.names : undefined
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

		case "explore":
			return (
				<Suspense fallback={<Loading variant="spinner" text="Loading Explore..." />}>
					<Explore userName={userName || ""} />
				</Suspense>
			);

		default:
			// Show setup if no names selected yet
			if (tournament.names === null) {
				return (
					<Suspense fallback={<Loading variant="spinner" text="Loading Setup..." />}>
						<TournamentSetup
							onLogin={onLogin as (name: string) => Promise<boolean>}
							onStart={onTournamentSetup as (selectedNames: unknown) => void}
							userName={userName}
							isLoggedIn={isLoggedIn}
							existingRatings={existingRatings}
						/>
					</Suspense>
				);
			}

			// Show active tournament
			return (
				<ErrorComponent variant="boundary" error={null}>
					<Suspense fallback={<Loading variant="spinner" text="Loading Tournament..." />}>
						<Tournament
							names={tournament.names as NameItem[]}
							existingRatings={existingRatings}
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
};
