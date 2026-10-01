import { Clock, Gamepad2, Layers, Undo2, X } from "lucide-react";
import { memo, useMemo } from "react";
import type { HeatLevel } from "@/tournament/tournamentEngine";
import { getHeatTextClasses } from "@/tournament/tournamentEngine";

interface BracketTreeProps {
	round: number;
	totalRounds: number;
}

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

function getStageFlavor(round: number, totalRounds: number): string {
	if (round >= totalRounds) {
		return "Finals";
	}
	if (totalRounds - round === 1) {
		return "Semifinals";
	}
	if (round <= 2) {
		return "Preliminary Rounds";
	}
	return "Middle Rounds";
}

export function BracketTree({
	round,
	totalRounds,
	onOpenBracket,
}: BracketTreeProps & { onOpenBracket?: () => void }) {
	const rounds = useMemo(
		() => Array.from({ length: Math.max(1, totalRounds) }, (_, i) => i + 1),
		[totalRounds],
	);
	const stageFlavor = useMemo(
		() => getStageFlavor(round, totalRounds),
		[round, totalRounds],
	);

	if (onOpenBracket) {
		return (
			<button
				type="button"
				onClick={onOpenBracket}
				className="w-full text-left rounded-xl border border-border/15 bg-foreground/[0.03] px-3 py-2 transition-all cursor-pointer hover:border-primary/40 hover:bg-foreground/[0.06] group/bracket focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
				title="Click to view full interactive tournament bracket"
			>
				<div className="mb-2 flex items-center justify-between text-[10px] tracking-wide text-muted-foreground">
					<span className="flex items-center gap-1">
						<Layers className="size-3 text-primary" />
						<span>Bracket Path</span>
						<span className="text-[9px] text-primary underline underline-offset-2 opacity-0 group-hover/bracket:opacity-100 transition-opacity">
							(Click to expand)
						</span>
					</span>
					<span>{stageFlavor}</span>
				</div>
				<div className="flex items-center gap-1 overflow-x-auto pb-1">
					{rounds.map((stageRound, index) => {
						const isDone = stageRound < round;
						const isActive = stageRound === round;
						const tone = isActive
							? "border-primary/70 bg-primary/20 text-primary shadow-[0_0_18px_rgba(166,94,237,0.45)]"
							: isDone
								? "border-chart-2/45 bg-chart-2/10 text-chart-2"
								: "border-border/20 bg-foreground/5 text-muted-foreground";

						return (
							<div
								key={`bracket-round-${stageRound}`}
								className="flex items-center gap-1"
							>
								<div
									className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${tone}`}
								>
									{getRoundCaption(stageRound, totalRounds)}
									{isActive ? " ✦" : ""}
								</div>
								{index < rounds.length - 1 && (
									<div
										className={`h-[1px] w-4 sm:w-6 ${
											isDone
												? "bg-chart-2/70"
												: isActive
													? "bg-primary/70"
													: "bg-border/20"
										}`}
									/>
								)}
							</div>
						);
					})}
				</div>
			</button>
		);
	}

	return (
		<div className="rounded-xl border border-border/15 bg-foreground/[0.03] px-3 py-2 transition-all">
			<div className="mb-2 flex items-center justify-between text-[10px] tracking-wide text-muted-foreground">
				<span className="flex items-center gap-1">
					<Layers className="size-3 text-primary" />
					<span>Bracket Path</span>
				</span>
				<span>{stageFlavor}</span>
			</div>
			<div className="flex items-center gap-1 overflow-x-auto pb-1">
				{rounds.map((stageRound, index) => {
					const isDone = stageRound < round;
					const isActive = stageRound === round;
					const tone = isActive
						? "border-primary/70 bg-primary/20 text-primary shadow-[0_0_18px_rgba(166,94,237,0.45)]"
						: isDone
							? "border-chart-2/45 bg-chart-2/10 text-chart-2"
							: "border-border/20 bg-foreground/5 text-muted-foreground";

					return (
						<div
							key={`bracket-round-${stageRound}`}
							className="flex items-center gap-1"
						>
							<div
								className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${tone}`}
							>
								{getRoundCaption(stageRound, totalRounds)}
								{isActive ? " ✦" : ""}
							</div>
							{index < rounds.length - 1 && (
								<div
									className={`h-[1px] w-4 sm:w-6 ${
										isDone
											? "bg-chart-2/70"
											: isActive
												? "bg-primary/70"
												: "bg-border/20"
									}`}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface TournamentHeaderProps {
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
	stageHeadline: string;
	dominantStreak: { name: string; streak: number; heatLevel: HeatLevel } | null;
	matchupTone: string;
	pressureCopy: string;
	matchesRemaining: number;
	roundMatchesLeft: number;
}

/**
 * Top title section with round info and match counter.
 */
function HeaderTitle({
	roundNumber,
	bracketStage,
	tournamentMode,
	currentMatchNumber,
	totalMatches,
	etaMinutes,
}: Pick<
	TournamentHeaderProps,
	| "roundNumber"
	| "bracketStage"
	| "tournamentMode"
	| "currentMatchNumber"
	| "totalMatches"
	| "totalRounds"
	| "etaMinutes"
>) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-secondary/40 text-primary shadow-xs">
				<Gamepad2 className="size-4" />
			</div>
			<div className="space-y-0.5">
				<div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
					<span>Round {roundNumber}</span>
					<span className="text-muted-foreground" aria-hidden="true">
						&middot;
					</span>
					<span>{bracketStage}</span>
					<span className="text-muted-foreground" aria-hidden="true">
						&middot;
					</span>
					<span>
						{tournamentMode === "2v2" ? "2v2 Teams" : "1v1 Head-to-Head"}
					</span>
				</div>
				<div className="flex items-baseline gap-2">
					<h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
						Match{" "}
						<span className="font-mono tabular-nums text-primary">
							{currentMatchNumber}
						</span>{" "}
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
	);
}

/**
 * Tactical control buttons (Undo, Exit) with unified nature-inspired tactile styling.
 */
function HeaderControls({
	canUndo,
	handleUndo,
	quitTournament,
	onOpenBracket,
}: Pick<
	TournamentHeaderProps,
	"canUndo" | "handleUndo" | "quitTournament" | "onOpenBracket"
>) {
	return (
		<div className="flex items-center gap-1.5 sm:gap-2">
			{onOpenBracket && (
				<button
					type="button"
					onClick={onOpenBracket}
					className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary transition-all duration-[300ms] ease-spring hover:bg-primary/20 hover:-translate-y-0.5 active:scale-[0.93] shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					aria-label="View tournament bracket tree"
					title="View tournament bracket (Press B)"
				>
					<Layers className="size-3.5" />
					<span>Bracket</span>
				</button>
			)}

			<button
				type="button"
				onClick={() => handleUndo()}
				disabled={!canUndo}
				className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-all duration-[300ms] ease-spring active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
					canUndo
						? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5 cursor-pointer"
						: "cursor-not-allowed border-border/30 bg-secondary/10 text-muted-foreground opacity-60"
				}`}
				aria-label="Undo last vote"
				title={canUndo ? "Undo last vote (Press U)" : "No votes to undo"}
			>
				<Undo2 className="size-3.5" />
				<span className="hidden sm:inline">Undo</span>
			</button>

			<button
				type="button"
				onClick={quitTournament}
				className="inline-flex h-9 items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-4 text-xs font-medium text-destructive transition-all duration-[300ms] ease-spring hover:bg-destructive/20 hover:-translate-y-0.5 active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
				aria-label="Exit tournament"
				title="Exit tournament"
			>
				<X className="size-3.5" />
				<span className="hidden sm:inline">Exit</span>
			</button>
		</div>
	);
}

/**
 * Fluid progress bar indicating tournament progress.
 */
function ProgressBar({
	progressWidth,
}: Pick<TournamentHeaderProps, "progressWidth">) {
	return (
		<div
			className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50"
			role="progressbar"
			aria-label="Tournament progress"
			aria-valuenow={Math.round(progressWidth)}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<div
				className="h-full rounded-full bg-primary transition-all duration-500 ease-out shadow-[0_0_12px_hsl(var(--pw-sage-hsl)/0.5)]"
				style={{ width: `${progressWidth}%` }}
			/>
		</div>
	);
}

/**
 * Contextual matchup pulse ribbon giving quick situational context without cluttering the screen.
 */
function ContextRibbon({
	matchupTone,
	pressureCopy,
	dominantStreak,
}: Pick<
	TournamentHeaderProps,
	"stageHeadline" | "matchupTone" | "pressureCopy" | "dominantStreak"
>) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
			<div className="flex flex-wrap items-center gap-2 text-muted-foreground">
				<span className="inline-flex items-center rounded-full border border-border/40 bg-secondary/30 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
					{matchupTone}
				</span>
				<span className="hidden md:inline text-muted-foreground">&middot;</span>
				<span className="hidden md:inline text-muted-foreground">
					{pressureCopy}
				</span>
			</div>

			{dominantStreak && (
				<span
					className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${getHeatTextClasses(
						dominantStreak.heatLevel,
					)}`}
				>
					<span className="rounded-full bg-foreground/10 px-1 py-0.2 text-[9px]">
						HOT
					</span>
					<span>
						{dominantStreak.name} &times;{dominantStreak.streak}
					</span>
				</span>
			)}
		</div>
	);
}

/**
 * Refactored nature-inspired Tournament Header component.
 */
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
	stageHeadline,
	dominantStreak,
	matchupTone,
	pressureCopy,
}: TournamentHeaderProps) {
	return (
		<header className="px-2 pt-2 sm:px-4 sm:pt-4">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-border/40 bg-card/75 p-3.5 sm:p-4 shadow-lg backdrop-blur-xl">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<HeaderTitle
						roundNumber={roundNumber}
						bracketStage={bracketStage}
						tournamentMode={tournamentMode}
						currentMatchNumber={currentMatchNumber}
						totalMatches={totalMatches}
						totalRounds={totalRounds}
						etaMinutes={etaMinutes}
					/>
					<HeaderControls
						canUndo={canUndo}
						handleUndo={handleUndo}
						quitTournament={quitTournament}
						onOpenBracket={onOpenBracket}
					/>
				</div>

				<div className="space-y-2">
					<ProgressBar progressWidth={progressWidth} />
					<ContextRibbon
						stageHeadline={stageHeadline}
						matchupTone={matchupTone}
						pressureCopy={pressureCopy}
						dominantStreak={dominantStreak}
					/>
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
