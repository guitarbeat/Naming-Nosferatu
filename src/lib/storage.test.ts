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
		sessionStorage.clear();
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
});
