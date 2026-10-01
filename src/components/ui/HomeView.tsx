import React, { Suspense, useCallback, useEffect } from "react";
import { Loading } from "@/components/LayoutBlocks";
import { TournamentStatusWidget } from "@/components/ui/TournamentStatusWidget";
import { useSectionScroll } from "@/hooks";
import useAppStore, { useActiveTournamentStatus } from "@/store";

// ⚡ Bolt: lazy-load heavy TournamentSetup (WebGL/framer children) out of initial bundle
const TournamentSetup = React.lazy(() =>
	import("@/tournament/TournamentSetup").then((m) => ({ default: m.TournamentSetup })),
);

export function HomeView() {
	const { hasActiveTournament, namesCount } = useActiveTournamentStatus();
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

	return (
		<div
			className={
				hasActiveTournament
					? "w-full flex flex-col items-center"
					: "w-full h-[100dvh] min-h-[100dvh] flex flex-col relative overflow-hidden"
			}
		>
			{hasActiveTournament ? (
				<div
					id="app-flow"
					className="w-full flex flex-col items-center gap-10 sm:gap-14 py-4 sm:py-6 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto"
				>
					<section id="pick" className="w-full scroll-mt-20 sm:scroll-mt-24">
						<div id="tournament" className="scroll-mt-20 sm:scroll-mt-24" />
						<div id="contenders" className="scroll-mt-20 sm:scroll-mt-24" />
						<TournamentStatusWidget
							namesCount={namesCount}
							onRestart={handleStartNewTournament}
						/>
						<div className="w-full min-h-[480px] flex flex-col flex-1">
							<Suspense fallback={<Loading variant="skeleton" height={400} />}>
								<TournamentSetup />
							</Suspense>
						</div>
					</section>
				</div>
			) : (
				<Suspense fallback={<Loading variant="skeleton" height={400} />}>
					<TournamentSetup />
				</Suspense>
			)}
		</div>
	);
}
