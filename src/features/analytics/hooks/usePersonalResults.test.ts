import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ELO_RATING } from "@/shared/lib/constants";
import { usePersonalResults } from "./usePersonalResults";

describe("usePersonalResults", () => {
	it("returns empty rankings when personalRatings is undefined", () => {
		const { result } = renderHook(() =>
			usePersonalResults({
				personalRatings: undefined,
			}),
		);
		expect(result.current.rankings).toEqual([]);
	});

	it("processes and sorts personalRatings correctly without currentTournamentNames", () => {
		const personalRatings = {
			"id-1": { rating: 1200, wins: 5, losses: 2 },
			"id-2": { rating: 1500, wins: 10, losses: 5 },
			"id-3": { rating: 1000, wins: 1, losses: 8 },
		};

		const { result } = renderHook(() =>
			usePersonalResults({
				personalRatings,
			}),
		);

		expect(result.current.rankings).toEqual([
			{ id: "id-2", name: "id-2", rating: 1500, wins: 10, losses: 5 },
			{ id: "id-1", name: "id-1", rating: 1200, wins: 5, losses: 2 },
			{ id: "id-3", name: "id-3", rating: 1000, wins: 1, losses: 8 },
		]);
	});

	it("maps names from currentTournamentNames when available", () => {
		const personalRatings = {
			"id-1": { rating: 1200, wins: 5, losses: 2 },
			"id-2": { rating: 1500, wins: 10, losses: 5 },
		};

		const currentTournamentNames = [
			{ id: "id-1", name: "Alpha", rating: 1100, wins: 0, losses: 0 },
			{ id: "id-2", name: "Beta", rating: 1400, wins: 0, losses: 0 },
		];

		const { result } = renderHook(() =>
			usePersonalResults({
				personalRatings,
				currentTournamentNames,
			}),
		);

		expect(result.current.rankings).toEqual([
			{ id: "id-2", name: "Beta", rating: 1500, wins: 10, losses: 5 },
			{ id: "id-1", name: "Alpha", rating: 1200, wins: 5, losses: 2 },
		]);
	});

	it("handles number values in personalRatings instead of objects", () => {
		const personalRatings = {
			"id-1": 1300,
			"id-2": 1600,
		};

		const { result } = renderHook(() =>
			usePersonalResults({
				personalRatings,
			}),
		);

		expect(result.current.rankings).toEqual([
			{ id: "id-2", name: "id-2", rating: 1600, wins: 0, losses: 0 },
			{ id: "id-1", name: "id-1", rating: 1300, wins: 0, losses: 0 },
		]);
	});

	it("uses default rating when rating is missing from object", () => {
		const personalRatings = {
			"id-1": { wins: 5, losses: 2 },
		};

		const { result } = renderHook(() =>
			usePersonalResults({
				personalRatings,
			}),
		);

		expect(result.current.rankings).toEqual([
			{ id: "id-1", name: "id-1", rating: ELO_RATING.DEFAULT_RATING, wins: 5, losses: 2 },
		]);
	});

	it("ignores currentTournamentNames without id", () => {
		const personalRatings = {
			"id-1": { rating: 1200, wins: 5, losses: 2 },
		};

		const currentTournamentNames = [{ name: "Alpha", rating: 1100, wins: 0, losses: 0 }];

		const { result } = renderHook(() =>
			usePersonalResults({
				personalRatings,
				currentTournamentNames,
			}),
		);

		expect(result.current.rankings).toEqual([
			{ id: "id-1", name: "id-1", rating: 1200, wins: 5, losses: 2 },
		]);
	});

	it("rounds ratings correctly", () => {
		const personalRatings = {
			"id-1": { rating: 1200.4, wins: 5, losses: 2 },
			"id-2": { rating: 1500.6, wins: 10, losses: 5 },
		};

		const { result } = renderHook(() =>
			usePersonalResults({
				personalRatings,
			}),
		);

		expect(result.current.rankings).toEqual([
			{ id: "id-2", name: "id-2", rating: 1501, wins: 10, losses: 5 },
			{ id: "id-1", name: "id-1", rating: 1200, wins: 5, losses: 2 },
		]);
	});
});
