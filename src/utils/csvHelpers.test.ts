import { describe, expect, it } from "vitest";
import type { NameItem } from "../types/appTypes";
import { generateCSV, sanitizeCSVField } from "./csvHelpers";

describe("sanitizeCSVField", () => {
	it("should sanitize strings starting with =", () => {
		expect(sanitizeCSVField("=cmd|/C calc!A0")).toBe(`"'=cmd|/C calc!A0"`);
	});

	it("should sanitize strings starting with +", () => {
		expect(sanitizeCSVField("+1+1")).toBe(`"'+1+1"`);
	});

	it("should sanitize strings starting with -", () => {
		expect(sanitizeCSVField("-1+1")).toBe(`"'-1+1"`);
	});

	it("should sanitize strings starting with @", () => {
		expect(sanitizeCSVField("@SUM(1+1)")).toBe(`"'@SUM(1+1)"`);
	});

	it("should escape double quotes", () => {
		expect(sanitizeCSVField('test "quote"')).toBe(`"test ""quote"""`);
	});

	it("should return empty quoted string for null/undefined", () => {
		expect(sanitizeCSVField(null)).toBe(`""`);
		expect(sanitizeCSVField(undefined)).toBe(`""`);
	});

	it("should handle normal strings", () => {
		expect(sanitizeCSVField("normal string")).toBe(`"normal string"`);
	});
});

describe("generateCSV", () => {
	it("should generate correct CSV format", () => {
		const data: NameItem[] = [
			{ id: 1, name: "Test Name", rating: 1500, wins: 1, losses: 0 },
			{ id: 2, name: "=Bad Name", rating: 1200, wins: 0, losses: 5 },
		];

		const csv = generateCSV(data);
		const lines = csv.split("\n");

		expect(lines[0]).toBe("Name,Rating,Wins,Losses");
		expect(lines[1]).toBe('"Test Name",1500,1,0');
		expect(lines[2]).toBe(`"'=Bad Name",1200,0,5`);
	});

	it("should handle empty input", () => {
		expect(generateCSV([])).toBe("");
	});
});
