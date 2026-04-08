import { ELO_RATING } from "@/shared/lib/constants";
import type { Team, TeamMatch, TournamentMode } from "@/shared/types";
import {
	applyEloMatchUpdate,
	calculatePairEloUpdate,
	getExpectedEloScore,
	updateEloRating,
} from "./pureElo";
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
	updateRating(r: number, exp: number, act: number, games = 0) {
		return updateEloRating({
			rating: r,
			expectedScore: exp,
			actualScore: act,
			gamesPlayed: games,
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

function shuffleArray<T>(items: T[]): T[] {
	const shuffled = [...items];
	for (let i = shuffled.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = shuffled[i];
		shuffled[i] = shuffled[j] as T;
		shuffled[j] = temp as T;
	}
	return shuffled;
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

export function buildTeamMatches(teams: Team[]): TeamMatch[] {
	const matches: TeamMatch[] = [];
	for (let i = 0; i < teams.length - 1; i += 1) {
		for (let j = i + 1; j < teams.length; j += 1) {
			const left = teams[i];
			const right = teams[j];
			if (!left || !right) {
				continue;
			}
			matches.push({ leftTeamId: left.id, rightTeamId: right.id });
		}
	}
	return matches;
}

export function applyTeamMatchElo({
	elo,
	ratings,
	leftTeam,
	rightTeam,
	winnerSide,
}: {
	elo: EloRating;
	ratings: Record<string, number>;
	leftTeam: Team;
	rightTeam: Team;
	winnerSide: "left" | "right";
}): Record<string, number> {
	return applyEloMatchUpdate({
		ratings,
		leftParticipantIds: leftTeam.memberIds,
		rightParticipantIds: rightTeam.memberIds,
		winnerSide,
		config: {
			defaultRating: elo.defaultRating,
			kFactor: elo.kFactor,
			minRating: ELO_RATING.MIN_RATING,
			maxRating: ELO_RATING.MAX_RATING,
			ratingDivisor: ELO_RATING.RATING_DIVISOR,
			newPlayerGameThreshold: ELO_RATING.NEW_PLAYER_GAME_THRESHOLD,
			newPlayerKMultiplier: ELO_RATING.NEW_PLAYER_K_MULTIPLIER,
		},
	}).ratings;
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
