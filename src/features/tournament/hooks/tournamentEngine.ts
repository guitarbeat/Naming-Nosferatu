import { applyEloMatchUpdate } from "@/features/tournament/services/pureElo";
import { getBracketStageLabel } from "@/features/tournament/services/tournament";
import type { Match, MatchRecord, NameItem, Team, TournamentMode } from "@/shared/types";

export interface HistoryEntry {
	match: Match;
	ratings: Record<string, number>;
	round: number;
	matchNumber: number;
}

interface TournamentMetrics {
	totalMatches: number;
	completedMatches: number;
	matchNumber: number;
	roundSize: number;
	round: number;
	totalRounds: number;
	stageLabel: string;
	progress: number;
	etaMinutes: number;
}

interface BracketDerivation {
	isComplete: boolean;
	totalMatches: number;
	completedMatches: number;
	round: number;
	totalRounds: number;
	stageLabel: string;
	roundSize: number;
	pendingMatchIds: { leftId: string; rightId: string } | null;
}

// Cache for bracket state calculations - enhanced with round-based caching
const bracketStateCache = new Map<string, BracketDerivation>();
const roundCache = new Map<string, number>(); // Cache round calculations by entrants count
const MAX_CACHE_SIZE = 100;

function getCacheKey(bracketEntrants: string[], matchHistory: MatchRecord[]): string {
	let key = "";
	const validEntrants: string[] = [];

	for (let i = 0; i < bracketEntrants.length; i++) {
		const e = bracketEntrants[i];
		if (e) validEntrants.push(String(e));
	}
	validEntrants.sort();

	for (let i = 0; i < validEntrants.length; i++) {
		if (i > 0) key += ",";
		key += validEntrants[i];
	}

	key += ":";

	for (let i = 0; i < matchHistory.length; i++) {
		if (i > 0) key += "|";
		const m = matchHistory[i];
		key += `${m.left}-${m.right}-${m.winner}`;
	}

	return key;
}

// Enhanced round caching with fallback calculation
function getCachedRound(entrantsCount: number): number {
	const cacheKey = `round_${entrantsCount}`;
	const cached = roundCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	// Calculate and cache the round
	const round = Math.max(1, Math.ceil(Math.log2(entrantsCount)));
	roundCache.set(cacheKey, round);

	// Maintain cache size
	if (roundCache.size > 50) {
		const firstKey = roundCache.keys().next().value;
		if (firstKey) {
			roundCache.delete(firstKey);
		}
	}

	return round;
}

const BYE_PREFIX = "__BYE__";

function nextPowerOfTwo(value: number): number {
	if (value <= 1) {
		return 1;
	}
	return 2 ** Math.ceil(Math.log2(value));
}

function isBye(id: string): boolean {
	return id.startsWith(BYE_PREFIX);
}

function createBye(round: number, index: number): string {
	return `${BYE_PREFIX}${round}_${index}`;
}

function padForRound(entrants: string[], round: number): string[] {
	if (entrants.length <= 1) {
		return entrants;
	}
	const targetSize = nextPowerOfTwo(entrants.length);
	const padded = [...entrants];
	while (padded.length < targetSize) {
		padded.push(createBye(round, padded.length));
	}
	return padded;
}

export function createIdToNameMap(names: NameItem[]): Map<string, NameItem> {
	const map = new Map<string, NameItem>();
	names.forEach((n) => {
		map.set(String(n.id), n);
	});
	return map;
}

export function createTeamsById(teams: Team[]): Map<string, Team> {
	const map = new Map<string, Team>();
	for (const team of teams) {
		map.set(team.id, team);
	}
	return map;
}

export function deriveBracketState(
	bracketEntrants: string[],
	matchHistory: MatchRecord[],
): BracketDerivation {
	// Check cache first
	const cacheKey = getCacheKey(bracketEntrants, matchHistory);
	const cached = bracketStateCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const entrants = bracketEntrants.map(String).filter(Boolean);
	const realEntrants = entrants.filter((id) => !isBye(id));
	const totalEntrants = realEntrants.length;

	if (totalEntrants < 2) {
		const result = {
			isComplete: true,
			totalMatches: 0,
			completedMatches: 0,
			round: 1,
			totalRounds: 1,
			stageLabel: "Final",
			roundSize: totalEntrants,
			pendingMatchIds: null,
		};

		// Cache and return result
		bracketStateCache.set(cacheKey, result);
		if (bracketStateCache.size > MAX_CACHE_SIZE) {
			// Clear oldest entries when cache gets too large
			const firstKey = bracketStateCache.keys().next().value;
			if (firstKey) {
				bracketStateCache.delete(firstKey);
			}
		}

		return result;
	}

	const totalMatches = Math.max(0, totalEntrants - 1);
	const totalRounds = getCachedRound(totalEntrants); // Use cached round calculation
	let round = 1;
	let cursor = 0;
	let currentRoundEntrants = padForRound(entrants, round);

	while (currentRoundEntrants.length > 1) {
		const winners: string[] = [];
		const activeRoundSize = currentRoundEntrants.filter((id) => !isBye(id)).length;

		for (let i = 0; i < currentRoundEntrants.length; i += 2) {
			const left = currentRoundEntrants[i];
			const right = currentRoundEntrants[i + 1];
			if (!left && !right) {
				continue;
			}
			if (!left) {
				if (right) {
					winners.push(right);
				}
				continue;
			}
			if (!right) {
				winners.push(left);
				continue;
			}
			if (isBye(left) && isBye(right)) {
				continue;
			}
			if (isBye(left)) {
				winners.push(right);
				continue;
			}
			if (isBye(right)) {
				winners.push(left);
				continue;
			}

			const record = matchHistory[cursor];
			if (!record || !record.winner) {
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

			if (record.winner === left || record.winner === right) {
				winners.push(record.winner);
				cursor += 1;
			} else {
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
		}

		if (winners.length <= 1) {
			break;
		}

		round += 1;
		currentRoundEntrants = padForRound(winners, round);
	}

	const result = {
		isComplete: true,
		totalMatches,
		completedMatches: Math.min(cursor, totalMatches),
		round: totalRounds,
		totalRounds,
		stageLabel: getBracketStageLabel(totalRounds, totalRounds),
		roundSize: 1,
		pendingMatchIds: null,
	};

	// Cache and return result
	bracketStateCache.set(cacheKey, result);
	if (bracketStateCache.size > MAX_CACHE_SIZE) {
		// Clear oldest entries when cache gets too large
		const firstKey = bracketStateCache.keys().next().value;
		if (firstKey) {
			bracketStateCache.delete(firstKey);
		}
	}

	return result;
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
	if (!pendingMatchIds) {
		return null;
	}

	if (tournamentMode === "2v2") {
		const leftTeam = teamsById.get(pendingMatchIds.leftId);
		const rightTeam = teamsById.get(pendingMatchIds.rightId);
		if (!leftTeam || !rightTeam) {
			return null;
		}
		return {
			mode: "2v2",
			left: leftTeam,
			right: rightTeam,
		};
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

export function calculateTournamentMetrics({
	derived,
}: {
	derived: BracketDerivation;
}): TournamentMetrics {
	const { totalMatches, completedMatches, round, totalRounds, stageLabel, roundSize, isComplete } =
		derived;
	const matchNumber = isComplete ? completedMatches : completedMatches + 1;
	const progress = totalMatches
		? Math.round((Math.min(completedMatches, totalMatches) / totalMatches) * 100)
		: 0;
	const etaMinutes =
		!totalMatches || completedMatches >= totalMatches
			? 0
			: Math.ceil(((totalMatches - completedMatches) * 3) / 60);

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
	loserId,
}: {
	currentMatch: Match;
	ratingsSnapshot: Record<string, number>;
	winnerId: string;
	loserId: string;
}): Record<string, number> {
	void loserId;

	const leftParticipantIds =
		currentMatch.mode === "2v2" ? currentMatch.left.memberIds : [String(currentMatch.left.id)];
	const rightParticipantIds =
		currentMatch.mode === "2v2" ? currentMatch.right.memberIds : [String(currentMatch.right.id)];
	const winnerSide = leftParticipantIds.includes(winnerId) ? "left" : "right";

	return applyEloMatchUpdate({
		ratings: ratingsSnapshot,
		leftParticipantIds,
		rightParticipantIds,
		winnerSide,
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
