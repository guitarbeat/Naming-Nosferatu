import { beforeEach, describe, expect, it, vi } from "vitest";
import { preloadImage, preloadImages } from "./hooks";
import { FALLBACK_CAT_SVG } from "./lib/constants";
import { setupGlobalImageErrorHandler } from "./lib/utils";

describe("Image Preloader & Global Error Handler", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("preloadImage & preloadImages", () => {
		it("resolves to true when Image loads successfully", async () => {
			const originalImage = globalThis.Image;
			class MockImage {
				src = "";
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				constructor() {
					setTimeout(() => {
						this.onload?.();
					}, 10);
				}
			}
			globalThis.Image = MockImage as unknown as typeof Image;

			const result = await preloadImage("/test-image-1.webp");
			expect(result).toBe(true);

			globalThis.Image = originalImage;
		});

		it("resolves to false when Image fails to load", async () => {
			const originalImage = globalThis.Image;
			class MockImage {
				src = "";
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				constructor() {
					setTimeout(() => {
						this.onerror?.();
					}, 10);
				}
			}
			globalThis.Image = MockImage as unknown as typeof Image;

			const result = await preloadImage("/test-fail-image.webp");
			expect(result).toBe(false);

			globalThis.Image = originalImage;
		});

		it("preloadImages preloads multiple URLs concurrently", async () => {
			const originalImage = globalThis.Image;
			class MockImage {
				src = "";
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				constructor() {
					setTimeout(() => {
						this.onload?.();
					}, 5);
				}
			}
			globalThis.Image = MockImage as unknown as typeof Image;

			const results = await preloadImages(["/img1.webp", "/img2.webp"]);
			expect(results).toEqual([true, true]);

			globalThis.Image = originalImage;
		});
	});

	describe("setupGlobalImageErrorHandler", () => {
		it("intercepts broken image elements and replaces src with fallback", () => {
			const cleanup = setupGlobalImageErrorHandler();

			const img = document.createElement("img");
			img.src = "https://invalid-non-existent-domain.fake/broken.jpg";
			document.body.appendChild(img);

			// Simulate image error event
			const errorEvent = new Event("error");
			img.dispatchEvent(errorEvent);

			expect(img.classList.contains("img-fallback-applied")).toBe(true);
			expect(img.dataset.fallbackApplied).toBe("true");
			expect(img.src).toBeTruthy();

			// Subsequent error swaps to bulletproof SVG data URI
			img.dispatchEvent(new Event("error"));
			expect(img.src).toBe(FALLBACK_CAT_SVG);

			cleanup();
			img.remove();
		});

		it("cleans up listener properly", () => {
			const cleanup = setupGlobalImageErrorHandler();
			cleanup();

			const img = document.createElement("img");
			img.src = "https://invalid-another-broken.fake/broken.jpg";
			document.body.appendChild(img);

			const errorEvent = new Event("error");
			img.dispatchEvent(errorEvent);

			// Should not have modified dataset since handler was cleaned up
			expect(img.dataset.fallbackApplied).toBeUndefined();
			img.remove();
		});
	});
});
