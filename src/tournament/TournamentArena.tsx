import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loading } from "@/components/UiPrimitives";
import { MatchSideCard, type OrbMemberInfo } from "@/components/ui/MatchSideCard";
import { TournamentHeader } from "@/components/ui/TournamentHeader";
import { useTimedState } from "@/hooks/useCommonHooks";
import { useTournamentState } from "@/hooks/useTournamentState";
import { getVisibleNames, hapticVoteTap, normalizeRatingsWithStats } from "@/lib/utils";
import type { NameItem, TournamentProps } from "@/types";
import { TournamentBracketModal } from "./TournamentBracket";
import { TournamentComplete } from "./TournamentComplete";
import {
	extractMatchData,
	getContestantStreak,
	getHeatLevel,
	getMatchSideId,
	STREAK_THRESHOLDS,
} from "./tournamentEngine";

function resolveSideOrbMembers(
	namesLookup: Map<string, NameItem>,
	sideId: string,
	sideName: string,
	memberNames: string[],
	sideDescription?: string,
	sidePronunciation?: string,
): OrbMemberInfo[] {
	if (memberNames.length > 1) {
		return memberNames.map((memberName, idx) => {
			const matched = namesLookup.get(memberName.toLowerCase());
			return {
				id: matched ? String(matched.id) : `${sideId}-${idx}`,
				name: matched?.name ?? memberName,
				description: matched?.description,
				pronunciation: matched?.pronunciation,
			};
		});
	}
	const single = namesLookup.get(sideId.toLowerCase()) ?? namesLookup.get(sideName.toLowerCase());
	return [
		{
			id: single ? String(single.id) : sideId,
			name: single?.name ?? sideName,
			description: single?.description ?? sideDescription,
			pronunciation: single?.pronunciation ?? sidePronunciation,
		},
	];
}

export const TournamentArena = memo(function TournamentArena({
	names,
	onComplete,
	userName,
}: TournamentProps) {
	const [bracketModalOpen, setBracketModalOpen] = useState(false);
	const activeNames = useMemo(() => getVisibleNames(names), [names]);
	const namesLookup = useMemo(() => {
		const map = new Map<string, NameItem>();
		for (const item of activeNames) {
			map.set(String(item.id).toLowerCase(), item);
			map.set(item.name.trim().toLowerCase(), item);
		}
		return map;
	}, [activeNames]);

	const ts = useTournamentState(activeNames, userName);
	const { value: selectedSide, setTimed: setSelectedSide } = useTimedState<"left" | "right" | null>(
		null,
	);

	const hasNotifiedCompleteRef = useRef(false);

	useEffect(() => {
		if (!ts.isComplete || ts.totalMatches === 0) {
			hasNotifiedCompleteRef.current = false;
			return;
		}
		if (!hasNotifiedCompleteRef.current) {
			hasNotifiedCompleteRef.current = true;
			onComplete(normalizeRatingsWithStats(ts.ratings));
		}
	}, [ts.isComplete, ts.totalMatches, onComplete, ts.ratings]);

	const onVoteSide = useCallback(
		(side: "left" | "right") => {
			if (!ts.currentMatch || ts.isVoting) {
				return;
			}
			hapticVoteTap(15);
			setSelectedSide(side, 280);
			const leftId = getMatchSideId(ts.currentMatch, "left");
			const rightId = getMatchSideId(ts.currentMatch, "right");
			ts.handleVoteWithAnimation(
				side === "left" ? leftId : rightId,
				side === "left" ? rightId : leftId,
			);
		},
		[ts, setSelectedSide],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (bracketModalOpen || ts.isVoting || !ts.currentMatch) {
				return;
			}
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				onVoteSide("left");
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				onVoteSide("right");
			} else if ((e.key === "u" || e.key === "U") && ts.canUndo) {
				e.preventDefault();
				ts.handleUndo();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [bracketModalOpen, ts, onVoteSide]);

	if (ts.isComplete) {
		return (
			<TournamentComplete
				totalMatches={ts.totalMatches}
				participantCount={activeNames.length}
				onNewTournament={ts.handleQuit}
				bracketEntrants={ts.bracketEntrants}
				matchHistory={ts.matchHistory}
				names={activeNames}
				teams={ts.teams}
				ratings={ts.ratings}
				totalRounds={ts.totalRounds}
				tournamentMode={ts.tournamentMode}
			/>
		);
	}

	if (!ts.currentMatch) {
		return (
			<div className="w-full min-h-[400px] flex items-center justify-center">
				<Loading variant="spinner" text="Setting up matches..." />
			</div>
		);
	}

	const m = extractMatchData(ts.currentMatch);
	const leftOrbMembers = resolveSideOrbMembers(
		namesLookup,
		m.leftId,
		m.leftName,
		m.leftMembers,
		m.leftDescription,
		m.leftPronunciation,
	);
	const rightOrbMembers = resolveSideOrbMembers(
		namesLookup,
		m.rightId,
		m.rightName,
		m.rightMembers,
		m.rightDescription,
		m.rightPronunciation,
	);
	const leftStreak = getContestantStreak(m.leftId, ts.matchHistory);
	const rightStreak = getContestantStreak(m.rightId, ts.matchHistory);
	const leftHeat = getHeatLevel(leftStreak);
	const rightHeat = getHeatLevel(rightStreak);
	const dominantStreak =
		leftStreak >= rightStreak && leftStreak >= STREAK_THRESHOLDS.warm && leftHeat
			? { name: m.leftName, streak: leftStreak, heatLevel: leftHeat }
			: rightStreak >= STREAK_THRESHOLDS.warm && rightHeat
				? { name: m.rightName, streak: rightStreak, heatLevel: rightHeat }
				: null;

	return (
		<div className="w-full flex flex-col flex-1 max-w-5xl mx-auto pb-8">
			<TournamentHeader
				roundNumber={ts.round}
				totalRounds={ts.totalRounds}
				bracketStage={ts.bracketStage}
				tournamentMode={ts.tournamentMode}
				currentMatchNumber={ts.matchNumber}
				totalMatches={ts.totalMatches}
				etaMinutes={ts.etaMinutes}
				canUndo={ts.canUndo}
				handleUndo={ts.handleUndo}
				quitTournament={ts.handleQuit}
				onOpenBracket={() => setBracketModalOpen(true)}
				progressWidth={ts.progress}
				dominantStreak={dominantStreak}
				matchupTone="Head-to-Head Matchup"
				pressureCopy="Click a card or press Left / Right arrow keys to vote"
			/>

			<div className="flex-1 flex flex-col md:flex-row items-stretch justify-center gap-4 sm:gap-8 px-2 sm:px-4 mt-6">
				<MatchSideCard
					side="left"
					name={m.leftName}
					orbMembers={leftOrbMembers}
					heatLevel={leftHeat}
					streak={leftStreak}
					rating={ts.ratings[m.leftId] ?? 1200}
					isVoting={ts.isVoting}
					isSelected={selectedSide === "left"}
					hasSelectionFeedback={Boolean(selectedSide)}
					isTeam={m.leftIsTeam}
					description={m.leftDescription}
					pronunciation={m.leftPronunciation}
					onVote={() => onVoteSide("left")}
				/>
				<div className="flex items-center justify-center my-auto shrink-0 py-2">
					<div className="size-10 sm:size-12 rounded-full border border-border/40 bg-card/90 shadow-sm flex items-center justify-center font-display font-black text-xs text-muted-foreground">
						VS
					</div>
				</div>
				<MatchSideCard
					side="right"
					name={m.rightName}
					orbMembers={rightOrbMembers}
					heatLevel={rightHeat}
					streak={rightStreak}
					rating={ts.ratings[m.rightId] ?? 1200}
					isVoting={ts.isVoting}
					isSelected={selectedSide === "right"}
					hasSelectionFeedback={Boolean(selectedSide)}
					isTeam={m.rightIsTeam}
					description={m.rightDescription}
					pronunciation={m.rightPronunciation}
					onVote={() => onVoteSide("right")}
				/>
			</div>

			<TournamentBracketModal
				isOpen={bracketModalOpen}
				onClose={() => setBracketModalOpen(false)}
				bracketEntrants={ts.bracketEntrants}
				matchHistory={ts.matchHistory}
				currentMatch={ts.currentMatch}
				names={activeNames}
				teams={ts.teams}
				ratings={ts.ratings}
				totalRounds={ts.totalRounds}
				tournamentMode={ts.tournamentMode}
				onVote={(w, l) => ts.handleVote(w, l)}
			/>
		</div>
	);
});
