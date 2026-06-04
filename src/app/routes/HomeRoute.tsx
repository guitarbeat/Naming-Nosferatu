import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { HomeHeroSection } from "@/app/routes/components/HomeSections";
import { namesQueryOptions } from "@/shared/api/names/api";

import Button from "@/shared/components/layout/Button";
import { ErrorBoundary } from "@/shared/components/layout/Feedback/ErrorBoundary";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { SectionNavigation } from "@/shared/components/layout/SectionNavigation";
import { useSectionScroll } from "@/shared/hooks/useSectionScroll";
import { getLockedNames } from "@/shared/lib/names/nameFilters";
import useAppStore from "@/store/appStore";

const LazyTournament = lazy(() => import("@/features/tournament/Tournament"));

const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;

export default function HomeRoute() {
	const { user, tournament, tournamentActions } = useAppStore();
	const namesQuery = useQuery(namesQueryOptions(user.isAdmin));
	const { scrollToSection, scheduleSectionScroll, clearPendingScroll } = useSectionScroll();

	const hasNamesData = typeof namesQuery.data !== "undefined";
	const heroState =
		!hasNamesData && namesQuery.isPending
			? "loading"
			: !hasNamesData && namesQuery.isError
				? "error"
				: "ready";
	const names = namesQuery.data?.names ?? [];
	const lockedNames = heroState === "ready" ? getLockedNames(names) : [];

	const scheduleAnalysisScroll = useCallback(() => {
		scheduleSectionScroll("analysis");
	}, [scheduleSectionScroll]);

	const handleStartNewTournament = useCallback(() => {
		clearPendingScroll();
		tournamentActions.resetTournament();
	}, [clearPendingScroll, tournamentActions]);

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	return (
		<>
			<HomeHeroSection
				state={heroState}
				lockedNames={lockedNames}
				onStartPicking={() => scrollToSection("pick")}
			/>

			<Section id="pick" variant="minimal" padding="comfortable" maxWidth="xl" separator={true} fullpage={true}>
				<div className="flex flex-col items-center justify-center min-h-[100dvh] py-12 md:py-16">
					<div className="w-full flex flex-col items-center gap-8 md:gap-12">
						<div>
							<SectionHeading title="Pick Your Favorites" subtitle="Swipe or click to select names you love." />
						</div>
						<div className="w-full">
							<Suspense fallback={<Loading variant="skeleton" height={400} />}>
								<TournamentFlow />
							</Suspense>
						</div>
						<div className="mt-auto pt-8 flex justify-center gap-4">
							<Button variant="glass" size="lg" onClick={() => scrollToSection("")}>
								← Back
							</Button>
							<Button variant="glass" size="lg" onClick={() => scrollToSection("tournament")}>
								Compare →
							</Button>
						</div>
					</div>
				</div>
			</Section>

			<Section
				id="tournament"
				variant="minimal"
				padding="comfortable"
				maxWidth="2xl"
				separator={true}
				fullpage={true}
			>
				<div className="flex flex-col items-center justify-center min-h-[100dvh] py-12 md:py-16">
					<div className="w-full flex flex-col items-center gap-8 md:gap-12">
						<div>
							<SectionHeading title="Compare Names" subtitle="Vote on which name you prefer in each matchup." />
						</div>
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							{tournament.names && tournament.names.length > 0 ? (
								<>
									<div className="w-full">
										<LazyTournament
											names={tournament.names}
											existingRatings={tournament.ratings}
											onComplete={(ratings) => {
												tournamentActions.completeTournament(ratings);
												scheduleAnalysisScroll();
											}}
										/>
									</div>
									<div className="mt-auto pt-8 flex justify-center gap-4">
										<Button variant="glass" size="lg" onClick={() => scrollToSection("pick")}>
											← Back
										</Button>
										<Button variant="glass" size="lg" onClick={() => scrollToSection("analysis")}>
											See Results →
										</Button>
									</div>
								</>
							) : (
								<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-12 text-center">
									<p className="text-pretty text-sm text-muted-foreground/70">
										Pick at least 2 names to start comparing them.
									</p>
									<Button variant="glass" onClick={() => scrollToSection("pick")}>
										← Back
									</Button>
								</div>
							)}
						</Suspense>
					</div>
				</div>
			</Section>

			<Section
				id="analysis"
				variant="minimal"
				padding="comfortable"
				maxWidth="2xl"
				separator={true}
				fullpage={true}
			>
				<div className="flex flex-col items-center justify-center min-h-[100dvh] py-12 md:py-16">
					<div className="w-full flex flex-col items-center gap-8 md:gap-12">
						<div>
							<SectionHeading title="Results" subtitle="See how all the names ranked." />
						</div>
						<div className="w-full">
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
						</div>
						<div className="mt-auto pt-8 flex justify-center gap-4">
							<Button variant="glass" size="lg" onClick={() => scrollToSection("tournament")}>
								← Back
							</Button>
							<Button variant="glass" size="lg" onClick={() => scrollToSection("pick")}>
								Pick Different Names
							</Button>
						</div>
					</div>
				</div>
			</Section>
		</>
	);
}
