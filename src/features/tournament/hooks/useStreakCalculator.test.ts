import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Match } from "@/shared/types";
import { useStreakCalculator } from "./useStreakCalculator";

describe("useStreakCalculator", () => {
	const mockMatch: Match = {
		mode: "1v1",
		left: { id: "1", name: "Alice" },
		right: { id: "2", name: "Bob" },
	};

	it("initializes with 0 streaks when history is empty and no match is present", () => {
		const { result } = renderHook(() => useStreakCalculator(null, []));
		expect(result.current.leftStreak).toBe(0);
		expect(result.current.rightStreak).toBe(0);
		expect(result.current.leftHeatLevel).toBeNull();
		expect(result.current.rightHeatLevel).toBeNull();
	});

	it("initializes with 0 streaks when history is empty but match is present", () => {
		const { result } = renderHook(() => useStreakCalculator(mockMatch, []));
		expect(result.current.leftStreak).toBe(0);
		expect(result.current.rightStreak).toBe(0);
	});

	it("calculates a win streak for a single participant correctly", () => {
		const matchHistory = [
			{
				match: {
					mode: "1v1",
					left: { id: "1", name: "Alice" },
					right: { id: "3", name: "Charlie" },
				} as Match,
				winner: "1",
			},
			{
				match: {
					mode: "1v1",
					left: { id: "4", name: "Dave" },
					right: { id: "1", name: "Alice" },
				} as Match,
				winner: "1",
			},
			{
				match: {
					mode: "1v1",
					left: { id: "1", name: "Alice" },
					right: { id: "5", name: "Eve" },
				} as Match,
				winner: "1",
			},
		];

		const { result } = renderHook(() => useStreakCalculator(mockMatch, matchHistory));
		expect(result.current.leftStreak).toBe(3); // Alice has won 3 in a row
		expect(result.current.rightStreak).toBe(0); // Bob has no history
	});

	it("stops calculating the streak if there is a loss", () => {
		const matchHistory = [
			{
				match: {
					mode: "1v1",
					left: { id: "1", name: "Alice" },
					right: { id: "3", name: "Charlie" },
				} as Match,
				winner: "1",
			},
			{
				match: {
					mode: "1v1",
					left: { id: "4", name: "Dave" },
					right: { id: "1", name: "Alice" },
				} as Match,
				winner: "4",
			}, // Alice lost
			{
				match: {
					mode: "1v1",
					left: { id: "1", name: "Alice" },
					right: { id: "5", name: "Eve" },
				} as Match,
				winner: "1",
			},
		];

		const { result } = renderHook(() => useStreakCalculator(mockMatch, matchHistory));
		expect(result.current.leftStreak).toBe(1); // Only the most recent win counts
	});

	it("skips matches the target participant was not involved in", () => {
		const matchHistory = [
			{
				match: {
					mode: "1v1",
					left: { id: "1", name: "Alice" },
					right: { id: "3", name: "Charlie" },
				} as Match,
				winner: "1",
			},
			{
				match: {
					mode: "1v1",
					left: { id: "4", name: "Dave" },
					right: { id: "5", name: "Eve" },
				} as Match,
				winner: "4",
			}, // Alice not involved
			{
				match: {
					mode: "1v1",
					left: { id: "1", name: "Alice" },
					right: { id: "6", name: "Frank" },
				} as Match,
				winner: "1",
			},
		];

		const { result } = renderHook(() => useStreakCalculator(mockMatch, matchHistory));
		expect(result.current.leftStreak).toBe(2);
	});

	it("correctly identifies heat levels based on streak", () => {
		const matchHistory = Array.from({ length: 5 }, () => ({
			match: {
				mode: "1v1",
				left: { id: "1", name: "Alice" },
				right: { id: "3", name: "Charlie" },
			} as Match,
			winner: "1",
		}));

		const { result } = renderHook(() => useStreakCalculator(mockMatch, matchHistory));
		expect(result.current.leftStreak).toBe(5);
		expect(result.current.leftHeatLevel).toBe("hot");
	});

	it("exposes calculateWinStreak function that works for arbitrary IDs", () => {
		const matchHistory = [
			{
				match: {
					mode: "1v1",
					left: { id: "3", name: "Charlie" },
					right: { id: "4", name: "Dave" },
				} as Match,
				winner: "3",
			},
			{
				match: {
					mode: "1v1",
					left: { id: "3", name: "Charlie" },
					right: { id: "5", name: "Eve" },
				} as Match,
				winner: "3",
			},
		];

		const { result } = renderHook(() => useStreakCalculator(null, matchHistory));
		expect(result.current.calculateWinStreak("3")).toBe(2);
		expect(result.current.calculateWinStreak("4")).toBe(0);
	});

	it("returns 0 when contestantId is not provided to calculateWinStreak", () => {
		const matchHistory = [
			{
				match: {
					mode: "1v1",
					left: { id: "3", name: "Charlie" },
					right: { id: "4", name: "Dave" },
				} as Match,
				winner: "3",
			},
		];

		const { result } = renderHook(() => useStreakCalculator(null, matchHistory));
		expect(result.current.calculateWinStreak(null)).toBe(0);
		expect(result.current.calculateWinStreak(undefined)).toBe(0);
	});
});
