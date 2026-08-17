import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorComponent } from "@/shared/components/layout/Feedback/ErrorBoundary";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getRandomCatImage } from "@/shared/lib/media";
import { getVisibleNames } from "@/shared/lib/names/nameFilters";
import type { TournamentProps } from "@/shared/types";
import useAppStore from "@/store/appStore";
import { MatchSideCard } from "./components/MatchSideCard";
import { TournamentAnnouncements } from "./components/TournamentAnnouncements";
import { TournamentComplete } from "./components/TournamentComplete";
import { TournamentHeader } from "./components/TournamentHeader";
import { useAudioManager } from "./hooks/useAudioManager";
import { useTournamentCompletion } from "./hooks/useTournamentCompletion";
import { useTournamentKeyboard } from "./hooks/useTournamentKeyboard";
import { useTournamentState } from "./hooks/useTournamentState";
import { useTournamentViewData } from "./hooks/useTournamentViewData";
import { useVoteHandler } from "./hooks/useVoteHandler";
import type { HeatLevel } from "./utils/heat";
import { useTimedState } from "./utils/useTimedState";

interface StreakBurst {
	key: number;
	side: "left" | "right";
	winnerName: string;
	streak: number;
	heatLevel: HeatLevel;
}

const OPENING_BRACKET_REVEAL_MS = 2200;

function TournamentContent({
	onComplete,
	names = [],
	onVote,
}: TournamentProps) {
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

	const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(
		null,
	);
	const voteAnnouncement = useTimedState<string | null>(null);
	const roundAnnouncement = useTimedState<number | null>(null);
	const streakBurst = useTimedState<StreakBurst | null>(null);
	const openingBracketReveal = useTimedState(false);
	const previousRoundRef = useRef(roundNumber);
	const openingRevealSignatureRef = useRef<string | null>(null);

	const handleVoteAdapter = useVoteHandler({
		onVote,
		currentMatch,
		ratings,
	});

	useTournamentCompletion({
		isComplete,
		onComplete,
		matchHistory,
		ratings,
		audioManager,
	});

	const {
		matchData,
		leftStreak,
		rightStreak,
		leftHeatLevel,
		rightHeatLevel,
		dominantStreak,
		leftRating,
		rightRating,

		leftIsFavored,
		rightIsFavored,
		matchesRemaining,
		roundMatchesLeft,
		stageHeadline,
		pressureCopy,
		matchupTone,
	} = useTournamentViewData({
		currentMatch,
		matchHistory,
		ratings,
		currentMatchNumber,
		totalMatches,
		roundNumber,
		totalRounds,
	});

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
			roundAnnouncement.setTimed(
				roundNumber,
				prefersReducedMotion ? 350 : 1200,
			);
		}
		previousRoundRef.current = roundNumber;
	}, [
		roundNumber,
		isComplete,
		audioManager,
		roundAnnouncement,
		prefersReducedMotion,
	]);

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
		openingBracketReveal.setTimed(
			true,
			prefersReducedMotion ? 700 : OPENING_BRACKET_REVEAL_MS,
		);
	}, [openingRevealSignature, openingBracketReveal, prefersReducedMotion]);

	const handleVoteForSide = useCallback(
		(side: "left" | "right") => {
			if (isVoting || openingBracketReveal.value || !matchData) {
				return;
			}

			const winnerId = side === "left" ? matchData.leftId : matchData.rightId;
			const loserId = side === "left" ? matchData.rightId : matchData.leftId;
			const winnerName =
				side === "left" ? matchData.leftName : matchData.rightName;
			const expectedStreak = (side === "left" ? leftStreak : rightStreak) + 1;
			const heatLevel = side === "left" ? leftHeatLevel : rightHeatLevel;

			if (heatLevel) {
				streakBurst.setTimed(
					{
						key: Date.now(),
						side,
						winnerName,
						streak: expectedStreak,
						heatLevel,
					},
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
			leftHeatLevel,
			rightHeatLevel,
			streakBurst,
			prefersReducedMotion,
			voteAnnouncement,
			handleVoteWithAnimation,
			onVote,
			handleVoteAdapter,
		],
	);

	const { handleKeyDown } = useTournamentKeyboard({
		isComplete,
		matchData,
		isVoting,
		openingBracketReveal: openingBracketReveal.value,
		canUndo,
		handleUndo,
		handleVoteForSide,
	});

	const leftImg = matchData
		? getRandomCatImage(matchData.leftId, CAT_IMAGES)
		: null;
	const rightImg = matchData
		? getRandomCatImage(matchData.rightId, CAT_IMAGES)
		: null;
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

	const progressWidth = progress || (currentMatchNumber / totalMatches) * 100;

	return (
		<div className="relative flex min-h-[82dvh] w-full flex-col overflow-x-hidden overflow-y-auto font-display text-foreground selection:bg-primary/30 sm:min-h-[88dvh]">
			<TournamentHeader
				roundNumber={roundNumber}
				totalRounds={totalRounds}
				bracketStage={bracketStage}
				tournamentMode={tournamentMode}
				currentMatchNumber={currentMatchNumber}
				totalMatches={totalMatches}
				etaMinutes={etaMinutes}
				audioManager={audioManager}
				canUndo={canUndo}
				handleUndo={handleUndo}
				quitTournament={quitTournament}
				progressWidth={progressWidth}
				stageHeadline={stageHeadline}
				dominantStreak={dominantStreak}
				matchupTone={matchupTone}
				pressureCopy={pressureCopy}
				matchesRemaining={matchesRemaining}
				roundMatchesLeft={roundMatchesLeft}
			/>

			<main className="relative flex min-h-0 flex-1 flex-col items-center justify-start px-1 py-3 sm:px-4 sm:py-5 sm:justify-center">
				<div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
					<div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-primary/20 animate-blob animation-delay-2000" />
					<div className="absolute right-0 top-1/4 h-24 w-24 rounded-full bg-stardust/20 animate-blob" />
					<div className="absolute bottom-1/4 left-1/4 h-28 w-28 rounded-full bg-primary/15 animate-blob animation-delay-4000" />
					<div className="absolute bottom-0 right-1/3 h-36 w-36 rounded-full bg-stardust/15 animate-blob animation-delay-2000" />
				</div>

				<TournamentAnnouncements
					prefersReducedMotion={prefersReducedMotion}
					openingBracketReveal={openingBracketReveal.value}
					openingEntrants={openingEntrants}
					tournamentMode={tournamentMode}
					totalRounds={totalRounds}
					voteAnnouncement={voteAnnouncement.value}
					currentMatchKey={currentMatchKey}
					streakBurst={streakBurst.value}
					roundAnnouncement={roundAnnouncement.value}
				/>

				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={currentMatchKey}
						initial={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, y: 14, filter: "blur(6px)" }
						}
						animate={
							prefersReducedMotion
								? { opacity: 1 }
								: { opacity: 1, y: 0, filter: "blur(0px)" }
						}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, y: -12, filter: "blur(6px)" }
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

						<div
							className="flex w-full flex-row items-center justify-center gap-3 py-1 sm:w-24 sm:flex-col sm:gap-3"
							aria-hidden="true"
						>
							<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-bold italic tracking-tight shadow-lg sm:h-16 sm:w-16 sm:text-2xl">
								VS
							</div>
							<div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60 sm:text-[11px]">
								{dominantStreak
									? `Hot streak x${dominantStreak.streak}`
									: "Choose one"}
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
