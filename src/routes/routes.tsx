/**
 * @module routes
 * @description Route-level code splitting and page composition.
 *
 * Each route is a thin orchestration component that:
 * 1. Lazy-loads the heavy feature component
 * 2. Reads the minimal store slice it needs
 * 3. Passes props down to the feature component
 *
 * Keep route components lean — business logic belongs in hooks/store,
 * not here.
 */

import { lazy, type ReactNode, Suspense } from "react";
import useAppStore from "@/store/appStore";

// ═══════════════════════════════════════════════════════════════════════════════
// Lazy-Loaded Feature Components
// ═══════════════════════════════════════════════════════════════════════════════

const TournamentFlow = lazy(() => import("@/features/tournament/modes/TournamentFlow"));

const DashboardLazy = lazy(() =>
	import("@/features/analytics/Dashboard").then((m) => ({
		default: m.Dashboard,
	})),
);

// ═══════════════════════════════════════════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Skeleton loading state for route transitions.
 * Replace with your actual Loading/Skeleton component.
 */
function RouteFallback({ height = 400 }: { height?: number }) {
	return (
		<div
			className="animate-pulse rounded-lg bg-white/5"
			style={{ height }}
			role="status"
			aria-label="Loading…"
		/>
	);
}

/**
 * Layout section wrapper.
 * Replace with your actual Section component from `@/layout/Section`.
 */
function Section({
	id,
	children,
	className = "",
}: {
	id: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section id={id} className={`w-full px-4 py-8 ${className}`}>
			{children}
		</section>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Route: Home (Tournament)
// ═══════════════════════════════════════════════════════════════════════════════

interface HomeRouteProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
}

/**
 * Home page: tournament name picker + play area + profile section.
 *
 * The `#pick` anchor sits above the section so scroll-to targets
 * land with proper navbar clearance.
 */
export function HomeRoute({ onLogin }: HomeRouteProps) {
	return (
		<>
			{/* Scroll anchor for the "Pick" nav section */}
			<div id="pick" className="absolute -top-20" />

			<Section id="play">
				<Suspense fallback={<RouteFallback height={400} />}>
					<TournamentFlow />
				</Suspense>
			</Section>

			{/*
			 * ProfileSection goes here. Example:
			 * <ProfileSection onLogin={onLogin} />
			 *
			 * Suppressing unused-var lint for onLogin since the real
			 * ProfileSection component isn't in this project stub.
			 */}
			<Section id="profile">
				<p className="text-center text-slate-500">
					Profile section placeholder (onLogin handler ready: {typeof onLogin})
				</p>
			</Section>
		</>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Route: Analysis
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Internal wrapper that reads store state and passes it to Dashboard.
 * Kept as a separate component so the lazy import boundary works correctly.
 */
function AnalysisPage() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);

	return (
		<DashboardLazy
			personalRatings={tournament.ratings}
			currentTournamentNames={tournament.names ?? undefined}
			onStartNew={tournamentActions.resetTournament}
			onUpdateRatings={tournamentActions.setRatings}
			userName={user.name}
		/>
	);
}

/**
 * Analysis page: tournament results dashboard with rankings and charts.
 */
export function AnalysisRoute() {
	return (
		<Section id="analysis">
			<h2 className="mb-12 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-center text-3xl font-bold uppercase tracking-tighter text-transparent md:text-5xl">
				The Victors Emerge
			</h2>

			<Suspense fallback={<RouteFallback height={600} />}>
				<AnalysisPage />
			</Suspense>
		</Section>
	);
}
