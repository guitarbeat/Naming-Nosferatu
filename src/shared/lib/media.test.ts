import { describe, expect, it } from "vitest";
import { getRandomCatImage } from "./media";

describe("getRandomCatImage", () => {
	it("returns the first image or empty string if id is not provided", () => {
		expect(getRandomCatImage(null, ["img1", "img2"])).toBe("img1");
		expect(getRandomCatImage(undefined, ["img1", "img2"])).toBe("img1");
		expect(getRandomCatImage("", ["img1", "img2"])).toBe("img1");
		expect(getRandomCatImage(null, [])).toBe("");
	});

	it("returns the first image or empty string if images array is empty", () => {
		expect(getRandomCatImage("test1", [])).toBe("");
	});

	it("returns a predictable image for a string id", () => {
		const images = ["img1", "img2", "img3"];
		const result1 = getRandomCatImage("test-id-1", images);
		const result2 = getRandomCatImage("test-id-1", images);
		expect(result1).toBe(result2);

		// It should be one of the images
		expect(images).toContain(result1);
	});

	it("returns a predictable image for a number id", () => {
		const images = ["img1", "img2", "img3"];
		const result1 = getRandomCatImage(12345, images);
		const result2 = getRandomCatImage(12345, images);
		expect(result1).toBe(result2);

		expect(images).toContain(result1);
	});

	it("handles negative number ids correctly", () => {
		const images = ["img1", "img2", "img3"];
		const result = getRandomCatImage(-12345, images);
		expect(images).toContain(result);
	});

	it("returns consistently across multiple calls due to caching", () => {
		const images = ["img1", "img2", "img3"];
		const result1 = getRandomCatImage("cached-test", images);
		// We know it gets cached because it uses the id and images.length as cacheKey
		const result2 = getRandomCatImage("cached-test", images);
		expect(result1).toBe(result2);
	});

	it("uses default CAT_IMAGES if no array is provided", () => {
		const result = getRandomCatImage("default-images-test");
		expect(result).toBeDefined();
		expect(typeof result).toBe("string");
	});

	it("evicts oldest items when cache size exceeds maximum (500)", () => {
		const images = ["img1"];
		for (let i = 0; i < 505; i++) {
			getRandomCatImage(`evict-test-${i}`, images);
		}
		// The cache shouldn't grow beyond 500, but we can't directly check the internal Map size.
		// We can at least ensure it doesn't crash and returns the correct image.
		const result = getRandomCatImage("evict-test-504", images);
		expect(images).toContain(result);
	});

	it("falls back to the first image or empty string if computed index is missing", () => {
		// Mock hashString to return an out-of-bounds index relative to an array with holes
		const images = ["img1", "img2"];
		// We'll create an array with a hole
		const sparseImages = new Array(3);
		sparseImages[0] = "img1";

		// When it accesses sparseImages[2], it will be undefined, so it should fallback to sparseImages[0]
		// We need an id that hashes to 2 (mod 3)
		let id = 0;
		while (true) {
			const seed = id;
			const index = Math.abs(seed) % sparseImages.length;
			if (index === 2) {
				break;
			}
			id++;
		}

		const result = getRandomCatImage(id, sparseImages);
		expect(result).toBe("img1");

		// If both are missing, it falls back to ""
		const emptySparse = new Array(3);
		// Note: the previous test call cached this id. So let's use id + 3 which also has index 2 mod 3.
		let id2 = id + 3;
		const resultEmpty = getRandomCatImage(id2, emptySparse);
		expect(resultEmpty).toBe("");
	});
});
