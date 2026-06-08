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
		const mapped = new Array(results.length);
		for (let i = 0; i < results.length; i++) {
			mapped[i] = results[i].item;
		}
		return mapped;
	}, [fuse, items, query]);
}
