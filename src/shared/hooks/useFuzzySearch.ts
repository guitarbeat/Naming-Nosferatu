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
		// biome-ignore lint/correctness/useExhaustiveDependencies: options is intentionally stable
		[items, keys, options],
	);

	return useMemo(() => {
		const trimmed = query.trim();
		if (!trimmed) {
			return items;
		}
		return fuse.search(trimmed).map((r) => r.item);
	}, [fuse, items, query]);
}
