import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getStorageString,
	isStorageAvailable,
	parseJsonValue,
	readStorageJson,
	removeStorageItem,
	setStorageString,
	writeStorageJson,
} from "./storage";

describe("storage utilities", () => {
	let originalConsoleError: typeof console.error;

	beforeEach(() => {
		originalConsoleError = console.error;
		console.error = vi.fn();
		// Clear mock storage before each test
		window.localStorage.clear();
	});

	afterEach(() => {
		console.error = originalConsoleError;
		vi.restoreAllMocks();
	});

	describe("isStorageAvailable", () => {
		it("returns true when localStorage is available", () => {
			expect(isStorageAvailable()).toBe(true);
		});

		it("returns false when localStorage access throws", () => {
			// Mock getter for localStorage to throw
			const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
				throw new Error("Access denied");
			});
			expect(isStorageAvailable()).toBe(false);
			spy.mockRestore();
		});
	});

	describe("getStorageString", () => {
		it("returns value when key exists", () => {
			window.localStorage.setItem("test-key", "test-value");
			expect(getStorageString("test-key")).toBe("test-value");
		});

		it("returns fallback when key does not exist", () => {
			expect(getStorageString("missing-key", "fallback")).toBe("fallback");
		});

		it("returns fallback and logs error when getItem throws", () => {
			const mockError = new Error("Storage error");
			vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
				throw mockError;
			});

			expect(getStorageString("test-key", "fallback")).toBe("fallback");
			expect(console.error).toHaveBeenCalledWith(
				'[storage] Failed to read key "test-key" from localStorage:',
				mockError,
			);
		});
	});

	describe("setStorageString", () => {
		it("sets value and returns true on success", () => {
			const result = setStorageString("test-key", "test-value");
			expect(result).toBe(true);
			expect(window.localStorage.getItem("test-key")).toBe("test-value");
		});

		it("returns false and logs error when setItem throws", () => {
			const mockError = new Error("Storage full");
			vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
				throw mockError;
			});

			const result = setStorageString("test-key", "test-value");
			expect(result).toBe(false);
			expect(console.error).toHaveBeenCalledWith(
				'[storage] Failed to write key "test-key" to localStorage:',
				mockError,
			);
		});
	});

	describe("removeStorageItem", () => {
		it("removes item from storage", () => {
			window.localStorage.setItem("test-key", "test-value");
			removeStorageItem("test-key");
			expect(window.localStorage.getItem("test-key")).toBeNull();
		});

		it("catches and logs errors when removeItem throws", () => {
			const mockError = new Error("Storage error");
			vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
				throw mockError;
			});

			const testKey = "test-key";

			// This should not throw
			expect(() => removeStorageItem(testKey)).not.toThrow();

			// It should log the error
			expect(console.error).toHaveBeenCalledWith(
				`[storage] Failed to remove key "${testKey}" from localStorage:`,
				mockError,
			);
		});
	});

	describe("parseJsonValue", () => {
		it("parses valid JSON", () => {
			expect(parseJsonValue('{"a": 1}', {})).toEqual({ a: 1 });
		});

		it("returns fallback for null value", () => {
			expect(parseJsonValue(null, "fallback")).toBe("fallback");
		});

		it("returns fallback and logs error for invalid JSON", () => {
			expect(parseJsonValue("invalid-json", "fallback")).toBe("fallback");
			expect(console.error).toHaveBeenCalledWith(
				"[storage] Failed to parse JSON from localStorage:",
				expect.any(SyntaxError),
			);
		});
	});

	describe("readStorageJson", () => {
		it("reads and parses valid JSON from storage", () => {
			window.localStorage.setItem("test-key", '{"a": 1}');
			expect(readStorageJson("test-key", {})).toEqual({ a: 1 });
		});

		it("returns fallback when parsing fails", () => {
			window.localStorage.setItem("test-key", "invalid-json");
			expect(readStorageJson("test-key", { fallback: true })).toEqual({ fallback: true });
		});
	});

	describe("writeStorageJson", () => {
		it("stringifies and saves value", () => {
			const result = writeStorageJson("test-key", { a: 1 });
			expect(result).toBe(true);
			expect(window.localStorage.getItem("test-key")).toBe('{"a":1}');
		});

		it("returns false and logs error when setItem throws", () => {
			const mockError = new Error("Storage full");
			vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
				throw mockError;
			});

			const result = writeStorageJson("test-key", { a: 1 });
			expect(result).toBe(false);
			expect(console.error).toHaveBeenCalledWith(
				'[storage] Failed to write key "test-key" to localStorage:',
				mockError,
			);
		});
	});
});
