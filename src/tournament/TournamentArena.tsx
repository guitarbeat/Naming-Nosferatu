import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CatImage, Loading } from "@/components/UiPrimitives";
import { useTimedState } from "@/hooks/useCommonHooks";
import { useTournamentState } from "@/hooks/useTournamentState";
import {
	getRandomCatImage,
	getVisibleNames,
	hapticVoteTap,
	MOTION_DURATIONS,
	normalizeRatingsWithStats,
} from "@/lib/utils";
import type { TournamentProps } from "@/types";
import { TournamentBracketModal } from "./TournamentBracket";
import { TournamentComplete, TournamentHeader } from "./TournamentComplete";
import {
	extractMatchData,
	getContestantStreak,
	getHeatCardClasses,
	getHeatGradientClasses,
	getHeatLevel,
	getMatchSideId,
	type HeatLevel,
	STREAK_THRESHOLDS,
} from "./tournamentEngine";

interface MatchSideCardProps {
	side: "left" | "right";
	name: string;
	img: string | null;
	heatLevel: HeatLevel | null;
	streak: number;
	rating: number;
	isVoting: boolean;
	isSelected: boolean;
	hasSelectionFeedback: boolean;
	isTeam: boolean;
	members: string[];
	description?: string;
	pronunciation?: string;
	onVote: () => void;
}

const MatchSideCard = memo(function MatchSideCard({
	side,
	name,
	img,
	heatLevel,
	streak,
	rating,
	isVoting,
	isSelected,
	hasSelectionFeedback,
	isTeam,
	members,
	description,
	pronunciation,
	onVote,
}: MatchSideCardProps) {
	const isRight = side === "right";
	return (
		<motion.div
			className="relative flex-1 flex flex-col w-full h-full"
			initial={{ opacity: 0, y: isRight ? 12 : -12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: MOTION_DURATIONS.base }}
		>
			<button
				type="button"
				onClick={onVote}
				disabled={isVoting}
				className={`group relative flex-1 flex flex-col items-center justify-between p-5 sm:p-6 rounded-3xl border transition-all duration-200 w-full overflow-hidden text-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
					isSelected && hasSelectionFeedback
						? "border-primary ring-4 ring-primary/40 scale-[1.01] shadow-xl bg-card"
						: "border-border/60 hover:border-primary/60 bg-card/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
				} ${getHeatCardClasses(heatLevel)}`}
				aria-label={`Vote for ${name}`}
			>
				{heatLevel && (
					<div
						className={`absolute inset-0 pointer-events-none opacity-35 ${getHeatGradientClasses(heatLevel)}`}
					/>
				)}
				<div className="relative z-10 w-full flex items-center justify-between text-xs text-muted-foreground font-mono tabular-nums">
					<span>ELO {Math.round(rating)}</span>
					{streak >= STREAK_THRESHOLDS.warm && (
						<span className="flex items-center gap-1 text-orange-400 font-bold">
							<Flame className="size-3.5 fill-orange-400" />
							{streak} streak
						</span>
					)}
				</div>
				<div className="relative z-10 my-4 flex flex-col items-center gap-3">
					{img && (
						<div className="relative size-32 sm:size-40 rounded-full overflow-hidden border-4 border-card shadow-md group-hover:scale-105 transition-transform duration-200">
							<CatImage src={img} alt={name} imageClassName="size-full object-cover" />
						</div>
					)}
					<div className="space-y-1">
						<h3 className="font-display font-black text-2xl sm:text-3xl text-foreground tracking-tight group-hover:text-primary transition-colors">
							{name}
						</h3>
						{pronunciation && (
							<p className="text-xs text-muted-foreground/80 font-mono">/{pronunciation}/</p>
						)}
						{description && (
							<p className="text-xs sm:text-sm text-muted-foreground max-w-xs line-clamp-2">
								{description}
							</p>
						)}
					</div>
					{isTeam && members.length > 0 && (
						<p className="text-xs font-medium text-muted-foreground mt-1">{members.join(" · ")}</p>
					)}
				</div>
				<div className="relative z-10 w-full pt-2">
					<div className="w-full py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm tracking-wide group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
						Vote {isRight ? "Right" : "Left"}
					</div>
				</div>
			</button>
		</motion.div>
	);
});

export const TournamentArena = memo(function TournamentArena({
	names,
	onComplete,
	userName,
}: TournamentProps) {
	const [bracketModalOpen, setBracketModalOpen] = useState(false);
	const activeNames = useMemo(() => getVisibleNames(names), [names]);
	const ts = useTournamentState(activeNames, userName);
	const { value: selectedSide, setTimed: setSelectedSide } = useTimedState<"left" | "right" | null>(
		null,
	);

	useEffect(() => {
		if (ts.isComplete) {
			onComplete(normalizeRatingsWithStats(ts.ratings));
		}
	}, [ts.isComplete, onComplete, ts.ratings]);

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
					img={getRandomCatImage(m.leftId, undefined, m.leftName)}
					heatLevel={leftHeat}
					streak={leftStreak}
					rating={ts.ratings[m.leftId] ?? 1200}
					isVoting={ts.isVoting}
					isSelected={selectedSide === "left"}
					hasSelectionFeedback={Boolean(selectedSide)}
					isTeam={m.leftIsTeam}
					members={m.leftMembers}
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
					img={getRandomCatImage(m.rightId, undefined, m.rightName)}
					heatLevel={rightHeat}
					streak={rightStreak}
					rating={ts.ratings[m.rightId] ?? 1200}
					isVoting={ts.isVoting}
					isSelected={selectedSide === "right"}
					hasSelectionFeedback={Boolean(selectedSide)}
					isTeam={m.rightIsTeam}
					members={m.rightMembers}
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
