import { describe, expect, it } from "vitest";
import { themeSurfaces, themeText } from "./themeClasses";

describe("themeClasses", () => {
	describe("themeSurfaces", () => {
		it("should be defined and have non-empty string values", () => {
			expect(themeSurfaces).toBeDefined();
			expect(Object.keys(themeSurfaces).length).toBeGreaterThan(0);
			for (const value of Object.values(themeSurfaces)) {
				expect(typeof value).toBe("string");
				expect(value.length).toBeGreaterThan(0);
			}
		});

		it("should have specific expected keys", () => {
			expect(themeSurfaces).toHaveProperty("panel");
			expect(themeSurfaces).toHaveProperty("badge");
		});
	});

	describe("themeText", () => {
		it("should be defined and have non-empty string values", () => {
			expect(themeText).toBeDefined();
			expect(Object.keys(themeText).length).toBeGreaterThan(0);
			for (const value of Object.values(themeText)) {
				expect(typeof value).toBe("string");
				expect(value.length).toBeGreaterThan(0);
			}
		});

		it("should have specific expected keys", () => {
			expect(themeText).toHaveProperty("eyebrow");
			expect(themeText).toHaveProperty("subtitle");
		});
	});
});
