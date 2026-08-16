import { describe, it, expect } from "vitest";
import {
	CHART_PALETTE,
	CHART_SERIES,
	CHART_TEXT_MUTED,
	CHART_GRID,
	CHART_AXIS,
	CHART_FOREGROUND,
} from "./chartTheme";

describe("chartTheme", () => {
	it("CHART_PALETTE should have expected color definitions", () => {
		expect(CHART_PALETTE.teal).toBe("#3FB8B0");
		expect(CHART_PALETTE.coral).toBe("#E5764A");
		expect(CHART_PALETTE.sand).toBe("#D4B483");
		expect(CHART_PALETTE.violet).toBe("#9F7AEA");
		expect(CHART_PALETTE.sky).toBe("#5BA8E8");
		expect(CHART_PALETTE.rose).toBe("#E26E9D");

		// Ensure it only contains the 6 expected colors
		expect(Object.keys(CHART_PALETTE)).toHaveLength(6);
	});

	it("CHART_SERIES should map correctly to palette values in order", () => {
		expect(CHART_SERIES).toEqual([
			CHART_PALETTE.teal,
			CHART_PALETTE.coral,
			CHART_PALETTE.sand,
			CHART_PALETTE.violet,
			CHART_PALETTE.sky,
			CHART_PALETTE.rose,
		]);
	});

	it("Chart utility colors should be defined correctly", () => {
		expect(CHART_TEXT_MUTED).toBe("rgba(200, 210, 222, 0.55)");
		expect(CHART_GRID).toBe("rgba(200, 210, 222, 0.12)");
		expect(CHART_AXIS).toBe("rgba(200, 210, 222, 0.18)");
		expect(CHART_FOREGROUND).toBe("#ebf1f7");
	});
});
