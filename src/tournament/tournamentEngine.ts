import {
	applyEloMatchUpdate,
	calculatePairEloUpdate,
	ELO_RATING,
	getExpectedEloScore,
	getRandomCatImage,
	shuffleArray,
} from "@/lib/utils";
import type { Match, MatchRecord, NameItem, Team, TournamentMode } from "@/types";

// ============================================================================
// ELO RATING SYSTEM HELPERS & CLASSES
// ============================================================================

export class EloRating {
	constructor(
		public defaultRating: number = ELO_RATING.DEFAULT_RATING,
		public kFactor: number = ELO_RATING.DEFAULT_K_FACTOR,
	) {}
	getExpectedScore(ra: number, rb: number) {
		return getExpectedEloScore(ra, rb, {
			ratingDivisor: ELO_RATING.RATING_DIVISOR,
		});
	}
	calculateNewRatings(
		ra: number,
		rb: number,
		outcome: string,
		stats?: { winsA: number; lossesA: number; winsB: number; lossesB: number },
	) {
		const result = calculatePairEloUpdate({
			leftRating: ra,
			rightRating: rb,
			outcome: outcome === "left" || outcome === "right" ? outcome : "tie",
			leftStats: {
				wins: stats?.winsA,
				losses: stats?.lossesA,
			},
			rightStats: {
				wins: stats?.winsB,
				losses: stats?.lossesB,
			},
			config: {
				kFactor: this.kFactor,
				defaultRating: this.defaultRating,
				minRating: ELO_RATING.MIN_RATING,
				maxRating: ELO_RATING.MAX_RATING,
				ratingDivisor: ELO_RATING.RATING_DIVISOR,
				newPlayerGameThreshold: ELO_RATING.NEW_PLAYER_GAME_THRESHOLD,
				newPlayerKMultiplier: ELO_RATING.NEW_PLAYER_K_MULTIPLIER,
			},
		});

		return {
			newRatingA: result.newRatingA,
			newRatingB: result.newRatingB,
			winsA: result.winsA,
			lossesA: result.lossesA,
			winsB: result.winsB,
			lossesB: result.lossesB,
		};
	}
}

export function resolveTournamentMode(selectedCount: number): TournamentMode {
	return selectedCount >= 4 && selectedCount % 4 === 0 ? "2v2" : "1v1";
}

export function generateRandomTeams(participants: Array<{ id: string; name: string }>): Team[] {
	const shuffled = shuffleArray(participants);
	const teams: Team[] = [];

	for (let i = 0; i + 1 < shuffled.length; i += 2) {
		const first = shuffled[i];
		const second = shuffled[i + 1];
		if (!first || !second) {
			continue;
		}
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
	const safeTotal = Math.max(1, totalRounds);
	const remaining = safeTotal - safeRound;

	if (remaining <= 0) {
		return "Final";
	}
	if (remaining === 1) {
		return "Semifinal";
	}
	if (remaining === 2) {
		return "Quarterfinal";
	}
	return `Round ${safeRound}`;
}

// ============================================================================
// HEAT & STREAK VISUAL HELPERS
// ============================================================================

export type HeatLevel = "warm" | "hot" | "blazing";

export const STREAK_THRESHOLDS = {
	warm: 3,
	hot: 5,
	blazing: 7,
} as const;

export function getHeatLevel(streak: number): HeatLevel | null {
	if (streak >= STREAK_THRESHOLDS.blazing) {
		return "blazing";
	}
	if (streak >= STREAK_THRESHOLDS.hot) {
		return "hot";
	}
	if (streak >= STREAK_THRESHOLDS.warm) {
		return "warm";
	}
	return null;
}

export function getHeatCardClasses(heatLevel: HeatLevel | null): string {
	switch (heatLevel) {
		case "blazing":
			return "ring-2 ring-orange-500/80 shadow-lg";
		case "hot":
			return "ring-2 ring-amber-500/70 shadow-md";
		case "warm":
			return "ring-1 ring-orange-400/50 shadow-sm";
		default:
			return "";
	}
}

export function getHeatTextClasses(heatLevel: HeatLevel): string {
	switch (heatLevel) {
		case "blazing":
			return "text-orange-200 border-orange-300/45 bg-orange-500/15";
		case "hot":
			return "text-amber-200 border-amber-300/45 bg-amber-500/15";
		default:
			return "text-orange-100 border-orange-300/35 bg-orange-500/10";
	}
}

export function getHeatGradientClasses(heatLevel: HeatLevel): string {
	switch (heatLevel) {
		case "blazing":
			return "bg-gradient-to-t from-orange-500/45 via-amber-400/25 to-transparent";
		case "hot":
			return "bg-gradient-to-t from-orange-500/35 via-amber-300/20 to-transparent";
		default:
			return "bg-gradient-to-t from-orange-500/20 via-amber-200/10 to-transparent";
	}
}

export function getFlameCount(streak: number, max = 8): number {
	return Math.min(max, Math.max(3, Math.round(streak * 1.2)));
}

// ============================================================================
// MATCH NORMALIZATION & DATA EXTRACTION
// ============================================================================

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
	if (typeof participant === "object" && participant !== null) {
		return String(participant.id);
	}
	return String(participant);
}

export function getMatchSideId(match: Match, side: "left" | "right"): string {
	return getFastParticipantId(match[side]);
}

interface StreakCacheEntry {
	len: number;
	map: Map<string, number>;
}

const streakCache = new WeakMap<MatchRecord[], StreakCacheEntry>();

export function getContestantStreak(
	contestantId: string | number | null | undefined,
	matchHistory?: MatchRecord[] | null,
): number {
	if (!contestantId || !matchHistory || matchHistory.length === 0) {
		return 0;
	}
	let entry = streakCache.get(matchHistory);
	if (!entry || entry.len !== matchHistory.length) {
		entry = { len: matchHistory.length, map: new Map<string, number>() };
		streakCache.set(matchHistory, entry);
	}
	const targetId = String(contestantId);
	const cached = entry.map.get(targetId);
	if (cached !== undefined) {
		return cached;
	}
	const streak = calculateWinStreak(targetId, matchHistory);
	entry.map.set(targetId, streak);
	return streak;
}

export function calculateWinStreak(
	contestantId: string | number | null | undefined,
	matchHistory?: MatchRecord[] | null,
): number {
	if (!contestantId || !matchHistory || matchHistory.length === 0) {
		return 0;
	}
	const targetId = String(contestantId);
	let streak = 0;
	for (let i = matchHistory.length - 1; i >= 0; i--) {
		const record = matchHistory[i];
		if (!record?.match) {
			continue;
		}
		const leftId = getFastParticipantId(record.match.left);
		const rightId = getFastParticipantId(record.match.right);
		if (leftId !== targetId && rightId !== targetId) {
			continue;
		}
		if (String(record.winner) === targetId) {
			streak++;
		} else {
			break;
		}
	}
	return streak;
}

interface MatchSideData {
	leftId: string;
	rightId: string;
	leftName: string;
	rightName: string;
	leftMembers: string[];
	rightMembers: string[];
	leftIsTeam: boolean;
	rightIsTeam: boolean;
	leftDescription?: string;
	rightDescription?: string;
	leftPronunciation?: string;
	rightPronunciation?: string;
}

export function extractMatchData(match: Match): MatchSideData {
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

// ============================================================================
// BRACKET DERIVATION ENGINE & METRICS
// ============================================================================

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

const bracketStateCache = new Map<string, BracketDerivation>();
const roundCache = new Map<string, number>();
const MAX_CACHE_SIZE = 100;

function evictIfNeeded<V>(cache: Map<string, V>, limit: number): void {
	while (cache.size > limit) {
		const firstKey = cache.keys().next().value;
		if (firstKey) {
			cache.delete(firstKey);
		} else {
			break;
		}
	}
}

function setBracketCache(key: string, result: BracketDerivation): BracketDerivation {
	bracketStateCache.set(key, result);
	evictIfNeeded(bracketStateCache, MAX_CACHE_SIZE);
	return result;
}

function makePendingResult(
	totalMatches: number,
	cursor: number,
	round: number,
	totalRounds: number,
	activeRoundSize: number,
	left: string,
	right: string,
	cacheKey?: string,
): BracketDerivation {
	const result = {
		isComplete: false,
		totalMatches,
		completedMatches: cursor,
		round,
		totalRounds,
		stageLabel: getBracketStageLabel(round, totalRounds),
		roundSize: activeRoundSize,
		pendingMatchIds: { leftId: left, rightId: right },
	};
	if (cacheKey) {
		return setBracketCache(cacheKey, result);
	}
	return result;
}

const entrantsKeyCache = new WeakMap<string[], string>();

function getCacheKey(bracketEntrants: string[], matchHistory: MatchRecord[]): string {
	let entrantsKey = entrantsKeyCache.get(bracketEntrants);
	if (entrantsKey === undefined) {
		entrantsKey = bracketEntrants.join(",");
		entrantsKeyCache.set(bracketEntrants, entrantsKey);
	}

	const historyLen = matchHistory.length;
	if (historyLen === 0) {
		return `${entrantsKey}:`;
	}

	const parts = new Array<string>(historyLen);
	for (let i = 0; i < historyLen; i++) {
		const rec = matchHistory[i];
		parts[i] = rec ? `${rec.winner}-${rec.loser}` : "";
	}

	return `${entrantsKey}:${parts.join("|")}`;
}

function getCachedRound(entrantsCount: number): number {
	if (!Number.isFinite(entrantsCount) || entrantsCount <= 1) {
		return 1;
	}
	const cacheKey = `round_${entrantsCount}`;
	const cached = roundCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	const round = Math.max(1, Math.ceil(Math.log2(Math.max(2, entrantsCount))));
	roundCache.set(cacheKey, round);
	evictIfNeeded(roundCache, 50);

	return round;
}

const BYE_PREFIX = "__BYE__";

export function nextPowerOfTwo(value: number): number {
	if (value <= 1) {
		return 1;
	}
	return 2 ** Math.ceil(Math.log2(value));
}

export function isBye(id: string | null | undefined): boolean {
	return Boolean(id?.startsWith(BYE_PREFIX));
}

function createBye(round: number, index: number): string {
	return `${BYE_PREFIX}${round}_${index}`;
}

export function padForRound(entrants: string[], round: number = 1): string[] {
	if (entrants.length <= 1) {
		return entrants;
	}
	const targetSize = nextPowerOfTwo(entrants.length);
	if (entrants.length === targetSize) {
		return entrants;
	}
	const padded = entrants.slice();
	while (padded.length < targetSize) {
		padded.push(createBye(round, padded.length));
	}
	return padded;
}

export function createIdToNameMap(names: NameItem[]): Map<string, NameItem> {
	const map = new Map<string, NameItem>();
	for (const n of names) {
		map.set(String(n.id), n);
	}
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
	const cacheKey = getCacheKey(bracketEntrants, matchHistory);
	const cached = bracketStateCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const entrants: string[] = [];
	let totalEntrants = 0;
	for (const rawId of bracketEntrants) {
		const id = String(rawId);
		if (id) {
			entrants.push(id);
			if (!isBye(id)) {
				totalEntrants++;
			}
		}
	}

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

		return setBracketCache(cacheKey, result);
	}

	const totalMatches = Math.max(0, totalEntrants - 1);
	const totalRounds = getCachedRound(totalEntrants);
	let round = 1;
	let cursor = 0;
	let currentRoundEntrants = padForRound(entrants, round);

	while (currentRoundEntrants.length > 1) {
		const winners: string[] = [];
		let activeRoundSize = 0;
		for (let i = 0; i < currentRoundEntrants.length; i++) {
			if (!isBye(currentRoundEntrants[i])) {
				activeRoundSize++;
			}
		}

		for (let i = 0; i < currentRoundEntrants.length; i += 2) {
			const left = currentRoundEntrants[i];
			const right = currentRoundEntrants[i + 1];
			const leftBye = !left || isBye(left);
			const rightBye = !right || isBye(right);

			if (leftBye && rightBye) {
				continue;
			}
			if (leftBye) {
				winners.push(right as string);
				continue;
			}
			if (rightBye) {
				winners.push(left as string);
				continue;
			}

			const record = matchHistory[cursor];
			if (!record?.winner) {
				return makePendingResult(
					totalMatches,
					cursor,
					round,
					totalRounds,
					activeRoundSize,
					left,
					right,
					cacheKey,
				);
			}

			if (record.winner === left || record.winner === right) {
				winners.push(record.winner);
				cursor += 1;
			} else {
				cursor += 1;
				bracketStateCache.delete(cacheKey);
				return makePendingResult(
					totalMatches,
					cursor - 1,
					round,
					totalRounds,
					activeRoundSize,
					left,
					right,
				);
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

	return setBracketCache(cacheKey, result);
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
	const progress =
		totalMatches > 0
			? Math.min(
					100,
					Math.max(0, Math.round((Math.min(completedMatches, totalMatches) / totalMatches) * 100)),
				)
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
	const winnerSide = isLeftWinner ? "left" : "right";

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

// ============================================================================
// VISUAL BRACKET UTILITIES (Consolidated from bracketUtils.ts)
// ============================================================================

export interface VisualContender {
	id: string;
	name: string;
	isBye: boolean;
	isWinner: boolean;
	isLoser: boolean;
	rating?: number;
	seed?: number;
	avatarUrl?: string | null;
	isTeam?: boolean;
	members?: string[];
	description?: string;
	pronunciation?: string;
	streak?: number;
}

export interface VisualMatch {
	id: string;
	overallMatchNumber?: number;
	roundNumber: number;
	roundName: string;
	matchIndex: number;
	contender1: VisualContender | null;
	contender2: VisualContender | null;
	winnerId: string | null;
	loserId: string | null;
	status: "completed" | "active" | "upcoming" | "bye";
	isCurrentMatch: boolean;
	placeholder1Text?: string;
	placeholder2Text?: string;
	targetMatchId?: string;
	targetSlot?: 0 | 1;
}

export interface VisualRound {
	roundNumber: number;
	roundName: string;
	matches: VisualMatch[];
	isCurrentRound: boolean;
	isCompleted: boolean;
}

export interface VisualBracketTree {
	rounds: VisualRound[];
	champion: VisualContender | null;
	totalEntrants: number;
	totalRounds: number;
	totalMatches: number;
	completedMatches: number;
	activeMatch: VisualMatch | null;
}

function createSeedMap(bracketEntrants: string[]): Map<string, number> {
	const seedMap = new Map<string, number>();
	let seedCounter = 1;
	for (let i = 0; i < bracketEntrants.length; i++) {
		const id = bracketEntrants[i];
		if (!isBye(id) && !seedMap.has(id)) {
			seedMap.set(id, seedCounter++);
		}
	}
	return seedMap;
}

export function areContendersEqual(
	c1?: VisualContender | null,
	c2?: VisualContender | null,
): boolean {
	if (c1 === c2) {
		return true;
	}
	if (!c1 || !c2) {
		return false;
	}
	return (
		c1.id === c2.id &&
		c1.name === c2.name &&
		c1.isWinner === c2.isWinner &&
		c1.isLoser === c2.isLoser &&
		c1.rating === c2.rating &&
		c1.streak === c2.streak &&
		c1.seed === c2.seed &&
		c1.isBye === c2.isBye
	);
}

export function areMatchNodePropsEqual<
	T extends {
		match: VisualMatch;
		highlightedContenderId?: string | null;
		onSelectMatch?: (match: VisualMatch) => void;
		onSelectContender?: (id: string) => void;
		onVoteForSide?: (side: "left" | "right") => void;
	},
>(prev: T, next: T): boolean {
	if (
		prev.highlightedContenderId !== next.highlightedContenderId ||
		prev.onSelectMatch !== next.onSelectMatch ||
		prev.onSelectContender !== next.onSelectContender ||
		prev.onVoteForSide !== next.onVoteForSide
	) {
		return false;
	}

	const pm = prev.match;
	const nm = next.match;
	if (pm === nm) {
		return true;
	}

	return (
		pm.id === nm.id &&
		pm.status === nm.status &&
		pm.isCurrentMatch === nm.isCurrentMatch &&
		pm.overallMatchNumber === nm.overallMatchNumber &&
		pm.placeholder1Text === nm.placeholder1Text &&
		pm.placeholder2Text === nm.placeholder2Text &&
		areContendersEqual(pm.contender1, nm.contender1) &&
		areContendersEqual(pm.contender2, nm.contender2)
	);
}

export function buildVisualContender({
	id,
	seed,
	namesMap,
	teamsMap,
	ratings,
	tournamentMode,
	isWinner = false,
	isLoser = false,
	matchHistory,
}: {
	id: string;
	seed?: number;
	namesMap: Map<string, NameItem>;
	teamsMap: Map<string, Team>;
	ratings: Record<string, number>;
	tournamentMode: TournamentMode;
	isWinner?: boolean;
	isLoser?: boolean;
	matchHistory?: MatchRecord[];
}): VisualContender {
	if (isBye(id)) {
		return {
			id,
			name: "BYE",
			isBye: true,
			isWinner: false,
			isLoser: false,
		};
	}

	const streak = getContestantStreak(id, matchHistory);

	if (tournamentMode === "2v2") {
		const team = teamsMap.get(id);
		const teamName = team ? team.memberNames.join(" + ") : id;
		const memberNames = team ? team.memberNames : [id];
		const rating = ratings[id] ?? 1500;

		return {
			id,
			name: teamName,
			isBye: false,
			isWinner,
			isLoser,
			rating,
			seed,
			isTeam: true,
			members: memberNames,
			avatarUrl: null,
			streak,
		};
	}

	const nameItem = namesMap.get(id);
	const catName = nameItem?.name ?? id;
	const rating = ratings[id] ?? nameItem?.rating ?? 1500;
	const avatarUrl = getRandomCatImage(id, undefined, catName);

	return {
		id,
		name: catName,
		isBye: false,
		isWinner,
		isLoser,
		rating,
		seed,
		isTeam: false,
		description: nameItem?.description,
		pronunciation: nameItem?.pronunciation,
		avatarUrl,
		streak,
	};
}

export function deriveVisualBracketTree({
	bracketEntrants = [],
	matchHistory = [],
	names = [],
	teams = [],
	ratings = {},
	totalRounds: passedTotalRounds,
	tournamentMode = "1v1",
}: {
	bracketEntrants?: string[];
	matchHistory?: MatchRecord[];
	currentMatch?: Match | null;
	names?: NameItem[];
	teams?: Team[];
	ratings?: Record<string, number>;
	totalRounds?: number;
	tournamentMode?: TournamentMode;
}): VisualBracketTree {
	const namesMap = createIdToNameMap(names);
	const teamsMap = createTeamsById(teams);

	let totalEntrants = 0;
	let firstRealEntrant: string | null = null;
	for (let i = 0; i < bracketEntrants.length; i++) {
		const id = bracketEntrants[i];
		if (!isBye(id)) {
			totalEntrants++;
			if (!firstRealEntrant) {
				firstRealEntrant = id;
			}
		}
	}

	if (totalEntrants < 2) {
		const singleContender = firstRealEntrant
			? buildVisualContender({
					id: firstRealEntrant,
					seed: 1,
					namesMap,
					teamsMap,
					ratings,
					tournamentMode,
					isWinner: true,
					matchHistory,
				})
			: null;

		return {
			rounds: [],
			champion: singleContender,
			totalEntrants,
			totalRounds: 1,
			totalMatches: 0,
			completedMatches: 0,
			activeMatch: null,
		};
	}

	const calcRounds = Math.max(1, Math.ceil(Math.log2(totalEntrants)));
	const totalRounds = passedTotalRounds ?? calcRounds;
	const totalMatches = Math.max(0, totalEntrants - 1);
	const completedMatches = matchHistory.length;

	const seedMap = createSeedMap(bracketEntrants);

	let currentRoundEntrants: (string | null)[] = padForRound(bracketEntrants);
	let historyCursor = 0;
	let matchSequenceCounter = 1;
	let activeMatchNode: VisualMatch | null = null;

	const rounds: VisualRound[] = [];

	for (let r = 1; r <= totalRounds; r++) {
		const matchCount = Math.max(1, Math.floor(currentRoundEntrants.length / 2));
		const nextRoundEntrants: (string | null)[] = [];
		const roundMatches: VisualMatch[] = [];
		const stageLabel = getBracketStageLabel(r, totalRounds);

		for (let m = 0; m < matchCount; m++) {
			const leftId = currentRoundEntrants[2 * m] ?? null;
			const rightId = currentRoundEntrants[2 * m + 1] ?? null;
			const matchId = `r${r}-m${m}`;
			const targetMatchId = r < totalRounds ? `r${r + 1}-m${Math.floor(m / 2)}` : undefined;
			const targetSlot = (m % 2) as 0 | 1;

			const leftIsBye = isBye(leftId);
			const rightIsBye = isBye(rightId);

			let status: VisualMatch["status"] = "upcoming";
			let winnerId: string | null = null;
			let loserId: string | null = null;
			let isCurrentMatch = false;
			let overallMatchNumber: number | undefined;

			if (leftIsBye && rightIsBye) {
				status = "bye";
				nextRoundEntrants.push(null);
			} else if (leftIsBye && rightId) {
				status = "bye";
				winnerId = rightId;
				loserId = leftId;
				nextRoundEntrants.push(rightId);
			} else if (rightIsBye && leftId) {
				status = "bye";
				winnerId = leftId;
				loserId = rightId;
				nextRoundEntrants.push(leftId);
			} else if (leftId && rightId) {
				overallMatchNumber = matchSequenceCounter++;

				if (historyCursor < matchHistory.length) {
					const record = matchHistory[historyCursor];
					status = "completed";
					winnerId = String(record.winner);
					loserId = String(record.loser);
					nextRoundEntrants.push(winnerId);
					historyCursor++;
				} else if (historyCursor === matchHistory.length) {
					status = "active";
					isCurrentMatch = true;
					nextRoundEntrants.push(null);
					historyCursor++;
				} else {
					status = "upcoming";
					nextRoundEntrants.push(null);
					historyCursor++;
				}
			} else {
				status = "upcoming";
				nextRoundEntrants.push(null);
			}

			const contender1 = leftId
				? buildVisualContender({
						id: leftId,
						seed: r === 1 ? seedMap.get(leftId) : undefined,
						namesMap,
						teamsMap,
						ratings,
						tournamentMode,
						isWinner: winnerId === leftId && !leftIsBye,
						isLoser: loserId === leftId,
						matchHistory,
					})
				: null;

			const contender2 = rightId
				? buildVisualContender({
						id: rightId,
						seed: r === 1 ? seedMap.get(rightId) : undefined,
						namesMap,
						teamsMap,
						ratings,
						tournamentMode,
						isWinner: winnerId === rightId && !rightIsBye,
						isLoser: loserId === rightId,
						matchHistory,
					})
				: null;

			const placeholder1Text = contender1
				? undefined
				: r > 1
					? `Winner R${r - 1}·M${2 * m + 1}`
					: "TBD";
			const placeholder2Text = contender2
				? undefined
				: r > 1
					? `Winner R${r - 1}·M${2 * m + 2}`
					: "TBD";

			const matchNode: VisualMatch = {
				id: matchId,
				overallMatchNumber,
				roundNumber: r,
				roundName: stageLabel,
				matchIndex: m,
				contender1,
				contender2,
				winnerId,
				loserId,
				status,
				isCurrentMatch,
				placeholder1Text,
				placeholder2Text,
				targetMatchId,
				targetSlot,
			};

			if (isCurrentMatch) {
				activeMatchNode = matchNode;
			}

			roundMatches.push(matchNode);
		}

		const isRoundCompleted = roundMatches.every(
			(m) => m.status === "completed" || m.status === "bye",
		);
		const isCurrentRound = roundMatches.some((m) => m.status === "active");

		rounds.push({
			roundNumber: r,
			roundName: stageLabel,
			matches: roundMatches,
			isCurrentRound,
			isCompleted: isRoundCompleted,
		});

		currentRoundEntrants = nextRoundEntrants;
	}

	const finalRound = rounds[rounds.length - 1];
	const finalMatch = finalRound?.matches[0];
	let champion: VisualContender | null = null;

	if (finalMatch && finalMatch.status === "completed" && finalMatch.winnerId) {
		champion = buildVisualContender({
			id: finalMatch.winnerId,
			namesMap,
			teamsMap,
			ratings,
			tournamentMode,
			isWinner: true,
			matchHistory,
		});
	}

	return {
		rounds,
		champion,
		totalEntrants,
		totalRounds,
		totalMatches,
		completedMatches,
		activeMatch: activeMatchNode,
	};
}
