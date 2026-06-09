import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { HomeHeroSection } from "@/app/routes/components/HomeSections";
import { namesQueryOptions } from "@/shared/api/names/api";
import { ErrorBoundary } from "@/shared/components/layout/Feedback/ErrorBoundary";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { SectionFlow } from "@/shared/components/ui/SectionFlow";
import { SectionPage } from "@/shared/components/ui/SectionPage";
import { useSectionScroll } from "@/shared/hooks/useSectionScroll";
import { getLockedNames } from "@/shared/lib/names/nameFilters";
import useAppStore from "@/store/appStore";

const LazyTournament = lazy(() => import("@/features/tournament/Tournament"));
const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;

export default function HomeRoute() {
	const { user, tournament, tournamentActions } = useAppStore();
	const namesQuery = useQuery(namesQueryOptions(user.isAdmin));
	const { clearPendingScroll } = useSectionScroll();

	const hasNamesData = typeof namesQuery.data !== "undefined";
	const heroState =
		!hasNamesData && namesQuery.isPending
			? "loading"
			: !hasNamesData && namesQuery.isError
				? "error"
				: "ready";
	const names = namesQuery.data?.names ?? [];
	const lockedNames = heroState === "ready" ? getLockedNames(names) : [];

	const handleStartNewTournament = useCallback(() => {
		clearPendingScroll();
		tournamentActions.resetTournament();
	}, [clearPendingScroll, tournamentActions]);

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	return (
		<SectionFlow
			sections={{
				hero: (
					<div className="home-hero-wrapper w-full">
						<section className="relative isolate flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden text-foreground px-6 text-center">
							<HomeHeroSection state={heroState} lockedNames={lockedNames} />
						</section>
					</div>
				),
				pick: (
					<SectionPage
						id="pick"
						title="My Cat Needs a Name"
						subtitle="Pick your favorites. Let's see what wins."
						maxWidth="xl"
					>
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							<TournamentFlow />
						</Suspense>
					</SectionPage>
				),
				tournament: (
					<SectionPage
						id="tournament"
						title="But See How I Got There"
						subtitle="Head-to-head matchups to rank them all."
						maxWidth="2xl"
					>
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							{tournament.names && tournament.names.length > 0 ? (
								<div className="w-full">
									<LazyTournament
										names={tournament.names}
										existingRatings={tournament.ratings}
										onComplete={(ratings) => {
											tournamentActions.completeTournament(ratings);
										}}
									/>
								</div>
							) : (
								<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-12 text-center">
									<p className="text-pretty text-sm text-muted-foreground/70">
										Pick at least 2 names to start comparing them.
									</p>
								</div>
							)}
						</Suspense>
					</SectionPage>
				),
				analysis: (
					<SectionPage
						id="analysis"
						title="Results"
						subtitle="See how all the names ranked."
						maxWidth="2xl"
					>
						<Suspense fallback={<Loading variant="skeleton" height={600} />}>
							<ErrorBoundary context={errorContexts.analysisDashboard}>
								<DashboardLazy
									personalRatings={tournament.ratings}
									currentTournamentNames={tournament.names ?? undefined}
									onStartNew={handleStartNewTournament}
									onUpdateRatings={tournamentActions.setRatings}
									userName={user.name ?? ""}
									isAdmin={user.isAdmin}
									isLoggedIn={user.isLoggedIn}
									avatarUrl={user.avatarUrl}
								/>
							</ErrorBoundary>
						</Suspense>
					</SectionPage>
				),
			}}
		/>
	);
}
