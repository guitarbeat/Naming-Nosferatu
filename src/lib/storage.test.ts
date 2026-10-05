import { beforeEach, describe, expect, it, vi } from "vitest";
import { ratingsAPI } from "../api";
import { logger } from "./logger";
import {
	decryptValue,
	getStorageString,
	parseJsonValue,
	removeStorageItem,
	resetStorageModuleCache,
	setStorageString,
	writeStorageJson,
} from "./storage";

describe("storage", () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		resetStorageModuleCache();
	});

	it("stores encryption key in sessionStorage and not localStorage", () => {
		setStorageString("secure_test_key", "secret_value");
		expect(sessionStorage.getItem("__device_key__")).not.toBeNull();
		expect(localStorage.getItem("__device_key__")).toBeNull();
	});

	it("purges legacy device key from localStorage", () => {
		localStorage.setItem("__device_key__", "legacy_cleartext_key_hex");
		setStorageString("secure_test_key", "secret_value");
		expect(localStorage.getItem("__device_key__")).toBeNull();
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

	it("decrypts raw encrypted values via decryptValue", () => {
		setStorageString("key1", "value1");
		const encryptedValue = localStorage.getItem("key1");
		expect(encryptedValue).not.toBeNull();
		expect(decryptValue(encryptedValue as string)).toBe("value1");
	});

	it("handles legacy unencrypted plaintext data safely", () => {
		const unencryptedData = "legacy_unencrypted_data";
		expect(decryptValue(unencryptedData)).toBe(unencryptedData);
	});

	it("uses dynamic random device key per session without static hardcoded key fallback", () => {
		setStorageString("sec_test", "confidential_data");
		const key1 = sessionStorage.getItem("__device_key__");
		expect(key1).not.toBeNull();
		expect(key1).not.toBe("nosferatu-secure-storage-key-1337");

		// Reset session state and verify a new unique key is generated
		sessionStorage.clear();
		resetStorageModuleCache();

		setStorageString("sec_test_2", "confidential_data_2");
		const key2 = sessionStorage.getItem("__device_key__");
		expect(key2).not.toBeNull();
		expect(key2).not.toEqual(key1);
	});

	it("generates distinct random IVs for each encrypted item and handles edge cases in decryptValue", () => {
		setStorageString("item1", "test_content_1");
		setStorageString("item2", "test_content_2");

		const raw1 = localStorage.getItem("item1") || "";
		const raw2 = localStorage.getItem("item2") || "";

		// Ciphertexts formatted as "<32 hex chars IV>:<ciphertext>"
		const iv1 = raw1.split(":")[0];
		const iv2 = raw2.split(":")[0];

		expect(iv1).toHaveLength(32);
		expect(iv2).toHaveLength(32);
		expect(iv1).not.toEqual(iv2);

		// Verify edge cases for decryptValue
		expect(decryptValue(null)).toBe("");
		expect(decryptValue(undefined)).toBe("");
		expect(decryptValue("")).toBe("");
	});
});
