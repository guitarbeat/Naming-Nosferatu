/**
 * @module App
 * @description Main application component with consolidated routing and layout.
 * Routes, auth, and layout are now coordinated here.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { useAuth } from "@/app/providers/Providers";
import { useTournamentHandlers } from "@/features/tournament/hooks";
import Tournament from "@/features/tournament/Tournament";
import { AppLayout, Button, ErrorBoundary, Loading, Section } from "@/shared/components";
import { useOfflineSync } from "@/shared/hooks";
import { ChevronDown } from "@/shared/lib/icons";
import {
        cleanupPerformanceMonitoring,
        initializePerformanceMonitoring,
} from "@/shared/lib/performance";
import { ErrorManager } from "@/shared/services/errorManager";
import { updateSupabaseUserContext } from "@/shared/services/supabase/runtime";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";
import { getLockedNames } from "@/shared/lib/basic";
import { namesQueryOptions } from "@/features/names/queries";
import { NameSuggestionInner } from "@/features/tournament/components/NameSuggestion";
import { ProfileInner } from "@/shared/components/profile/ProfileInner";

const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;
const AdminDashboardLazy = routeComponents.AdminDashboardLazy;

function App() {
        const { user: authUser, isLoading } = useAuth();
        const isInitialized = !isLoading;
        const { userActions } = useAppStore();
        const location = useLocation();
        const { pathname } = location;

        // Sync auth user with store
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
        useOfflineSync();

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
                                <Route
                                        path="/tournament"
                                        element={
                                                <ErrorBoundary context={errorContexts.tournamentFlow}>
                                                        <TournamentContent />
                                                </ErrorBoundary>
                                        }
                                />
                                <Route path="/analysis" element={<AnalysisContent />} />
                                <Route path="/admin" element={<AdminContent />} />
                        </Routes>
                </AppLayout>
        );
}

const GRADIENT_HEADING_CLS =
        "font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase tracking-tighter";

function HomeContent() {
	const { login } = useAuth();
	const namesQuery = useQuery(namesQueryOptions(true));
        const lockedNames = getLockedNames(namesQuery.data?.names);
        const [hoveredWordIdx, setHoveredWordIdx] = useState<number | null>(null);

        // Build word list and a parallel map back to the source NameItem (null for "WOODS")
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

        return (
                <>
                        {/* Hero — bleeds edge-to-edge, full viewport height */}
			<section className="relative -mx-3 -mt-4 flex min-h-[100dvh] w-[calc(100%+1.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)] sm:px-8 md:-mt-10 md:px-12">
				{/* Radial glow behind name */}
				<div
					className="pointer-events-none absolute inset-0 -z-10"
					aria-hidden="true"
				>
					<div className="absolute left-1/2 top-1/2 h-[60vw] w-[80vw] max-h-[500px] max-w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />
				</div>

				{/* Label */}
				<p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:mb-5 sm:text-base md:text-lg">
					My cat's name is
				</p>

				{/* Decorative line */}
				<div className="mb-3 h-px w-12 bg-gradient-to-r from-transparent via-border to-transparent sm:mb-6 sm:w-16" />

				{/* Name — fluid sizing that respects container padding */}
				<h1
					className="max-w-full font-black uppercase leading-[0.85] tracking-tighter"
					style={{ fontSize: "clamp(1.75rem, 9vw, 9rem)" }}
				>
                                        {wordEntries.length > 0 ? (
                                                <span>
                                                        {wordEntries.map(({ word }, i) => (
                                                                /*
                                                                 * Two-span pattern: filter on the outer motion.span,
                                                                 * bg-clip-text on the inner span. Applying filter
                                                                 * directly to a bg-clip-text element makes text
                                                                 * disappear in Chrome/Safari.
                                                                 */
                                                                <motion.span
                                                                        key={`${word}-${i}`}
                                                                        className="block sm:inline-block cursor-default"
                                                                        onHoverStart={() => setHoveredWordIdx(i)}
                                                                        onHoverEnd={() => setHoveredWordIdx(null)}
                                                                        whileHover={{ filter: "brightness(1.25)" }}
                                                                        transition={{ duration: 0.15 }}
                                                                >
                                                                        <span className={GRADIENT_HEADING_CLS}>
                                                                                {i < wordEntries.length - 1
                                                                                        ? `${word}\u00a0`
                                                                                        : word}
                                                                        </span>
                                                                </motion.span>
                                                        ))}
                                                </span>
                                        ) : (
                                                <span className="text-foreground/15">________</span>
                                        )}
                                </h1>

                                {/* Subtitle — swaps to a stats card when hovering a name word */}
				<div className="mt-6 flex min-h-[3.5rem] items-center justify-center sm:mt-10 sm:min-h-[4.5rem]">
					<AnimatePresence mode="wait">
						{!hoveredEntry ? (
							<motion.p
								key="default"
								className="max-w-[85vw] text-xs leading-relaxed text-muted-foreground/70 sm:max-w-md sm:text-base"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.18 }}
							>
								I'm indecisive — scroll down, pick your favorites, and help me decide!
                                                        </motion.p>
                                                ) : !hoveredEntry.name ? (
                                                        <motion.p
                                                                key="woods"
                                                                className="text-sm italic text-muted-foreground/60"
                                                                initial={{ opacity: 0, y: 6 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -4 }}
                                                                transition={{ duration: 0.18 }}
                                                        >
                                                                Woods — the surname every great cat deserves.
                                                        </motion.p>
                                                ) : (
                                                        <motion.div
                                                                key={hoveredEntry.name.name}
                                                                className="flex flex-col items-center gap-2.5"
                                                                initial={{ opacity: 0, y: 6 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -4 }}
                                                                transition={{ duration: 0.18 }}
                                                        >
                                                                {/* Name + rating badge */}
                                                                <div className="flex items-center gap-2.5">
                                                                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
                                                                                name
                                                                        </span>
                                                                        <span className="text-sm font-bold text-foreground">
                                                                                {hoveredEntry.name.name}
                                                                        </span>
                                                                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
                                                                                ★{" "}
                                                                                {Math.round(
                                                                                        hoveredEntry.name.avgRating ??
                                                                                                hoveredEntry.name.avg_rating ??
                                                                                                1500,
                                                                                )}
                                                                        </span>
                                                                </div>

                                                                {/* Win / loss pills */}
                                                                {(() => {
                                                                        const wins = hoveredEntry.name.wins ?? 0;
                                                                        const losses = hoveredEntry.name.losses ?? 0;
                                                                        const total = wins + losses;
                                                                        const winRate =
                                                                                total > 0 ? Math.round((wins / total) * 100) : null;
                                                                        return total > 0 ? (
                                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                                                                                        <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 font-medium text-green-400">
                                                                                                {wins}W
                                                                                        </span>
                                                                                        <span className="text-muted-foreground/30">/</span>
                                                                                        <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 font-medium text-red-400">
                                                                                                {losses}L
                                                                                        </span>
                                                                                        {winRate !== null && (
                                                                                                <span className="ml-1 text-muted-foreground/50">
                                                                                                        {winRate}% win rate
                                                                                                </span>
                                                                                        )}
                                                                                </div>
                                                                        ) : (
                                                                                <span className="text-xs text-muted-foreground/40">
                                                                                        no matches yet
                                                                                </span>
                                                                        );
                                                                })()}

                                                                {/* Description */}
                                                                {hoveredEntry.name.description && (
                                                                        <p className="max-w-xs text-center text-xs italic text-muted-foreground/50">
                                                                                {hoveredEntry.name.description}
                                                                        </p>
                                                                )}
                                                        </motion.div>
                                                )}
                                        </AnimatePresence>
                                </div>

                                {/* Scroll hint — cascading chevrons */}
                                <motion.div
                                        className="absolute bottom-8 flex flex-col items-center gap-3"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.2, duration: 0.8 }}
                                >
                                        <motion.span
                                                className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground/35"
                                                animate={{ opacity: [0.35, 0.7, 0.35] }}
                                                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                                scroll
                                        </motion.span>
                                        <div className="flex flex-col items-center -gap-1">
                                                {[0, 1, 2].map((i) => (
                                                        <motion.div
                                                                key={i}
                                                                animate={{
                                                                        opacity: [0, 1, 0],
                                                                        y: [0, 5, 10],
                                                                }}
                                                                transition={{
                                                                        duration: 1.4,
                                                                        repeat: Infinity,
                                                                        delay: i * 0.22,
                                                                        ease: "easeInOut",
                                                                }}
                                                        >
                                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                        </motion.div>
                                                ))}
                                        </div>
                                </motion.div>
                        </section>

		<Section id="pick" variant="minimal" padding="compact" maxWidth="xl" centered={true}>
				<Suspense fallback={<Loading variant="skeleton" height={400} />}>
					<TournamentFlow />
				</Suspense>
			</Section>

		<Section id="suggest" variant="minimal" padding="comfortable" maxWidth="2xl" centered={true}>
			<SectionHeading icon={Lightbulb} title="Suggest a Name" subtitle="Have a great cat name idea? Share it!" />
			<NameSuggestionInner />
		</Section>

		<Section id="profile" variant="minimal" padding="comfortable" maxWidth="md" centered={true}>
			<SectionHeading icon={User} title="Your Profile" subtitle="Log in to track your ratings and preferences" />
			<ProfileInner onLogin={(name) => login({ name })} />
		</Section>
		</>
	);
}

function TournamentContent() {
        const { user, tournament, tournamentActions } = useAppStore();
        const navigate = useNavigate();
        const { handleTournamentComplete } = useTournamentHandlers({
                userName: user.name,
                tournamentActions,
        });

        return (
                <Section id="tournament" variant="minimal" padding="compact" maxWidth="full">
                        <Suspense fallback={<Loading variant="skeleton" height={400} />}>
                                {tournament.names && tournament.names.length > 0 ? (
                                        <Tournament
                                                names={tournament.names}
                                                existingRatings={tournament.ratings}
                                                onComplete={handleTournamentComplete}
                                        />
                                ) : (
                                        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-10 text-center">
                                                <h2 className={`text-2xl sm:text-3xl ${GRADIENT_HEADING_CLS}`}>
                                                        No contenders yet
                                                </h2>
                                                <p className="text-muted-foreground text-pretty">
                                                        Choose at least two names in the picker to start your tournament bracket.
                                                </p>
                                                <div className="flex flex-wrap items-center justify-center gap-3">
                                                        <Button variant="glass" onClick={() => navigate("/")}>
                                                                Go to Name Picker
                                                        </Button>
                                                        <Button variant="glass" onClick={() => navigate("/analysis")}>
                                                                View Analysis
                                                        </Button>
                                                </div>
                                        </div>
                                )}
                        </Suspense>
                </Section>
        );
}

function AnalysisContent() {
	const { user, tournament, tournamentActions } = useAppStore();
	const { handleStartNewTournament } = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	return (
		<Section id="analysis" variant="minimal" padding="comfortable" maxWidth="2xl" centered={true}>
			<h2 className={`mb-8 text-center text-3xl sm:mb-12 md:text-5xl ${GRADIENT_HEADING_CLS}`}>
				The Victors Emerge
			</h2>
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
