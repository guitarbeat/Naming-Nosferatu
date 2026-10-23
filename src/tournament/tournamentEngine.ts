import { applyEloMatchUpdate, shuffleArray } from "@/lib/utils";
import type { Match, MatchRecord, NameItem, Team, TournamentMode } from "@/types";

export function resolveTournamentMode(selectedCount: number): TournamentMode {
	return selectedCount >= 4 && selectedCount % 4 === 0 ? "2v2" : "1v1";
}

export function generateRandomTeams(participants: Array<{ id: string; name: string }>): Team[] {
	const shuffled = shuffleArray(participants);
	const teams: Team[] = [];
	for (let i = 0; i + 1 < shuffled.length; i += 2) {
		const first = shuffled[i];
		const second = shuffled[i + 1];
		if (!first || !second) continue;
		teams.push({
			id: `team-${teams.length + 1}`,
			memberIds: [first.id, second.id],
			memberNames: [first.name, second.name],
		});
	}
	return teams;
}

export function getBracketStageLabel(round: number, totalRounds: number): string {
	const safeRound = Math.max(1, round);
	const remaining = Math.max(1, totalRounds) - safeRound;
	if (remaining <= 0) return "Final";
	if (remaining === 1) return "Semifinal";
	if (remaining === 2) return "Quarterfinal";
	return `Round ${safeRound}`;
}

export type HeatLevel = "warm" | "hot" | "blazing";

export const STREAK_THRESHOLDS = { warm: 3, hot: 5, blazing: 7 } as const;

export function getHeatLevel(streak: number): HeatLevel | null {
	if (streak >= STREAK_THRESHOLDS.blazing) return "blazing";
	if (streak >= STREAK_THRESHOLDS.hot) return "hot";
	if (streak >= STREAK_THRESHOLDS.warm) return "warm";
	return null;
}

export function getHeatCardClasses(heatLevel: HeatLevel | null): string {
	if (heatLevel === "blazing") return "ring-2 ring-orange-500/80 shadow-lg";
	if (heatLevel === "hot") return "ring-2 ring-amber-500/70 shadow-md";
	if (heatLevel === "warm") return "ring-1 ring-orange-400/50 shadow-sm";
	return "";
}

export function getHeatTextClasses(heatLevel: HeatLevel): string {
	if (heatLevel === "blazing") return "text-orange-200 border-orange-300/45 bg-orange-500/15";
	if (heatLevel === "hot") return "text-amber-200 border-amber-300/45 bg-amber-500/15";
	return "text-orange-100 border-orange-300/35 bg-orange-500/10";
}

export function getHeatGradientClasses(heatLevel: HeatLevel): string {
	if (heatLevel === "blazing")
		return "bg-gradient-to-t from-orange-500/45 via-amber-400/25 to-transparent";
	if (heatLevel === "hot")
		return "bg-gradient-to-t from-orange-500/35 via-amber-300/20 to-transparent";
	return "bg-gradient-to-t from-orange-500/20 via-amber-200/10 to-transparent";
}

export function getFlameCount(streak: number, max = 8): number {
	return Math.min(max, Math.max(3, Math.round(streak * 1.2)));
}

interface NormalizedParticipant {
	id: string;
	name: string;
	memberIds: string[];
	memberNames: string[];
	isTeam: boolean;
	description?: string;
	pronunciation?: string;
}

export function normalizeParticipant(
	participant: Match["left"] | Match["right"],
): NormalizedParticipant {
	if (typeof participant === "object" && participant !== null) {
		if ("memberNames" in participant) {
			return {
				id: String(participant.id),
				name: (participant.memberNames ?? []).join(" + ") || String(participant.id),
				memberIds: participant.memberIds?.map(String) ?? [String(participant.id)],
				memberNames: participant.memberNames ?? [],
				isTeam: true,
			};
		}
		return {
			id: String(participant.id),
			name: participant.name,
			memberIds: [String(participant.id)],
			memberNames: [participant.name],
			isTeam: false,
			description: participant.description,
			pronunciation: (participant as NameItem).pronunciation,
		};
	}
	return {
		id: String(participant),
		name: String(participant),
		memberIds: [String(participant)],
		memberNames: [String(participant)],
		isTeam: false,
	};
}

function getFastParticipantId(participant: Match["left"] | Match["right"]): string {
	return typeof participant === "object" && participant !== null
		? String(participant.id)
		: String(participant);
}

export function getMatchSideId(match: Match, side: "left" | "right"): string {
	return getFastParticipantId(match[side]);
}

export function getContestantStreak(
	contestantId: string | number | null | undefined,
	matchHistory?: MatchRecord[] | null,
): number {
	if (!contestantId || !matchHistory || matchHistory.length === 0) return 0;
	const targetId = String(contestantId);
	let streak = 0;
	for (let i = matchHistory.length - 1; i >= 0; i--) {
		const record = matchHistory[i];
		if (!record?.match) continue;
		const leftId = getFastParticipantId(record.match.left);
		const rightId = getFastParticipantId(record.match.right);
		if (leftId !== targetId && rightId !== targetId) continue;
		if (String(record.winner) === targetId) streak++;
		else break;
	}
	return streak;
}

export function extractMatchData(match: Match) {
	const left = normalizeParticipant(match.left);
	const right = normalizeParticipant(match.right);
	return {
		leftId: left.id,
		rightId: right.id,
		leftName: left.name,
		rightName: right.name,
		leftMembers: left.memberNames,
		rightMembers: right.memberNames,
		leftIsTeam: left.isTeam,
		rightIsTeam: right.isTeam,
		leftDescription: left.description,
		rightDescription: right.description,
		leftPronunciation: left.pronunciation,
		rightPronunciation: right.pronunciation,
	};
}

export interface HistoryEntry {
	match: Match;
	ratings: Record<string, number>;
	round: number;
	matchNumber: number;
}

export interface BracketDerivation {
	isComplete: boolean;
	totalMatches: number;
	completedMatches: number;
	round: number;
	totalRounds: number;
	stageLabel: string;
	roundSize: number;
	pendingMatchIds: { leftId: string; rightId: string } | null;
}

const BYE_PREFIX = "__BYE__";

export function nextPowerOfTwo(value: number): number {
	return value <= 1 ? 1 : 2 ** Math.ceil(Math.log2(value));
}

export function isBye(id: string | null | undefined): boolean {
	return Boolean(id?.startsWith(BYE_PREFIX));
}

export function padForRound(entrants: string[], round: number = 1): string[] {
	if (entrants.length <= 1) return entrants;
	const targetSize = nextPowerOfTwo(entrants.length);
	if (entrants.length === targetSize) return entrants;
	const padded = entrants.slice();
	while (padded.length < targetSize) padded.push(`${BYE_PREFIX}${round}_${padded.length}`);
	return padded;
}

export function createIdToNameMap(names: NameItem[]): Map<string, NameItem> {
	const map = new Map<string, NameItem>();
	for (const n of names) map.set(String(n.id), n);
	return map;
}

export function createTeamsById(teams: Team[]): Map<string, Team> {
	const map = new Map<string, Team>();
	for (const team of teams) map.set(team.id, team);
	return map;
}

export function deriveBracketState(
	bracketEntrants: string[],
	matchHistory: MatchRecord[],
): BracketDerivation {
	const entrants = bracketEntrants.map(String).filter(Boolean);
	const totalEntrants = entrants.filter((id) => !isBye(id)).length;

	if (totalEntrants < 2) {
		return {
			isComplete: true,
			totalMatches: 0,
			completedMatches: 0,
			round: 1,
			totalRounds: 1,
			stageLabel: "Final",
			roundSize: totalEntrants,
			pendingMatchIds: null,
		};
	}

	const totalMatches = Math.max(0, totalEntrants - 1);
	const totalRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, totalEntrants))));
	let round = 1;
	let cursor = 0;
	let currentRoundEntrants = padForRound(entrants, round);

	while (currentRoundEntrants.length > 1) {
		const winners: string[] = [];
		const activeRoundSize = currentRoundEntrants.filter((id) => !isBye(id)).length;

		for (let i = 0; i < currentRoundEntrants.length; i += 2) {
			const left = currentRoundEntrants[i];
			const right = currentRoundEntrants[i + 1];
			const leftBye = !left || isBye(left);
			const rightBye = !right || isBye(right);

			if (leftBye && rightBye) continue;
			if (leftBye) {
				winners.push(right as string);
				continue;
			}
			if (rightBye) {
				winners.push(left as string);
				continue;
			}

			const record = matchHistory[cursor];
			if (!record?.winner || (record.winner !== left && record.winner !== right)) {
				return {
					isComplete: false,
					totalMatches,
					completedMatches: cursor,
					round,
					totalRounds,
					stageLabel: getBracketStageLabel(round, totalRounds),
					roundSize: activeRoundSize,
					pendingMatchIds: { leftId: left, rightId: right },
				};
			}
			winners.push(record.winner);
			cursor += 1;
		}

		if (winners.length <= 1) break;
		round += 1;
		currentRoundEntrants = padForRound(winners, round);
	}

	return {
		isComplete: true,
		totalMatches,
		completedMatches: Math.min(cursor, totalMatches),
		round: totalRounds,
		totalRounds,
		stageLabel: getBracketStageLabel(totalRounds, totalRounds),
		roundSize: 1,
		pendingMatchIds: null,
	};
}

export function resolveCurrentMatch({
	tournamentMode,
	pendingMatchIds,
	teamsById,
	idToNameMap,
}: {
	tournamentMode: TournamentMode;
	pendingMatchIds: { leftId: string; rightId: string } | null;
	teamsById: Map<string, Team>;
	idToNameMap: Map<string, NameItem>;
}): Match | null {
	if (!pendingMatchIds) return null;
	if (tournamentMode === "2v2") {
		const leftTeam = teamsById.get(pendingMatchIds.leftId);
		const rightTeam = teamsById.get(pendingMatchIds.rightId);
		return leftTeam && rightTeam ? { mode: "2v2", left: leftTeam, right: rightTeam } : null;
	}
	return {
		mode: "1v1",
		left: idToNameMap.get(pendingMatchIds.leftId) || {
			id: pendingMatchIds.leftId,
			name: pendingMatchIds.leftId,
		},
		right: idToNameMap.get(pendingMatchIds.rightId) || {
			id: pendingMatchIds.rightId,
			name: pendingMatchIds.rightId,
		},
	};
}

export function calculateTournamentMetrics({ derived }: { derived: BracketDerivation }) {
	const { totalMatches, completedMatches, round, totalRounds, stageLabel, roundSize, isComplete } =
		derived;
	const matchNumber = isComplete ? completedMatches : completedMatches + 1;
	const progress =
		totalMatches > 0
			? Math.min(100, Math.max(0, Math.round((completedMatches / totalMatches) * 100)))
			: 0;
	const etaMinutes =
		!totalMatches || completedMatches >= totalMatches
			? 0
			: Math.max(0, Math.ceil(((totalMatches - completedMatches) * 3) / 60));
	return {
		totalMatches,
		completedMatches,
		matchNumber,
		roundSize,
		round,
		totalRounds,
		stageLabel,
		progress,
		etaMinutes,
	};
}

export function computeUpdatedRatings({
	currentMatch,
	ratingsSnapshot,
	winnerId,
}: {
	currentMatch: Match;
	ratingsSnapshot: Record<string, number>;
	winnerId: string;
}): Record<string, number> {
	const leftParticipantIds =
		currentMatch.mode === "2v2"
			? currentMatch.left.memberIds
			: [String(typeof currentMatch.left === "string" ? currentMatch.left : currentMatch.left.id)];
	const rightParticipantIds =
		currentMatch.mode === "2v2"
			? currentMatch.right.memberIds
			: [
					String(
						typeof currentMatch.right === "string" ? currentMatch.right : currentMatch.right.id,
					),
				];
	const isLeftWinner =
		leftParticipantIds.includes(winnerId) ||
		(currentMatch.mode === "2v2" && currentMatch.left.id === winnerId);

	return applyEloMatchUpdate({
		ratings: ratingsSnapshot,
		leftParticipantIds,
		rightParticipantIds,
		winnerSide: isLeftWinner ? "left" : "right",
	}).ratings;
}

export function createMatchRecord({
	currentMatch,
	winnerId,
	loserId,
	matchNumber,
	round,
}: {
	currentMatch: Match;
	winnerId: string;
	loserId: string;
	matchNumber: number;
	round: number;
}): MatchRecord {
	return {
		match: currentMatch,
		winner: winnerId,
		loser: loserId,
		voteType: "normal",
		matchNumber,
		roundNumber: round,
		timestamp: Date.now(),
	};
}
