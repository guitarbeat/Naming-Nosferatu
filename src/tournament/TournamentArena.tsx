import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NameOrb } from "@/components/GlassEffects";
import { Loading } from "@/components/UiPrimitives";
import { TournamentComplete, TournamentHeader } from "@/components/ui/TournamentComplete";
import { useTimedState } from "@/hooks/useCommonHooks";
import { useTournamentState } from "@/hooks/useTournamentState";
import {
	getVisibleNames,
	hapticVoteTap,
	MOTION_DURATIONS,
	normalizeRatingsWithStats,
} from "@/lib/utils";
import type { NameItem, TournamentProps } from "@/types";
import { TournamentBracketModal } from "./TournamentBracket";
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

interface OrbMemberInfo {
	id: string;
	name: string;
	description?: string;
	pronunciation?: string;
}

interface MatchSideCardProps {
	side: "left" | "right";
	name: string;
	orbMembers: OrbMemberInfo[];
	heatLevel: HeatLevel | null;
	streak: number;
	rating: number;
	isVoting: boolean;
	isSelected: boolean;
	hasSelectionFeedback: boolean;
	isTeam: boolean;
	description?: string;
	pronunciation?: string;
	onVote: () => void;
}

const MatchSideCard = memo(function MatchSideCard({
	side,
	name,
	orbMembers,
	heatLevel,
	streak,
	rating,
	isVoting,
	isSelected,
	hasSelectionFeedback,
	isTeam,
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
					<span className="inline-flex items-center gap-1.5">
						<span>ELO {Math.round(rating)}</span>
						{isTeam && (
							<span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-sans text-[10px] font-bold text-primary">
								Duo Group
							</span>
						)}
					</span>
					{streak >= STREAK_THRESHOLDS.warm && (
						<span className="flex items-center gap-1 text-orange-400 font-bold">
							<Flame className="size-3.5 fill-orange-400" />
							{streak} streak
						</span>
					)}
				</div>

				<div className="relative z-10 my-5 flex flex-col items-center gap-4 w-full">
					{orbMembers.length > 1 ? (
						<div className="relative flex items-center justify-center -space-x-3 sm:-space-x-2 py-1 group-hover:scale-[1.03] transition-transform duration-200">
							{orbMembers.map((member, idx) => (
								<div
									key={`${member.id}-${idx}`}
									className={`relative transition-transform duration-200 ${
										idx === 0
											? "-rotate-3 group-hover:-translate-x-1"
											: "rotate-3 group-hover:translate-x-1"
									}`}
								>
									<NameOrb
										orbId={`${side}-${member.id}-${idx}`}
										name={member.name}
										orbitText={
											member.description ||
											(member.pronunciation ? `/${member.pronunciation}/` : "")
										}
										size={136}
									/>
								</div>
							))}
							<div className="absolute z-20 flex size-8 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-md font-display font-black text-sm">
								+
							</div>
						</div>
					) : (
						<div className="relative py-1 group-hover:scale-105 transition-transform duration-200">
							<NameOrb
								orbId={`${side}-${orbMembers[0]?.id ?? name}`}
								name={orbMembers[0]?.name ?? name}
								orbitText={
									orbMembers[0]?.description ||
									description ||
									(pronunciation ? `/${pronunciation}/` : "")
								}
								size={162}
							/>
						</div>
					)}

					<div className="space-y-1.5 max-w-sm">
						<h3 className="font-display font-black text-2xl sm:text-3xl text-foreground tracking-tight group-hover:text-primary transition-colors">
							{name}
						</h3>
						{pronunciation && !isTeam && (
							<p className="text-xs text-muted-foreground/80 font-mono">/{pronunciation}/</p>
						)}
						{isTeam && orbMembers.length > 1 ? (
							<div className="flex flex-col gap-1 pt-1">
								{orbMembers.map((member) =>
									member.description ? (
										<p
											key={member.id}
											className="text-xs text-muted-foreground line-clamp-1 leading-relaxed"
										>
											<span className="font-bold text-foreground/90">{member.name}:</span>{" "}
											{member.description}
										</p>
									) : null,
								)}
							</div>
						) : (
							description && (
								<p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto line-clamp-2">
									{description}
								</p>
							)
						)}
					</div>
				</div>

				<div className="relative z-10 w-full pt-2">
					<div className="w-full py-2.5 rounded-2xl bg-primary/15 border border-primary/30 text-primary font-bold text-sm tracking-wide group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 flex items-center justify-center gap-1.5">
						<Sparkles className="size-3.5" />
						<span>Vote {isRight ? "Right" : "Left"}</span>
					</div>
				</div>
			</button>
		</motion.div>
	);
});

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
