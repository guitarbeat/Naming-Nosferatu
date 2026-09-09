import { describe, expect, it } from "vitest";
import type { NameWithStats } from "./types";
import { buildAdminStats, filterNamesByStatusAndSearch, mapNameToDisplay } from "./utils";

describe("dashboard utils", () => {
	const sampleNames: NameWithStats[] = [
		{
			id: "1",
			name: "Mittens",
			rating: 1400,
			is_hidden: false,
			locked_in: false,
		},
		{
			id: "2",
			name: "Shadow",
			rating: 1200,
			is_hidden: true,
			locked_in: false,
		},
		{
			id: "3",
			name: "Nosferatu",
			rating: 1600,
			is_hidden: false,
			locked_in: true,
		},
	];

	it("maps names to display format", () => {
		const mapped = mapNameToDisplay(sampleNames[0]);
		expect(mapped.name).toBe("Mittens");
		expect(mapped.id).toBe("1");
	});

	it("filters names by search term", () => {
		const result = filterNamesByStatusAndSearch(sampleNames, "all", "mitt");
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Mittens");
	});

	it("filters active names", () => {
		const active = filterNamesByStatusAndSearch(sampleNames, "active", "");
		expect(active).toHaveLength(1);
		expect(active[0].name).toBe("Mittens");
	});

	it("filters hidden names", () => {
		const hidden = filterNamesByStatusAndSearch(sampleNames, "hidden", "");
		expect(hidden).toHaveLength(1);
		expect(hidden[0].name).toBe("Shadow");
	});

	it("filters locked names", () => {
		const locked = filterNamesByStatusAndSearch(sampleNames, "locked", "");
		expect(locked).toHaveLength(1);
		expect(locked[0].name).toBe("Nosferatu");
	});

	it("builds admin statistics correctly", () => {
		const stats = buildAdminStats(sampleNames, {
			totalUsers: 42,
			totalRatings: 100,
		});
		expect(stats.totalNames).toBe(3);
		expect(stats.totalUsers).toBe(42);
		expect(stats.recentVotes).toBe(100);
	});
});
