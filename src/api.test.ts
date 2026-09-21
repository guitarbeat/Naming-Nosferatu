import { beforeEach, describe, expect, it, vi } from "vitest";
import { ratingsAPI } from "./api";
import * as storageModule from "./lib/storage";

describe("api - saveStoredNames error handling", () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		storageModule.resetStorageModuleCache();
		vi.restoreAllMocks();
	});

	it("handles errors thrown by writeStorageJson when persisting candidate names in saveStoredNames", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const testError = new Error("Storage write failure");

		vi.spyOn(storageModule, "writeStorageJson").mockImplementation((key) => {
			if (key === "nosferatu-candidates") {
				throw testError;
			}
			return true;
		});

		const userId = "user123";
		const sampleRatings = {
			cat1: { rating: 1500, wins: 1, losses: 0 },
		};

		await ratingsAPI.saveRatings(userId, sampleRatings);

		expect(warnSpy).toHaveBeenCalledWith("Failed to persist candidates:", testError);
	});
});
