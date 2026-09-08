import { ChevronDown, RotateCcw, Trophy } from "lucide-react";
import { Suspense, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app";
import { Dashboard as DashboardLazy } from "@/features/dashboard/Dashboard";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";
import {
	Button,
	ErrorBoundary,
	Loading,
	Section,
} from "@/shared/components/LayoutBlocks";
import { SectionHeading } from "@/shared/components/UIBlocks";
import { useSectionScroll } from "@/shared/hooks";
import useAppStore, { errorContexts } from "@/store";

export function HomeRoute() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const { scrollToSection, scheduleSectionScroll, clearPendingScroll } =
		useSectionScroll();

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
			{/* HERO SECTION - integrating previously unused styling classes */}
			<section className="home-hero-section w-full relative flex flex-col justify-center items-center">
				<div className="home-hero-inner w-full flex flex-col lg:flex-row items-center justify-between gap-12 z-10 relative">
					{/* Left Copy Column */}
					<div className="home-hero-copy flex flex-col items-start w-full lg:w-1/2 gap-6 z-10 text-left">
						<h1 className="gradient-heading text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight">
							Name Nosferatu.
						</h1>
					</div>

					{/* Right Graphic Column */}
					<div className="home-hero-preview relative w-full lg:w-1/2 flex justify-center lg:justify-end items-center z-10">
						<div className="relative w-full max-w-[500px] aspect-square rounded-[2.5rem] glass-surface glass-surface--fallback p-2 animate-float">
							<div className="relative w-full h-full rounded-[2rem] overflow-hidden">
								<img
									src="/assets/images/ui/cat_graphic_hd.png"
									alt="Nosferatu"
									className="w-full h-full object-cover rounded-[2rem] opacity-90 transition-transform duration-1000 hover:scale-110"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none rounded-[2rem]" />
							</div>
						</div>

						{/* Ambient Glow */}
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10" />
					</div>
				</div>

				<div
					className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-primary transition-colors z-20"
					onClick={() => scrollToSection("app-flow")}
				>
					<span className="text-xs uppercase tracking-widest font-semibold">
						Scroll to Discover
					</span>
					<ChevronDown className="w-6 h-6 animate-bounce" />
				</div>
			</section>

			<div
				id="app-flow"
				className="w-full flex flex-col items-center gap-10 sm:gap-14 py-4 sm:py-6 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto"
			>
				{/* 1. Pick Contenders / Tournament Arena */}
				<section id="pick" className="w-full scroll-mt-20 sm:scroll-mt-24">
					<div id="tournament" className="scroll-mt-20 sm:scroll-mt-24" />
					<div id="contenders" className="scroll-mt-20 sm:scroll-mt-24" />
					{hasActiveInProgressTournament && (
						<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/80 p-3.5 sm:p-4 shadow-sm">
							<div className="flex items-center gap-3 text-left w-full sm:w-auto">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
									<Trophy size={18} />
								</div>
								<div>
									<h4 className="text-sm font-semibold text-foreground">
										Tournament in Progress
									</h4>
									<p className="text-xs text-muted-foreground">
										{tournament.names?.length} contenders seeded
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
								<Button
									variant="ghost"
									size="small"
									onClick={handleStartNewTournament}
									className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
								>
									<RotateCcw size={13} />
									Start Fresh
								</Button>
							</div>
						</div>
					)}
					<div className="w-full min-h-[480px] flex flex-col flex-1">
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							<TournamentSetup />
						</Suspense>
					</div>
				</section>

				{/* 2. Results & Leaderboards */}
				<section
					id="analysis"
					className="w-full scroll-mt-20 sm:scroll-mt-24 pt-8 border-t border-border/20"
				>
					<div id="results" className="scroll-mt-20 sm:scroll-mt-24" />
					<div id="stats" className="scroll-mt-20 sm:scroll-mt-24" />
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
				</section>
			</div>
		</div>
	);
}

function AdminLoading() {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-background">
			<Loading variant="skeleton" height={600} />
		</div>
	);
}

function AccessDenied() {
	const navigate = useNavigate();
	return (
		<Section id="admin" maxWidth="md">
			<div className="flex flex-col items-center gap-4 py-10 text-center">
				<h2 className="text-3xl font-bold text-destructive">Access Denied</h2>
				<p className="max-w-md text-muted-foreground">
					Admin access is required to view this page. Head back home to log in
					or return to the main tournament flow.
				</p>
				<Button variant="glass" onClick={() => navigate("/")}>
					Back Home
				</Button>
			</div>
		</Section>
	);
}

export function AdminRoute() {
	const { user: authUser, isLoading: authLoading } = useAuth();

	if (authLoading) {
		return <AdminLoading />;
	}

	if (!authUser?.isAdmin) {
		return <AccessDenied />;
	}

	return (
		<Section id="admin">
			<Suspense fallback={<Loading variant="skeleton" height={600} />}>
				<ErrorBoundary context={errorContexts.analysisDashboard}>
					<DashboardLazy
						isAdmin={authUser?.isAdmin}
						userName={authUser?.name}
						isLoggedIn={authUser?.isLoggedIn}
						avatarUrl={authUser?.avatarUrl}
					/>
				</ErrorBoundary>
			</Suspense>
		</Section>
	);
}
