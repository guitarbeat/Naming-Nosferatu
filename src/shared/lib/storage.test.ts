import { describe, expect, it } from "vitest";
import { parseJsonValue } from "./storage";

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
