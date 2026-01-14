/**
 * @module ViewRenderer
 * @description State-based view renderer with smooth transitions.
 * Replaces React Router with Zustand state-driven view switching.
 */

import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useMemo } from "react";
import type { NameItem, VoteData } from "../../../types/components";
import { Loading } from "../Loading";

// Lazy load views
const Dashboard = lazy(() => import("../../../features/tournament/Dashboard"));
const GalleryView = lazy(() => import("../../../features/gallery/GalleryView"));
const Tournament = lazy(() => import("../../../features/tournament/Tournament"));
const TournamentSetup = lazy(
	() => import("../../../features/tournament/components/TournamentSetup"),
);
const Explore = lazy(() => import("../../../features/explore/Explore"));

// View state type
export type ViewState = "login" | "tournament" | "results" | "gallery" | "analysis" | "explore";

interface TournamentState {
	names: NameItem[] | null;
	ratings: Record<string, { rating: number; wins?: number; losses?: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: VoteData[];
	currentView: ViewState;
}

interface ViewRendererProps {
	currentView: ViewState;
	isLoggedIn: boolean;
	onLogin: (userName: string) => Promise<boolean>;
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
}

// Animation variants
const viewTransition = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 },
};

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

export default function ViewRenderer({
	currentView,
	isLoggedIn,
	onLogin,
	tournament,
	userName,
	onStartNewTournament,
	onUpdateRatings,
	onTournamentSetup,
	onTournamentComplete,
	onVote,
}: ViewRendererProps) {
	// Convert ratings to simple format
	const existingRatings = useMemo(() => ratingsToNumbers(tournament.ratings), [tournament.ratings]);

	// Determine effective view
	const effectiveView = useMemo(() => {
		if (!isLoggedIn) return "login";
		return currentView;
	}, [isLoggedIn, currentView]);

	// Render view content based on state
	const renderView = () => {
		switch (effectiveView) {
			case "login":
				return (
					<Suspense fallback={<Loading variant="spinner" text="Loading..." />}>
						<TournamentSetup
							onLogin={onLogin}
							onStart={onTournamentSetup as (selectedNames: unknown) => void}
							userName={userName}
							isLoggedIn={false}
							existingRatings={existingRatings}
						/>
					</Suspense>
				);

			case "gallery":
				return (
					<Suspense fallback={<Loading variant="spinner" text="Loading Gallery..." />}>
						<GalleryView />
					</Suspense>
				);

			case "results":
			case "analysis": {
				const hasPersonalData = tournament.isComplete && tournament.names !== null;
				const dashboardMode =
					effectiveView === "analysis" ? "global" : hasPersonalData ? "personal" : "global";

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

			case "tournament":
			default:
				// Show setup if no names selected yet
				if (tournament.names === null) {
					return (
						<Suspense fallback={<Loading variant="spinner" text="Loading Setup..." />}>
							<TournamentSetup
								onLogin={onLogin}
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
				);
		}
	};

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={effectiveView}
				variants={viewTransition}
				initial="initial"
				animate="animate"
				exit="exit"
				transition={{ duration: 0.2, ease: "easeOut" }}
				style={{ width: "100%", height: "100%" }}
			>
				{renderView()}
			</motion.div>
		</AnimatePresence>
	);
}
