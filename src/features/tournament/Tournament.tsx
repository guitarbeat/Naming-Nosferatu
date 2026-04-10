import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorComponent } from "@/shared/components/layout/Feedback";
import { getRandomCatImage, getVisibleNames } from "@/shared/lib/basic";
import { CAT_IMAGES } from "@/shared/lib/constants";
import {
	Clock,
	Gamepad2,
	Medal,
	Music,
	PawPrint,
	SkipBack,
	SkipForward,
	Trophy,
	Undo2,
	Volume2,
	VolumeX,
	X,
} from "@/shared/lib/icons";
import type { TournamentProps } from "@/shared/types";
import useAppStore from "@/store/appStore";
import { BracketTree } from "./components/BracketTree";
import { MatchSideCard } from "./components/MatchSideCard";
import { TournamentComplete } from "./components/TournamentComplete";
import { useAudioManager } from "./hooks";
import { useTournamentState } from "./hooks/useTournamentState";
import {
	getFlameCount,
	getHeatLevel,
	getHeatTextClasses,
	type HeatLevel,
	STREAK_THRESHOLDS,
} from "./utils/heat";
import { extractMatchData, getMatchSideId } from "./utils/matchHelpers";
import { useTimedState } from "./utils/useTimedState";

interface StreakBurst {
	key: number;
	side: "left" | "right";
	winnerName: string;
	streak: number;
	heatLevel: HeatLevel;
}

function TournamentContent({ onComplete, names = [], onVote }: TournamentProps) {
	const navigate = useNavigate();
	const userName = useAppStore((state) => state.user.name);
	const tournamentActions = useAppStore((state) => state.tournamentActions);
	const visibleNames = useMemo(() => getVisibleNames(names), [names]);
	const audioManager = useAudioManager();
	const prefersReducedMotion = useReducedMotion();

	const tournament = useTournamentState(visibleNames, userName);
	const {
		currentMatch,
		ratings,
		isComplete,
		tournamentMode,
		round: roundNumber,
		totalRounds,
		bracketStage,
		matchNumber: currentMatchNumber,
		totalMatches,
		handleUndo,
		canUndo,
		handleQuit,
		progress,
		etaMinutes = 0,
		handleVoteWithAnimation,
		isVoting,
		matchHistory,
	} = tournament;

	const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);
	const voteAnnouncement = useTimedState<string | null>(null);
	const roundAnnouncement = useTimedState<number | null>(null);
	const streakBurst = useTimedState<StreakBurst | null>(null);
	const previousRoundRef = useRef(roundNumber);

	const calculateWinStreak = useCallback(
		(contestantId: string | number | null | undefined) => {
			if (!contestantId || matchHistory.length === 0) {
				return 0;
			}
			const targetId = String(contestantId);
			let streak = 0;
			for (let i = matchHistory.length - 1; i >= 0; i--) {
				const record = matchHistory[i];
				if (!record) {
					continue;
				}
				const leftId = getMatchSideId(record.match, "left");
				const rightId = getMatchSideId(record.match, "right");
				if (leftId !== targetId && rightId !== targetId) {
					continue;
				}
				if (record.winner === targetId) {
					streak++;
				} else {
					break;
				}
			}
			return streak;
		},
		[matchHistory],
	);

	const leftStreak = useMemo(
		() => (currentMatch ? calculateWinStreak(getMatchSideId(currentMatch, "left")) : 0),
		[currentMatch, calculateWinStreak],
	);
	const rightStreak = useMemo(
		() => (currentMatch ? calculateWinStreak(getMatchSideId(currentMatch, "right")) : 0),
		[currentMatch, calculateWinStreak],
	);
	const leftHeatLevel = useMemo(() => getHeatLevel(leftStreak), [leftStreak]);
	const rightHeatLevel = useMemo(() => getHeatLevel(rightStreak), [rightStreak]);

	const handleVoteAdapter = useCallback(
		async (winnerId: string, _loserId: string) => {
			if (!onVote || !currentMatch) {
				return;
			}
			const sideData = (side: "left" | "right") => {
				const participant = currentMatch[side];
				const id = typeof participant === "object" ? String(participant.id) : String(participant);
				const name =
					currentMatch.mode === "2v2"
						? (currentMatch[side] as any).memberNames.join(" + ")
						: typeof participant === "object"
							? participant.name
							: String(participant);
				return { name, id, description: "", outcome: winnerId === id ? "winner" : "loser" };
			};
			try {
				await Promise.resolve(
					onVote({
						match: { left: sideData("left"), right: sideData("right") },
						result: winnerId === sideData("left").id ? 1 : 0,
						ratings,
						timestamp: new Date().toISOString(),
					}),
				);
			} catch (error) {
				console.error("Vote callback error:", error);
			}
		},
		[onVote, currentMatch, ratings],
	);

	const idToName = useMemo(
		() => new Map(visibleNames.map((n) => [String(n.id), n.name])),
		[visibleNames],
	);

	const completionHandledRef = useRef(false);

	useEffect(() => {
		if (isComplete && onComplete && !completionHandledRef.current) {
			completionHandledRef.current = true;
			audioManager.playLevelUpSound();
			setTimeout(() => audioManager.playWowSound(), 500);
			const results: Record<string, { rating: number; wins: number; losses: number }> = {};
			for (const [id, rating] of Object.entries(ratings)) {
				results[idToName.get(id) ?? id] = { rating, wins: 0, losses: 0 };
			}
			onComplete(results);
		}
	}, [isComplete, ratings, onComplete, idToName, audioManager]);

	const showCatPictures = useAppStore((state) => state.ui.showCatPictures);
	const setCatPictures = useAppStore((state) => state.uiActions.setCatPictures);

	const matchData = useMemo(
		() => (currentMatch ? extractMatchData(currentMatch) : null),
		[currentMatch],
	);

	useEffect(() => {
		if (!currentMatch) {
			setSelectedSide(null);
			streakBurst.set(null);
			return;
		}
		setSelectedSide(null);
	}, [currentMatch, streakBurst.set]);

	useEffect(() => {
		if (isComplete) {
			previousRoundRef.current = roundNumber;
			return;
		}
		if (roundNumber > previousRoundRef.current) {
			audioManager.playSurpriseSound();
			roundAnnouncement.setTimed(roundNumber, prefersReducedMotion ? 350 : 1200);
		}
		previousRoundRef.current = roundNumber;
	}, [roundNumber, isComplete, audioManager, roundAnnouncement, prefersReducedMotion]);

	const handleVoteForSide = useCallback(
		(side: "left" | "right") => {
			if (isVoting || !matchData) {
				return;
			}
			audioManager.primeAudioExperience();

			const winnerId = side === "left" ? matchData.leftId : matchData.rightId;
			const loserId = side === "left" ? matchData.rightId : matchData.leftId;
			const winnerName = side === "left" ? matchData.leftName : matchData.rightName;
			const expectedStreak = (side === "left" ? leftStreak : rightStreak) + 1;
			const heatLevel = getHeatLevel(expectedStreak);

			if (heatLevel) {
				streakBurst.setTimed(
					{ key: Date.now(), side, winnerName, streak: expectedStreak, heatLevel },
					prefersReducedMotion ? 280 : 950,
				);
				audioManager.playStreakSound(expectedStreak);
			}

			setSelectedSide(side);
			voteAnnouncement.setTimed(winnerName, prefersReducedMotion ? 250 : 900);
			handleVoteWithAnimation(winnerId, loserId);
			if (onVote) {
				handleVoteAdapter(winnerId, loserId);
			}
		},
		[
			isVoting,
			matchData,
			audioManager,
			leftStreak,
			rightStreak,
			streakBurst,
			prefersReducedMotion,
			voteAnnouncement,
			handleVoteWithAnimation,
			onVote,
			handleVoteAdapter,
		],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>, side: "left" | "right") => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handleVoteForSide(side);
			}
		},
		[handleVoteForSide],
	);

	const leftImg =
		showCatPictures && matchData ? getRandomCatImage(matchData.leftId, CAT_IMAGES) : null;
	const rightImg =
		showCatPictures && matchData ? getRandomCatImage(matchData.rightId, CAT_IMAGES) : null;
	const hasSelectionFeedback = selectedSide !== null;
	const currentMatchKey = matchData
		? `${roundNumber}-${currentMatchNumber}-${matchData.leftId}-${matchData.rightId}`
		: `${roundNumber}-${currentMatchNumber}`;

	const quitTournament = useCallback(() => {
		handleQuit();
		tournamentActions.resetTournament();
		navigate("/");
	}, [handleQuit, tournamentActions, navigate]);

	if (isComplete) {
		return (
			<TournamentComplete
				totalMatches={totalMatches}
				participantCount={visibleNames.length}
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

	return (
		<div className="relative flex min-h-[82dvh] w-full flex-col overflow-x-hidden overflow-y-auto font-display text-foreground selection:bg-primary/30 sm:min-h-[88dvh]">
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
								<span>Pick the side that should advance.</span>
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
					{roundAnnouncement.value !== null && `Round ${roundAnnouncement.value} begins.`}
					{voteAnnouncement.value && `${voteAnnouncement.value} advances.`}
					{streakBurst.value &&
						`${streakBurst.value.winnerName} is on a ${streakBurst.value.streak} win streak.`}
				</div>

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
							key={`streak-burst-${streakBurst.value.key}`}
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
												key={`streak-flame-${streakBurst.value.key}-${i}`}
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
							isVoting={isVoting}
							isSelected={selectedSide === "left"}
							hasSelectionFeedback={hasSelectionFeedback}
							isTeam={matchData.leftIsTeam}
							members={matchData.leftMembers}
							description={matchData.leftDescription}
							pronunciation={matchData.leftPronunciation}
							onKeyDown={(event) => handleKeyDown(event, "left")}
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
								Tap a card or press Enter to send it forward.
							</p>
						</div>

						<MatchSideCard
							side="right"
							name={matchData.rightName}
							img={rightImg}
							heatLevel={rightHeatLevel}
							streak={rightStreak}
							isVoting={isVoting}
							isSelected={selectedSide === "right"}
							hasSelectionFeedback={hasSelectionFeedback}
							isTeam={matchData.rightIsTeam}
							members={matchData.rightMembers}
							description={matchData.rightDescription}
							pronunciation={matchData.rightPronunciation}
							onKeyDown={(event) => handleKeyDown(event, "right")}
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
