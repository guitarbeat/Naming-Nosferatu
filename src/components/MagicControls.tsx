import { Gamepad2, Layers, Search, X } from "lucide-react";
import { memo, Suspense, useCallback, useEffect, useRef } from "react";
import { Loading } from "@/components/AppChrome";
import { useSectionScroll } from "@/hooks";
import useAppStore, { useActiveTournamentStatus } from "@/store";
import { TournamentSetup, TournamentStatusWidget } from "@/tournament/TournamentViews";

/* ==========================================================================
   MAGIC SEARCH
   ========================================================================== */

interface MagicSearchProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
}

export const MagicSearch = memo(function MagicSearch({
	searchQuery,
	setSearchQuery,
}: MagicSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClear = () => {
		setSearchQuery("");
		inputRef.current?.focus();
	};

	return (
		<div className="relative group flex-1 sm:flex-none">
			<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" />
			<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary z-10" />
			<input
				ref={inputRef}
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				placeholder="Find cat in bracket..."
				aria-label="Search bracket"
				className="h-8 w-full sm:w-48 rounded-xl border border-white/25 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-300 focus:w-full sm:focus:w-56"
			/>
			{searchQuery && (
				<button
					type="button"
					onClick={handleClear}
					aria-label="Clear search"
					title="Clear search"
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
				>
					<X className="size-3" />
				</button>
			)}
		</div>
	);
});

/* ==========================================================================
   MAGIC TOGGLE
   ========================================================================== */

interface MagicToggleProps {
	viewMode: "tree" | "cards";
	setViewMode: (mode: "tree" | "cards") => void;
}

export const MagicToggle = memo(function MagicToggle({ viewMode, setViewMode }: MagicToggleProps) {
	return (
		<div
			className="inline-flex rounded-xl border border-white/20 dark:border-white/10 bg-white/25 dark:bg-white/5 backdrop-blur-md p-0.5 text-xs relative overflow-hidden"
			role="group"
			aria-label="View mode"
		>
			<div
				className="absolute top-0.5 bottom-0.5 w-[50%] rounded-lg bg-card text-foreground shadow-xs font-semibold transition-transform duration-300 ease-spring"
				style={{
					transform: `translateX(${viewMode === "tree" ? "2px" : "calc(100% - 2px)"})`,
				}}
			/>
			<button
				type="button"
				onClick={() => setViewMode("tree")}
				aria-pressed={viewMode === "tree"}
				className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
					viewMode === "tree"
						? "text-foreground font-semibold"
						: "text-muted-foreground hover:text-foreground"
				}`}
			>
				<Layers className="size-3.5" />
				<span>Tree Flow</span>
			</button>
			<button
				type="button"
				onClick={() => setViewMode("cards")}
				aria-pressed={viewMode === "cards"}
				className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
					viewMode === "cards"
						? "text-foreground font-semibold"
						: "text-muted-foreground hover:text-foreground"
				}`}
			>
				<Gamepad2 className="size-3.5" />
				<span>Rounds List</span>
			</button>
		</div>
	);
});

/* ==========================================================================
   MAGIC TOOLBAR
   ========================================================================== */

export interface MagicToolbarProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	viewMode: "tree" | "cards";
	setViewMode: (mode: "tree" | "cards") => void;
}

export const MagicToolbar = memo(function MagicToolbar({
	searchQuery,
	setSearchQuery,
	viewMode,
	setViewMode,
}: MagicToolbarProps) {
	return (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
			<MagicToggle viewMode={viewMode} setViewMode={setViewMode} />
			<div className="hidden sm:block w-px h-6 bg-border/40" />
			<MagicSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
		</div>
	);
});

/* ==========================================================================
   HOME VIEW
   ========================================================================== */

export function HomeView() {
	const { hasActiveTournament, namesCount } = useActiveTournamentStatus();
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const { scrollToSection, scheduleSectionScroll, clearPendingScroll } = useSectionScroll();

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
		if (
			window.confirm(
				"Are you sure you want to restart the tournament? Your current progress will be lost.",
			)
		) {
			clearPendingScroll();
			tournamentActions.resetTournament();
			scheduleSectionScroll("pick");
		}
	}, [clearPendingScroll, tournamentActions, scheduleSectionScroll]);

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	return (
		<div
			className={
				hasActiveTournament
					? "w-full flex flex-col items-center"
					: "w-full min-h-[100vh] flex flex-col relative overflow-hidden"
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
						<TournamentStatusWidget namesCount={namesCount} onRestart={handleStartNewTournament} />
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
