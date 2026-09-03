import { ArrowRight, BarChart3, CheckCircle, RotateCcw, Trophy } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Dashboard as DashboardLazy } from "@/features/dashboard/Dashboard";
import { TournamentArena } from "@/features/tournament/TournamentArena";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";
import { Button, ErrorBoundary, Loading, Section } from "@/shared/components/LayoutBlocks";
import { TextLoop } from "@/shared/components/TextLoop";
import { SectionHeading } from "@/shared/components/UIBlocks";
import { useSectionScroll } from "@/shared/hooks";
import useAppStore, { errorContexts } from "@/store";

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
	const { scrollToSection, scheduleSectionScroll, clearPendingScroll } = useSectionScroll();

	const [activeTab, setActiveTab] = useState<AppFlowTab>(() => {
		if (tournament.names && tournament.names.length >= 2 && !tournament.isComplete) {
			return "tournament";
		}
		if (tournament.isComplete && Object.keys(tournament.ratings).length > 0) {
			return "analysis";
		}
		return "pick";
	});

	const handleActiveTabChange = useCallback((tab: AppFlowTab) => {
		setActiveTab(tab);
	}, []);

	useEffect(() => {
		if (tournament.names && tournament.names.length >= 2 && !tournament.isComplete) {
			setActiveTab("tournament");
		}
	}, [tournament.names, tournament.isComplete]);

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

	const hasActiveInProgressTournament = Boolean(
		tournament.names && tournament.names.length >= 2 && !tournament.isComplete,
	);

	return (
		<Section
			id="app-flow"
			maxWidth="xl"
			separator={false}
			fullpage={false}
			ariaLabelledBy="section-heading-app"
		>
			<div className="flex flex-col items-center w-full py-2 sm:py-4">
				<div className="w-full mb-4 overflow-hidden rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-md shadow-xs py-1">
					<TextLoop
						text="NAME NOSFERATU ✦ THE ULTIMATE CAT TOURNAMENT ✦ CHOOSE CONTENDERS ✦ VOTE & RANK CHAMPIONS"
						shape="wave"
						ribbon={true}
						ribbonColor="#5227FF"
						curviness={28}
						fontSize={18}
						speed={65}
						ribbonWidth={42}
					/>
				</div>

				<div className="w-full flex flex-col items-center gap-6">
					{activeTab === "pick" && (
						<div
							id="pick"
							className="w-full animate-in fade-in zoom-in-95 duration-300 slide-in-from-bottom-4"
						>
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
												{tournament.names?.length} contenders • Resume where you left off or start
												fresh
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
												handleActiveTabChange("tournament");
												scheduleSectionScroll("tournament");
											}}
											className="text-xs font-semibold flex items-center gap-1.5"
										>
											Resume Voting
											<ArrowRight size={13} />
										</Button>
									</div>
								</div>
							)}
							<div className="w-full mt-4 sm:mt-6">
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
										<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-12 text-center">
											<p className="text-pretty text-sm text-muted-foreground">
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
					)}
				</div>
			</div>
		</Section>
	);
}
