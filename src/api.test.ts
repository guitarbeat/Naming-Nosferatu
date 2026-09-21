import { beforeEach, describe, expect, it, vi } from "vitest";
import { ratingsAPI } from "./api";
import * as storage from "./lib/storage";

describe("api", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("ratingsAPI.saveRatings", () => {
		it("catches errors and logs a warning when saveStoredNames or writeStorageJson throws", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const writeStorageJsonSpy = vi.spyOn(storage, "writeStorageJson").mockImplementation(() => {
				throw new Error("Storage failure");
			});

			await ratingsAPI.saveRatings("user123", {
				cat1: { rating: 1500, wins: 1, losses: 0 },
			});

			expect(warnSpy).toHaveBeenCalledWith("Failed to persist ratings:", expect.any(Error));
			expect(warnSpy.mock.calls[0][1].message).toBe("Storage failure");

			writeStorageJsonSpy.mockRestore();
			warnSpy.mockRestore();
		});
	});
});
