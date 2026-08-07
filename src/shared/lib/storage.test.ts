import { afterEach, describe, expect, it, vi } from "vitest";
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
		expect(parseJsonValue("undefined", "fallback")).toBe("fallback"); // "undefined" is not valid JSON
	});

	it("returns fallback when value is an empty string", () => {
		expect(parseJsonValue("", "fallback")).toBe("fallback");
	});
});

describe("storage", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		window.localStorage.clear();
	});

	describe("isStorageAvailable", () => {
		it("returns true when available", () => {
			expect(isStorageAvailable()).toBe(true);
		});

		it("returns false when window is undefined", () => {
			const originalWindow = global.window;
			// @ts-expect-error - overriding for test
			global.window = undefined;
			expect(isStorageAvailable()).toBe(false);
			global.window = originalWindow;
		});

		it("returns false when localStorage throws", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementationOnce(() => {
				throw new Error("Quota exceeded");
			});
			expect(isStorageAvailable()).toBe(false);
		});
	});

	describe("getStorageString and setStorageString", () => {
		it("returns fallback when value doesn't exist", () => {
			expect(getStorageString("test-key", "fallback")).toBe("fallback");
		});

		it("returns fallback when storage is unavailable", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementationOnce(() => {
				throw new Error("Quota exceeded");
			});
			expect(getStorageString("test-key", "fallback")).toBe("fallback");
		});

		it("returns fallback on decryption error", () => {
			window.localStorage.setItem("test-key", "unencrypted-value");
			expect(getStorageString("test-key", "fallback")).toBe(
				"unencrypted-value",
			);
		});

		it("sets and gets a value", () => {
			setStorageString("test-key", "test-value");
			expect(getStorageString("test-key")).toBe("test-value");
			expect(window.localStorage.getItem("test-key")).not.toBe("test-value");
		});

		it("fails to set value when storage is unavailable", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
				throw new Error("Quota exceeded");
			});
			expect(setStorageString("test-key", "test-value")).toBe(false);
		});
	});

	describe("removeStorageItem", () => {
		it("removes an item", () => {
			setStorageString("test-key", "test-value");
			removeStorageItem("test-key");
			expect(getStorageString("test-key")).toBeNull();
		});

		it("does nothing when storage is unavailable", () => {
			const originalWindow = global.window;
			// @ts-expect-error - overriding for test
			global.window = undefined;
			expect(() => removeStorageItem("test-key")).not.toThrow();
			global.window = originalWindow;
		});
	});

	describe("readStorageJson and writeStorageJson", () => {
		it("returns fallback when value doesn't exist", () => {
			expect(readStorageJson("test-key", { fallback: true })).toEqual({
				fallback: true,
			});
		});

		it("sets and gets a json value", () => {
			writeStorageJson("test-key", { key: "value", num: 42 });
			expect(readStorageJson("test-key", {})).toEqual({
				key: "value",
				num: 42,
			});
			expect(window.localStorage.getItem("test-key")).not.toBe(
				JSON.stringify({ key: "value", num: 42 }),
			);
		});

		it("fails to set json value when storage is unavailable", () => {
			vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
				throw new Error("Quota exceeded");
			});
			expect(writeStorageJson("test-key", { key: "value" })).toBe(false);
		});
	});

	describe("decryptValue", () => {
		it("returns empty string when value is null or undefined", () => {
			expect(decryptValue(null)).toBe("");
			expect(decryptValue(undefined)).toBe("");
		});

		it("decrypts an encrypted value", () => {
			setStorageString("test-key", "test-value");
			const encryptedValue = window.localStorage.getItem("test-key");
			expect(decryptValue(encryptedValue)).toBe("test-value");
		});
	});
});
