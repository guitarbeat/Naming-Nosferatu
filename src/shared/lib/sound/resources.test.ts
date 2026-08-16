import { describe, expect, it } from "vitest";
import { SOUND_EFFECTS, getFallbackEffectPattern } from "./resources";

describe("sound resources", () => {
	describe("SOUND_EFFECTS", () => {
		it("should contain all expected sound effect identifiers", () => {
			expect(SOUND_EFFECTS).toEqual([
				"vote",
				"undo",
				"level-up",
				"wow",
				"surprise",
				"streak",
				"meow",
			]);
		});

		it("should not contain duplicate identifiers", () => {
			const uniqueEffects = new Set(SOUND_EFFECTS);
			expect(uniqueEffects.size).toBe(SOUND_EFFECTS.length);
		});
	});

	describe("getFallbackEffectPattern", () => {
		it("should return a pattern for each valid sound effect", () => {
			for (const effect of SOUND_EFFECTS) {
				const pattern = getFallbackEffectPattern(effect);
				expect(pattern).not.toBeNull();
				expect(Array.isArray(pattern)).toBe(true);
				expect(pattern!.length).toBeGreaterThan(0);

				// Verify note structure
				for (const note of pattern!) {
					expect(typeof note.frequency).toBe("number");
					expect(typeof note.duration).toBe("number");
					expect(note.frequency).toBeGreaterThan(0);
					expect(note.duration).toBeGreaterThan(0);
				}
			}
		});

		it("should return null for unknown sound effects", () => {
			expect(getFallbackEffectPattern("unknown-effect")).toBeNull();
			expect(getFallbackEffectPattern("")).toBeNull();
		});

		it("should return specific pattern structure for 'vote'", () => {
			const pattern = getFallbackEffectPattern("vote");
			expect(pattern).toEqual([
				{ frequency: 523.25, duration: 0.05 },
				{ frequency: 659.25, duration: 0.08 },
			]);
		});

		it("should support notes with specific wave types", () => {
			const wowPattern = getFallbackEffectPattern("wow");
			expect(wowPattern![0].wave).toBe("sawtooth");
			expect(wowPattern![1].wave).toBe("triangle");
		});

		it("should support notes with specific gain values", () => {
			const meowPattern = getFallbackEffectPattern("meow");
			expect(meowPattern![2].wave).toBe("sine");
			expect(meowPattern![2].gain).toBe(0.8);
			expect(meowPattern![3].gain).toBe(0.6);
		});
	});
});
