import CryptoJS from "crypto-js";
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

	it("retains encryption key in memory and purges legacy device key from Web Storage", () => {
		localStorage.setItem("__device_key__", "legacy_cleartext_key_hex");
		sessionStorage.setItem("__device_key__", "legacy_cleartext_session_key");

		setStorageString("secure_test_key", "secret_value");

		// Encryption key should not be exposed in Web Storage
		expect(sessionStorage.getItem("__device_key__")).toBeNull();
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

	it("uses in-memory device key per runtime session without persisting key to Web Storage", () => {
		setStorageString("sec_test", "confidential_data");
		expect(sessionStorage.getItem("__device_key__")).toBeNull();
		expect(localStorage.getItem("__device_key__")).toBeNull();

		const encryptedVal1 = localStorage.getItem("sec_test");
		expect(encryptedVal1).not.toBeNull();

		// Reset module cache (simulating runtime restart)
		resetStorageModuleCache();

		setStorageString("sec_test_2", "confidential_data_2");
		const encryptedVal2 = localStorage.getItem("sec_test_2");
		expect(encryptedVal2).not.toBeNull();
		expect(sessionStorage.getItem("__device_key__")).toBeNull();
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

	it("falls back gracefully to returning original text when CryptoJS.AES.decrypt throws an error", () => {
		const mockTextWithIv = "0123456789abcdef0123456789abcdef:corrupted_ciphertext";
		const decryptSpy = vi.spyOn(CryptoJS.AES, "decrypt").mockImplementation(() => {
			throw new Error("Simulated decryption failure");
		});

		const result = decryptValue(mockTextWithIv);

		expect(decryptSpy).toHaveBeenCalled();
		expect(result).toBe(mockTextWithIv);

		decryptSpy.mockRestore();
	});
});
