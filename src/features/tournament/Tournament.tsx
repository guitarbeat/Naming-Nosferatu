import { AnimatePresence, motion } from "framer-motion";
import { memo, useMemo } from "react";
import { ErrorComponent } from "@/shared/components/layout/Feedback";
import { ELO_RATING } from "@/shared/lib/constants";
import { Music, PawPrint, Trophy, Undo2, Volume2, VolumeX, X } from "@/shared/lib/icons";
import { getVisibleNames } from "@/shared/lib/names/nameFilters";
import type { TournamentProps } from "@/shared/types";
import useAppStore from "@/store/appStore";
import { BracketTree } from "./components/BracketTree";
import { MatchSideCard } from "./components/MatchSideCard";
import { TournamentComplete } from "./components/TournamentComplete";
import { useTournamentState } from "./hooks/useTournamentState";
import { getStageHeadline, useTournamentUIState } from "./hooks/useTournamentUIState";
import { getFlameCount, getHeatTextClasses, type HeatLevel, STREAK_THRESHOLDS } from "./utils/heat";

function TournamentContent({ onComplete, names = [], onVote }: TournamentProps) {
	const userName = useAppStore((state) => state.user.name);
	const visibleNamesList = useMemo(() => getVisibleNames(names), [names]);

	const tournament = useTournamentState(visibleNamesList, userName);
	const {
		ratings,
		openingEntrants,
		isComplete,
		tournamentMode,
		round: roundNumber,
		totalRounds,
		bracketStage,
		matchNumber: currentMatchNumber,
		totalMatches,
		handleUndo,
		canUndo,
		progress,
		isVoting,
	} = tournament;

	const {
		audioManager,
		prefersReducedMotion,
		selectedSide,
		voteAnnouncement,
		roundAnnouncement,
		streakBurst,
		openingBracketReveal,
		leftStreak,
		rightStreak,
		leftHeatLevel,
		rightHeatLevel,

		showCatPictures,
		setCatPictures,
		matchData,
		handleVoteForSide,
		leftImg,
		rightImg,
		hasSelectionFeedback,
		currentMatchKey,
		quitTournament,
	} = useTournamentUIState({ onComplete, names, onVote, tournament });

	if (isComplete) {
		return (
			<TournamentComplete
				totalMatches={totalMatches}
				participantCount={visibleNamesList.length}
				onNewTournament={quitTournament}
			/>
		);
	}

	if (!matchData) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<div className="text-muted-foreground">Loading tournament...</div>
			</div>
		);
	}

	const dominantStreak =
		leftStreak >= rightStreak
			? leftStreak >= STREAK_THRESHOLDS.warm
				? {
						name: matchData.leftName,
						streak: leftStreak,
						heatLevel: leftHeatLevel ?? ("warm" as HeatLevel),
					}
				: null
			: rightStreak >= STREAK_THRESHOLDS.warm
				? {
						name: matchData.rightName,
						streak: rightStreak,
						heatLevel: rightHeatLevel ?? ("warm" as HeatLevel),
					}
				: null;

	const progressWidth = progress || (currentMatchNumber / totalMatches) * 100;
	const leftRating = ratings[matchData.leftId] ?? ELO_RATING.DEFAULT_RATING;
	const rightRating = ratings[matchData.rightId] ?? ELO_RATING.DEFAULT_RATING;
	const _ratingGap = Math.abs(leftRating - rightRating);
	const leftIsFavored = leftRating > rightRating;
	const rightIsFavored = rightRating > leftRating;
	const stageHeadline = getStageHeadline(roundNumber, totalRounds);

	return (
		<div className="relative flex min-h-[82dvh] w-full flex-col overflow-x-hidden overflow-y-auto font-display text-foreground selection:bg-primary/30 sm:min-h-[88dvh]">
			<header className="px-2 pb-2 pt-2 sm:px-4 sm:pt-4">
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/60 px-4 py-3 shadow-[0_20px_55px_rgba(2,8,18,0.24)] backdrop-blur-xl sm:px-5">
					<div className="flex items-center justify-between gap-4">
						<div className="space-y-0.5">
							<div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
								<span>Round {roundNumber}</span>
								<span className="text-white/20" aria-hidden="true">
									&middot;
								</span>
								<span>{bracketStage}</span>
							</div>
							<h2 className="text-base font-semibold tracking-tight text-white">
								Match {currentMatchNumber} of {totalMatches}
							</h2>
						</div>

						<div className="flex items-center gap-1.5">
							{(
								[
									{
										action: audioManager.handleToggleMute,
										icon: audioManager.isMuted ? VolumeX : Volume2,
										label: audioManager.isMuted ? "Unmute" : "Mute",
										active: false,
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
									className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
										active
											? "border-primary/30 bg-primary/15 text-primary"
											: "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.08] hover:text-white"
									}`}
									aria-label={label}
								>
									<Icon className="size-3.5" />
								</button>
							))}
							<button
								type="button"
								onClick={() => handleUndo()}
								className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors ${
									canUndo
										? "border-primary/30 bg-primary/12 text-primary hover:bg-primary/18"
										: "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/30"
								}`}
								aria-label="Undo last vote"
								disabled={!canUndo}
							>
								<Undo2 className="size-3.5" />
								<span className="hidden sm:inline">Undo</span>
							</button>
							<button
								type="button"
								onClick={quitTournament}
								className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/12 px-2.5 text-xs text-destructive transition-colors hover:bg-destructive/18"
								aria-label="Quit tournament"
							>
								<X className="size-3.5" />
								<span className="hidden sm:inline">Exit</span>
							</button>
						</div>
					</div>

					<div className="space-y-2">
						<div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
							<div
								className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_12px_rgba(39,135,153,0.4)]"
								style={{ width: `${progressWidth}%` }}
							/>
						</div>

						<div className="flex items-center justify-between gap-3">
							<span className="text-[11px] text-white/45">{stageHeadline}</span>
							{dominantStreak && (
								<span
									className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getHeatTextClasses(dominantStreak.heatLevel)}`}
								>
									<span className="rounded-full bg-white/10 px-1 py-0.5 text-[9px]">HOT</span>
									<span>
										{dominantStreak.name} x{dominantStreak.streak}
									</span>
								</span>
							)}
						</div>

						<div className="hidden sm:block">
							<BracketTree round={roundNumber} totalRounds={totalRounds} />
						</div>
					</div>
				</div>
			</header>

			<main className="relative flex min-h-0 flex-1 flex-col items-center justify-start px-1 py-3 sm:px-4 sm:py-5 sm:justify-center">
				<div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
					<div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-primary/20 animate-blob animation-delay-2000" />
					<div className="absolute right-0 top-1/4 h-24 w-24 rounded-full bg-stardust/20 animate-blob" />
					<div className="absolute bottom-1/4 left-1/4 h-28 w-28 rounded-full bg-primary/15 animate-blob animation-delay-4000" />
					<div className="absolute bottom-0 right-1/3 h-36 w-36 rounded-full bg-stardust/15 animate-blob animation-delay-2000" />
				</div>

				<div className="sr-only" aria-live="polite">
					{openingBracketReveal.value && "The bracket is set. First match begins now."}
					{voteAnnouncement.value && `${voteAnnouncement.value} advances to the next round.`}
					{streakBurst.value &&
						`${streakBurst.value.winnerName} is on a ${streakBurst.value.streak} win streak.`}
					{roundAnnouncement.value && `Round ${roundAnnouncement.value} is beginning.`}
					{isComplete && "Tournament complete. Results are being saved."}
				</div>

				<AnimatePresence>
					{openingBracketReveal.value && (
						<motion.div
							key="bracket-reveal-overlay"
							initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.05 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
							exit={
								prefersReducedMotion
									? { opacity: 0 }
									: { opacity: 0, scale: 0.95, filter: "blur(8px)" }
							}
							transition={{ duration: prefersReducedMotion ? 0.08 : 0.42 }}
							className="absolute inset-0 z-40 flex items-center justify-center px-3 sm:px-6"
						>
							<div className="absolute inset-0 bg-slate-950/82 backdrop-blur-md" />
							<motion.div
								initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
								animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
								exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
								transition={{ duration: prefersReducedMotion ? 0.08 : 0.38 }}
								className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 overflow-hidden rounded-[2rem] border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(57,189,216,0.18),rgba(2,6,23,0.96)_46%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8"
							>
								<div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.05),transparent)]" />
								<div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
									<div>
										<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/70">
											Bracket Reveal
										</p>
										<h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
											The field is set
										</h3>
										<p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
											{tournamentMode === "2v2"
												? "Teams enter the night bracket. Watch the path lock in before Match 1 ignites."
												: "Every contender is seeded. The opening duel begins as soon as the bracket settles."}
										</p>
									</div>
									<div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
										<Trophy className="size-3.5 text-primary" />
										<span>{openingEntrants.length} contenders</span>
										<span className="h-1 w-1 rounded-full bg-white/25" />
										<span>{totalRounds} rounds</span>
									</div>
								</div>

								<div className="relative">
									<div className="mb-4">
										<BracketTree round={1} totalRounds={totalRounds} />
									</div>
									<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
										{openingEntrants.slice(0, 8).map((entrant, index) => (
											<motion.div
												key={`opening-entrant-${entrant.id}`}
												initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
												animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
												transition={{
													duration: prefersReducedMotion ? 0.08 : 0.3,
													delay: prefersReducedMotion ? 0 : 0.12 + index * 0.06,
												}}
												className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
											>
												<div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-accent to-chart-4" />
												<p className="pl-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
													Seed {index + 1}
												</p>
												<p className="pl-2 pt-2 font-display text-xl leading-tight text-white sm:text-2xl">
													{entrant.label}
												</p>
											</motion.div>
										))}
									</div>
									{openingEntrants.length > 8 && (
										<p className="mt-4 text-center text-xs uppercase tracking-[0.18em] text-white/48">
											+ {openingEntrants.length - 8} more contenders in the shadows
										</p>
									)}
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{voteAnnouncement.value && (
						<motion.div
							key={`${voteAnnouncement.value}-${currentMatchKey}`}
							initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
							exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
							transition={{ duration: prefersReducedMotion ? 0.01 : 0.28 }}
							className="pointer-events-none absolute left-1/2 top-2 z-30 w-[calc(100%-1.5rem)] max-w-full -translate-x-1/2 sm:w-auto"
						>
							<div className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-md sm:px-4">
								<div className="flex items-center gap-2 text-emerald-100">
									<Trophy className="size-4 text-emerald-300" />
									<span className="truncate text-xs font-bold tracking-wide sm:text-sm">
										{voteAnnouncement.value} advances
									</span>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{streakBurst.value && (
						<motion.div
							key={`streak-burst-${streakBurst.value?.key}`}
							initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
							exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 1.03 }}
							transition={{ duration: prefersReducedMotion ? 0.01 : 0.28 }}
							className={`pointer-events-none absolute top-[20%] z-30 ${
								streakBurst.value.side === "left"
									? "left-3 sm:left-6"
									: "right-3 text-right sm:right-6"
							}`}
						>
							<div
								className={`rounded-2xl border px-4 py-3 shadow-[0_0_40px_rgba(249,115,22,0.35)] backdrop-blur-lg ${getHeatTextClasses(streakBurst.value.heatLevel)}`}
							>
								<p className="text-[10px] uppercase tracking-[0.22em] opacity-80 sm:text-xs">
									Hot streak
								</p>
								<p className="text-base font-black tracking-tight sm:text-lg">
									{streakBurst.value.winnerName} x{streakBurst.value.streak}
								</p>
								<div className="mt-2 flex gap-1.5">
									{Array.from({ length: getFlameCount(streakBurst.value.streak, 9) }).map(
										(_, i) => (
											<span
												key={`streak-flame-${streakBurst.value?.key}-${i}`}
												className="h-1.5 w-5 animate-pulse rounded-full bg-current opacity-80 sm:h-2 sm:w-6"
												style={{ animationDelay: `${i * 80}ms` }}
											/>
										),
									)}
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{roundAnnouncement.value !== null && (
						<motion.div
							key={`round-announcement-${roundAnnouncement.value}`}
							initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
							exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
							transition={{ duration: prefersReducedMotion ? 0.01 : 0.35 }}
							className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4"
						>
							<motion.div
								initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0.85, y: 8 }}
								animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
								exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0.7, y: -6 }}
								transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
								className="relative overflow-hidden rounded-2xl border border-primary/35 bg-slate-900/80 px-5 py-5 text-center shadow-[0_0_80px_rgba(39,135,153,0.25)] backdrop-blur-xl sm:px-8 sm:py-6"
							>
								<div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-chart-4/20" />
								<div className="relative">
									<p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-primary/70 sm:text-xs sm:tracking-[0.3em]">
										Next stage
									</p>
									<p className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
										Round {roundAnnouncement.value}
									</p>
									<p className="mt-1 text-xs text-white/72 sm:text-sm">
										New head-to-head matchups ready
									</p>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={currentMatchKey}
						initial={
							prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(6px)" }
						}
						animate={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }
						}
						exit={
							prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(6px)" }
						}
						transition={{ duration: prefersReducedMotion ? 0.01 : 0.32 }}
						className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-stretch gap-4 sm:grid sm:h-full sm:min-h-0 sm:grid-cols-[1fr_auto_1fr] sm:gap-4"
					>
						<MatchSideCard
							side="left"
							name={matchData.leftName}
							img={leftImg}
							heatLevel={leftHeatLevel}
							streak={leftStreak}
							rating={leftRating}
							isFavored={leftIsFavored}
							isVoting={isVoting || openingBracketReveal.value}
							isSelected={selectedSide === "left"}
							hasSelectionFeedback={hasSelectionFeedback}
							isTeam={matchData.leftIsTeam}
							members={matchData.leftMembers}
							description={matchData.leftDescription}
							pronunciation={matchData.leftPronunciation}
							onVote={() => handleVoteForSide("left")}
						/>

						<div className="flex w-full flex-row items-center justify-center gap-3 py-1 sm:w-24 sm:flex-col sm:gap-3">
							<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-bold italic tracking-tight shadow-lg sm:h-16 sm:w-16 sm:text-2xl">
								VS
							</div>
							<div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60 sm:text-[11px]">
								{dominantStreak ? `Hot streak x${dominantStreak.streak}` : "Choose one"}
							</div>
							<p className="hidden max-w-[7rem] text-center text-[11px] leading-relaxed text-white/50 sm:block">
								Tap a card to send it forward.
							</p>
						</div>

						<MatchSideCard
							side="right"
							name={matchData.rightName}
							img={rightImg}
							heatLevel={rightHeatLevel}
							streak={rightStreak}
							rating={rightRating}
							isFavored={rightIsFavored}
							isVoting={isVoting || openingBracketReveal.value}
							isSelected={selectedSide === "right"}
							hasSelectionFeedback={hasSelectionFeedback}
							isTeam={matchData.rightIsTeam}
							members={matchData.rightMembers}
							description={matchData.rightDescription}
							pronunciation={matchData.rightPronunciation}
							onVote={() => handleVoteForSide("right")}
							animationDelay="2s"
						/>
					</motion.div>
				</AnimatePresence>
			</main>

			<div className="absolute left-[-10%] top-[-10%] -z-10 h-40 w-40 rounded-full bg-primary/10 blur-[100px] sm:size-64" />
			<div className="absolute bottom-[-10%] right-[-10%] -z-10 h-40 w-40 rounded-full bg-stardust/10 blur-[100px] sm:size-64" />
		</div>
	);
}

const MemoizedTournament = memo(TournamentContent);

export default function Tournament(props: TournamentProps) {
	return (
		<ErrorComponent variant="boundary">
			<MemoizedTournament {...props} />
		</ErrorComponent>
	);
}
