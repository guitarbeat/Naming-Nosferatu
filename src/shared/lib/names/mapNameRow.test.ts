import { describe, expect, it } from "vitest";
import { mapNameRow } from "./mapNameRow";

describe("mapNameRow", () => {
	it("maps snake_case fields correctly", () => {
		const raw = {
			id: "1",
			name: "Test",
			avg_rating: 1200,
			global_wins: 10,
			global_losses: 5,
			is_hidden: true,
			locked_in: true,
			created_at: "2023-01-01",
		};
		const result = mapNameRow(raw);
		expect(result.id).toBe("1");
		expect(result.name).toBe("Test");
		expect(result.avgRating).toBe(1200);
		expect(result.wins).toBe(10);
		expect(result.losses).toBe(5);
		expect(result.isHidden).toBe(true);
		expect(result.lockedIn).toBe(true);
		expect(result.createdAt).toBe("2023-01-01");
	});

	it("maps camelCase fields correctly", () => {
		const raw = {
			id: 2,
			name: "Camel",
			avgRating: 1300,
			globalWins: 20,
			globalLosses: 10,
			isHidden: false,
			lockedIn: false,
			createdAt: "2023-02-02",
		};
		const result = mapNameRow(raw);
		expect(result.id).toBe("2");
		expect(result.avgRating).toBe(1300);
		expect(result.wins).toBe(20);
		expect(result.losses).toBe(10);
		expect(result.isHidden).toBe(false);
		expect(result.lockedIn).toBe(false);
		expect(result.createdAt).toBe("2023-02-02");
	});

	it("uses default values for missing fields", () => {
		const result = mapNameRow({});
		expect(result.avgRating).toBe(1500);
		expect(result.wins).toBe(0);
		expect(result.losses).toBe(0);
		expect(result.isHidden).toBe(false);
		expect(result.isActive).toBe(true);
		expect(result.status).toBe("candidate");
	});
});
