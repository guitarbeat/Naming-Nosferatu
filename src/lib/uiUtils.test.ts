import { afterEach, describe, expect, it, vi } from "vitest";
import { isMobileOrLowPowerDevice } from "./uiUtils";

describe("isMobileOrLowPowerDevice", () => {
	const originalWindow = globalThis.window;
	const originalNavigator = globalThis.navigator;

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns false when window is undefined (SSR environment)", () => {
		vi.stubGlobal("window", undefined);
		expect(isMobileOrLowPowerDevice()).toBe(false);
	});

	it("returns true when innerWidth is <= 768px (small screen)", () => {
		vi.stubGlobal("window", {
			...originalWindow,
			innerWidth: 375,
			matchMedia: vi.fn().mockReturnValue({ matches: false }),
		});
		expect(isMobileOrLowPowerDevice()).toBe(true);
	});

	it("returns false when innerWidth > 768px, non-coarse pointer, and high concurrency", () => {
		vi.stubGlobal("window", {
			...originalWindow,
			innerWidth: 1024,
			matchMedia: vi.fn().mockImplementation(() => ({
				matches: false,
			})),
		});
		vi.stubGlobal("navigator", {
			...originalNavigator,
			hardwareConcurrency: 8,
		});
		expect(isMobileOrLowPowerDevice()).toBe(false);
	});

	it("returns true when innerWidth > 768px, coarse pointer, and low hardware concurrency (<= 4)", () => {
		vi.stubGlobal("window", {
			...originalWindow,
			innerWidth: 1024,
			matchMedia: vi.fn().mockImplementation((query: string) => ({
				matches: query === "(pointer: coarse)",
			})),
		});
		vi.stubGlobal("navigator", {
			...originalNavigator,
			hardwareConcurrency: 2,
		});
		expect(isMobileOrLowPowerDevice()).toBe(true);
	});

	it("returns false when innerWidth > 768px, coarse pointer, but high hardware concurrency (> 4)", () => {
		vi.stubGlobal("window", {
			...originalWindow,
			innerWidth: 1024,
			matchMedia: vi.fn().mockImplementation((query: string) => ({
				matches: query === "(pointer: coarse)",
			})),
		});
		vi.stubGlobal("navigator", {
			...originalNavigator,
			hardwareConcurrency: 8,
		});
		expect(isMobileOrLowPowerDevice()).toBe(false);
	});

	it("handles missing navigator or hardwareConcurrency gracefully", () => {
		vi.stubGlobal("window", {
			...originalWindow,
			innerWidth: 1024,
			matchMedia: vi.fn().mockImplementation((query: string) => ({
				matches: query === "(pointer: coarse)",
			})),
		});
		vi.stubGlobal("navigator", {
			...originalNavigator,
			hardwareConcurrency: undefined,
		});
		expect(isMobileOrLowPowerDevice()).toBe(false);
	});

	it("handles missing matchMedia gracefully", () => {
		vi.stubGlobal("window", {
			...originalWindow,
			innerWidth: 1024,
			matchMedia: undefined,
		});
		expect(isMobileOrLowPowerDevice()).toBe(false);
	});
});
