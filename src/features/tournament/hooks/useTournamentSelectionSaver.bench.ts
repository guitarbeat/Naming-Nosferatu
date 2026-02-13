import { bench, describe } from "vitest";
import type { NameItem } from "@/types/appTypes";

function generateNames(count: number): NameItem[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `id-${i}`,
		name: `Name ${i}`,
		rating: 1500, // Optional based on types, but good to include
	}));
}

const smallList = generateNames(100);
const mediumList = generateNames(1000);
const largeList = generateNames(5000);

describe("Selection Hash Calculation", () => {
	bench("Small list (100 items)", () => {
		smallList
			.map((n) => n.id)
			.sort()
			.join(",");
	});

	bench("Medium list (1000 items)", () => {
		mediumList
			.map((n) => n.id)
			.sort()
			.join(",");
	});

	bench("Large list (5000 items)", () => {
		largeList
			.map((n) => n.id)
			.sort()
			.join(",");
	});
});
