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
});
