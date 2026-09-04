import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { Suspense, useCallback, useEffect } from "react";
import { Dashboard as DashboardLazy } from "@/features/dashboard/Dashboard";
import { TournamentArena } from "@/features/tournament/TournamentArena";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";
import { Button, ErrorBoundary, Loading } from "@/shared/components/LayoutBlocks";
import { StaggeredMenuToggle, useMenu } from "@/shared/components/StaggeredMenu";
import { TextLoop } from "@/shared/components/TextLoop";
import { SectionHeading } from "@/shared/components/UIBlocks";
import { useSectionScroll } from "@/shared/hooks";
import useAppStore, { errorContexts } from "@/store";

export default function HomeRoute() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const menu = useMenu();
	const { scrollToSection, scheduleSectionScroll, clearPendingScroll } = useSectionScroll();

	useEffect(() => {
		const handleTabChange = (e: Event) => {
			const customEvent = e as CustomEvent<string>;
			if (customEvent.detail) {
				scrollToSection(customEvent.detail);
			}
		};
		window.addEventListener("nav-tab-change", handleTabChange);
		return () => window.removeEventListener("nav-tab-change", handleTabChange);
	}, [scrollToSection]);

	const handleCompleteTournament = useCallback(() => {
		scheduleSectionScroll("analysis");
	}, [scheduleSectionScroll]);

	const handleStartNewTournament = useCallback(() => {
		clearPendingScroll();
		tournamentActions.resetTournament();
		scheduleSectionScroll("pick");
	}, [clearPendingScroll, tournamentActions, scheduleSectionScroll]);

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	const hasActiveInProgressTournament = Boolean(
		tournament.names && tournament.names.length >= 2 && !tournament.isComplete,
	);

	return (
		<div className="w-full flex flex-col items-center">
			<div className="w-full overflow-hidden mb-1">
				<TextLoop
					text="NOSFERATU WOODS ✦ MENU ✦ NOSFERATU WOODS ✦ MENU"
					shape="wave"
					ribbon={true}
					ribbonColor="#5227FF"
					curviness={28}
					fontSize={18}
					speed={65}
					ribbonWidth={42}
					className="w-full"
					onClick={menu?.toggle}
				>
					<StaggeredMenuToggle />
				</TextLoop>
			</div>

			<div
				id="app-flow"
				className="w-full flex flex-col items-center gap-12 sm:gap-16 py-4 sm:py-8 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto"
			>
				{/* 1. Pick Contenders */}
				<div id="pick" className="w-full scroll-mt-20 sm:scroll-mt-24">
					{hasActiveInProgressTournament && (
						<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5 shadow-sm backdrop-blur-md">
							<div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
									<Trophy size={20} />
								</div>
								<div>
									<h4 className="text-sm font-semibold text-foreground">
										Tournament Session in Progress
									</h4>
									<p className="text-xs text-muted-foreground mt-0.5">
										{tournament.names?.length} contenders • Resume where you left off or start fresh
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
								<Button
									variant="ghost"
									size="small"
									onClick={handleStartNewTournament}
									className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
								>
									<RotateCcw size={13} />
									Start Fresh
								</Button>
								<Button
									variant="primary"
									size="small"
									onClick={() => {
										scrollToSection("tournament");
									}}
									className="text-xs font-semibold flex items-center gap-1.5"
								>
									Resume Voting
									<ArrowRight size={13} />
								</Button>
							</div>
						</div>
					)}
					<div className="w-full min-h-[480px] flex flex-col flex-1">
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							<TournamentSetup />
						</Suspense>
					</div>
				</div>

				{/* 2. Head-to-Head Tournament Arena */}
				<div
					id="tournament"
					className="w-full scroll-mt-20 sm:scroll-mt-24 pt-8 border-t border-border/20"
				>
					<SectionHeading
						id="section-heading-tournament"
						title="Head-to-Head Tournament"
						subtitle="Compare contenders head-to-head to determine the ranking."
					/>
					<div className="w-full mt-4 sm:mt-6">
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
								<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-12 px-6 text-center rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm">
									<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Trophy size={24} />
									</div>
									<div className="space-y-1">
										<h4 className="text-base font-semibold text-foreground">Tournament Arena</h4>
										<p className="text-pretty text-sm text-muted-foreground">
											Pick at least 2 contenders above to start comparing them in the bracket arena.
										</p>
									</div>
									<Button
										variant="glass"
										size="small"
										onClick={() => scrollToSection("pick")}
										className="text-xs mt-2"
									>
										↑ Pick Contenders
									</Button>
								</div>
							)}
						</Suspense>
					</div>
				</div>

				{/* 3. Results & Leaderboards */}
				<div
					id="analysis"
					className="w-full scroll-mt-20 sm:scroll-mt-24 pt-8 border-t border-border/20"
				>
					<SectionHeading
						id="section-heading-analysis"
						title="Results & Leaderboards"
						subtitle="See how all the contenders ranked across tournaments."
					/>
					<div className="w-full mt-4 sm:mt-6">
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
		</div>
	);
}
