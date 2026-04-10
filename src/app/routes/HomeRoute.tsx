import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback } from "react";
import { errorContexts, routeComponents } from "@/app/appConfig";
import { useAuth } from "@/app/providers/Providers";
import { HomeHeroSection } from "@/app/routes/components/HomeHeroSection";
import { TournamentBracketSection } from "@/app/routes/components/TournamentBracketSection";
import { namesQueryOptions } from "@/features/names/queries";
import { useTournamentHandlers } from "@/features/tournament/hooks";
import { ErrorBoundary, Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { getLockedNames } from "@/shared/lib/basic";
import { BarChart3, CheckCircle, Lightbulb, User } from "@/shared/lib/icons";
import useAppStore from "@/store/appStore";

const LazyTournament = lazy(() => import("@/features/tournament/Tournament"));
const LazyNameSuggestionInner = lazy(() =>
	import("@/features/tournament/components/NameSuggestion").then((module) => ({
		default: module.NameSuggestionInner,
	})),
);
const LazyProfileInner = lazy(() =>
	import("@/shared/components/profile/ProfileInner").then((module) => ({
		default: module.ProfileInner,
	})),
);

const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;

export default function HomeRoute() {
	const { login } = useAuth();
	const { user, tournament, tournamentActions } = useAppStore();
	const namesQuery = useQuery(namesQueryOptions(user.isAdmin));
	const lockedNames = getLockedNames(namesQuery.data?.names);
	const totalNameCount = namesQuery.data?.names?.length ?? 0;
	const selectedCount = tournament.selectedNames?.length ?? 0;
	const { handleTournamentComplete, handleStartNewTournament } = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	const scrollToSection = useCallback((id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
	}, []);

	return (
		<>
			<HomeHeroSection
				lockedNames={lockedNames}
				selectedCount={selectedCount}
				totalNameCount={totalNameCount}
				onStartPicking={() => scrollToSection("pick")}
				onSeeResults={() => scrollToSection("analysis")}
			/>

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

			<TournamentBracketSection
				LazyTournament={LazyTournament}
				names={tournament.names}
				ratings={tournament.ratings}
				onComplete={(ratings) => {
					handleTournamentComplete(ratings);
					setTimeout(() => {
						document
							.getElementById("analysis")
							?.scrollIntoView({ behavior: "smooth", block: "start" });
					}, 800);
				}}
				onGoToPicker={() => scrollToSection("pick")}
			/>

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
				<Suspense fallback={<Loading variant="card-skeleton" height={340} />}>
					<LazyNameSuggestionInner />
				</Suspense>
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
				<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
					<LazyProfileInner onLogin={(name) => login({ name })} />
				</Suspense>
			</Section>
		</>
	);
}
