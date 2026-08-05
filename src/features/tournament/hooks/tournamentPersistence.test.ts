import { describe, expect, it } from "vitest";
import type { NameItem } from "@/shared/types";
import { createTournamentId } from "./tournamentPersistence";

describe("createTournamentId", () => {
	it("should generate a correct ID with sorted names and a username", () => {
		const names: NameItem[] = [
			{ id: 2, name: "Zeta" },
			{ id: 1, name: "Alpha" },
			{ id: 3, name: "Charlie" },
		];
		const result = createTournamentId(names, "Alice");
		expect(result).toBe("tournament-Alice-rr2ny-3");
	});

	it("should use 'anonymous' when userName is not provided", () => {
		const names: NameItem[] = [
			{ id: 1, name: "Bravo" },
			{ id: 2, name: "Delta" },
		];
		const result = createTournamentId(names);
		expect(result).toBe("tournament-anonymous-11fb-2");
	});

	it("should fallback to stringified ID when name is missing or falsy", () => {
		const names = [
			{ id: "uuid-1", name: "" },
			{ id: 42, name: undefined },
			{ id: 99, name: "Valid" },
		] as NameItem[];
		const result = createTournamentId(names, "Bob");
		expect(result).toBe("tournament-Bob-nf01kz-3");
	});

	it("should handle an empty array of names", () => {
		const names: NameItem[] = [];
		const result = createTournamentId(names, "Eve");
		expect(result).toBe("tournament-Eve-0-0");
	});

	it("should handle empty userName and empty names", () => {
		const names: NameItem[] = [];
		const result = createTournamentId(names, "");
		expect(result).toBe("tournament-anonymous-0-0");
	});
});
