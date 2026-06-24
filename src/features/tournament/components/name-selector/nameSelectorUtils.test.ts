import { describe, expect, it } from "vitest";
import { getCardStyles, getNameOverlayClasses } from "./nameSelectorUtils";

describe("nameSelectorUtils", () => {
	describe("getCardStyles", () => {
		it("should return base classes when not selected and not locked", () => {
			const result = getCardStyles(false, false);
			expect(result).toContain("mobile-readable-card");
			expect(result).toContain("border-white/10"); // unselected classes
			expect(result).not.toContain("cursor-not-allowed"); // not locked
			expect(result).not.toContain("ring-1"); // not selected
		});

		it("should return selected classes when selected", () => {
			const result = getCardStyles(true, false);
			expect(result).toContain("mobile-readable-card");
			expect(result).toContain("z-10 border-primary/45"); // selected classes
			expect(result).not.toContain("cursor-not-allowed"); // not locked
			expect(result).not.toContain("border-white/10"); // not unselected
		});

		it("should return locked classes when locked", () => {
			const result = getCardStyles(false, true);
			expect(result).toContain("mobile-readable-card");
			expect(result).toContain("border-white/10"); // unselected classes
			expect(result).toContain("cursor-not-allowed"); // locked classes
		});

		it("should return both selected and locked classes when both are true", () => {
			const result = getCardStyles(true, true);
			expect(result).toContain("mobile-readable-card");
			expect(result).toContain("z-10 border-primary/45"); // selected classes
			expect(result).toContain("cursor-not-allowed"); // locked classes
		});
	});

	describe("getNameOverlayClasses", () => {
		it('should return correct classes for "grid" variant', () => {
			const result = getNameOverlayClasses("grid");
			expect(result).toContain("absolute inset-0 flex");
			expect(result).toContain("p-4 sm:p-5 text-center");
			expect(result).not.toContain("p-6 sm:p-8 text-center");
		});

		it('should return correct classes for "swipe" variant', () => {
			const result = getNameOverlayClasses("swipe");
			expect(result).toContain("absolute inset-0 flex");
			expect(result).toContain("z-10 p-6 sm:p-8 text-center");
			expect(result).not.toContain("p-4 sm:p-5 text-center");
		});
	});
});
