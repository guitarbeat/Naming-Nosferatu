import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	decryptValue,
	getStorageString,
	isStorageAvailable,
	parseJsonValue,
	readStorageJson,
	removeStorageItem,
	setStorageString,
	writeStorageJson,
} from "./storage";

describe("storage", () => {
	let _originalLocalStorage: Storage;

	beforeEach(() => {
		_originalLocalStorage = window.localStorage;
		// Clear local storage before each test
		window.localStorage.clear();
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("parseJsonValue", () => {
		it("returns fallback when value is null", () => {
			expect(parseJsonValue(null, "fallback")).toBe("fallback");
			expect(parseJsonValue(null, { a: 1 })).toEqual({ a: 1 });
		});

		it("returns parsed JSON when value is a valid JSON string (object)", () => {
			const jsonString = JSON.stringify({ key: "value", num: 42 });
			expect(parseJsonValue(jsonString, {})).toEqual({ key: "value", num: 42 });
		});

		it("returns parsed JSON when value is a valid JSON string (array)", () => {
			const jsonString = JSON.stringify([1, 2, "three"]);
			expect(parseJsonValue(jsonString, [])).toEqual([1, 2, "three"]);
		});

		it("returns parsed JSON when value is a valid JSON string (primitive)", () => {
			expect(parseJsonValue('"hello"', "fallback")).toBe("hello");
			expect(parseJsonValue("42", 0)).toBe(42);
			expect(parseJsonValue("true", false)).toBe(true);
		});

		it("returns fallback when value is a malformed JSON string", () => {
			expect(parseJsonValue("{ invalid: json }", { fallback: true })).toEqual({
				fallback: true,
			});
			expect(parseJsonValue('["missing_bracket"', [])).toEqual([]);
			expect(parseJsonValue("undefined", "fallback")).toBe("fallback");
		});

		it("returns fallback when value is an empty string", () => {
			expect(parseJsonValue("", "fallback")).toBe("fallback");
		});
	});

	describe("isStorageAvailable", () => {
		it("returns true when localStorage is available", () => {
			expect(isStorageAvailable()).toBe(true);
		});

		it("returns false when localStorage throws an error", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
				throw new Error("Quota exceeded");
			});
			expect(isStorageAvailable()).toBe(false);
		});
	});

	describe("setStorageString and getStorageString", () => {
		it("stores and retrieves a string correctly (encryption round-trip)", () => {
			const success = setStorageString("test_key", "my_secret_data");
			expect(success).toBe(true);

			const retrieved = getStorageString("test_key");
			expect(retrieved).toBe("my_secret_data");

			// Verify it's actually encrypted in localStorage
			const rawValue = window.localStorage.getItem("test_key");
			expect(rawValue).not.toBe("my_secret_data");
			expect(rawValue).not.toBeNull();
			expect(rawValue?.includes(":")).toBe(true); // Checks for IV:ciphertext format
		});

		it("returns fallback when key does not exist", () => {
			expect(getStorageString("non_existent", "fallback_val")).toBe("fallback_val");
		});

		it("handles getStorageString error path (localStorage throws)", () => {
			vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
				throw new Error("Storage read error");
			});
			expect(getStorageString("test_key", "fallback_val")).toBe("fallback_val");
		});

		it("handles setStorageString error path (localStorage throws)", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
				throw new Error("Storage write error");
			});
			expect(setStorageString("test_key", "value")).toBe(false);
		});

		it("returns fallback when storage is not available for get", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
				throw new Error("Storage unavailable");
			});
			// isStorageAvailable will return false
			expect(getStorageString("test_key", "fallback_val")).toBe("fallback_val");
		});
	});

	describe("removeStorageItem", () => {
		it("removes an item from storage", () => {
			window.localStorage.setItem("test_key", "value");
			removeStorageItem("test_key");
			expect(window.localStorage.getItem("test_key")).toBeNull();
		});

		it("handles error path safely when storage throws", () => {
			vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
				throw new Error("Remove error");
			});
			// Should not throw
			expect(() => removeStorageItem("test_key")).not.toThrow();
		});
	});

	describe("writeStorageJson and readStorageJson", () => {
		it("stores and retrieves JSON correctly", () => {
			const data = { id: 1, name: "test" };
			const success = writeStorageJson("json_key", data);
			expect(success).toBe(true);

			const retrieved = readStorageJson("json_key", { fallback: true });
			expect(retrieved).toEqual(data);
		});

		it("returns fallback when reading invalid JSON", () => {
			// Write raw invalid JSON string to bypass encryption
			window.localStorage.setItem("json_key", "invalid json");
			// decrypt will just return "invalid json" since it fails decryption, then parseJsonValue will fail
			const retrieved = readStorageJson("json_key", { fallback: true });
			expect(retrieved).toEqual({ fallback: true });
		});

		it("handles writeStorageJson error path (localStorage throws)", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
				throw new Error("Storage write error");
			});
			expect(writeStorageJson("json_key", { a: 1 })).toBe(false);
		});
	});

	describe("decryptValue", () => {
		it("returns empty string when value is null or undefined", () => {
			expect(decryptValue(null)).toBe("");
			expect(decryptValue(undefined)).toBe("");
		});

		it("returns clear text if decryption fails (e.g. legacy unencrypted data)", () => {
			// Since it is not encrypted, decryption will fail and it should return the original string
			expect(decryptValue("plain_text_data")).toBe("plain_text_data");
		});

		it("triggers the outer catch block by providing an invalid type", () => {
			// Simulate a runtime type error where a non-string is passed to trigger the outer catch block
			// text.indexOf(":") will throw a TypeError, dropping into the outer catch block
			const invalidInput = 123 as unknown as string;
			expect(decryptValue(invalidInput)).toBe(invalidInput);
		});
	});
});
