import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { useAuth } from "@/app/providers/Providers";
import { namesQueryOptions } from "@/features/names/queries";
import { NameSuggestionInner } from "@/features/tournament/components/NameSuggestion";
import { useTournamentHandlers } from "@/features/tournament/hooks";
import Tournament from "@/features/tournament/Tournament";
import {
	AppLayout,
	Button,
	ErrorBoundary,
	Loading,
	Section,
	SectionHeading,
} from "@/shared/components";
import CatImage from "@/shared/components/layout/CatImage";
import { ProfileInner } from "@/shared/components/profile/ProfileInner";
import { getLockedNames } from "@/shared/lib/basic";
import { CAT_IMAGES } from "@/shared/lib/constants";
import {
	BarChart3,
	CheckCircle,
	Lightbulb,
	PawPrint,
	Trophy,
	User,
} from "@/shared/lib/icons";
import {
	cleanupPerformanceMonitoring,
	initializePerformanceMonitoring,
} from "@/shared/lib/performance";
import { ErrorManager } from "@/shared/services/errorManager";
import { updateSupabaseUserContext } from "@/shared/services/supabase/runtime";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";

const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;
const AdminDashboardLazy = routeComponents.AdminDashboardLazy;

function App() {
	const { user: authUser, isLoading } = useAuth();
	const isInitialized = !isLoading;
	const { userActions } = useAppStore();
	const location = useLocation();
	const { pathname } = location;

	useLayoutEffect(() => {
		if (pathname) {
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	}, [pathname]);

	useEffect(() => {
		if (authUser) {
			userActions.setAdminStatus(Boolean(authUser.isAdmin));
		}
		updateSupabaseUserContext(authUser?.name ?? null, authUser?.id ?? null);
	}, [authUser, userActions]);

	useEffect(() => {
		initializePerformanceMonitoring();
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanupPerformanceMonitoring();
			cleanup();
		};
	}, []);

	const handleUserContext = useCallback((name: string) => {
		updateSupabaseUserContext(name, null);
	}, []);
	useAppStoreInitialization(handleUserContext);

	if (!isInitialized) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-background">
				<Loading variant="spinner" text="Preparing the tournament..." />
			</div>
		);
	}

	return (
		<AppLayout>
			<Routes>
				<Route
					path="/"
					element={
						<ErrorBoundary context={errorContexts.tournamentFlow}>
							<HomeContent />
						</ErrorBoundary>
					}
				/>
				<Route path="/tournament" element={<Navigate to="/" replace={true} />} />
				<Route path="/analysis" element={<Navigate to="/" replace={true} />} />
				<Route path="/admin" element={<AdminContent />} />
			</Routes>
		</AppLayout>
	);
}

function HomeContent() {
	const { login } = useAuth();
	const namesQuery = useQuery(namesQueryOptions(true));
	const lockedNames = getLockedNames(namesQuery.data?.names);
	const [hoveredWordIdx, setHoveredWordIdx] = useState<number | null>(null);
	const { user, tournament, tournamentActions } = useAppStore();
	const totalNameCount = namesQuery.data?.names?.length ?? 0;
	const selectedCount = tournament.selectedNames?.length ?? 0;
	const { handleTournamentComplete, handleStartNewTournament } = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	const wordEntries: Array<{ word: string; name: (typeof lockedNames)[number] | null }> =
		lockedNames.length > 0
			? [
					...lockedNames.flatMap((n) =>
						n.name
							.toUpperCase()
							.split(/\s+/)
							.map((word) => ({ word, name: n })),
					),
					{ word: "WOODS", name: null },
				]
			: [];

	const hoveredEntry = hoveredWordIdx !== null ? (wordEntries[hoveredWordIdx] ?? null) : null;
	const scrollToSection = useCallback((id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);
	const heroImage = CAT_IMAGES[10] ?? CAT_IMAGES[0];
	const featuredImage = CAT_IMAGES[4] ?? CAT_IMAGES[0];

	return (
		<>
			<section className="relative isolate flex min-h-[100dvh] w-full overflow-hidden border-b border-white/10">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(39,135,153,0.2),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(225,110,70,0.18),transparent_32%),linear-gradient(180deg,rgba(8,12,18,0.96),rgba(8,12,18,0.92))]" />
				<div className="absolute inset-y-0 right-0 hidden w-[42%] min-w-[22rem] lg:block">
					<CatImage
						src={heroImage}
						alt="Woods"
						containerClassName="h-full w-full"
						imageClassName="h-full w-full object-cover opacity-35"
					/>
					<div className="absolute inset-0 bg-gradient-to-l from-slate-950/25 via-slate-950/55 to-slate-950" />
				</div>

				<div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:grid-cols-[minmax(0,28rem)_1fr] lg:items-end lg:gap-16 lg:px-8">
					<div className="max-w-xl self-center">
						<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/85">
							<PawPrint className="h-3.5 w-3.5" />
							Naming Nosferatu
						</div>

						<p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
							Help choose Woods&apos;s forever name
						</p>
						<h1 className="mt-4 max-w-[12ch] font-display text-4xl leading-[0.92] text-white sm:text-5xl md:text-6xl">
							Run the bracket. Keep the chaos. Land on the name that sticks.
						</h1>
						<p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
							Browse the shortlist, lock in your favorites, and see which names survive both
							your picks and the global leaderboard.
						</p>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button size="large" className="min-w-[12rem]" onClick={() => scrollToSection("pick")}>
								Start Picking
							</Button>
							<Button
								variant="outline"
								size="large"
								className="min-w-[12rem] border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]"
								onClick={() => scrollToSection("analysis")}
							>
								See Results
							</Button>
						</div>

						<div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-lg">
							{[
								{ label: "Names in play", value: totalNameCount || "—" },
								{ label: "Locked finalists", value: lockedNames.length || "—" },
								{ label: "Your picks", value: selectedCount || "0" },
							].map((item) => (
								<div
									key={item.label}
									className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-md"
								>
									<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
										{item.label}
									</p>
									<p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
										{item.value}
									</p>
								</div>
							))}
						</div>
					</div>

					<div className="relative flex min-h-[26rem] items-end lg:min-h-[34rem]">
						<div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/55">
							<CatImage
								src={featuredImage}
								alt="Cat portrait"
								containerClassName="h-full w-full"
								imageClassName="h-full w-full object-cover opacity-75"
							/>
							<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,16,0.18),rgba(7,10,16,0.82)),radial-gradient(circle_at_top_right,rgba(225,110,70,0.24),transparent_30%)]" />
						</div>

						<div className="relative z-10 flex w-full flex-col justify-end gap-6 p-5 sm:p-8 lg:p-10">
							<div className="space-y-3">
								<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
									Current shortlist
								</p>
								<div
									className="max-w-4xl font-black uppercase leading-[0.82] tracking-[-0.04em]"
									style={{ fontSize: "clamp(2.35rem, 8vw, 7rem)" }}
								>
									{wordEntries.length > 0 ? (
										<span>
											{wordEntries.map(({ word }, i) => (
												<motion.span
													key={`${word}-${i}`}
													className="mr-3 inline-block cursor-default last:mr-0"
													onHoverStart={() => setHoveredWordIdx(i)}
													onHoverEnd={() => setHoveredWordIdx(null)}
													whileHover={{ filter: "brightness(1.22)" }}
													transition={{ duration: 0.15 }}
												>
													<span className="gradient-heading">{word}</span>
												</motion.span>
											))}
										</span>
									) : (
										<span className="text-white/15">Woods</span>
									)}
								</div>
							</div>

							<div className="max-w-xl rounded-[1.75rem] border border-white/10 bg-black/35 p-4 backdrop-blur-lg sm:p-5">
								<AnimatePresence mode="wait">
									{hoveredEntry ? (
										hoveredEntry.name ? (
											<motion.div
												key={hoveredEntry.name.name}
												className="space-y-3"
												initial={{ opacity: 0, y: 6 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -4 }}
												transition={{ duration: 0.18 }}
											>
												<div className="flex flex-wrap items-center gap-2.5">
													<span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
														Name
													</span>
													<span className="text-sm font-semibold text-white sm:text-base">
														{hoveredEntry.name.name}
													</span>
													<span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs font-semibold text-primary">
														★{" "}
														{Math.round(
															hoveredEntry.name.avgRating ??
																hoveredEntry.name.avg_rating ??
																1500,
														)}
													</span>
												</div>

												{(() => {
													const wins = hoveredEntry.name.wins ?? 0;
													const losses = hoveredEntry.name.losses ?? 0;
													const total = wins + losses;
													const winRate = total > 0 ? Math.round((wins / total) * 100) : null;
													return total > 0 ? (
														<div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
															<span className="rounded-full bg-emerald-500/12 px-2.5 py-1 font-medium text-emerald-300">
																{wins} wins
															</span>
															<span className="rounded-full bg-rose-500/12 px-2.5 py-1 font-medium text-rose-300">
																{losses} losses
															</span>
															{winRate !== null && <span>{winRate}% win rate</span>}
														</div>
													) : (
														<span className="text-xs text-white/45">No matches yet.</span>
													);
												})()}

												{hoveredEntry.name.description && (
													<p className="max-w-lg text-sm leading-relaxed text-white/65">
														{hoveredEntry.name.description}
													</p>
												)}
											</motion.div>
										) : (
											<motion.p
												key="woods"
												className="text-sm leading-relaxed text-white/65"
												initial={{ opacity: 0, y: 6 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -4 }}
												transition={{ duration: 0.18 }}
											>
												Woods stays in the mix as the surname anchor while the bracket sorts
												out the first name.
											</motion.p>
										)
									) : (
										<motion.div
											key="default"
											className="space-y-2"
											initial={{ opacity: 0, y: 6 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -4 }}
											transition={{ duration: 0.18 }}
										>
											<p className="text-sm font-medium text-white/85">
												Hover over a word to preview how it’s performing.
											</p>
											<p className="text-sm leading-relaxed text-white/60">
												Start in the picker, send your favorites into the tournament, and let
												the analysis view show what keeps winning.
											</p>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>
					</div>
				</div>
			</section>

			<Section
				id="pick"
				variant="minimal"
				padding="comfortable"
				maxWidth="xl"
				centered={true}
				separator={true}
			>
				<SectionHeading
					icon={CheckCircle}
					title="Pick Your Favorites"
					subtitle="Select the names you love, then send them into the bracket."
				/>
				<Suspense fallback={<Loading variant="skeleton" height={400} />}>
					<TournamentFlow />
				</Suspense>
			</Section>

			<Section
				id="tournament"
				variant="minimal"
				padding="comfortable"
				maxWidth="full"
				separator={true}
			>
				<SectionHeading
					icon={Trophy}
					title="Tournament Bracket"
					subtitle="Head-to-head matchups, one winner at a time."
				/>
				<Suspense fallback={<Loading variant="skeleton" height={400} />}>
					{tournament.names && tournament.names.length > 0 ? (
						<Tournament
							names={tournament.names}
							existingRatings={tournament.ratings}
							onComplete={(ratings) => {
								handleTournamentComplete(ratings);
								setTimeout(() => {
									document
										.getElementById("analysis")
										?.scrollIntoView({ behavior: "smooth", block: "start" });
								}, 800);
							}}
						/>
					) : (
						<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-6 text-center">
							<p className="text-pretty text-sm text-muted-foreground/70">
								Pick at least two names above to start the bracket.
							</p>
							<Button variant="glass" onClick={() => scrollToSection("pick")}>
								Go to Picker
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
				centered={true}
				separator={true}
			>
				<SectionHeading
					icon={BarChart3}
					title="Results and Rankings"
					subtitle="Compare your bracket with the community leaderboard and deeper stats."
				/>
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

			<Section
				id="suggest"
				variant="minimal"
				padding="comfortable"
				maxWidth="2xl"
				centered={true}
				separator={true}
			>
				<SectionHeading
					icon={Lightbulb}
					title="Suggest a Name"
					subtitle="Got a contender that deserves a shot? Add it to the pool."
				/>
				<NameSuggestionInner />
			</Section>

			<Section
				id="profile"
				variant="minimal"
				padding="comfortable"
				maxWidth="md"
				centered={true}
				separator={true}
			>
				<SectionHeading
					icon={User}
					title="Your Profile"
					subtitle="Log in to keep your ratings, preferences, and tournament history."
				/>
				<ProfileInner onLogin={(name) => login({ name })} />
			</Section>
		</>
	);
}

function AdminContent() {
	const { user: authUser, isLoading: authLoading } = useAuth();

	if (authLoading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-background">
				<Loading variant="spinner" text="Checking access..." />
			</div>
		);
	}

	if (!authUser?.isAdmin) {
		return (
			<Section id="admin" variant="minimal" padding="comfortable" maxWidth="md" centered={true}>
				<div className="flex flex-col items-center gap-4 py-10 text-center">
					<h2 className="text-3xl font-bold text-destructive">Access Denied</h2>
					<p className="text-muted-foreground">Admin access required to view this page.</p>
				</div>
			</Section>
		);
	}

	return (
		<Section id="admin" variant="minimal" padding="comfortable" maxWidth="2xl">
			<Suspense fallback={<Loading variant="skeleton" height={600} />}>
				<ErrorBoundary context={errorContexts.analysisDashboard}>
					<AdminDashboardLazy />
				</ErrorBoundary>
			</Suspense>
		</Section>
	);
}

export default App;
