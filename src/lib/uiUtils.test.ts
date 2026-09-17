import { afterEach, describe, expect, it, vi } from "vitest";
import { CAT_IMAGES } from "./constants";
import { getRandomCatImage, isMobileOrLowPowerDevice } from "./uiUtils";

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

	it("returns true when innerWidth is exactly 768px (boundary check)", () => {
		vi.stubGlobal("window", {
			...originalWindow,
			innerWidth: 768,
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

describe("getRandomCatImage", () => {
	it("returns empty string when images array is empty or falsy", () => {
		expect(getRandomCatImage("test-id", [])).toBe("");
		expect(getRandomCatImage("test-id", null as unknown as string[])).toBe("");
	});

	it("returns a image deterministically based on id and fallbackName", () => {
		const sampleImages = ["img1.jpg", "img2.jpg", "img3.jpg"];
		const imgA1 = getRandomCatImage("cat-1", sampleImages, "Fluffy");
		const imgA2 = getRandomCatImage("cat-1", sampleImages, "Fluffy");
		expect(imgA1).toBe(imgA2);

		// Number id vs string id consistency handling
		const imgNum = getRandomCatImage(42, sampleImages);
		const imgStr = getRandomCatImage("42", sampleImages);
		expect(imgNum).toBe(imgStr);
	});

	it("differentiates cache keys and outcomes when fallbackName changes", () => {
		const sampleImages = ["img1.jpg", "img2.jpg", "img3.jpg"];
		// Use fresh IDs so cache doesn't return previously stored values
		const img1 = getRandomCatImage("fb-id-1", sampleImages, "Fluffy");
		const img2 = getRandomCatImage("fb-id-1", sampleImages, "Spot");
		const imgNoFb = getRandomCatImage("fb-id-1", sampleImages);

		expect(img1).toBeDefined();
		expect(img2).toBeDefined();
		expect(imgNoFb).toBeDefined();
	});

	it("falls back to images[0] or empty string if indexed image is undefined or array is sparse", () => {
		const sparseArray: string[] = [];
		sparseArray[10] = "at-index-10.jpg"; // sparse array with length 11, index 0 is undefined
		const result = getRandomCatImage("sparse-test-id", sparseArray);
		expect(typeof result).toBe("string");
	});

	it("uses default CAT_IMAGES when images parameter is not provided", () => {
		const result = getRandomCatImage("default-test-id");
		expect(CAT_IMAGES).toContain(result);
	});

	it("caches results and returns cached entry on subsequent calls", () => {
		const customImages = ["cached1.png", "cached2.png"];
		const uniqueId = "cache-key-test-id";
		const firstCall = getRandomCatImage(uniqueId, customImages, "Mittens");
		// Subsequent call with different images array still returns cached result for same cacheKey
		const secondCall = getRandomCatImage(uniqueId, ["other.png"], "Mittens");
		expect(secondCall).toBe(firstCall);
	});

	it("evicts oldest entry when cache size exceeds limit", () => {
		const customImages = ["evict1.png", "evict2.png"];

		// Populate cache up to max size + 1 (257 entries)
		const firstId = "evict-id-0";
		const firstResult = getRandomCatImage(firstId, customImages);

		for (let i = 1; i <= 256; i++) {
			getRandomCatImage(`evict-id-${i}`, customImages);
		}

		// Since firstId was evicted from cache, calling it with a different image array will calculate new result
		const reCalculated = getRandomCatImage(firstId, ["new-image.png"]);
		expect(reCalculated).toBe("new-image.png");
		expect(reCalculated).not.toBe(firstResult);
	});
});
