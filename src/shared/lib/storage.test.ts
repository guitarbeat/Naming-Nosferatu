import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStorageString } from "./storage";

describe("storage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	describe("getStorageString", () => {
		it("returns the stored string when localStorage.getItem returns a value", () => {
			localStorage.setItem("test-key", "test-value");
			expect(getStorageString("test-key")).toBe("test-value");
		});

		it("returns the fallback when localStorage.getItem returns null", () => {
			expect(getStorageString("non-existent-key", "fallback-value")).toBe("fallback-value");
		});

		it("handles error path and returns fallback when localStorage.getItem throws", () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
				/* noop */
			});
			vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
				throw new Error("Test error");
			});

			const result = getStorageString("error-key", "error-fallback");

			expect(result).toBe("error-fallback");
			expect(consoleSpy).toHaveBeenCalledWith(
				'[storage] Failed to read key "error-key" from localStorage:',
				expect.any(Error),
			);
		});
	});
});
