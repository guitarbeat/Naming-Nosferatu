import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { HomeHeroSection } from "@/app/routes/components/HomeSections";
import { namesQueryOptions } from "@/shared/api/names/api";

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
		tournamentActions.resetTournament();
	}, [clearPendingAnalysisScroll, tournamentActions]);

	useEffect(() => clearPendingAnalysisScroll, [clearPendingAnalysisScroll]);

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
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, ease: "easeOut" }}
							viewport={{ once: false }}
						>
							<SectionHeading title="Narrow It Down" subtitle="Select your top picks." />
						</motion.div>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
							viewport={{ once: false }}
							className="w-full"
						>
							<Suspense fallback={<Loading variant="skeleton" height={400} />}>
								<TournamentFlow />
							</Suspense>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
							viewport={{ once: false }}
							className="mt-auto pt-8 flex justify-center"
						>
							<Button variant="glass" size="lg" onClick={() => scrollToSection("tournament")}>
								Continue to Bracket
							</Button>
						</motion.div>
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
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, ease: "easeOut" }}
							viewport={{ once: false }}
						>
							<SectionHeading title="Bracket" subtitle="Head-to-head matchups." />
						</motion.div>
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							{tournament.names && tournament.names.length > 0 ? (
								<>
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										whileInView={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
										viewport={{ once: false }}
										className="w-full"
									>
										<LazyTournament
											names={tournament.names}
											existingRatings={tournament.ratings}
											onComplete={(ratings) => {
												tournamentActions.completeTournament(ratings);
												scheduleAnalysisScroll();
											}}
										/>
									</motion.div>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
										viewport={{ once: false }}
										className="mt-auto pt-8 flex justify-center"
									>
										<Button variant="glass" size="lg" onClick={() => scrollToSection("analysis")}>
											View Rankings
										</Button>
									</motion.div>
								</>
							) : (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, ease: "easeOut" }}
									viewport={{ once: false }}
									className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-12 text-center"
								>
									<p className="text-pretty text-sm text-muted-foreground/70">
										Select at least two names to begin.
									</p>
									<Button variant="glass" onClick={() => scrollToSection("pick")}>
										Go Back
									</Button>
								</motion.div>
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
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, ease: "easeOut" }}
							viewport={{ once: false }}
						>
							<SectionHeading title="Your Rankings" subtitle="Final scores." />
						</motion.div>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
							viewport={{ once: false }}
							className="w-full"
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
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
							viewport={{ once: false }}
							className="mt-auto pt-8 flex justify-center"
						>
							<Button variant="glass" size="lg" onClick={() => scrollToSection("pick")}>
								Start Over
							</Button>
						</motion.div>
					</div>
				</div>
			</Section>
		</>
	);
}
