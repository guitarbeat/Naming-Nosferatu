import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import {
	HomeAnalysisSection,
	HomeHeroSection,
	HomePickSection,
	HomeTournamentSection,
} from "@/app/routes/components/HomeSections";
import { namesQueryOptions } from "@/shared/api/names/api";

import { useSectionScroll } from "@/shared/hooks/useSectionScroll";
import { getLockedNames } from "@/shared/lib/names/nameFilters";
import useAppStore from "@/store/appStore";

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

	const scheduleAnalysisScroll = useCallback(() => {
		scheduleSectionScroll("analysis");
	}, [scheduleSectionScroll]);

	const handleStartNewTournament = useCallback(() => {
		clearPendingScroll();
		tournamentActions.resetTournament();
	}, [clearPendingScroll, tournamentActions]);

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	return (
		<>
			<HomeHeroSection
				state={heroState}
				lockedNames={lockedNames}
				onStartPicking={() => scrollToSection("pick")}
			/>

			<HomePickSection />

			<HomeTournamentSection
				tournament={tournament}
				tournamentActions={tournamentActions}
				scheduleAnalysisScroll={scheduleAnalysisScroll}
				scrollToSection={scrollToSection}
			/>

			<HomeAnalysisSection
				tournament={tournament}
				tournamentActions={tournamentActions}
				user={user}
				handleStartNewTournament={handleStartNewTournament}
			/>
		</>
	);
}
