import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, CheckCircle, Trophy } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { TournamentArena } from "@/features/tournament/TournamentArena";
import { namesQueryOptions } from "@/shared/api/names/api";
import { Button, ErrorBoundary, Loading, Section } from "@/shared/components/LayoutBlocks";
import { SectionHeading } from "@/shared/components/UIBlocks";
import { useSectionScroll } from "@/shared/hooks";
import { TIMING } from "@/shared/lib/constants";
import { getLockedNames } from "@/shared/lib/names";
import { MOTION_DURATIONS, MOTION_EASING, themeText } from "@/shared/lib/uiUtils";
import useAppStore from "@/store/appStore";

const TournamentSetup = routeComponents.TournamentSetup;
const DashboardLazy = routeComponents.DashboardLazy;

type HomeHeroState = "loading" | "ready" | "error";

interface HomeHeroSectionProps {
	state: HomeHeroState;
	lockedNames: NameItem[];
}

interface HeroNameWordsProps {
	state: HomeHeroState;
	lockedNames: NameItem[];
}

function HeroNameWords({ state, lockedNames }: HeroNameWordsProps) {
	if (state === "loading") {
		return <span className={themeText.heroPlaceholder}>________</span>;
	}
	if (state === "error" || lockedNames.length === 0) {
		return <span>NOSFERATU</span>;
	}

	const words = [...lockedNames.flatMap((n) => n.name.toUpperCase().split(/\s+/)), "WOODS"];

	return (
		<span>
			{words.map((word, i) => {
				const isLast = i === words.length - 1;
				return (
					<span key={`hero-word-${word}-${i}`} className="block sm:inline-block">
						{isLast ? word : `${word}\u00a0`}
					</span>
				);
			})}
		</span>
	);
}

export function HomeHeroSection({ state, lockedNames }: HomeHeroSectionProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<div className="home-hero-wrapper w-full">
			<Section
				fullpage={true}
				className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden text-foreground px-6 text-center"
			>
				<motion.div
					initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
					animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
					transition={{
						duration: prefersReducedMotion
							? MOTION_DURATIONS.reducedMotionDuration
							: MOTION_DURATIONS.gentle,
						ease: MOTION_EASING.easeStandard,
					}}
					className="flex flex-col items-center justify-center text-center max-w-4xl gap-8 md:gap-12"
				>
					<motion.div
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
						transition={{
							delay: prefersReducedMotion ? 0 : 0.2,
							duration: prefersReducedMotion
								? MOTION_DURATIONS.reducedMotionDuration
								: TIMING.MOTION_SLOW,
							ease: TIMING.MOTION_EASING,
						}}
					>
						<h1
							className={`${themeText.heroDisplay} tracking-tighter`}
							style={{
								fontSize: "clamp(2.5rem, 8vw, 6.5rem)",
								lineHeight: 1.05,
							}}
						>
							<HeroNameWords state={state} lockedNames={lockedNames} />
						</h1>
					</motion.div>
				</motion.div>
			</Section>
		</div>
	);
}

type AppFlowTab = "pick" | "tournament" | "analysis";

const APP_FLOW_TABS = [
	{ value: "pick", label: "Pick", icon: <CheckCircle size={16} /> },
	{ value: "tournament", label: "Vote", icon: <Trophy size={16} /> },
	{ value: "analysis", label: "Results", icon: <BarChart3 size={16} /> },
] as const;

export default function HomeRoute() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
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

	const [activeTab, setActiveTab] = useState<AppFlowTab>("pick");

	const handleActiveTabChange = useCallback((tab: AppFlowTab) => {
		setActiveTab(tab);
	}, []);

	useEffect(() => {
		const handleTabChange = (e: Event) => {
			const customEvent = e as CustomEvent<AppFlowTab>;
			if (APP_FLOW_TABS.some((t) => t.value === customEvent.detail)) {
				setActiveTab(customEvent.detail);
				scrollToSection(customEvent.detail);
			}
		};
		window.addEventListener("nav-tab-change", handleTabChange);
		return () => window.removeEventListener("nav-tab-change", handleTabChange);
	}, [scrollToSection]);

	const handleCompleteTournament = useCallback(() => {
		handleActiveTabChange("analysis");
		scheduleSectionScroll("analysis");
	}, [scheduleSectionScroll, handleActiveTabChange]);

	const handleStartNewTournament = useCallback(() => {
		clearPendingScroll();
		tournamentActions.resetTournament();
		handleActiveTabChange("pick");
		scheduleSectionScroll("pick");
	}, [clearPendingScroll, tournamentActions, scheduleSectionScroll, handleActiveTabChange]);

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	return (
		<>
			<HomeHeroSection state={heroState} lockedNames={lockedNames} />

			<Section
				id="app-flow"
				maxWidth="xl"
				separator={true}
				fullpage={false}
				ariaLabelledBy="section-heading-app"
			>
				<div className="flex flex-col items-center min-h-[100dvh] py-12 md:py-16">
					<div className="w-full flex flex-col items-center gap-8 md:gap-12">
						{activeTab === "pick" && (
							<div
								id="pick"
								className="w-full animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4"
							>
								<div className="w-full mt-8">
									<Suspense fallback={<Loading variant="skeleton" height={400} />}>
										<TournamentSetup />
									</Suspense>
								</div>
							</div>
						)}
						{activeTab === "tournament" && (
							<div
								id="tournament"
								className="w-full animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4"
							>
								<SectionHeading
									id="section-heading-tournament"
									title="But See How I Got There"
									subtitle="Head-to-head matchups to rank them all."
								/>
								<div className="w-full mt-8">
									<Suspense fallback={<Loading variant="skeleton" height={400} />}>
										{tournament.names && tournament.names.length > 0 ? (
											<TournamentArena
												names={tournament.names}
												existingRatings={tournament.ratings}
												onComplete={(ratings) => {
													tournamentActions.completeTournament(ratings);
													handleCompleteTournament();
												}}
											/>
										) : (
											<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-12 text-center">
												<p className="text-pretty text-sm text-muted-foreground/70">
													Pick at least 2 names to start comparing them.
												</p>
												<Button variant="glass" onClick={() => setActiveTab("pick")}>
													← Back to Pick
												</Button>
											</div>
										)}
									</Suspense>
								</div>
							</div>
						)}
						{activeTab === "analysis" && (
							<div
								id="analysis"
								className="w-full animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4"
							>
								<SectionHeading
									id="section-heading-analysis"
									title="Results"
									subtitle="See how all the names ranked."
								/>
								<div className="w-full mt-8">
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
							</div>
						)}
					</div>
				</div>
			</Section>
		</>
	);
}
