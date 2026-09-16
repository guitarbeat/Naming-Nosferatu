import { Gamepad2, Layers } from "lucide-react";
import { memo } from "react";

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
				style={{ transform: `translateX(${viewMode === "tree" ? "2px" : "calc(100% - 2px)"})` }}
			/>
			<button
				type="button"
				onClick={() => setViewMode("tree")}
				aria-pressed={viewMode === "tree"}
				className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
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
				className={`relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
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
