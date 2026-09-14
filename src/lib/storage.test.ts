import { beforeEach, describe, expect, it, vi } from "vitest";
import { ratingsAPI } from "../api";
import { logger } from "./logger";
import {
	getStorageString,
	parseJsonValue,
	removeStorageItem,
	setStorageString,
	writeStorageJson,
} from "./storage";

describe("storage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("reads and writes string values", () => {
		setStorageString("test_key", "hello");
		expect(getStorageString("test_key")).toBe("hello");
	});

	it("removes storage items", () => {
		setStorageString("test_key", "hello");
		removeStorageItem("test_key");
		expect(getStorageString("test_key")).toBeNull();
	});

	it("reads and writes JSON values", () => {
		const data = { id: 1, name: "Mittens" };
		writeStorageJson("json_key", data);
		expect(parseJsonValue(getStorageString("json_key"), null)).toEqual(data);
	});

	it("returns fallback for missing JSON keys", () => {
		expect(parseJsonValue(getStorageString("missing_key"), { fallback: true })).toEqual({
			fallback: true,
		});
	});

	it("returns fallback for invalid JSON values", () => {
		const spy = vi.spyOn(logger, "error").mockImplementation(() => {});
		localStorage.setItem("corrupted", "{invalid_json");
		expect(parseJsonValue(getStorageString("corrupted"), "fallback")).toBe("fallback");
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it("encrypts sensitive ratings and candidate data in localStorage", async () => {
		const userId = "user123";
		const sampleRatings = {
			cat1: { rating: 1500, wins: 5, losses: 2 },
		};

		await ratingsAPI.saveRatings(userId, sampleRatings);

		// Verify raw localStorage contains encrypted string (contains IV colon delimiter and not plaintext JSON)
		const rawStoredRatings = localStorage.getItem(`nosferatu-ratings-${userId}`);
		expect(rawStoredRatings).not.toBeNull();
		expect(rawStoredRatings).not.toContain('"rating":1500');
		expect(rawStoredRatings).toContain(":");

		// Verify decrypting via getStorageString restores original ratings object
		const decryptedRatings = parseJsonValue(getStorageString(`nosferatu-ratings-${userId}`), null);
		expect(decryptedRatings).toEqual(sampleRatings);

		// Verify candidate storage is also stored encrypted in localStorage
		const rawStoredCandidates = localStorage.getItem("nosferatu-candidates");
		expect(rawStoredCandidates).not.toBeNull();
		expect(rawStoredCandidates).not.toContain("description");
		expect(rawStoredCandidates).toContain(":");
	});
});
