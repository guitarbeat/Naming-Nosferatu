import { describe, expect, it } from "vitest";
import {
	getFlameCount,
	getHeatCardClasses,
	getHeatGradientClasses,
	getHeatLevel,
	getHeatTextClasses,
} from "./heat";

describe("heat utils", () => {
	describe("getHeatLevel", () => {
		it("returns null for streaks below warm threshold", () => {
			expect(getHeatLevel(0)).toBe(null);
			expect(getHeatLevel(2)).toBe(null);
		});

		it('returns "warm" for streaks at or above warm threshold', () => {
			expect(getHeatLevel(3)).toBe("warm");
			expect(getHeatLevel(4)).toBe("warm");
		});

		it('returns "hot" for streaks at or above hot threshold', () => {
			expect(getHeatLevel(5)).toBe("hot");
			expect(getHeatLevel(6)).toBe("hot");
		});

		it('returns "blazing" for streaks at or above blazing threshold', () => {
			expect(getHeatLevel(7)).toBe("blazing");
			expect(getHeatLevel(10)).toBe("blazing");
		});
	});

	describe("getHeatCardClasses", () => {
		it('returns correct classes for "blazing"', () => {
			expect(getHeatCardClasses("blazing")).toBe(
				"ring-2 ring-orange-100/85 shadow-[0_0_105px_rgba(249,115,22,0.52)]",
			);
		});

		it('returns correct classes for "hot"', () => {
			expect(getHeatCardClasses("hot")).toBe(
				"ring-2 ring-amber-200/65 shadow-[0_0_78px_rgba(251,191,36,0.42)]",
			);
		});

		it('returns correct classes for "warm"', () => {
			expect(getHeatCardClasses("warm")).toBe(
				"ring-1 ring-orange-200/30 shadow-[0_0_35px_rgba(249,115,22,0.24)]",
			);
		});

		it("returns empty string for null", () => {
			expect(getHeatCardClasses(null)).toBe("");
		});
	});

	describe("getHeatTextClasses", () => {
		it('returns correct classes for "blazing"', () => {
			expect(getHeatTextClasses("blazing")).toBe(
				"text-orange-200 border-orange-300/45 bg-orange-500/15",
			);
		});

		it('returns correct classes for "hot"', () => {
			expect(getHeatTextClasses("hot")).toBe("text-amber-200 border-amber-300/45 bg-amber-500/15");
		});

		it('returns correct classes for "warm"', () => {
			expect(getHeatTextClasses("warm")).toBe(
				"text-orange-100 border-orange-300/35 bg-orange-500/10",
			);
		});
	});

	describe("getHeatGradientClasses", () => {
		it('returns correct classes for "blazing"', () => {
			expect(getHeatGradientClasses("blazing")).toBe(
				"bg-gradient-to-t from-orange-500/45 via-amber-400/25 to-transparent",
			);
		});

		it('returns correct classes for "hot"', () => {
			expect(getHeatGradientClasses("hot")).toBe(
				"bg-gradient-to-t from-orange-500/35 via-amber-300/20 to-transparent",
			);
		});

		it('returns correct classes for "warm"', () => {
			expect(getHeatGradientClasses("warm")).toBe(
				"bg-gradient-to-t from-orange-500/20 via-amber-200/10 to-transparent",
			);
		});
	});

	describe("getFlameCount", () => {
		it("returns at least 3 flames", () => {
			expect(getFlameCount(0)).toBe(3);
			expect(getFlameCount(2)).toBe(3);
		});

		it("calculates flames based on streak", () => {
			expect(getFlameCount(3)).toBe(4); // 3 * 1.2 = 3.6 -> 4
			expect(getFlameCount(5)).toBe(6); // 5 * 1.2 = 6
		});

		it("caps flames at max value", () => {
			expect(getFlameCount(7)).toBe(8); // 7 * 1.2 = 8.4 -> 8, default max 8
			expect(getFlameCount(10)).toBe(8); // 10 * 1.2 = 12 -> 8, default max 8
		});

		it("respects custom max value", () => {
			expect(getFlameCount(10, 12)).toBe(12); // 10 * 1.2 = 12
		});
	});
});
