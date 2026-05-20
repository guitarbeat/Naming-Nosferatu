import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NameItem } from "@/shared/types";
import { useTournamentSelectionSaver } from "./useTournamentSelectionSaver";

const mockNames: NameItem[] = [
	{ id: 1, name: "Mittens", userId: 1, lastUsed: null, createdAt: new Date() },
	{ id: 2, name: "Luna", userId: 1, lastUsed: null, createdAt: new Date() },
];

function tournamentSelectionWrites(spy: ReturnType<typeof vi.spyOn>) {
	return spy.mock.calls.filter(([key]) => String(key).startsWith("tournament_selection_"));
}

describe("useTournamentSelectionSaver", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("with SaverOptions (API signature)", () => {
		it("returns scheduleSave and loadSavedSelection functions", () => {
			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: "testuser" }));

			// result.current is SaverApiResult | undefined.
			// With options, it should be SaverApiResult.
			expect(result.current).toBeDefined();
			expect(typeof result.current?.scheduleSave).toBe("function");
			expect(typeof result.current?.loadSavedSelection).toBe("function");
		});

		it("scheduleSave correctly writes to localStorage after 1000ms delay", () => {
			const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: "testuser" }));

			result.current?.scheduleSave(mockNames);

			expect(tournamentSelectionWrites(setItemSpy)).toHaveLength(0);

			vi.advanceTimersByTime(999);
			expect(tournamentSelectionWrites(setItemSpy)).toHaveLength(0);

			vi.advanceTimersByTime(1);
			expect(tournamentSelectionWrites(setItemSpy)).toEqual([
				["tournament_selection_testuser", JSON.stringify([1, 2])],
			]);
		});

		it("scheduleSave debounces multiple rapid calls", () => {
			const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: "testuser" }));

			result.current?.scheduleSave([mockNames[0]]);
			vi.advanceTimersByTime(500); // Wait 500ms

			// Call again before the first 1000ms is up
			result.current?.scheduleSave(mockNames);
			vi.advanceTimersByTime(500); // 1000ms since first call, but 500ms since second

			expect(tournamentSelectionWrites(setItemSpy)).toHaveLength(0);

			vi.advanceTimersByTime(500); // 1000ms since second call

			expect(tournamentSelectionWrites(setItemSpy)).toHaveLength(1);
			expect(tournamentSelectionWrites(setItemSpy)[0]).toEqual([
				"tournament_selection_testuser",
				JSON.stringify([1, 2]),
			]);
		});

		it("does not save if the selection hash has not changed", () => {
			const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: "testuser" }));

			result.current?.scheduleSave(mockNames);
			vi.advanceTimersByTime(1000);
			expect(tournamentSelectionWrites(setItemSpy)).toHaveLength(1);

			setItemSpy.mockClear();

			result.current?.scheduleSave(mockNames);
			vi.advanceTimersByTime(1000);

			expect(tournamentSelectionWrites(setItemSpy)).toHaveLength(0);
		});

		it("does not save if enableAutoSave is false", () => {
			const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
			const { result } = renderHook(() =>
				useTournamentSelectionSaver({ userName: "testuser", enableAutoSave: false }),
			);

			result.current?.scheduleSave(mockNames);
			vi.advanceTimersByTime(1000);

			expect(setItemSpy).not.toHaveBeenCalled();
		});

		it("does not save if userName is null", () => {
			const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: null }));

			result.current?.scheduleSave(mockNames);
			vi.advanceTimersByTime(1000);

			expect(setItemSpy).not.toHaveBeenCalled();
		});

		it("loadSavedSelection returns empty array if no saved selection exists", () => {
			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: "testuser" }));

			const saved = result.current?.loadSavedSelection();
			expect(saved).toEqual([]);
		});

		it("loadSavedSelection correctly loads and parses from localStorage", () => {
			localStorage.setItem("tournament_selection_testuser", JSON.stringify([1, 2]));

			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: "testuser" }));

			const saved = result.current?.loadSavedSelection();
			expect(saved).toEqual([1, 2]);
		});

		it("loadSavedSelection handles JSON parsing errors gracefully", () => {
			localStorage.setItem("tournament_selection_testuser", "invalid json[}");

			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: "testuser" }));

			const saved = result.current?.loadSavedSelection();
			expect(saved).toEqual([]); // Fallback to empty array
		});

		it("loadSavedSelection returns empty array if userName is null", () => {
			localStorage.setItem("tournament_selection_testuser", JSON.stringify([1, 2]));

			const { result } = renderHook(() => useTournamentSelectionSaver({ userName: null }));

			const saved = result.current?.loadSavedSelection();
			expect(saved).toEqual([]);
		});
	});

	describe("with NameItem[] (useEffect side-effect signature)", () => {
		it("returns undefined but updates hash reference behind the scenes without setting localStorage", () => {
			const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
			const { result } = renderHook(() => useTournamentSelectionSaver(mockNames));

			// Should return undefined when an array of NameItem is passed
			expect(result.current).toBeUndefined();

			// Should have scheduled a timer that doesn't save to localStorage but updates the ref
			vi.advanceTimersByTime(1000);

			// Importantly, the effect signature should NOT actually call localStorage.setItem
			// because that logic is only in the scheduleSave callback. The effect just updates lastSavedRef.current
			expect(setItemSpy).not.toHaveBeenCalled();
		});
	});
});
