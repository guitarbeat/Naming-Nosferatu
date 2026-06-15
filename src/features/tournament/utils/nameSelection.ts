import { CAT_IMAGES } from "@/shared/lib/constants";
import { getRandomCatImage } from "@/shared/lib/media";
import type { IdType, NameItem } from "@/shared/types";

type ItemWithId<TId> = {
	id: TId;
};

export function countSelectedItems<TId>(
	items: ReadonlyArray<ItemWithId<TId>>,
	selectedIds: ReadonlySet<TId>,
): number {
	let count = 0;
	const limit = selectedIds.size;
	if (limit === 0 || items.length === 0) {
		return 0;
	}

	// ⚡ Bolt Performance Optimization:
	// Use an indexed loop and an early exit condition.
	// When we've found all the selected items, we can stop iterating.
	// Impact: Reduces O(N) full array scans to O(K) where K is the index of the last matched item.
	for (let i = 0; i < items.length; i++) {
		if (selectedIds.has(items[i].id)) {
			count += 1;
			if (count === limit) {
				break;
			}
		}
	}
	return count;
}

export function pickRandomItemIds<T extends ItemWithId<IdType>>(
	items: ReadonlyArray<T>,
	count: number,
): Set<IdType> {
	if (count <= 0 || items.length === 0) {
		return new Set();
	}

	const maxCount = Math.min(count, items.length);
	const result = new Set<IdType>();

	if (maxCount < items.length * 0.25) {
		const selectedIndices = new Set<number>();
		while (selectedIndices.size < maxCount) {
			const randomIndex = Math.floor(Math.random() * items.length);
			if (!selectedIndices.has(randomIndex)) {
				selectedIndices.add(randomIndex);
				result.add(items[randomIndex]?.id);
			}
		}
		return result;
	}

	const pool = new Int32Array(items.length);
	for (let i = 0; i < items.length; i++) {
		pool[i] = i;
	}

	for (let i = 0; i < maxCount; i++) {
		const j = i + Math.floor(Math.random() * (items.length - i));
		const temp = pool[i] as number;
		pool[i] = pool[j] as number;
		pool[j] = temp;
		result.add(items[pool[i] as number]?.id);
	}

	return result;
}

export function buildNameCardImages(names: readonly NameItem[]): {
	catImages: string[];
	catImageById: Map<IdType, string>;
} {
	const count = names.length;
	const catImages = new Array<string>(count);
	const catImageById = new Map<IdType, string>();

	for (let i = 0; i < count; i++) {
		const nameItem = names[i];
		const image = getRandomCatImage(nameItem.id, CAT_IMAGES);
		catImages[i] = image;
		if (image) {
			catImageById.set(nameItem.id, image);
		}
	}

	return { catImages, catImageById };
}
