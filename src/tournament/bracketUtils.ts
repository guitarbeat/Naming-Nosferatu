import { getRandomCatImage } from "@/lib/uiUtils";
import type { Match, MatchRecord, NameItem, Team, TournamentMode } from "@/types";
import {
	BYE_PREFIX,
	createIdToNameMap,
	createTeamsById,
	getBracketStageLabel,
	getContestantStreak,
	isBye,
	nextPowerOfTwo,
	padForRound,
} from "./tournamentEngine";

export const isByeId = isBye;
export const padEntrantsForRound = padForRound;

export { BYE_PREFIX, nextPowerOfTwo };

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

export function createSeedMap(bracketEntrants: string[]): Map<string, number> {
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
		onSelectMatch?: (match: any) => void;
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
	if (isByeId(id)) {
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
		if (!isByeId(id)) {
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

	let currentRoundEntrants: (string | null)[] = padEntrantsForRound(bracketEntrants);
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

			const leftIsBye = isByeId(leftId);
			const rightIsBye = isByeId(rightId);

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
