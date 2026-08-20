import { motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import Button from "@/shared/components/layout/Button";
import { ErrorBoundary } from "@/shared/components/layout/Feedback/ErrorBoundary";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/ui/SectionHeading";
import { TIMING } from "@/shared/lib/constants";
import { themeText } from "@/shared/lib/themeClasses";
import type { NameItem } from "@/shared/types";
import type { AppState } from "@/store/appStore.types";

const LazyTournament = lazy(() => import("@/features/tournament/Tournament"));
const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;

type HomeHeroState = "loading" | "ready" | "error";

interface HomeHeroSectionProps {
	state: HomeHeroState;
	lockedNames: NameItem[];
	onStartPicking: () => void;
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
		return <span>Nosferatu</span>;
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

export function HomeHeroSection({ state, lockedNames, onStartPicking }: HomeHeroSectionProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<div className="home-hero-wrapper w-full">
			<section className="relative isolate flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden text-foreground px-6 text-center">
				<motion.div
					initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
					animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="flex flex-col items-center justify-center text-center max-w-4xl gap-8 md:gap-12"
				>
					<motion.p
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
						transition={{
							delay: 0.1,
							duration: TIMING.MOTION_NORMAL,
							ease: TIMING.MOTION_EASING,
						}}
						className="text-sm font-medium uppercase tracking-wider text-muted-foreground/70"
					>
						What should we name my cat?
					</motion.p>

					<motion.div
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
						transition={{
							delay: 0.2,
							duration: TIMING.MOTION_SLOW,
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

					<motion.h2
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
						transition={{
							delay: 0.35,
							duration: TIMING.MOTION_SLOW,
							ease: TIMING.MOTION_EASING,
						}}
						className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground/85 text-center max-w-2xl px-4"
						style={{ lineHeight: 1.4 }}
					>
						Pick your favorites and see which names score highest with your friends.
					</motion.h2>

					<motion.div
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
						transition={{
							delay: 0.5,
							duration: TIMING.MOTION_NORMAL,
							ease: TIMING.MOTION_EASING,
						}}
						className="mt-6"
					>
						<Button variant="glass" size="large" onClick={onStartPicking}>
							Get Started
						</Button>
					</motion.div>
				</motion.div>
			</section>
		</div>
	);
}

export function HomePickSection() {
	return (
		<Section
			id="pick"
			maxWidth="xl"
			separator={true}
			fullpage={true}
			ariaLabelledBy="section-heading-pick"
		>
			<div className="flex flex-col items-center justify-center min-h-[100dvh] py-12 md:py-16">
				<div className="w-full flex flex-col items-center gap-8 md:gap-12">
					<div>
						<SectionHeading
							id="section-heading-pick"
							title="My Cat Needs a Name"
							subtitle="Pick your favorites. Let's see what wins."
						/>
					</div>
					<div className="w-full">
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							<TournamentFlow />
						</Suspense>
					</div>
				</div>
			</div>
		</Section>
	);
}

export function HomeTournamentSection({
	tournament,
	tournamentActions,
	scheduleAnalysisScroll,
	scrollToSection,
}: {
	tournament: AppState["tournament"];
	tournamentActions: AppState["tournamentActions"];
	scheduleAnalysisScroll: () => void;
	scrollToSection: (id: string) => void;
}) {
	return (
		<Section
			id="tournament"
			separator={true}
			fullpage={true}
			ariaLabelledBy="section-heading-tournament"
		>
			<div className="flex flex-col items-center justify-center min-h-[100dvh] py-12 md:py-16">
				<div className="w-full flex flex-col items-center gap-8 md:gap-12">
					<div>
						<SectionHeading
							id="section-heading-tournament"
							title="But See How I Got There"
							subtitle="Head-to-head matchups to rank them all."
						/>
					</div>
					<Suspense fallback={<Loading variant="skeleton" height={400} />}>
						{tournament.names && tournament.names.length > 0 ? (
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
	);
}

export function HomeAnalysisSection({
	tournament,
	tournamentActions,
	user,
	handleStartNewTournament,
}: {
	tournament: AppState["tournament"];
	tournamentActions: AppState["tournamentActions"];
	user: AppState["user"];
	handleStartNewTournament: () => void;
}) {
	return (
		<Section
			id="analysis"
			separator={true}
			fullpage={true}
			ariaLabelledBy="section-heading-analysis"
		>
			<div className="flex flex-col items-center justify-center min-h-[100dvh] py-12 md:py-16">
				<div className="w-full flex flex-col items-center gap-8 md:gap-12">
					<div>
						<SectionHeading
							id="section-heading-analysis"
							title="Results"
							subtitle="See how all the names ranked."
						/>
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
				</div>
			</div>
		</Section>
	);
}
