import { MousePointerClick, Play, RotateCcw, Trophy, Undo2, X } from "lucide-react";
import { memo } from "react";
import type { useTournamentState } from "@/hooks/useTournamentState";

interface TournamentDockProps {
	isTournamentActive: boolean;
	ts: ReturnType<typeof useTournamentState>;
	championInfo?: { label: string; memberIds: Set<string> };
	selectedCount: number;
	canStartCustom: boolean;
	onClearSelection: () => void;
	onExitTournament: () => void;
	onUndoMove: () => void;
	onStartSelected: () => void;
}

export const TournamentDock = memo(function TournamentDock({
	isTournamentActive,
	ts,
	championInfo,
	selectedCount,
	canStartCustom,
	onClearSelection,
	onExitTournament,
	onUndoMove,
	onStartSelected,
}: TournamentDockProps) {
	if (isTournamentActive) {
		return (
			<div className="flex w-full items-center justify-between gap-3 sm:gap-4">
				<div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
					<span className="font-display text-sm sm:text-base font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
						Name Nosferatu
					</span>
					<span className="text-foreground/25 font-light" aria-hidden="true">
						&middot;
					</span>
					<div className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap truncate">
						{ts.isComplete ? (
							<span className="inline-flex items-center gap-1.5 font-semibold text-primary">
								<Trophy className="size-3.5" />
								<span>Champion: {championInfo?.label || "Complete"}</span>
							</span>
						) : (
							<span className="font-mono text-xs font-medium text-foreground/75 tabular-nums">
								Round {ts.round} &middot; Match {ts.matchNumber}/{ts.totalMatches}
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
					{ts.isComplete ? (
						<>
							{selectedCount > 0 && (
								<button
									type="button"
									onClick={onClearSelection}
									className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-full border border-foreground/15 bg-foreground/6 px-2.5 sm:px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/12 hover:text-foreground active:scale-95 whitespace-nowrap shrink-0"
									aria-label="Clear selected names"
								>
									<X className="size-3" />
									<span>Clear</span>
								</button>
							)}
							<button
								type="button"
								onClick={onExitTournament}
								className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full bg-primary px-3 sm:px-3.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-95 whitespace-nowrap shrink-0"
								aria-label="Start a new bracket"
							>
								<RotateCcw className="size-3" />
								<span>New Bracket</span>
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={onUndoMove}
								disabled={!ts.canUndo}
								className={`inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full border px-2.5 sm:px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
									ts.canUndo
										? "border-foreground/15 bg-foreground/6 text-foreground/80 hover:bg-foreground/12 hover:text-foreground active:scale-95"
										: "cursor-not-allowed border-foreground/5 bg-foreground/2 text-foreground/25"
								}`}
								aria-label="Undo last vote"
							>
								<Undo2 className="size-3" />
								<span className="hidden sm:inline">Undo</span>
							</button>

							<button
								type="button"
								onClick={onExitTournament}
								className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 sm:px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 active:scale-95 whitespace-nowrap shrink-0"
								aria-label="Exit tournament"
							>
								<X className="size-3" />
								<span>Exit</span>
							</button>
						</>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex w-full items-center justify-between gap-3 sm:gap-4">
			<div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
				{selectedCount === 0 ? (
					<div className="flex items-center gap-2 min-w-0">
						<span className="hidden sm:inline font-display text-sm sm:text-base font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
							Name Nosferatu
						</span>
						<span
							className="hidden sm:inline text-foreground/25 font-light shrink-0"
							aria-hidden="true"
						>
							&middot;
						</span>
						<span className="text-xs sm:text-sm text-foreground/80 font-medium truncate flex items-center gap-1.5">
							<MousePointerClick className="size-3.5 text-primary shrink-0" />
							<span>Click names or drag to select</span>
						</span>
					</div>
				) : (
					<>
						<span className="font-display text-sm sm:text-base font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
							Name Nosferatu
						</span>
						<span className="text-foreground/25 font-light" aria-hidden="true">
							&middot;
						</span>
						<span className="font-mono text-xs font-bold tabular-nums text-primary">
							{selectedCount} selected
						</span>
						{selectedCount === 1 && (
							<span className="hidden md:inline text-xs text-foreground/45 font-normal">
								(pick 1 more to duel)
							</span>
						)}
					</>
				)}
			</div>

			<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
				{selectedCount > 0 && (
					<button
						type="button"
						onClick={onClearSelection}
						className="inline-flex h-8 sm:h-9 items-center gap-1 rounded-full border border-foreground/15 bg-foreground/6 px-2.5 sm:px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/12 hover:text-foreground active:scale-95 whitespace-nowrap shrink-0"
						aria-label="Clear selected names"
					>
						<X className="size-3" />
						<span>Clear</span>
					</button>
				)}

				{canStartCustom && (
					<button
						type="button"
						onClick={onStartSelected}
						className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full bg-primary px-3 sm:px-4 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-95 whitespace-nowrap shrink-0"
					>
						<Play className="size-3 fill-current" />
						<span>Start</span>
						<span className="font-mono tabular-nums opacity-90">&middot; {selectedCount}</span>
					</button>
				)}
			</div>
		</div>
	);
});
