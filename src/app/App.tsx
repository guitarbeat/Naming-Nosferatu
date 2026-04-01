/**
 * @module App
 * @description Main application component with consolidated routing and layout.
 * Routes, auth, and layout are now coordinated here.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { Suspense, useCallback, useEffect, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { useAuth } from "@/app/providers/Providers";
import { NameSuggestionInner } from "@/features/tournament/components/NameSuggestion";
import { useTournamentHandlers } from "@/features/tournament/hooks";
import Tournament from "@/features/tournament/Tournament";
import { AppLayout, Button, ErrorBoundary, Loading, Section } from "@/shared/components";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { useOfflineSync } from "@/shared/hooks";
import { ChevronDown, Lightbulb } from "@/shared/lib/icons";
import {
        cleanupPerformanceMonitoring,
        initializePerformanceMonitoring,
} from "@/shared/lib/performance";
import { ErrorManager } from "@/shared/services/errorManager";
import { updateSupabaseUserContext } from "@/shared/services/supabase/runtime";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";
import { getLockedNames } from "@/shared/lib/basic";
import { namesQueryOptions } from "@/features/names/queries";

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
        const namesQuery = useQuery(namesQueryOptions(true));
        const lockedNames = getLockedNames(namesQuery.data?.names);
        const nameDisplay =
                lockedNames.length > 0
                        ? lockedNames.map((n) => n.name.toUpperCase()).join(" ") + " WOODS"
                        : null;

        return (
                <>
                        {/* Hero — bleeds edge-to-edge, full viewport height */}
                        <section className="relative -mx-3 -mt-4 flex min-h-[100dvh] w-[calc(100%+1.5rem)] flex-col items-center justify-center overflow-hidden px-6 text-center sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)] md:-mt-10">
                                {/* Radial glow behind name */}
                                <div
                                        className="pointer-events-none absolute inset-0 -z-10"
                                        aria-hidden="true"
                                >
                                        <div className="absolute left-1/2 top-1/2 h-[60vw] w-[80vw] max-h-[500px] max-w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />
                                </div>

                                {/* Label */}
                                <p className="mb-5 text-base font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:text-lg md:text-xl">
                                        My cat's name is
                                </p>

                                {/* Decorative line */}
                                <div className="mb-6 h-px w-16 bg-gradient-to-r from-transparent via-border to-transparent" />

                                {/* Name */}
                                <h1
                                        className="font-black uppercase leading-[0.9] tracking-tighter"
                                        style={{ fontSize: "clamp(2.6rem, 9vw, 9rem)" }}
                                >
                                        {nameDisplay ? (
                                                <span className={GRADIENT_HEADING_CLS}>{nameDisplay}</span>
                                        ) : (
                                                <span className="text-foreground/15">________</span>
                                        )}
                                </h1>

                                {/* Subtitle */}
                                <p className="mt-10 max-w-sm text-sm leading-relaxed text-muted-foreground/70 sm:max-w-md sm:text-base">
                                        I'm indecisive — so I'm still considering the names below. Scroll down, pick your favorites from the top contenders, and help me make up my mind!
                                </p>

                                {/* Scroll hint */}
                                <div className="absolute bottom-10 flex flex-col items-center gap-2 text-muted-foreground/40">
                                        <span className="text-[9px] uppercase tracking-[0.3em]">scroll</span>
                                        <ChevronDown className="h-4 w-4 animate-bounce" />
                                </div>
                        </section>

                        <Section id="pick" variant="minimal" padding="compact" maxWidth="xl" centered={true}>
                                <Suspense fallback={<Loading variant="skeleton" height={400} />}>
                                        <TournamentFlow />
                                </Suspense>
                        </Section>

                        <Section id="suggest" variant="minimal" padding="comfortable" maxWidth="lg" centered={true}>
                                <SectionHeading
                                        icon={Lightbulb}
                                        title="Suggest a Name"
                                        subtitle="Got a great cat name? Share it with the community"
                                />
                                <NameSuggestionInner />
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
