import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import {
        HomeHeroSection,
        TournamentBracketSection,
} from "@/app/routes/components/HomeSections";
import { namesQueryOptions } from "@/features/names/api";
import { useTournamentHandlers } from "@/features/tournament/hooks";
import { ErrorBoundary, Loading } from "@/shared/components/layout/Feedback";
import { useMediaQuery } from "@/shared/hooks/useBrowserState";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { getLockedNames } from "@/shared/lib/names/nameFilters";
import useAppStore from "@/store/appStore";

const LazyTournament = lazy(() => import("@/features/tournament/Tournament"));
const LazyNameSuggestionInner = lazy(() =>
        import("@/features/tournament/components/NameSuggestion").then((module) => ({
                default: module.NameSuggestionInner,
        })),
);

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
        const { handleTournamentComplete, handleStartNewTournament: startNewTournament } =
                useTournamentHandlers({
                        userName: user.name,
                        tournamentActions,
                });

        const clearPendingAnalysisScroll = useCallback(() => {
                if (pendingAnalysisScrollRef.current === null) {
                        return;
                }

                window.clearTimeout(pendingAnalysisScrollRef.current);
                pendingAnalysisScrollRef.current = null;
        }, []);

        const performSectionScroll = useCallback((id: string) => {
                document
                        .getElementById(id)
                        ?.scrollIntoView({
                                behavior: prefersReducedMotion ? "auto" : "smooth",
                                block: "start",
                        });
        }, [prefersReducedMotion]);

        const scrollToSection = useCallback((id: string) => {
                clearPendingAnalysisScroll();
                performSectionScroll(id);
        }, [clearPendingAnalysisScroll, performSectionScroll]);

        const scheduleAnalysisScroll = useCallback(() => {
                clearPendingAnalysisScroll();
                pendingAnalysisScrollRef.current = window.setTimeout(() => {
                        pendingAnalysisScrollRef.current = null;
                        performSectionScroll("analysis");
                }, 800);
        }, [clearPendingAnalysisScroll, performSectionScroll]);

        const handleStartNewTournament = useCallback(() => {
                clearPendingAnalysisScroll();
                startNewTournament();
        }, [clearPendingAnalysisScroll, startNewTournament]);

        useEffect(() => clearPendingAnalysisScroll, [clearPendingAnalysisScroll]);

        return (
                <>
                        <HomeHeroSection
                                state={heroState}
                                lockedNames={lockedNames}
                                onStartPicking={() => scrollToSection("pick")}
                        />

                        <Section
                                id="pick"
                                variant="minimal"
                                padding="comfortable"
                                maxWidth="xl"

                                separator={true}
                        >
                                <SectionHeading
                                        title="Pick Your Favorites"
                                        subtitle="Tap to select."
                                />
                                <Suspense fallback={<Loading variant="skeleton" height={400} />}>
                                        <TournamentFlow />
                                </Suspense>
                        </Section>

                        <TournamentBracketSection
                                LazyTournament={LazyTournament}
                                names={tournament.names}
                                ratings={tournament.ratings}
                                onComplete={(ratings) => {
                                        handleTournamentComplete(ratings);
                                        scheduleAnalysisScroll();
                                }}
                                onGoToPicker={() => scrollToSection("pick")}
                        />

                        <Section
                                id="analysis"
                                variant="minimal"
                                padding="comfortable"
                                maxWidth="2xl"

                                separator={true}
                        >
                                <SectionHeading
                                        title="Results and Rankings"
                                        subtitle="Leaderboard and stats."
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

                                separator={true}
                        >
                                <SectionHeading
                                        title="Suggest a Name"
                                        subtitle="Add a name."
                                />
                                <Suspense fallback={<Loading variant="card-skeleton" height={340} />}>
                                        <LazyNameSuggestionInner />
                                </Suspense>
                        </Section>
                </>
        );
}
