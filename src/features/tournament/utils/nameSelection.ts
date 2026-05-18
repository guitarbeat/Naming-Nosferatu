
import {
	addToSet,
	addManyToSet,
	removeFromSet,
	toggleInSet,
} from "@/shared/lib/setUtils";

export const addIdToSet = addToSet;
export const toggleIdInSet = toggleInSet;
export const addIdsToSet = addManyToSet;
export const removeIdFromSet = removeFromSet;

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

import { addToSet as addIdToSet, addManyToSet as addIdsToSet, removeFromSet as removeIdFromSet, toggleInSet as toggleIdInSet } from "@/shared/lib/setUtils";
export { addIdToSet, addIdsToSet, removeIdFromSet, toggleIdInSet };
