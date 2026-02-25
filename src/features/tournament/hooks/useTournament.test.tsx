import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NameItem } from "@/shared/types";
import { useTournament } from "./useTournament";

// Mocks
vi.mock("./useHelpers", () => ({
	useAudioManager: () => ({
		playVoteSound: vi.fn(),
		playUndoSound: vi.fn(),
		playLevelUpSound: vi.fn(),
		playWowSound: vi.fn(),
		playSurpriseSound: vi.fn(),
		handleToggleMute: vi.fn(),
		isMuted: false,
	}),
}));

vi.mock("@/app/providers/Providers", () => ({
	useToast: () => ({
		showWarning: vi.fn(),
	}),
}));

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		clear: () => {
			store = {};
		},
	};
})();
Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("useTournament", () => {
	const mockNames: NameItem[] = [
		{ id: "1", name: "Cat 1" },
		{ id: "2", name: "Cat 2" },
		{ id: "3", name: "Cat 3" },
	];

	beforeEach(() => {
		window.localStorage.clear();
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should initialize correctly", () => {
		const { result } = renderHook(() => useTournament(mockNames));
		expect(result.current.round).toBe(1);
		expect(result.current.matchNumber).toBe(1);
		expect(result.current.currentMatch).not.toBeNull();
	});

	it("should advance after voting", () => {
		const { result } = renderHook(() => useTournament(mockNames));

		act(() => {
			const match = result.current.currentMatch;
			if (match) {
				const leftId = typeof match.left === "object" ? match.left.id : match.left;
				const rightId = typeof match.right === "object" ? match.right.id : match.right;
				result.current.handleVote(String(leftId), String(rightId));
			}
		});

		expect(result.current.matchNumber).toBe(2);
	});

	it("should restore state from localStorage", () => {
		// First run to generate history
		const { result, unmount } = renderHook(() => useTournament(mockNames, "user1"));

		act(() => {
			const match = result.current.currentMatch;
			if (match) {
				const leftId = String(typeof match.left === "object" ? match.left.id : match.left);
				const rightId = String(typeof match.right === "object" ? match.right.id : match.right);
				result.current.handleVote(leftId, rightId);
			}
		});

		// Fast forward to ensure localStorage is written (debounced)
		act(() => {
			vi.advanceTimersByTime(2000);
		});

		expect(result.current.matchNumber).toBe(2);

		unmount();

		// Second run - should restore match number 2
		const { result: result2 } = renderHook(() => useTournament(mockNames, "user1"));

		// If restoration relies on useEffect which might be async or dependent on state updates?
		// Let's flush effects? renderHook usually handles it.

		expect(result2.current.matchNumber).toBe(2);

		// Also verify the match is actually different (i.e. sorter advanced)
		// If sorter didn't advance, matchNumber would be 2 (from persistent state) but currentMatch might be the first pair again?
		// Wait, matchNumber IS calculated from persistent state.
		// So this assertion passes even if sorter is broken!

		// I need to assert that currentMatch corresponds to the NEXT match, not the first match.
		// The first match for [1,2,3] is 1 vs 2.
		// If we voted 1, the next match (if 1 is kept or we iterate pairs)
		// PreferenceSorter (Round Robin):
		// 1 vs 2 (done)
		// 1 vs 3
		// 2 vs 3

		// So match 1 was 1 vs 2. Match 2 should be 1 vs 3.
		const match2 = result2.current.currentMatch;
		expect(match2).not.toBeNull();
		if (match2) {
			const leftId = String(typeof match2.left === "object" ? match2.left.id : match2.left);
			const rightId = String(typeof match2.right === "object" ? match2.right.id : match2.right);
			// Should be 1 and 3
			const ids = [leftId, rightId].sort();
			expect(ids).toEqual(["1", "3"]);
		}
	});
});
