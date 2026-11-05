import { Clock, Flame, Gamepad2, Layers, Undo2, X } from "lucide-react";
import { memo, useMemo } from "react";
import { getHeatTextClasses, type HeatLevel } from "@/tournament/tournamentEngine";

/* ==========================================================================
   BRACKET PATH PILL BAR & TOURNAMENT HEADER
   ========================================================================== */

function getRoundCaption(stageRound: number, totalRounds: number): string {
	if (stageRound === totalRounds) {
		return "Final";
	}
	if (stageRound === totalRounds - 1) {
		return "Semi";
	}
	if (stageRound === totalRounds - 2) {
		return "Quarter";
	}
	return `R${stageRound}`;
}

export function BracketTree({
	round,
	totalRounds,
	onOpenBracket,
}: {
	round: number;
	totalRounds: number;
	onOpenBracket?: () => void;
}) {
	const rounds = useMemo(
		() => Array.from({ length: Math.max(1, totalRounds) }, (_, i) => i + 1),
		[totalRounds],
	);
	const stageFlavor =
		round >= totalRounds
			? "Finals"
			: totalRounds - round === 1
				? "Semifinals"
				: round <= 2
					? "Preliminary Rounds"
					: "Middle Rounds";

	const content = (
		<div className="flex items-center gap-1 overflow-x-auto pb-1">
			{rounds.map((stageRound, index) => {
				const isDone = stageRound < round;
				const isActive = stageRound === round;
				const tone = isActive
					? "border-primary/70 bg-primary/20 text-primary"
					: isDone
						? "border-secondary/60 bg-secondary/20 text-foreground"
						: "border-border/20 bg-foreground/5 text-muted-foreground";
				return (
					<div key={`bracket-round-${stageRound}`} className="flex items-center gap-1">
						<div className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${tone}`}>
							{getRoundCaption(stageRound, totalRounds)}
						</div>
						{index < rounds.length - 1 && (
							<div
								className={`h-[1px] w-4 sm:w-6 ${
									isDone ? "bg-secondary" : isActive ? "bg-primary/70" : "bg-border/20"
								}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);

	if (onOpenBracket) {
		return (
			<button
				type="button"
				onClick={onOpenBracket}
				className="w-full text-left rounded-xl border border-border/20 bg-foreground/[0.03] px-3 py-2 transition-colors cursor-pointer hover:border-primary/40 hover:bg-foreground/[0.06] group/bracket focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
				title="Click to view full interactive tournament bracket"
				aria-label="Open full interactive tournament bracket"
			>
				<div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
					<span className="flex items-center gap-1.5 font-medium">
						<Layers className="size-3 text-primary" />
						<span>Bracket Path</span>
						<span className="text-[10px] text-primary opacity-0 group-hover/bracket:opacity-100 transition-opacity">
							(Expand)
						</span>
					</span>
					<span>{stageFlavor}</span>
				</div>
				{content}
			</button>
		);
	}

	return (
		<div className="rounded-xl border border-border/20 bg-foreground/[0.03] px-3 py-2">
			<div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
				<span className="flex items-center gap-1.5 font-medium">
					<Layers className="size-3 text-primary" />
					<span>Bracket Path</span>
				</span>
				<span>{stageFlavor}</span>
			</div>
			{content}
		</div>
	);
}

export interface TournamentHeaderProps {
	roundNumber: number;
	totalRounds: number;
	bracketStage: string;
	tournamentMode: string;
	currentMatchNumber: number;
	totalMatches: number;
	etaMinutes: number;
	canUndo: boolean;
	handleUndo: () => void;
	quitTournament: () => void;
	onOpenBracket?: () => void;
	progressWidth: number;
	dominantStreak: { name: string; streak: number; heatLevel: HeatLevel } | null;
	matchupTone: string;
	pressureCopy: string;
}

export const TournamentHeader = memo(function TournamentHeader({
	roundNumber,
	totalRounds,
	bracketStage,
	tournamentMode,
	currentMatchNumber,
	totalMatches,
	etaMinutes,
	canUndo,
	handleUndo,
	quitTournament,
	onOpenBracket,
	progressWidth,
	dominantStreak,
	matchupTone,
	pressureCopy,
}: TournamentHeaderProps) {
	return (
		<header className="px-2 pt-2 sm:px-4 sm:pt-4">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-border/40 bg-card/80 p-3.5 sm:p-4 shadow-md backdrop-blur-xl">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-secondary/30 text-primary">
							<Gamepad2 className="size-4" />
						</div>
						<div className="space-y-0.5">
							<div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
								<span>Round {roundNumber}</span>
								<span aria-hidden="true">&middot;</span>
								<span>{bracketStage}</span>
								<span aria-hidden="true">&middot;</span>
								<span>{tournamentMode === "2v2" ? "2v2 Teams" : "1v1 Head-to-Head"}</span>
							</div>
							<div className="flex items-baseline gap-2.5">
								<h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
									Match{" "}
									<span className="font-mono tabular-nums text-primary">{currentMatchNumber}</span>{" "}
									of <span className="font-mono tabular-nums">{totalMatches}</span>
								</h2>
								{etaMinutes > 0 && (
									<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
										<Clock className="size-3" />
										<span className="font-mono tabular-nums">{etaMinutes}m</span> left
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{onOpenBracket && (
							<button
								type="button"
								onClick={onOpenBracket}
								className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 whitespace-nowrap shrink-0"
								aria-label="View tournament bracket tree"
							>
								<Layers className="size-3.5" />
								<span>Bracket</span>
							</button>
						)}
						<button
							type="button"
							onClick={handleUndo}
							disabled={!canUndo}
							className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
								canUndo
									? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
									: "cursor-not-allowed border-border/30 bg-muted/20 text-muted-foreground opacity-50"
							}`}
							aria-label="Undo last vote"
						>
							<Undo2 className="size-3.5" />
							<span className="hidden sm:inline">Undo</span>
						</button>
						<button
							type="button"
							onClick={quitTournament}
							className="inline-flex h-9 items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-4 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 whitespace-nowrap shrink-0"
							aria-label="Exit tournament"
						>
							<X className="size-3.5" />
							<span className="hidden sm:inline">Exit</span>
						</button>
					</div>
				</div>

				<div className="space-y-2">
					<div
						className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50"
						role="progressbar"
						aria-label="Tournament progress"
						aria-valuenow={Math.round(progressWidth)}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<div
							className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
							style={{ width: `${progressWidth}%` }}
						/>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-muted-foreground">
						<div className="flex items-center gap-1.5">
							<span className="font-medium text-foreground/80">{matchupTone}</span>
							<span aria-hidden="true">&middot;</span>
							<span>{pressureCopy}</span>
						</div>
						{dominantStreak && (
							<span
								className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold font-mono tabular-nums ${getHeatTextClasses(
									dominantStreak.heatLevel,
								)}`}
							>
								<Flame className="size-3" />
								<span>
									{dominantStreak.name} &times;{dominantStreak.streak}
								</span>
							</span>
						)}
					</div>
					<div className="hidden sm:block pt-1">
						<BracketTree
							round={roundNumber}
							totalRounds={totalRounds}
							onOpenBracket={onOpenBracket}
						/>
					</div>
				</div>
			</div>
		</header>
	);
});
