import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getRandomCatImage } from "@/shared/lib/media";

import type { NameItem, RatingData, TournamentMatch } from "@/shared/types";
import useAppStore from "@/store/appStore";
import { getHeatLevel, type HeatLevel } from "../utils/heat";
import { extractMatchData, getMatchSideId } from "../utils/matchHelpers";
import { useTimedState } from "../utils/useTimedState";
import { useAudioManager } from ".";
export interface StreakBurst {
	key: number;
	side: "left" | "right";
	winnerName: string;
	streak: number;
	heatLevel: HeatLevel;
}
export const OPENING_BRACKET_REVEAL_MS = 2200;
export function getStageHeadline(round: number, totalRounds: number): string {
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
interface UseTournamentUIStateProps {
	onComplete?: (ratings: Record<string, RatingData>) => void;
	names?: NameItem[];
	onVote?: (data: {
		match: TournamentMatch;
		result: number;
		ratings: Record<string, number>;
		timestamp: string;
	}) => void | Promise<void>;
	tournament: ReturnType<typeof import("./useTournamentState").useTournamentState>;
}
export function useTournamentUIState({
	onComplete,
	names = [],
	onVote,
	tournament,
}: UseTournamentUIStateProps) {
	const navigate = useNavigate();
	const tournamentActions = useAppStore((state) => state.tournamentActions);
	const audioManager = useAudioManager();
	const prefersReducedMotion = useReducedMotion();
	const {
		currentMatch,
		ratings,
		openingEntrants,
		isComplete,
		tournamentMode,
		round: roundNumber,
		matchNumber: currentMatchNumber,
		handleQuit,
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
				let name = "";
				if (currentMatch.mode === "2v2") {
					const teamParticipant = participant as { memberNames?: string[] };
					name = (teamParticipant.memberNames ?? []).join(" + ") || id;
				} else {
					name =
						typeof participant === "object" && "name" in participant
							? String((participant as { name: string }).name)
							: String(participant);
				}
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
	const idToName = useMemo(() => new Map(names.map((n) => [String(n.id), n.name])), [names]);
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
	return {
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
	};
}
