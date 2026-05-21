import { describe, expect, it } from "vitest";
import type { NameWithStats } from "../types";
import { filterNamesByStatusAndSearch } from "./adminUtils";

describe("filterNamesByStatusAndSearch", () => {
	const mockNames = [
		{
			id: "1",
			name: "ActiveName1",
			description: "First active cat",
			isHidden: false,
			lockedIn: false,
		},
		{
			id: "2",
			name: "ActiveName2",
			description: "Second active feline",
			isHidden: false,
			lockedIn: false,
		},
		{
			id: "3",
			name: "HiddenName",
			description: "A hidden one",
			isHidden: true,
			lockedIn: false,
		},
		{
			id: "4",
			name: "LockedName",
			description: "A locked one",
			isHidden: false,
			lockedIn: true,
		},
		{
			id: "5",
			name: "HiddenLockedName",
			description: "A hidden and locked one",
			isHidden: true,
			lockedIn: true,
		},
	] as NameWithStats[];

	it("returns all names when filter is 'all' and search is empty", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "all", "");
		expect(result).toHaveLength(5);
		expect(result).toEqual(mockNames);
	});

	it("filters by 'active' status", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "active", "");
		expect(result).toHaveLength(2);
		expect(result.map((n) => n.id)).toEqual(["1", "2"]);
	});

	it("filters by 'hidden' status", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "hidden", "");
		expect(result).toHaveLength(2);
		expect(result.map((n) => n.id)).toEqual(["3", "5"]);
	});

	it("filters by 'locked' status", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "locked", "");
		expect(result).toHaveLength(2);
		expect(result.map((n) => n.id)).toEqual(["4", "5"]);
	});

	it("filters by search term matching name (case-insensitive)", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "all", "activename1");
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("1");
	});

	it("filters by search term matching description (case-insensitive)", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "all", "feline");
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("2");
	});

	it("returns empty array when search term has no matches", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "all", "nonexistent");
		expect(result).toHaveLength(0);
	});

	it("combines status filter and search term", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "active", "active");
		expect(result).toHaveLength(2); // Matches "ActiveName1" and "ActiveName2"

		const resultHidden = filterNamesByStatusAndSearch(mockNames, "hidden", "one");
		expect(resultHidden).toHaveLength(2); // Matches "A hidden one" and "A hidden and locked one"

		const resultLocked = filterNamesByStatusAndSearch(mockNames, "locked", "one");
		expect(resultLocked).toHaveLength(2); // Matches "A locked one" and "A hidden and locked one"

		// Search term matches a name that is filtered out by status
		const resultNoMatch = filterNamesByStatusAndSearch(mockNames, "active", "hidden");
		expect(resultNoMatch).toHaveLength(0);
	});

	it("ignores whitespace-only search term", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "all", "   ");
		expect(result).toHaveLength(5);
	});

	it("trims whitespace from search term", () => {
		const result = filterNamesByStatusAndSearch(mockNames, "all", "  LockedName  ");
		expect(result).toHaveLength(2);
		expect(result.map((n) => n.id)).toEqual(["4", "5"]);
	});
});
