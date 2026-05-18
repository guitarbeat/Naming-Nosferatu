import { describe, expect, it } from "vitest";
import { ELO_RATING } from "./constants";
import { updateEloRating } from "./elo";

describe("updateEloRating", () => {
	it("updates rating for an established player on win", () => {
		const newRating = updateEloRating({
			rating: 1500,
			expectedScore: 0.5,
			actualScore: 1,
			gamesPlayed: 20, // >= 15
		});
		// rating + 40 * 1 * (1 - 0.5) = 1500 + 20 = 1520
		expect(newRating).toBe(1520);
	});

	it("updates rating for an established player on loss", () => {
		const newRating = updateEloRating({
			rating: 1500,
			expectedScore: 0.5,
			actualScore: 0,
			gamesPlayed: 20,
		});
		// rating + 40 * 1 * (0 - 0.5) = 1500 - 20 = 1480
		expect(newRating).toBe(1480);
	});

	it("applies new player multiplier for win", () => {
		const newRating = updateEloRating({
			rating: 1500,
			expectedScore: 0.5,
			actualScore: 1,
			gamesPlayed: 5, // < 15
		});
		// rating + 40 * 2 * (1 - 0.5) = 1500 + 40 = 1540
		expect(newRating).toBe(1540);
	});

	it("applies new player multiplier for loss", () => {
		const newRating = updateEloRating({
			rating: 1500,
			expectedScore: 0.5,
			actualScore: 0,
			gamesPlayed: 5,
		});
		// rating + 40 * 2 * (0 - 0.5) = 1500 - 40 = 1460
		expect(newRating).toBe(1460);
	});

	it("uses standard multiplier at the exact gamesPlayed threshold boundary", () => {
		const newRating = updateEloRating({
			rating: 1500,
			expectedScore: 0.5,
			actualScore: 1,
			gamesPlayed: 15, // exactly ELO_RATING.NEW_PLAYER_GAME_THRESHOLD
		});
		expect(newRating).toBe(1520);
	});

	it("clamps rating to minimum value", () => {
		const newRating = updateEloRating({
			rating: 810,
			expectedScore: 0.9,
			actualScore: 0, // lost when expected to win big
			gamesPlayed: 20,
		});
		// rating + 40 * 1 * (0 - 0.9) = 810 - 36 = 774 -> clamped to 800
		expect(newRating).toBe(ELO_RATING.MIN_RATING);
	});

	it("clamps rating to maximum value", () => {
		const newRating = updateEloRating({
			rating: 2380,
			expectedScore: 0.1,
			actualScore: 1, // won when expected to lose big
			gamesPlayed: 20,
		});
		// rating + 40 * 1 * (1 - 0.1) = 2380 + 36 = 2416 -> clamped to 2400
		expect(newRating).toBe(ELO_RATING.MAX_RATING);
	});

	it("respects custom configuration overrides", () => {
		const newRating = updateEloRating({
			rating: 1000,
			expectedScore: 0.5,
			actualScore: 1,
			gamesPlayed: 5,
			config: {
				kFactor: 50,
				newPlayerGameThreshold: 10,
				newPlayerKMultiplier: 3,
				minRating: 500,
				maxRating: 3000,
			},
		});
		// config threshold is 10, gamesPlayed 5 -> multiplier 3 applies
		// rating + 50 * 3 * (1 - 0.5) = 1000 + 75 = 1075
		expect(newRating).toBe(1075);
	});

	it("respects custom config for clamping", () => {
		const newRating = updateEloRating({
			rating: 2990,
			expectedScore: 0.5,
			actualScore: 1,
			gamesPlayed: 20,
			config: {
				kFactor: 50,
				maxRating: 3000,
			},
		});
		// rating + 50 * 1 * 0.5 = 3015 -> clamped to 3000
		expect(newRating).toBe(3000);
	});
});
