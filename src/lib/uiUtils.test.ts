import { afterEach, describe, expect, it, vi } from "vitest";
import { CAT_IMAGES } from "./constants";
import { getRandomCatImage, isMobileOrLowPowerDevice } from "./uiUtils";

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

describe("isMobileOrLowPowerDevice", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns false if window is undefined (SSR environment)", () => {
		const stubWindow = globalThis.window;
		vi.stubGlobal("window", undefined);
		try {
			expect(isMobileOrLowPowerDevice()).toBe(false);
		} finally {
			vi.stubGlobal("window", stubWindow);
		}
	});

	it("returns true for small screen width", () => {
		vi.stubGlobal("window", {
			innerWidth: 500,
			matchMedia: () => ({ matches: false }),
		});
		expect(isMobileOrLowPowerDevice()).toBe(true);
	});

	it("returns true for coarse pointer with low concurrency", () => {
		vi.stubGlobal("window", {
			innerWidth: 1024,
			matchMedia: (query: string) => ({
				matches: query.includes("coarse"),
			}),
		});
		vi.stubGlobal("navigator", {
			hardwareConcurrency: 4,
		});
		expect(isMobileOrLowPowerDevice()).toBe(true);
	});

	it("returns false for desktop screen, fine pointer, or high concurrency", () => {
		vi.stubGlobal("window", {
			innerWidth: 1024,
			matchMedia: () => ({ matches: false }),
		});
		vi.stubGlobal("navigator", {
			hardwareConcurrency: 8,
		});
		expect(isMobileOrLowPowerDevice()).toBe(false);
	});
});
