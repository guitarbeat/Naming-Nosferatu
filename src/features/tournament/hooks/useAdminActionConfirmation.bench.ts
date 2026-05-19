import { bench, describe } from "vitest";
import type { NameItem } from "@/shared/types";

describe("useAdminActionConfirmation names lookup", () => {
	const names: NameItem[] = Array.from(
		{ length: 1000 },
		(_, i) =>
			({
				id: i,
				name: `Name${i}`,
			}) as NameItem,
	);

	const targetId = 999;

	bench("Array.find", () => {
		const target = names.find((name) => name.id === targetId);
		const result = target?.name ?? "this name";
	});

	const namesMap = new Map<number | string, NameItem>();
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		namesMap.set(name.id, name);
	}

	bench("Map.get", () => {
		const target = namesMap.get(targetId);
		const result = target?.name ?? "this name";
	});
});
