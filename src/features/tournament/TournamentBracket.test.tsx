import { describe, expect, it } from "vitest";
import type { MatchRecord, NameItem, Team } from "@/shared/types";
import { deriveVisualBracketTree } from "./TournamentBracket";

describe("TournamentBracket derivation", () => {
	const sampleNames: NameItem[] = [
		{ id: "cat-1", name: "Nosferatu", rating: 1650, description: "The vampire feline" },
		{ id: "cat-2", name: "Shadow", rating: 1520, description: "Stealthy void cat" },
		{ id: "cat-3", name: "Luna", rating: 1480, description: "Moonlit tabby" },
		{ id: "cat-4", name: "Milo", rating: 1400, description: "Orange ginger boy" },
	];

	it("derives a 4-contender bracket tree in initial state", () => {
		const bracketEntrants = ["cat-1", "cat-2", "cat-3", "cat-4"];
		const tree = deriveVisualBracketTree({
			bracketEntrants,
			matchHistory: [],
			names: sampleNames,
			totalRounds: 2,
			tournamentMode: "1v1",
		});

		expect(tree.totalEntrants).toBe(4);
		expect(tree.totalRounds).toBe(2);
		expect(tree.totalMatches).toBe(3);
		expect(tree.completedMatches).toBe(0);
		expect(tree.rounds).toHaveLength(2);

		// Round 1 (Semifinals) has 2 matches
		const r1 = tree.rounds[0];
		expect(r1.matches).toHaveLength(2);
		expect(r1.matches[0].contender1?.name).toBe("Nosferatu");
		expect(r1.matches[0].contender2?.name).toBe("Shadow");
		expect(r1.matches[0].status).toBe("active");
		expect(r1.matches[0].isCurrentMatch).toBe(true);

		expect(r1.matches[1].contender1?.name).toBe("Luna");
		expect(r1.matches[1].contender2?.name).toBe("Milo");
		expect(r1.matches[1].status).toBe("upcoming");

		// Round 2 (Finals) has 1 match with placeholders
		const r2 = tree.rounds[1];
		expect(r2.matches).toHaveLength(1);
		expect(r2.matches[0].status).toBe("upcoming");
		expect(r2.matches[0].contender1).toBeNull();
		expect(tree.champion).toBeNull();
	});

	it("progresses correctly as matchHistory entries are added", () => {
		const bracketEntrants = ["cat-1", "cat-2", "cat-3", "cat-4"];

		// Match 1: Nosferatu beats Shadow
		const history1: MatchRecord[] = [
			{
				match: {
					mode: "1v1",
					left: "cat-1",
					right: "cat-2",
				},
				winner: "cat-1",
				loser: "cat-2",
				voteType: "head_to_head",
				matchNumber: 1,
				roundNumber: 1,
				timestamp: Date.now(),
			},
		];

		const treeAfterM1 = deriveVisualBracketTree({
			bracketEntrants,
			matchHistory: history1,
			names: sampleNames,
			totalRounds: 2,
			tournamentMode: "1v1",
		});

		expect(treeAfterM1.completedMatches).toBe(1);
		const r1M1 = treeAfterM1.rounds[0].matches[0];
		expect(r1M1.status).toBe("completed");
		expect(r1M1.winnerId).toBe("cat-1");
		expect(r1M1.contender1?.isWinner).toBe(true);
		expect(r1M1.contender2?.isLoser).toBe(true);

		// Match 2 is now active
		const r1M2 = treeAfterM1.rounds[0].matches[1];
		expect(r1M2.status).toBe("active");
		expect(r1M2.isCurrentMatch).toBe(true);

		// Finals match now has Nosferatu in top slot
		const r2 = treeAfterM1.rounds[1];
		expect(r2.matches[0].contender1?.name).toBe("Nosferatu");
		expect(r2.matches[0].contender2).toBeNull();

		// Match 2: Luna beats Milo
		const history2: MatchRecord[] = [
			...history1,
			{
				match: {
					mode: "1v1",
					left: "cat-3",
					right: "cat-4",
				},
				winner: "cat-3",
				loser: "cat-4",
				voteType: "head_to_head",
				matchNumber: 2,
				roundNumber: 1,
				timestamp: Date.now(),
			},
		];

		const treeAfterM2 = deriveVisualBracketTree({
			bracketEntrants,
			matchHistory: history2,
			names: sampleNames,
			totalRounds: 2,
			tournamentMode: "1v1",
		});

		// Now Finals match is active with Nosferatu vs Luna
		const r2Match = treeAfterM2.rounds[1].matches[0];
		expect(r2Match.status).toBe("active");
		expect(r2Match.contender1?.name).toBe("Nosferatu");
		expect(r2Match.contender2?.name).toBe("Luna");
	});

	it("crowns the champion when the championship match completes", () => {
		const bracketEntrants = ["cat-1", "cat-2", "cat-3", "cat-4"];
		const fullHistory: MatchRecord[] = [
			{
				match: { mode: "1v1", left: "cat-1", right: "cat-2" },
				winner: "cat-1",
				loser: "cat-2",
				voteType: "head_to_head",
				matchNumber: 1,
				roundNumber: 1,
				timestamp: Date.now(),
			},
			{
				match: { mode: "1v1", left: "cat-3", right: "cat-4" },
				winner: "cat-3",
				loser: "cat-4",
				voteType: "head_to_head",
				matchNumber: 2,
				roundNumber: 1,
				timestamp: Date.now(),
			},
			{
				match: { mode: "1v1", left: "cat-1", right: "cat-3" },
				winner: "cat-1",
				loser: "cat-3",
				voteType: "head_to_head",
				matchNumber: 3,
				roundNumber: 2,
				timestamp: Date.now(),
			},
		];

		const tree = deriveVisualBracketTree({
			bracketEntrants,
			matchHistory: fullHistory,
			names: sampleNames,
			totalRounds: 2,
			tournamentMode: "1v1",
		});

		expect(tree.completedMatches).toBe(3);
		expect(tree.champion).not.toBeNull();
		expect(tree.champion?.name).toBe("Nosferatu");
		expect(tree.champion?.isWinner).toBe(true);
	});

	it("handles BYEs in bracket accurately", () => {
		const entrantsWithBye = ["cat-1", "__BYE__1_1", "cat-3", "cat-4"];
		const tree = deriveVisualBracketTree({
			bracketEntrants: entrantsWithBye,
			matchHistory: [],
			names: sampleNames,
			totalRounds: 2,
			tournamentMode: "1v1",
		});

		// First match is a BYE auto-advance for cat-1
		const r1M1 = tree.rounds[0].matches[0];
		expect(r1M1.status).toBe("bye");
		expect(r1M1.winnerId).toBe("cat-1");

		// Finals match immediately receives cat-1 in top slot
		expect(tree.rounds[1].matches[0].contender1?.name).toBe("Nosferatu");
	});

	it("supports 2v2 team tournaments", () => {
		const sampleTeams: Team[] = [
			{ id: "team-1", memberIds: ["cat-1", "cat-2"], memberNames: ["Nosferatu", "Shadow"] },
			{ id: "team-2", memberIds: ["cat-3", "cat-4"], memberNames: ["Luna", "Milo"] },
		];

		const tree = deriveVisualBracketTree({
			bracketEntrants: ["team-1", "team-2"],
			matchHistory: [],
			names: sampleNames,
			teams: sampleTeams,
			totalRounds: 1,
			tournamentMode: "2v2",
		});

		expect(tree.rounds[0].matches[0].contender1?.name).toBe("Nosferatu + Shadow");
		expect(tree.rounds[0].matches[0].contender1?.isTeam).toBe(true);
		expect(tree.rounds[0].matches[0].contender2?.name).toBe("Luna + Milo");
	});
});
