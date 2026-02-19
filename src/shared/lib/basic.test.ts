import { describe, expect, it } from "vitest";
import { formatDate } from "./basic";

describe("formatDate", () => {
	// These tests assume the test environment uses en-US locale by default.
	// If the environment locale is different, these tests might fail on the specific string format.

	it("formats a Date object correctly", () => {
		// Note: The output depends on the timezone of the test runner if the input is UTC
		// To avoid timezone issues, we can use a local date string
		const localDate = new Date(2023, 0, 1); // Jan 1, 2023 local time
		expect(formatDate(localDate)).toMatch(/Jan 1, 2023/);
	});

	it("formats a string date correctly", () => {
		const dateStr = "2023-01-01";
		// When parsing a date-only string, it's treated as UTC usually, but browser/node behavior can vary.
		// Let's check if it returns a valid formatted date string.
		const result = formatDate(dateStr);
		expect(result).not.toBe("Invalid Date");
		expect(result).toContain("2023");
		expect(result).toMatch(/[A-Z][a-z]{2}/); // Month short name
	});

	it("formats a timestamp number correctly", () => {
		const timestamp = new Date(2023, 0, 1).getTime();
		expect(formatDate(timestamp)).toMatch(/Jan 1, 2023/);
	});

	it("returns 'Invalid Date' for invalid date string", () => {
		expect(formatDate("invalid-date")).toBe("Invalid Date");
	});

	it("returns 'Invalid Date' for NaN", () => {
		expect(formatDate(NaN)).toBe("Invalid Date");
	});

	it("accepts custom options", () => {
		const date = new Date(2023, 0, 1);
		const result = formatDate(date, { weekday: "long" });
		expect(result).toContain("Sunday"); // Jan 1, 2023 was a Sunday
	});

	it("overrides default options with custom options", () => {
		const date = new Date(2023, 0, 1);
		// Default is month: 'short'. Override with 'long'.
		const result = formatDate(date, { month: "long" });
		expect(result).toMatch(/January 1, 2023/);
	});
});
