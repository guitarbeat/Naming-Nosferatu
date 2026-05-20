import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { HomeHeroSection } from "@/app/routes/components/HomeSections";
import { namesQueryOptions } from "@/features/names/api";
import { useTournamentHandlers } from "@/features/tournament/hooks/useTournamentHandlers";
import Button from "@/shared/components/layout/Button";
import { ErrorBoundary } from "@/shared/components/layout/Feedback/ErrorBoundary";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { useMediaQuery } from "@/shared/hooks/useBrowserState";
import { getLockedNames } from "@/shared/lib/names/nameFilters";
import useAppStore from "@/store/appStore";

const LazyTournament = lazy(() => import("@/features/tournament/Tournament"));

const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;

export default function HomeRoute() {
	const { user, tournament, tournamentActions } = useAppStore();
	const namesQuery = useQuery(namesQueryOptions(user.isAdmin));
	const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const pendingAnalysisScrollRef = useRef<number | null>(null);
	const hasNamesData = typeof namesQuery.data !== "undefined";
	const heroState =
		!hasNamesData && namesQuery.isPending
			? "loading"
			: !hasNamesData && namesQuery.isError
				? "error"
				: "ready";
	const names = namesQuery.data?.names ?? [];
	const lockedNames = heroState === "ready" ? getLockedNames(names) : [];
	const { handleTournamentComplete, handleStartNewTournament: startNewTournament } =
		useTournamentHandlers({
			userName: user.name,
			tournamentActions,
		});

	const clearPendingAnalysisScroll = useCallback(() => {
		if (pendingAnalysisScrollRef.current === null) {
			return;
		}

		window.clearTimeout(pendingAnalysisScrollRef.current);
		pendingAnalysisScrollRef.current = null;
	}, []);

	const performSectionScroll = useCallback(
		(id: string) => {
			document.getElementById(id)?.scrollIntoView({
				behavior: prefersReducedMotion ? "auto" : "smooth",
				block: "start",
			});
		},
		[prefersReducedMotion],
	);

	const scrollToSection = useCallback(
		(id: string) => {
			clearPendingAnalysisScroll();
			performSectionScroll(id);
		},
		[clearPendingAnalysisScroll, performSectionScroll],
	);

	const scheduleAnalysisScroll = useCallback(() => {
		clearPendingAnalysisScroll();
		pendingAnalysisScrollRef.current = window.setTimeout(() => {
			pendingAnalysisScrollRef.current = null;
			performSectionScroll("analysis");
		}, 800);
	}, [clearPendingAnalysisScroll, performSectionScroll]);

	const handleStartNewTournament = useCallback(() => {
		clearPendingAnalysisScroll();
		startNewTournament();
	}, [clearPendingAnalysisScroll, startNewTournament]);

	useEffect(() => clearPendingAnalysisScroll, [clearPendingAnalysisScroll]);

	return (
		<>
			<HomeHeroSection
				state={heroState}
				lockedNames={lockedNames}
				onStartPicking={() => scrollToSection("pick")}
				useCinematic={true}
			/>

			<Section
				id="pick"
				variant="minimal"
				padding="comfortable"
				maxWidth="xl"
				fullpage={true}
				separator={true}
			>
				<SectionHeading title="Narrow It Down" subtitle="Select your top picks." />
				<Suspense fallback={<Loading variant="skeleton" height={400} />}>
					<TournamentFlow />
				</Suspense>
			</Section>

			<Section
				id="tournament"
				variant="minimal"
				padding="comfortable"
				maxWidth="2xl"
				fullpage={true}
				separator={true}
			>
				<SectionHeading title="Bracket" subtitle="Head-to-head matchups." />
				<Suspense fallback={<Loading variant="skeleton" height={400} />}>
					{tournament.names && tournament.names.length > 0 ? (
						<LazyTournament
							names={tournament.names}
							existingRatings={tournament.ratings}
							onComplete={(ratings) => {
								handleTournamentComplete(ratings);
								scheduleAnalysisScroll();
							}}
						/>
					) : (
						<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-12 text-center">
							<p className="text-pretty text-sm text-muted-foreground/70">
								Select at least two names to begin.
							</p>
							<Button variant="glass" onClick={() => scrollToSection("pick")}>
								Go Back
							</Button>
						</div>
					)}
				</Suspense>
			</Section>

			<Section
				id="analysis"
				variant="minimal"
				padding="comfortable"
				maxWidth="2xl"
				fullpage={true}
				separator={true}
			>
				<SectionHeading title="Your Rankings" subtitle="Final scores." />
				<Suspense fallback={<Loading variant="skeleton" height={600} />}>
					<ErrorBoundary context={errorContexts.analysisDashboard}>
						<DashboardLazy
							personalRatings={tournament.ratings}
							currentTournamentNames={tournament.names ?? undefined}
							onStartNew={handleStartNewTournament}
							userName={user.name ?? ""}
							isAdmin={user.isAdmin}
							isLoggedIn={user.isLoggedIn}
							avatarUrl={user.avatarUrl}
						/>
					</ErrorBoundary>
				</Suspense>
			</Section>
		</>
	);
}
