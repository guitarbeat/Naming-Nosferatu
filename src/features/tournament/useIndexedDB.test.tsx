import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Configure React act environment for jsdom
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import {
	clearMemoryFallbackStores,
	clearStoredTournamentFromIDB,
	getRecordFromDB,
	getStoredTournamentFromIDB,
	isIndexedDBAvailable,
	saveStoredTournamentToIDB,
	setRecordInDB,
} from "@/shared/lib/indexedDB";
import type { StoredTournamentSnapshot } from "@/shared/lib/storage";
import useAppStore, { hydrateTournamentFromIndexedDB } from "@/store";
import { useIndexedDB, useTournamentIndexedDB } from "./hooks";

function renderHookHarness<T>(hookFn: () => T) {
	let latestResult: T;
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);

	function Harness() {
		latestResult = hookFn();
		return null;
	}

	act(() => {
		root.render(<Harness />);
	});

	return {
		get current() {
			return latestResult;
		},
		unmount() {
			act(() => {
				root.unmount();
			});
			container.remove();
		},
	};
}

describe("IndexedDB Offline-First Persistence & useIndexedDB", () => {
	const mockSnapshot: StoredTournamentSnapshot = {
		names: [
			{ id: "cat-1", name: "Shadow", rating: 1550 },
			{ id: "cat-2", name: "Luna", rating: 1450 },
		],
		ratings: {
			"cat-1": { rating: 1550, wins: 1, losses: 0 },
			"cat-2": { rating: 1450, wins: 0, losses: 1 },
		},
		isComplete: false,
		voteHistory: [{ winnerId: "cat-1", loserId: "cat-2", timestamp: 123456 }],
		selectedNames: [
			{ id: "cat-1", name: "Shadow", rating: 1550 },
			{ id: "cat-2", name: "Luna", rating: 1450 },
		],
		matchHistory: [
			{
				winner: "cat-1",
				loser: "cat-2",
				voteType: "standard",
				matchNumber: 1,
				roundNumber: 1,
				timestamp: 123456,
				match: { mode: "1v1", left: "cat-1", right: "cat-2" },
			},
		],
		currentRound: 1,
		currentMatch: 2,
		totalMatches: 3,
		mode: "1v1",
		bracketEntrants: ["cat-1", "cat-2"],
		lastUpdated: Date.now(),
	};

	beforeEach(() => {
		clearMemoryFallbackStores();
		useAppStore.getState().tournamentActions.resetTournament();
		vi.restoreAllMocks();
	});

	describe("IndexedDB Storage Layer", () => {
		it("detects environment capabilities and provides robust fallback", () => {
			expect(typeof isIndexedDBAvailable()).toBe("boolean");
		});

		it("stores, retrieves, and clears tournament snapshot in offline persistence store", async () => {
			const initial = await getStoredTournamentFromIDB();
			expect(initial).toBeNull();

			await saveStoredTournamentToIDB(mockSnapshot);
			const stored = await getStoredTournamentFromIDB();

			expect(stored).not.toBeNull();
			expect(stored?.names).toHaveLength(2);
			expect(stored?.names?.[0].name).toBe("Shadow");
			expect(stored?.currentRound).toBe(1);
			expect(stored?.currentMatch).toBe(2);
			expect(stored?.totalMatches).toBe(3);
			expect(stored?.voteHistory).toHaveLength(1);

			await clearStoredTournamentFromIDB();
			const afterClear = await getStoredTournamentFromIDB();
			expect(afterClear).toBeNull();
		});

		it("supports generic key-value records in custom stores", async () => {
			await setRecordInDB("keyval", "offline_setting", { offlineMode: true });
			const result = await getRecordFromDB<{ offlineMode: boolean }>("keyval", "offline_setting");

			expect(result).toEqual({ offlineMode: true });
		});
	});

	describe("useIndexedDB Hook", () => {
		it("loads initial value and allows saving and clearing tournament data", async () => {
			const harness = renderHookHarness(() =>
				useIndexedDB<StoredTournamentSnapshot>({
					key: "test_hook_key",
					initialValue: null,
				}),
			);

			// Initial state
			expect(harness.current.isLoading).toBe(true);

			// Wait for initial load to finish
			await act(async () => {
				await harness.current.load();
			});

			expect(harness.current.isLoading).toBe(false);
			expect(harness.current.data).toBeNull();

			// Save tournament snapshot
			let saveSuccess = false;
			await act(async () => {
				saveSuccess = await harness.current.save(mockSnapshot);
			});

			expect(saveSuccess).toBe(true);
			expect(harness.current.data?.names?.[0].name).toBe("Shadow");
			expect(harness.current.syncStatus).toBe("synced");

			// Clear tournament snapshot
			let clearSuccess = false;
			await act(async () => {
				clearSuccess = await harness.current.clear();
			});

			expect(clearSuccess).toBe(true);
			expect(harness.current.data).toBeNull();
			expect(harness.current.syncStatus).toBe("idle");

			harness.unmount();
		});
	});

	describe("Integration with useAppStore", () => {
		it("hydrates tournament state from IndexedDB into useAppStore when store is empty", async () => {
			// Ensure store is empty initially
			expect(useAppStore.getState().tournament.names).toBeNull();

			// Save to IndexedDB persistence
			await saveStoredTournamentToIDB(mockSnapshot);

			// Run hydration
			await act(async () => {
				await hydrateTournamentFromIndexedDB();
			});

			// Verify useAppStore was hydrated
			const storeTournament = useAppStore.getState().tournament;
			expect(storeTournament.names).toHaveLength(2);
			expect(storeTournament.names?.[0].name).toBe("Shadow");
			expect(storeTournament.currentRound).toBe(1);
			expect(storeTournament.currentMatch).toBe(2);
			expect(storeTournament.matchHistory).toHaveLength(1);
		});

		it("useTournamentIndexedDB synchronizes changes from useAppStore", async () => {
			const harness = renderHookHarness(() =>
				useTournamentIndexedDB({
					debounceMs: 10,
				}),
			);

			await act(async () => {
				await harness.current.load();
			});

			// Perform an action in useAppStore
			await act(async () => {
				useAppStore.getState().tournamentActions.setNames([
					{ id: "cat-10", name: "Midnight", rating: 1600 },
					{ id: "cat-11", name: "Smokey", rating: 1500 },
				]);
			});

			// Wait for debounce timer
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
			});

			const saved = await getStoredTournamentFromIDB();
			expect(saved).not.toBeNull();
			expect(saved?.names).toHaveLength(2);
			expect(saved?.names?.[0].name).toBe("Midnight");

			harness.unmount();
		});
	});
});
