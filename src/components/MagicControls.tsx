import { Suspense, useEffect } from "react";
import { Loading } from "@/components/UiPrimitives";
import { useSectionScroll } from "@/hooks/useCommonHooks";
import { TournamentSetup } from "@/tournament/TournamentSetup";
import { MagicSearch } from "./ui/MagicSearch";
import { MagicToggle } from "./ui/MagicToggle";
import { MagicToolbar, type MagicToolbarProps } from "./ui/MagicToolbar";

export { MagicSearch, MagicToggle, MagicToolbar, type MagicToolbarProps };

/* ==========================================================================
   HOME VIEW
   ========================================================================== */

export function HomeView() {
	const { scrollToSection, clearPendingScroll } = useSectionScroll();

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

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	return (
		<div className="w-full min-h-[100vh] flex flex-col relative overflow-hidden">
			<Suspense fallback={<Loading variant="skeleton" height={400} />}>
				<TournamentSetup />
			</Suspense>
		</div>
	);
}
