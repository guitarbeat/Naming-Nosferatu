import { motion } from "framer-motion";
import { CheckSquare, Heart, Layers, LayoutGrid, Square } from "lucide-react";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";

interface NameSelectorToolbarProps {
	isSwipeMode: boolean;
	onSwipeModeChange: (isSwipeMode: boolean) => void;
	selectedCount: number;
	totalCount: number;
	onToggleAll: () => void;
	remainingCount?: number;
}

export function NameSelectorToolbar({
	isSwipeMode,
	onSwipeModeChange,
	selectedCount,
	totalCount,
	onToggleAll,
	remainingCount,
}: NameSelectorToolbarProps) {
	const hasSelections = selectedCount > 0;

	return (
		<div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mobile-nav-safe-top bg-foreground/[0.02] p-4 rounded-2xl border border-border/5">
			<div className="flex flex-col gap-2 w-full sm:w-auto">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-primary/10 rounded-xl">
						<Heart className="size-5 sm:size-6 text-primary fill-primary/20" />
					</div>
					<div>
						<h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
							{isSwipeMode ? "Swipe to Pick" : "Select Favorites"}
						</h3>
						<p className="text-sm text-muted-foreground/80 max-w-sm mt-0.5">
							{isSwipeMode
								? "Swipe right to keep, left to pass."
								: "Tap to select names for your tournament."}
						</p>
					</div>
				</div>
			</div>

			<div className="flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center w-full sm:w-auto gap-3 sm:gap-4">
				<SegmentedControl
					size="medium"
					value={isSwipeMode ? "swipe" : "grid"}
					onChange={(val) => onSwipeModeChange(val === "swipe")}
					options={[
						{ value: "grid", label: "Grid", icon: <LayoutGrid size={16} /> },
						{ value: "swipe", label: "Swipe", icon: <Layers size={16} /> },
					]}
				/>

				<div className="flex items-center gap-2 bg-background/50 rounded-xl p-1 border border-border/10">
					<div className="px-3 py-1.5 flex items-center gap-1.5">
						<span className="text-sm font-bold text-foreground">{selectedCount}</span>
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Selected
						</span>
					</div>

					<div className="w-px h-6 bg-border/20 mx-1" />

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.96 }}
						type="button"
						onClick={onToggleAll}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
							hasSelections
								? "bg-foreground/5 hover:bg-foreground/10 text-foreground/80"
								: "bg-primary/10 hover:bg-primary/20 text-primary"
						}`}
					>
						{hasSelections ? (
							<>
								<Square size={16} />
								<span>Clear</span>
							</>
						) : (
							<>
								<CheckSquare size={16} />
								<span>All</span>
							</>
						)}
					</motion.button>
				</div>
			</div>
		</div>
	);
}
