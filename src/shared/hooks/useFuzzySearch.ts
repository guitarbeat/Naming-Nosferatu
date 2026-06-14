import Fuse, { type IFuseOptions } from "fuse.js";
import { useMemo } from "react";

export function useFuzzySearch<T>(
	items: T[],
	keys: Array<string>,
	query: string,
	options?: Partial<IFuseOptions<T>>,
): T[] {
	const fuse = useMemo(
		() =>
			new Fuse(items, {
				keys,
				threshold: 0.35,
				includeScore: true,
				ignoreLocation: true,
				minMatchCharLength: 1,
				...options,
			}),
		[items, keys, options],
	);

	return useMemo(() => {
		const trimmed = query.trim();
		if (!trimmed) {
			return items;
		}
		const results = fuse.search(trimmed);
		const length = results.length;
		const matchedItems = new Array(length);
		for (let i = 0; i < length; i++) {
			matchedItems[i] = results[i].item;
		}
		return matchedItems;
	}, [fuse, items, query]);
}
