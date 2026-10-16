import { Search, X } from "lucide-react";
import { memo, useEffect, useRef } from "react";

interface MagicSearchProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
}

export const MagicSearch = memo(function MagicSearch({
	searchQuery,
	setSearchQuery,
}: MagicSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	// 🎨 Palette: Add keyboard shortcut listener for global search
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
				aria-keyshortcuts="/"
				className="h-8 w-full sm:w-48 rounded-xl border border-white/25 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-300 focus:w-full sm:focus:w-56"
			/>
			{!searchQuery && (
				<div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
					<kbd
						className="inline-flex h-4 items-center rounded border border-border/50 bg-muted/30 px-1.5 font-mono text-[9px] font-medium text-muted-foreground/70"
						aria-hidden="true"
					>
						/
					</kbd>
				</div>
			)}
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
