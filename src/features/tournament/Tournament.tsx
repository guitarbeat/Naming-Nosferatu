import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type KeyboardEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorComponent } from "@/shared/components/layout/Feedback";
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
import { getRandomCatImage } from "@/shared/lib/media";
import { getVisibleNames } from "@/shared/lib/names/nameFilters";
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

const OPENING_BRACKET_REVEAL_MS = 2200;

function isInteractiveTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	const tagName = target.tagName;
	return (
		tagName === "INPUT" ||
		tagName === "TEXTAREA" ||
		tagName === "SELECT" ||
		target.isContentEditable
	);
}

function getStageHeadline(round: number, totalRounds: number): string {
	if (round >= totalRounds) {
		return "Championship pick";
	}
	if (totalRounds - round === 1) {
		return "Final four pressure";
	}
	if (round <= 1) {
		return "Opening chaos";
	}
	return "Bracket pressure";
}

function getPressureCopy({
	round,
	totalRounds,
	currentMatchNumber,
	totalMatches,
	ratingGap,
}: {
	round: number;
	totalRounds: number;
	currentMatchNumber: number;
	totalMatches: number;
	ratingGap: number;
}): string {
	if (round >= totalRounds) {
		return "Last decision. Winner takes the crown.";
	}
	if (ratingGap <= 24) {
		return "Too close to call. Go with the name that survives on vibe alone.";
	}
	if (currentMatchNumber >= totalMatches - 1) {
		return "The bracket is nearly locked. Every pick now reshapes the podium.";
	}
	if (round <= 1) {
		return "Set the tone early. One upset can warp the whole tournament path.";
	}
	return "Momentum matters now. Protect a streak or torch the favorite.";
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
	const openingBracketReveal = useTimedState(false);
	const previousRoundRef = useRef(roundNumber);
	const openingRevealSignatureRef = useRef<string | null>(null);

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
						? ((currentMatch[side] as any).memberNames ?? []).join(" + ") ||
							String((currentMatch[side] as any).id)
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

	const openingRevealSignature =
		currentMatch && currentMatchNumber === 1 && matchHistory.length === 0
			? `${tournamentMode}:${openingEntrants.map((entrant) => entrant.id).join("|")}`
			: null;

	useEffect(() => {
		if (!openingRevealSignature) {
			return;
		}
		if (openingRevealSignatureRef.current === openingRevealSignature) {
			return;
		}

		openingRevealSignatureRef.current = openingRevealSignature;
		openingBracketReveal.setTimed(true, prefersReducedMotion ? 700 : OPENING_BRACKET_REVEAL_MS);
	}, [openingRevealSignature, openingBracketReveal, prefersReducedMotion]);

	const handleVoteForSide = useCallback(
		(side: "left" | "right") => {
			if (isVoting || openingBracketReveal.value || !matchData) {
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
			openingBracketReveal.value,
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

	useEffect(() => {
		if (isComplete || !matchData) {
			return;
		}

		const handleWindowKeydown = (event: globalThis.KeyboardEvent) => {
			if (
				isVoting ||
				openingBracketReveal.value ||
				isInteractiveTarget(event.target) ||
				event.metaKey ||
				event.ctrlKey ||
				event.altKey
			) {
				return;
			}

			const key = event.key.toLowerCase();
			if (key === "arrowleft" || key === "a") {
				event.preventDefault();
				handleVoteForSide("left");
				return;
			}
			if (key === "arrowright" || key === "d") {
				event.preventDefault();
				handleVoteForSide("right");
				return;
			}
			if ((key === "u" || key === "backspace") && canUndo) {
				event.preventDefault();
				handleUndo();
			}
		};

		window.addEventListener("keydown", handleWindowKeydown);
		return () => window.removeEventListener("keydown", handleWindowKeydown);
	}, [
		canUndo,
		handleUndo,
		handleVoteForSide,
		isComplete,
		isVoting,
		matchData,
		openingBracketReveal.value,
	]);

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
	const leftRating = ratings[matchData.leftId] ?? 1500;
	const rightRating = ratings[matchData.rightId] ?? 1500;
	const ratingGap = Math.abs(leftRating - rightRating);
	const leftIsFavored = leftRating > rightRating;
	const rightIsFavored = rightRating > leftRating;
	const matchesRemaining = Math.max(0, totalMatches - currentMatchNumber);
	const roundMatchesLeft = Math.max(0, Math.ceil((totalMatches - currentMatchNumber) / 2));
	const stageHeadline = getStageHeadline(roundNumber, totalRounds);
	const pressureCopy = getPressureCopy({
		round: roundNumber,
		totalRounds,
		currentMatchNumber,
		totalMatches,
		ratingGap,
	});
	const matchupTone =
		ratingGap <= 24
			? "Dead heat"
			: leftIsFavored
				? `${matchData.leftName} leads by ${Math.round(ratingGap)}`
				: `${matchData.rightName} leads by ${Math.round(ratingGap)}`;

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

			<main className="relative flex min-h-0 flex-1 flex-col items-center justify-start px-1 py-3 sm:px-4 sm:py-5 sm:justify-center">
				<div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
					<div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-primary/20 animate-blob animation-delay-2000" />
					<div className="absolute right-0 top-1/4 h-24 w-24 rounded-full bg-stardust/20 animate-blob" />
					<div className="absolute bottom-1/4 left-1/4 h-28 w-28 rounded-full bg-primary/15 animate-blob animation-delay-4000" />
					<div className="absolute bottom-0 right-1/3 h-36 w-36 rounded-full bg-stardust/15 animate-blob animation-delay-2000" />
				</div>

				<div className="sr-only" aria-live="polite">
					{openingBracketReveal.value && "The bracket is set. First match begins now."}
					{roundAnnouncement.value !== null && `Round ${roundAnnouncement.value} begins.`}
					{voteAnnouncement.value && `${voteAnnouncement.value} advances.`}
					{streakBurst.value &&
						`${streakBurst.value.winnerName} is on a ${streakBurst.value.streak} win streak.`}
				</div>

				<AnimatePresence>
					{openingBracketReveal.value && openingEntrants.length > 1 && (
						<motion.div
							initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
							exit={
								prefersReducedMotion
									? { opacity: 0 }
									: { opacity: 0, scale: 1.03, filter: "blur(6px)" }
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
							rating={leftRating}
							isFavored={leftIsFavored}
							shortcutHint="A / ←"
							isVoting={isVoting || openingBracketReveal.value}
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
								Tap a card or use the keyboard to send it forward.
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
							shortcutHint="D / →"
							isVoting={isVoting || openingBracketReveal.value}
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
