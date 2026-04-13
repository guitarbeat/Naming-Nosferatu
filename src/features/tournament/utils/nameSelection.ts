import { shuffleArray } from "@/shared/lib/utils";
import { getRandomCatImage } from "@/shared/lib/media";
import { CAT_IMAGES } from "@/shared/lib/constants";
import type { IdType, NameItem } from "@/shared/types";

type ItemWithId<TId> = {
	id: TId;
};

export function countSelectedItems<TId>(
	items: ReadonlyArray<ItemWithId<TId>>,
	selectedIds: ReadonlySet<TId>,
): number {
	let count = 0;
	for (const item of items) {
		if (selectedIds.has(item.id)) {
			count += 1;
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

	return new Set(
		shuffleArray([...items])
			.slice(0, count)
			.map((item) => item.id),
	);
}

export function buildNameCardImages(names: readonly NameItem[]): {
	catImages: string[];
	catImageById: Map<IdType, string>;
} {
	const catImages = names.map((nameItem) => getRandomCatImage(nameItem.id, CAT_IMAGES));
	const catImageById = new Map<IdType, string>();

	names.forEach((nameItem, index) => {
		const image = catImages[index];
		if (image) {
			catImageById.set(nameItem.id, image);
		}
	});

	return { catImages, catImageById };
}
