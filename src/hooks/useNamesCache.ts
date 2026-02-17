/**
 * @module useNamesCache
 * @description Hook for caching and managing names data with TTL support
 */

import { useCallback, useEffect, useRef } from "react";
import type { NameItem } from "@/shared/types";

interface CacheEntry {
	data: NameItem[];
	timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = "names_cache_v2";

export function useNamesCache() {
	const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

	const getCachedData = useCallback((includeHidden: boolean): NameItem[] | null => {
		const key = `${CACHE_KEY}_${includeHidden}`;
		const entry = cacheRef.current.get(key);

		if (!entry) {
			return null;
		}

		const now = Date.now();
		if (now - entry.timestamp > CACHE_TTL) {
			cacheRef.current.delete(key);
			return null;
		}

		return entry.data;
	}, []);

	const setCachedData = useCallback((data: NameItem[], includeHidden: boolean): void => {
		const key = `${CACHE_KEY}_${includeHidden}`;
		cacheRef.current.set(key, {
			data,
			timestamp: Date.now(),
		});
	}, []);

	const invalidateCache = useCallback((): void => {
		cacheRef.current.clear();
	}, []);

	// Load cache from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem("names_cache_map");
			if (stored) {
				const parsed = JSON.parse(stored);
				const now = Date.now();

				// Filter out expired entries
				Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
					if (now - entry.timestamp <= CACHE_TTL) {
						cacheRef.current.set(key, entry);
					}
				});
			}
		} catch (error) {
			console.warn("Failed to load names cache from localStorage:", error);
		}
	}, []);

	// Save cache to localStorage when it changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: cacheRef.current.size is the trigger
	useEffect(() => {
		const cacheObject = Object.fromEntries(cacheRef.current);
		localStorage.setItem("names_cache_map", JSON.stringify(cacheObject));
	}, []);

	return {
		getCachedData,
		setCachedData,
		invalidateCache,
	};
}
