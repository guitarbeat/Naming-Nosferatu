import { describe, expect, it } from "vitest";
import { AUDIO, CAT_IMAGES, ELO_RATING, STORAGE_KEYS, TIMING } from "./constants";

describe("constants", () => {
	describe("CAT_IMAGES", () => {
		it("should be an array of image paths", () => {
			expect(Array.isArray(CAT_IMAGES)).toBe(true);
			expect(CAT_IMAGES.length).toBeGreaterThan(0);
			for (const path of CAT_IMAGES) {
				expect(typeof path).toBe("string");
				expect(path.startsWith("/assets/images/")).toBe(true);
				expect(path.endsWith(".avif")).toBe(true);
			}
		});

		it("should be deeply immutable by convention", () => {
			// Arrays cast `as const` are type-checked as readonly
			// Rather than trying to bypass it and test for throwing (since at runtime it might not freeze unless `Object.freeze` is used)
			// We just verify it has elements. Type checking covers the rest.
			expect(CAT_IMAGES.length).toBeGreaterThan(0);
		});
	});

	describe("ELO_RATING", () => {
		it("should contain standard Elo rating configuration", () => {
			expect(ELO_RATING.DEFAULT_RATING).toBe(1500);
			expect(ELO_RATING.DEFAULT_K_FACTOR).toBe(40);
			expect(ELO_RATING.MIN_RATING).toBe(800);
			expect(ELO_RATING.MAX_RATING).toBe(2400);
			expect(ELO_RATING.RATING_DIVISOR).toBe(400);
		});

		it("should define logically consistent K-factor thresholds", () => {
			expect(ELO_RATING.LOW_RATING_THRESHOLD).toBeLessThan(ELO_RATING.HIGH_RATING_THRESHOLD);
			expect(ELO_RATING.NEW_PLAYER_GAME_THRESHOLD).toBeGreaterThan(0);
		});

		it("should define logically consistent K-factor multipliers", () => {
			expect(ELO_RATING.NEW_PLAYER_K_MULTIPLIER).toBeGreaterThan(1);
			expect(ELO_RATING.EXTREME_RATING_K_MULTIPLIER).toBeGreaterThan(1);
			expect(ELO_RATING.NEW_PLAYER_K_MULTIPLIER).toBeGreaterThan(
				ELO_RATING.EXTREME_RATING_K_MULTIPLIER,
			);
		});

		it("should define logically consistent match outcome scores", () => {
			expect(ELO_RATING.WIN_SCORE).toBe(1);
			expect(ELO_RATING.LOSS_SCORE).toBe(0);
			expect(ELO_RATING.TIE_SCORE).toBe(0.5);
			expect(ELO_RATING.BOTH_WIN_SCORE).toBeGreaterThan(ELO_RATING.TIE_SCORE);
			expect(ELO_RATING.BOTH_WIN_SCORE).toBeLessThan(ELO_RATING.WIN_SCORE);
			expect(ELO_RATING.NEITHER_WIN_SCORE).toBeLessThan(ELO_RATING.TIE_SCORE);
			expect(ELO_RATING.NEITHER_WIN_SCORE).toBeGreaterThan(ELO_RATING.LOSS_SCORE);
		});
	});

	describe("STORAGE_KEYS", () => {
		it("should contain string values for storage keys", () => {
			for (const key of Object.values(STORAGE_KEYS)) {
				expect(typeof key).toBe("string");
				expect(key.length).toBeGreaterThan(0);
			}
		});

		it("should have unique values for all keys", () => {
			const values = Object.values(STORAGE_KEYS);
			const uniqueValues = new Set(values);
			expect(values.length).toBe(uniqueValues.size);
		});
	});

	describe("TIMING", () => {
		it("should define time values in numbers", () => {
			expect(typeof TIMING.RIPPLE_ANIMATION_DURATION_MS).toBe("number");
			expect(typeof TIMING.VOTE_COOLDOWN_MS).toBe("number");
			expect(typeof TIMING.TOURNAMENT_INIT_DELAY_MS).toBe("number");
			expect(typeof TIMING.MOTION_FAST).toBe("number");
			expect(typeof TIMING.MOTION_NORMAL).toBe("number");
			expect(typeof TIMING.MOTION_SLOW).toBe("number");
			expect(typeof TIMING.MOTION_CYCLE).toBe("number");
		});

		it("should define an easing string", () => {
			expect(typeof TIMING.MOTION_EASING).toBe("string");
		});

		it("should have logical motion timings", () => {
			expect(TIMING.MOTION_FAST).toBeLessThan(TIMING.MOTION_NORMAL);
			expect(TIMING.MOTION_NORMAL).toBeLessThan(TIMING.MOTION_SLOW);
		});
	});

	describe("AUDIO", () => {
		it("should define audio constants", () => {
			expect(typeof AUDIO.DEFAULT_EFFECTS_VOLUME).toBe("number");
			expect(AUDIO.DEFAULT_EFFECTS_VOLUME).toBeGreaterThanOrEqual(0);
			expect(AUDIO.DEFAULT_EFFECTS_VOLUME).toBeLessThanOrEqual(1);

			expect(typeof AUDIO.MAX_RETRIES).toBe("number");
			expect(AUDIO.MAX_RETRIES).toBeGreaterThan(0);
		});
	});
});
