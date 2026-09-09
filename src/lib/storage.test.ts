import { beforeEach, describe, expect, it } from "vitest";
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
		localStorage.setItem("corrupted", "{invalid_json");
		expect(parseJsonValue(getStorageString("corrupted"), "fallback")).toBe("fallback");
	});
});
