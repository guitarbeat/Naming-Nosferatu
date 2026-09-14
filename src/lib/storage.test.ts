import { beforeEach, describe, expect, it, vi } from "vitest";
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

	it("decrypts legacy values encrypted with static IV and legacy secret key", () => {
		// Value "secret_legacy_data" encrypted using legacy key "nosferatu-secure-storage-key-1337" and legacy static IV "nosferatu-iv-123\0\0\0"
		const legacyEncryptedString = "ETi3ExivLZJn3fwuoGtvoU8m0zk2uzMXuQFq94LYAv4=";
		// Set in localStorage without prepended IV prefix (no colon delimiter)
		localStorage.setItem("legacy_key", legacyEncryptedString);

		// getStorageString should attempt device key, fail, and fallback to legacy static key & IV
		const decrypted = getStorageString("legacy_key");
		expect(decrypted).toBe("secret_legacy_data");
	});
});
