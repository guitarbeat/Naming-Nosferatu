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
	let _originalLocalStorage: Storage;

	beforeEach(() => {
		// Store original to restore later if needed
		_originalLocalStorage = window.localStorage;
		window.localStorage.clear();
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("isStorageAvailable", () => {
		it("returns true when localStorage is available", () => {
			expect(isStorageAvailable()).toBe(true);
		});

		it("returns false when window is undefined", () => {
			const originalWindow = globalThis.window;
			// @ts-expect-error
			globalThis.window = undefined;
			expect(isStorageAvailable()).toBe(false);
			globalThis.window = originalWindow;
		});

		it("returns false when localStorage access throws", () => {
			vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
				throw new Error("Access denied");
			});
			expect(isStorageAvailable()).toBe(false);
		});
	});

	describe("getStorageString", () => {
		it("returns value from localStorage if exists", () => {
			window.localStorage.setItem("test-key", "test-value");
			expect(getStorageString("test-key")).toBe("test-value");
		});

		it("returns fallback if key does not exist", () => {
			expect(getStorageString("non-existent", "fallback")).toBe("fallback");
		});

		it("returns null fallback by default", () => {
			expect(getStorageString("non-existent")).toBe(null);
		});

		it("returns fallback if localStorage throws", () => {
			vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
				throw new Error("Storage error");
			});
			expect(getStorageString("test-key", "fallback")).toBe("fallback");
		});
	});

	describe("setStorageString", () => {
		it("sets value in localStorage and returns true", () => {
			const result = setStorageString("test-key", "test-value");
			expect(result).toBe(true);
			expect(window.localStorage.getItem("test-key")).toBe("test-value");
		});

		it("returns false if localStorage throws", () => {
			vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
				throw new Error("Quota exceeded");
			});
			const result = setStorageString("test-key", "test-value");
			expect(result).toBe(false);
		});
	});

	describe("removeStorageItem", () => {
		it("removes item from localStorage", () => {
			window.localStorage.setItem("test-key", "test-value");
			removeStorageItem("test-key");
			expect(window.localStorage.getItem("test-key")).toBe(null);
		});

		it("handles errors gracefully", () => {
			vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
				throw new Error("Storage error");
			});
			// Should not throw
			expect(() => removeStorageItem("test-key")).not.toThrow();
		});
	});

	describe("parseJsonValue", () => {
		it("parses valid JSON string", () => {
			expect(parseJsonValue('{"a": 1}', { a: 0 })).toEqual({ a: 1 });
		});

		it("returns fallback for null input", () => {
			expect(parseJsonValue(null, "fallback")).toBe("fallback");
		});

		it("returns fallback for invalid JSON string", () => {
			expect(parseJsonValue("invalid-json", "fallback")).toBe("fallback");
		});
	});

	describe("readStorageJson", () => {
		it("reads and parses JSON from localStorage", () => {
			window.localStorage.setItem("test-json", '{"val": 42}');
			expect(readStorageJson("test-json", { val: 0 })).toEqual({ val: 42 });
		});

		it("returns fallback if key does not exist", () => {
			expect(readStorageJson("non-existent", { default: true })).toEqual({ default: true });
		});
	});

	describe("writeStorageJson", () => {
		it("stringifies value and sets in localStorage", () => {
			const result = writeStorageJson("test-json", { foo: "bar" });
			expect(result).toBe(true);
			expect(window.localStorage.getItem("test-json")).toBe('{"foo":"bar"}');
		});

		it("returns false if localStorage.setItem throws", () => {
			vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
				throw new Error("Quota exceeded");
			});
			const result = writeStorageJson("test-json", { foo: "bar" });
			expect(result).toBe(false);
		});

		it("returns false if JSON.stringify throws (circular reference)", () => {
			const circularObj: any = { a: 1 };
			circularObj.self = circularObj; // Create circular reference

			const result = writeStorageJson("circular-test", circularObj);
			expect(result).toBe(false);
		});
	});
});
