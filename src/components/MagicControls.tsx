import { Gamepad2, Layers, Search, X } from "lucide-react";
import { memo, Suspense, useEffect, useRef } from "react";
import { Loading } from "@/components/UiPrimitives";
import { useSectionScroll } from "@/hooks/useCommonHooks";
import { TournamentSetup } from "@/tournament/TournamentSetup";

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

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === "/" &&
				document.activeElement?.tagName !== "INPUT" &&
				document.activeElement?.tagName !== "TEXTAREA"
			) {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="relative group flex-1 sm:flex-none">
			<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary z-10" />
			<input
				ref={inputRef}
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				placeholder="Find cat in bracket..."
				aria-label="Search bracket"
				aria-keyshortcuts="/"
				className="h-8 w-full sm:w-48 rounded-xl border border-border/60 bg-white/40 dark:bg-black/40 backdrop-blur-md pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 focus:w-full sm:focus:w-56"
			/>
			{!searchQuery && (
				<kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none rounded border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground select-none">
					/
				</kbd>
			)}
			{searchQuery && (
				<button
					type="button"
					onClick={handleClear}
					aria-label="Clear search"
					title="Clear search"
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full p-0.5 transition-colors"
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
			className="inline-flex rounded-xl border border-border/50 bg-white/25 dark:bg-white/5 backdrop-blur-md p-0.5 text-xs relative overflow-hidden"
			role="group"
			aria-label="View mode"
		>
			<div
				className="absolute top-0.5 bottom-0.5 w-[50%] rounded-lg bg-card text-foreground shadow-xs font-semibold transition-transform duration-200 ease-spring"
				style={{
					transform: `translateX(${viewMode === "tree" ? "2px" : "calc(100% - 2px)"})`,
				}}
			/>
			<button
				type="button"
				onClick={() => setViewMode("tree")}
				aria-pressed={viewMode === "tree"}
				className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap shrink-0 ${
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
				className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap shrink-0 ${
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
