import { beforeEach, describe, expect, it } from "vitest";
import useAppStore from "./index";

describe("User Store Actions", () => {
	beforeEach(() => {
		useAppStore.getState().userActions.logout();
	});

	it("generates a secure user ID using UUID format upon login", () => {
		useAppStore.getState().userActions.login("TestUser");
		const user = useAppStore.getState().user;

		expect(user.isLoggedIn).toBe(true);
		expect(user.name).toBe("TestUser");
		expect(user.id).toMatch(/^user_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
	});
});

describe("Tournament Store Actions", () => {
	beforeEach(() => {
		useAppStore.getState().tournamentActions.resetTournament();
	});

	it("sets tournament names and processes ratings correctly", () => {
		const store = useAppStore.getState();
		const sampleNames = [
			{ id: "cat1", name: "Luna", rating: 1550 },
			{ id: "cat2", name: "Milo" },
		];

		store.tournamentActions.setNames(sampleNames);
		const tournament = useAppStore.getState().tournament;

		expect(tournament.names).toHaveLength(2);
		expect(tournament.names?.[0]).toEqual({
			id: "cat1",
			name: "Luna",
			rating: 1550,
		});
		expect(tournament.names?.[1]).toEqual({
			id: "cat2",
			name: "Milo",
			rating: 1500, // default fallback rating
		});
		expect(tournament.isComplete).toBe(false);
		expect(tournament.currentRound).toBe(1);
		expect(tournament.currentMatch).toBe(1);

		// Test setting names to null
		useAppStore.getState().tournamentActions.setNames(null);
		expect(useAppStore.getState().tournament.names).toBeNull();
	});

	it("processes ratings correctly when matched by id or name as object or number in setNames", () => {
		const actions = useAppStore.getState().tournamentActions;
		actions.setRatings({
			cat1: { rating: 1650, wins: 2, losses: 0 },
			Milo: 1420 as any,
		});

		actions.setNames([
			{ id: "cat1", name: "Luna" },
			{ id: "cat2", name: "Milo" },
		]);

		const tournament = useAppStore.getState().tournament;
		expect(tournament.names?.[0].rating).toBe(1650);
		expect(tournament.names?.[1].rating).toBe(1420);
	});

	it("sets ratings using direct value or updater function", () => {
		const actions = useAppStore.getState().tournamentActions;

		actions.setRatings({ cat1: { rating: 1600, wins: 1, losses: 0 } });
		expect(useAppStore.getState().tournament.ratings).toEqual({
			cat1: { rating: 1600, wins: 1, losses: 0 },
		});

		actions.setRatings((prev) => ({
			...prev,
			cat2: { rating: 1400, wins: 0, losses: 1 },
		}));
		expect(useAppStore.getState().tournament.ratings).toEqual({
			cat1: { rating: 1600, wins: 1, losses: 0 },
			cat2: { rating: 1400, wins: 0, losses: 1 },
		});
	});

	it("updates completion state with setComplete and completeTournament", () => {
		const actions = useAppStore.getState().tournamentActions;

		actions.setComplete(true);
		expect(useAppStore.getState().tournament.isComplete).toBe(true);

		actions.setComplete(false);
		expect(useAppStore.getState().tournament.isComplete).toBe(false);

		actions.completeTournament({ cat1: { rating: 1700, wins: 5, losses: 0 } });
		const state = useAppStore.getState().tournament;
		expect(state.isComplete).toBe(true);
		expect(state.ratings.cat1).toEqual({ rating: 1700, wins: 5, losses: 0 });
	});

	it("resets tournament state completely", () => {
		const actions = useAppStore.getState().tournamentActions;

		actions.setNames([{ id: "cat1", name: "Luna" }]);
		actions.setRatings({ cat1: { rating: 1600, wins: 2, losses: 0 } });
		actions.setComplete(true);

		actions.resetTournament();
		const state = useAppStore.getState().tournament;

		expect(state.names).toBeNull();
		expect(state.isComplete).toBe(false);
		expect(state.ratings).toEqual({});
		expect(state.voteHistory).toEqual([]);
		expect(state.matchHistory).toEqual([]);
		expect(state.currentRound).toBe(1);
		expect(state.currentMatch).toBe(1);
	});

	it("manages selected names with setSelection", () => {
		const actions = useAppStore.getState().tournamentActions;
		const selection = [{ id: "cat1", name: "Luna" }];

		actions.setSelection(selection);
		expect(useAppStore.getState().tournament.selectedNames).toEqual(selection);
	});

	it("records and undos votes correctly", () => {
		const actions = useAppStore.getState().tournamentActions;

		actions.recordVote("cat1", "cat2", ["member1"], ["member2"]);
		let state = useAppStore.getState().tournament;

		expect(state.voteHistory).toHaveLength(1);
		expect(state.voteHistory[0].winnerId).toBe("cat1");
		expect(state.voteHistory[0].loserId).toBe("cat2");
		expect(state.voteHistory[0].winnerMemberIds).toEqual(["member1"]);
		expect(state.voteHistory[0].loserMemberIds).toEqual(["member2"]);

		actions.recordVote("cat2", "cat3");
		expect(useAppStore.getState().tournament.voteHistory).toHaveLength(2);

		actions.undoVote();
		state = useAppStore.getState().tournament;
		expect(state.voteHistory).toHaveLength(1);
		expect(state.voteHistory[0].winnerId).toBe("cat1");
	});

	it("popping matchHistory alongside voteHistory in undoVote when matchHistory exists", () => {
		const actions = useAppStore.getState().tournamentActions;
		actions.syncTournamentProgress({
			matchHistory: [
				{ round: 1, match: 1, winnerId: "cat1", loserId: "cat2" } as any,
				{ round: 1, match: 2, winnerId: "cat2", loserId: "cat3" } as any,
			],
			voteHistory: [
				{ winnerId: "cat1", loserId: "cat2", timestamp: 100 },
				{ winnerId: "cat2", loserId: "cat3", timestamp: 200 },
			],
		});

		actions.undoVote();
		const state = useAppStore.getState().tournament;
		expect(state.voteHistory).toHaveLength(1);
		expect(state.matchHistory).toHaveLength(1);
		expect(state.matchHistory?.[0]).toEqual({
			round: 1,
			match: 1,
			winnerId: "cat1",
			loserId: "cat2",
		});
	});

	it("syncs tournament progress and merges ratings", () => {
		const actions = useAppStore.getState().tournamentActions;

		actions.setRatings({ cat1: { rating: 1500, wins: 0, losses: 0 } });
		actions.syncTournamentProgress({
			currentRound: 2,
			currentMatch: 3,
			ratings: { cat2: { rating: 1550, wins: 1, losses: 0 } },
		});

		const state = useAppStore.getState().tournament;
		expect(state.currentRound).toBe(2);
		expect(state.currentMatch).toBe(3);
		expect(state.ratings).toEqual({
			cat1: { rating: 1500, wins: 0, losses: 0 },
			cat2: { rating: 1550, wins: 1, losses: 0 },
		});
		expect(state.lastUpdated).toBeDefined();
	});

	it("preserves existing ratings in syncTournamentProgress when ratings update is omitted", () => {
		const actions = useAppStore.getState().tournamentActions;
		actions.setRatings({ cat1: { rating: 1500, wins: 1, losses: 0 } });
		actions.syncTournamentProgress({ currentRound: 3 });

		const state = useAppStore.getState().tournament;
		expect(state.currentRound).toBe(3);
		expect(state.ratings).toEqual({ cat1: { rating: 1500, wins: 1, losses: 0 } });
	});

	it("clears vote history", () => {
		const actions = useAppStore.getState().tournamentActions;

		actions.recordVote("cat1", "cat2");
		expect(useAppStore.getState().tournament.voteHistory).toHaveLength(1);

		actions.clearVoteHistory();
		expect(useAppStore.getState().tournament.voteHistory).toEqual([]);
	});

	it("replaces full tournament state snapshot", () => {
		const actions = useAppStore.getState().tournamentActions;
		const customSnapshot = {
			names: [{ id: "cat1", name: "Luna", rating: 1600 }],
			ratings: { cat1: { rating: 1600, wins: 2, losses: 0 } },
			isComplete: false,
			isLoading: false,
			voteHistory: [],
			selectedNames: [],
			currentRound: 3,
			currentMatch: 5,
		};

		actions.replaceTournamentState(customSnapshot);
		expect(useAppStore.getState().tournament).toEqual(customSnapshot);
	});
});
