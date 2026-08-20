import { Clock, Gamepad2, Medal } from "lucide-react";
import { memo } from "react";
import { getHeatTextClasses, type HeatLevel } from "../utils/heat";
import { BracketTree } from "./BracketTree";
import { MatchInfoPanel } from "./ui/MatchInfoPanel";
import { TournamentControls } from "./ui/TournamentControls";

interface TournamentHeaderProps {
	roundNumber: number;
	totalRounds: number;
	bracketStage: string;
	tournamentMode: string;
	currentMatchNumber: number;
	totalMatches: number;
	etaMinutes: number;
	// biome-ignore lint/suspicious/noExplicitAny: complex hook API
	audioManager: any;
	canUndo: boolean;
	handleUndo: () => void;
	quitTournament: () => void;
	progressWidth: number;
	stageHeadline: string;
	dominantStreak: { name: string; streak: number; heatLevel: HeatLevel } | null;
	matchupTone: string;
	pressureCopy: string;
	matchesRemaining: number;
	roundMatchesLeft: number;
}

// ⚡ Bolt Performance Optimization: Wrapped TournamentHeader in React.memo()
// Prevents unnecessary re-renders when parent match data changes but header props (like progress or round number) do not.
export const TournamentHeader = memo(function TournamentHeader({
	roundNumber,
	totalRounds,
	bracketStage,
	tournamentMode,
	currentMatchNumber,
	totalMatches,
	etaMinutes,
	audioManager,
	canUndo,
	handleUndo,
	quitTournament,
	progressWidth,
	stageHeadline,
	dominantStreak,
	matchupTone,
	pressureCopy,
	matchesRemaining,
	roundMatchesLeft,
}: TournamentHeaderProps) {
	return (
		<header className="px-2 pb-2 pt-2 sm:px-4 sm:pt-4">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/60 px-4 py-4 shadow-[0_20px_55px_rgba(2,8,18,0.24)] backdrop-blur-xl sm:px-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-start gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
							<Gamepad2 className="size-4" />
						</div>
						<div className="space-y-1">
							<div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
								<span>Round {roundNumber}</span>
								<span className="text-white/25" aria-hidden="true">
									&middot;
								</span>
								<span>{bracketStage}</span>
								<span className="text-white/25" aria-hidden="true">
									&middot;
								</span>
								<span>
									{tournamentMode === "2v2" ? "Team mode" : "Head to head"}
								</span>
							</div>
							<h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
								Match <span className="tabular-nums">{currentMatchNumber}</span>{" "}
								of <span className="tabular-nums">{totalMatches}</span>
							</h2>
							<div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
								<span>
									<span className="tabular-nums">{totalRounds}</span> rounds
									total
								</span>
								{etaMinutes > 0 && (
									<span className="inline-flex items-center gap-1">
										<Clock className="size-3" />
										About{" "}
										<span className="tabular-nums ml-1">{etaMinutes}</span>{" "}
										minutes left
									</span>
								)}
							</div>
						</div>
					</div>

					<TournamentControls
						audioManager={audioManager}
						canUndo={canUndo}
						handleUndo={handleUndo}
						quitTournament={quitTournament}
					/>
				</div>

				<div className="space-y-3">
					<div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
						<div
							className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_18px_rgba(39,135,153,0.45)]"
							style={{ width: `${progressWidth}%` }}
						/>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
							<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
								<Medal className="size-3.5 text-accent" />
								<span className="tabular-nums">{currentMatchNumber}</span>/
								<span className="tabular-nums">{totalMatches}</span>
							</span>
							<span>{stageHeadline}</span>
						</div>
						{dominantStreak && (
							<span
								className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${getHeatTextClasses(dominantStreak.heatLevel)}`}
							>
								<span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">
									HOT
								</span>
								<span>
									{dominantStreak.name} x{dominantStreak.streak}
								</span>
							</span>
						)}
					</div>

					<div className="hidden sm:block">
						<BracketTree round={roundNumber} totalRounds={totalRounds} />
					</div>

					<MatchInfoPanel
						matchupTone={matchupTone}
						pressureCopy={pressureCopy}
						matchesRemaining={matchesRemaining}
						roundMatchesLeft={roundMatchesLeft}
					/>
				</div>
			</div>
		</header>
	);
});
