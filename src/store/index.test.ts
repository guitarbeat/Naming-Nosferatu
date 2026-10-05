import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as indexedDBModule from "@/lib/indexedDB";
import { ErrorManager } from "@/lib/utils";
import useAppStore, { hydrateTournamentFromIndexedDB } from "./index";

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

describe("hydrateTournamentFromIndexedDB", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns null when IndexedDB is empty (no stored snapshot)", async () => {
		vi.spyOn(indexedDBModule, "getStoredTournamentFromIDB").mockResolvedValue(null);

		const result = await hydrateTournamentFromIndexedDB();
		expect(result).toBeNull();
	});

	it("hydrates tournament state from IndexedDB when in-memory state is empty", async () => {
		const mockSnapshot = {
			names: [{ id: "cat-1", name: "Shadow" }],
			ratings: { "cat-1": { rating: 1600, wins: 2, losses: 0 } },
			isComplete: false,
			voteHistory: [],
			selectedNames: [{ id: "cat-1", name: "Shadow" }],
			lastUpdated: 1000,
		};

		vi.spyOn(indexedDBModule, "getStoredTournamentFromIDB").mockResolvedValue(mockSnapshot);

		useAppStore.getState().tournamentActions.resetTournament();

		const result = await hydrateTournamentFromIndexedDB();

		expect(result).toEqual(mockSnapshot);
		const currentState = useAppStore.getState().tournament;
		expect(currentState.names).toEqual([{ id: "cat-1", name: "Shadow" }]);
	});

	it("handles errors during hydration by logging via ErrorManager and returning null", async () => {
		const testError = new Error("IndexedDB read failure");
		vi.spyOn(indexedDBModule, "getStoredTournamentFromIDB").mockRejectedValue(testError);
		const handleErrorSpy = vi
			.spyOn(ErrorManager, "handleError")
			.mockReturnValue({ id: "err_test" });

		const result = await hydrateTournamentFromIndexedDB();

		expect(result).toBeNull();
		expect(handleErrorSpy).toHaveBeenCalledWith(testError, "hydrateTournamentFromIndexedDB");
	});
});
