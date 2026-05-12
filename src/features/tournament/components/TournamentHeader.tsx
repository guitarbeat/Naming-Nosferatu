import {
	Clock,
	Gamepad2,
	Medal,
	Music,
	PawPrint,
	SkipBack,
	SkipForward,
	Undo2,
	Volume2,
	VolumeX,
	X,
} from "@/shared/lib/icons";
import { getHeatTextClasses, type HeatLevel } from "../utils/heat";
import { BracketTree } from "./BracketTree";

interface TournamentHeaderProps {
	roundNumber: number;
	totalRounds: number;
	bracketStage: string;
	tournamentMode: string;
	currentMatchNumber: number;
	totalMatches: number;
	etaMinutes: number;
	audioManager: any;
	showCatPictures: boolean;
	setCatPictures: (show: boolean) => void;
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

export function TournamentHeader({
	roundNumber,
	totalRounds,
	bracketStage,
	tournamentMode,
	currentMatchNumber,
	totalMatches,
	etaMinutes,
	audioManager,
	showCatPictures,
	setCatPictures,
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
								<span>{tournamentMode === "2v2" ? "Team mode" : "Head to head"}</span>
							</div>
							<h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
								Match {currentMatchNumber} of {totalMatches}
							</h2>
							<div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
								<span>{totalRounds} rounds total</span>
								{etaMinutes > 0 && (
									<span className="inline-flex items-center gap-1">
										<Clock className="size-3" />
										About {etaMinutes} minutes left
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{(
							[
								{
									action: audioManager.handleToggleMute,
									icon: audioManager.isMuted ? VolumeX : Volume2,
									label: audioManager.isMuted ? "Unmute" : "Mute",
								},
								{
									action: audioManager.toggleBackgroundMusic,
									icon: Music,
									label: audioManager.backgroundMusicEnabled ? "Stop music" : "Play music",
									active: audioManager.backgroundMusicEnabled,
								},
								{
									action: () => setCatPictures(!showCatPictures),
									icon: PawPrint,
									label: showCatPictures ? "Names only" : "Show cats",
									active: showCatPictures,
								},
							] as const
						).map(({ action, icon: Icon, label, active }) => (
							<button
								key={label}
								type="button"
								onClick={action}
								className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm transition-colors ${
									active
										? "border-primary/30 bg-primary/15 text-primary"
										: "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white"
								}`}
								aria-label={label}
							>
								<Icon className="size-4" />
							</button>
						))}
						<button
							type="button"
							onClick={audioManager.handlePreviousTrack}
							className="hidden h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white sm:inline-flex"
							aria-label="Previous track"
						>
							<SkipBack className="size-4" />
						</button>
						<button
							type="button"
							onClick={audioManager.handleNextTrack}
							className="hidden h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white sm:inline-flex"
							aria-label="Next track"
						>
							<SkipForward className="size-4" />
						</button>
						<button
							type="button"
							onClick={() => handleUndo()}
							className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${
								canUndo
									? "border-primary/30 bg-primary/12 text-primary hover:bg-primary/18"
									: "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/35"
							}`}
							aria-label="Undo last vote"
							disabled={!canUndo}
						>
							<Undo2 className="size-4" />
							<span className="hidden sm:inline">Undo</span>
						</button>
						<button
							type="button"
							onClick={quitTournament}
							className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/12 px-3 text-sm text-destructive transition-colors hover:bg-destructive/18"
							aria-label="Quit tournament"
						>
							<X className="size-4" />
							<span className="hidden sm:inline">Exit</span>
						</button>
					</div>
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
								{currentMatchNumber}/{totalMatches}
							</span>
							<span>{stageHeadline}</span>
						</div>
						{dominantStreak && (
							<span
								className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${getHeatTextClasses(dominantStreak.heatLevel)}`}
							>
								<span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">HOT</span>
								<span>
									{dominantStreak.name} x{dominantStreak.streak}
								</span>
							</span>
						)}
					</div>

					<div className="hidden sm:block">
						<BracketTree round={roundNumber} totalRounds={totalRounds} />
					</div>

					<div className="grid gap-3 md:grid-cols-[1.25fr_1fr_1fr]">
						<div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-white/78">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
								Match pulse
							</p>
							<p className="mt-2 text-sm font-semibold text-white">{matchupTone}</p>
							<p className="mt-1 text-xs leading-relaxed text-white/58">{pressureCopy}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-white/78">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
								Road to crown
							</p>
							<p className="mt-2 text-sm font-semibold text-white">
								{matchesRemaining} match{matchesRemaining === 1 ? "" : "es"} after this
							</p>
							<p className="mt-1 text-xs leading-relaxed text-white/58">
								Roughly {roundMatchesLeft} duel{roundMatchesLeft === 1 ? "" : "s"} remain in the
								live bracket cycle.
							</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-white/78">
							<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
								Quick controls
							</p>
							<div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
								<span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white/72">
									A / ← Left
								</span>
								<span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white/72">
									D / → Right
								</span>
								<span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white/72">
									U Undo
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
