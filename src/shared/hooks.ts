import { type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { CRITICAL_SHELL_IMAGES } from "@/shared/lib/constants";
import {
	decryptValue,
	getStorageString,
	parseJsonValue,
	readStorageJson,
	removeStorageItem,
	writeStorageJson,
} from "@/shared/lib/storage";
import type { NameItem } from "@/shared/types";

const IS_BROWSER = typeof window !== "undefined";
const IS_DEV = import.meta.env?.DEV ?? false;

// Helper debounce for useLocalStorage
function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (this: unknown, ...args: Parameters<T>) {
		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => func.apply(this, args), wait);
	} as T;
}

// ============================================================================
// 1. usePrefersReducedMotion
// ============================================================================
const EMPTY_OPTIONS: Record<string, never> = {};
const EMPTY_ARRAY: never[] = [];

export function usePrefersReducedMotion() {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
			return;
		}

		try {
			const media = window.matchMedia("(prefers-reduced-motion: reduce)");
			setMatches(media.matches);
			const handleChange = () => setMatches(media.matches);
			if (media.addEventListener) {
				media.addEventListener("change", handleChange);
				return () => media.removeEventListener("change", handleChange);
			} else if (media.addListener) {
				media.addListener(handleChange);
				return () => media.removeListener(handleChange);
			}
		} catch {
			// Ignore unsupported matchMedia errors
		}
	}, []);

	return matches;
}

// ============================================================================
// 2. useLocalStorage
// ============================================================================
export function useLocalStorage<T>(
	key: string,
	initialValue: T,
	options: {
		debounceWait?: number;
		onError?: (error: unknown) => void;
	} = EMPTY_OPTIONS,
): [T, (value: SetStateAction<T>) => void, () => void] {
	const initialRef = useRef(initialValue);
	const onErrorRef = useRef(options.onError);

	useEffect(() => {
		onErrorRef.current = options.onError;
	}, [options.onError]);

	const readValue = useCallback((): T => {
		if (!IS_BROWSER) {
			return initialRef.current;
		}

		const raw = getStorageString(key, null);
		return raw === null ? initialRef.current : parseJsonValue(raw, initialRef.current);
	}, [key]);

	const [stored, setStored] = useState<T>(readValue);
	const valueRef = useRef(stored);
	const currentKeyRef = useRef(key);

	// Safe sync of refs outside of render
	useEffect(() => {
		valueRef.current = stored;
		currentKeyRef.current = key;
	}, [stored, key]);
	const isUnmountingRef = useRef(false);

	const debouncedSetItemRef = useRef<ReturnType<typeof debounce> | null>(null);

	useEffect(() => {
		if (options.debounceWait && options.debounceWait > 0) {
			debouncedSetItemRef.current = debounce(
				((value: T) => {
					if (!IS_BROWSER) {
						return;
					}

					const success = writeStorageJson(key, value);
					if (!success) {
						onErrorRef.current?.(new Error(`localStorage write failed for key "${key}"`));
					}
				}) as (...args: unknown[]) => void,
				options.debounceWait,
			);
			return;
		}

		debouncedSetItemRef.current = null;
	}, [key, options.debounceWait]);

	// Track true unmount (not key changes)
	useEffect(() => {
		isUnmountingRef.current = false; // Reset on (re)mount (handles strict mode)
		return () => {
			isUnmountingRef.current = true;
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: key is needed to re-register cleanup when key changes
	useEffect(() => {
		return () => {
			if (!isUnmountingRef.current || !options.debounceWait || !IS_BROWSER) {
				return;
			}

			const success = writeStorageJson(currentKeyRef.current, valueRef.current);
			if (!success) {
				if (IS_DEV) {
					console.error(
						`[useLocalStorage] Unmount flush failed for key "${currentKeyRef.current}".`,
					);
				}
			}
		};
	}, [key, options.debounceWait]);

	const setValue = useCallback(
		(next: SetStateAction<T>) => {
			try {
				const resolved =
					typeof next === "function" ? (next as (previous: T) => T)(valueRef.current) : next;

				setStored(resolved);
				valueRef.current = resolved;

				if (debouncedSetItemRef.current) {
					debouncedSetItemRef.current(resolved);
					return;
				}

				if (!IS_BROWSER) {
					return;
				}

				const success = writeStorageJson(key, resolved);
				if (!success) {
					onErrorRef.current?.(new Error(`localStorage write failed for key "${key}"`));
				}
			} catch (error) {
				if (IS_DEV) {
					console.error(`[useLocalStorage] Unexpected error for key "${key}":`, error);
				}
				onErrorRef.current?.(error);
			}
		},
		[key],
	);

	const removeValue = useCallback(() => {
		const fallback = initialRef.current;
		setStored(fallback);
		valueRef.current = fallback;

		if (IS_BROWSER) {
			removeStorageItem(key);
		}
	}, [key]);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}

		const handleStorage = (event: StorageEvent) => {
			if (event.key !== key) {
				return;
			}

			if (event.newValue === null) {
				setStored(initialRef.current);
				valueRef.current = initialRef.current;
				return;
			}

			const decrypted = decryptValue(event.newValue);
			const parsed = parseJsonValue<T>(decrypted, initialRef.current);
			setStored(parsed);
			valueRef.current = parsed;
		};

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [key]);

	return [stored, setValue, removeValue];
}

// ============================================================================
// 3. useSectionScroll
// ============================================================================
export function useSectionScroll() {
	const prefersReducedMotion = usePrefersReducedMotion();
	const pendingScrollRef = useRef<number | null>(null);

	const clearPendingScroll = useCallback(() => {
		if (pendingScrollRef.current === null) {
			return;
		}
		window.clearTimeout(pendingScrollRef.current);
		pendingScrollRef.current = null;
	}, []);

	const scrollToSection = useCallback(
		(id: string) => {
			clearPendingScroll();
			pendingScrollRef.current = window.setTimeout(() => {
				const element = document.getElementById(id);
				element?.scrollIntoView?.({
					behavior: prefersReducedMotion ? "auto" : "smooth",
					block: "start",
				});
				pendingScrollRef.current = null;
			}, 10);
		},
		[clearPendingScroll, prefersReducedMotion],
	);

	const scheduleSectionScroll = useCallback(
		(id: string, delay: number = 800) => {
			clearPendingScroll();
			pendingScrollRef.current = window.setTimeout(() => {
				pendingScrollRef.current = null;
				scrollToSection(id);
			}, delay);
		},
		[clearPendingScroll, scrollToSection],
	);

	return { scrollToSection, scheduleSectionScroll, clearPendingScroll };
}

// ============================================================================
// 4. useAsyncData
// ============================================================================
interface UseAsyncDataOptions {
	deps?: unknown[];
}

interface UseAsyncDataResult<T> {
	data: T;
	isLoading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
}

export function useAsyncData<T>(
	fetcher: (signal?: AbortSignal) => Promise<T>,
	initialValue: T,
	options: UseAsyncDataOptions = EMPTY_OPTIONS,
): UseAsyncDataResult<T> {
	const { deps = EMPTY_ARRAY } = options;
	const [data, setData] = useState<T>(initialValue);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const fetcherRef = useRef(fetcher);
	useEffect(() => {
		fetcherRef.current = fetcher;
	}, [fetcher]);

	const abortRef = useRef<AbortController | null>(null);

	const run = useCallback(async () => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setIsLoading(true);
		setError(null);
		try {
			const result = await fetcherRef.current(controller.signal);
			if (!controller.signal.aborted) {
				setData(result);
			}
		} catch (error) {
			if (!controller.signal.aborted) {
				setError(error instanceof Error ? error : new Error(String(error)));
			}
		} finally {
			if (!controller.signal.aborted) {
				setIsLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		let isActive = true;
		const controller = new AbortController();
		setIsLoading(true);
		setError(null);

		fetcherRef
			.current(controller.signal)
			.then((result) => {
				if (isActive) {
					setData(result);
				}
			})
			.catch((error) => {
				if (isActive && error?.name !== "AbortError") {
					setError(error instanceof Error ? error : new Error(String(error)));
				}
			})
			.finally(() => {
				if (isActive) {
					setIsLoading(false);
				}
			});

		return () => {
			isActive = false;
			controller.abort();
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: caller supplies dependency list
	}, deps);

	return { data, isLoading, error, refresh: run };
}

// ============================================================================
// 5. useNamesCache
// ============================================================================
interface CacheEntry {
	data: NameItem[];
	timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = "names_cache_v2";

function isNameItemArray(value: unknown): value is NameItem[] {
	return Array.isArray(value);
}

function isCacheEntry(value: unknown): value is CacheEntry {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as Partial<CacheEntry>;
	return typeof candidate.timestamp === "number" && isNameItemArray(candidate.data);
}

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

		// Persist to localStorage after updating cache
		const cacheObject = Object.fromEntries(cacheRef.current);
		writeStorageJson("names_cache_map", cacheObject);
	}, []);

	const invalidateCache = useCallback((): void => {
		cacheRef.current.clear();
	}, []);

	// Load cache from localStorage on mount
	useEffect(() => {
		const stored = readStorageJson("names_cache_map", {});

		if (!stored || typeof stored !== "object") {
			return;
		}

		const now = Date.now();
		for (const [key, entry] of Object.entries(stored as Record<string, unknown>)) {
			if (isCacheEntry(entry) && now - entry.timestamp <= CACHE_TTL) {
				cacheRef.current.set(key, entry);
			}
		}
	}, []);

	return {
		getCachedData,
		setCachedData,
		invalidateCache,
	};
}

// ============================================================================
// 6. usePreloadImages (Critical Shell Image Preloader)
// ============================================================================

export interface UsePreloadImagesOptions {
	enabled?: boolean;
	crossOrigin?: "anonymous" | "use-credentials";
	onComplete?: (loadedUrls: string[], failedUrls: string[]) => void;
	onError?: (failedUrl: string) => void;
}

export interface UsePreloadImagesResult {
	isLoading: boolean;
	isLoaded: boolean;
	progress: number; // 0.0 to 1.0
	loadedCount: number;
	totalCount: number;
	loadedUrls: string[];
	failedUrls: string[];
}

// Module-level cache of successfully preloaded URLs across component lifecycles
const globalPreloadedImageCache = new Set<string>();

/**
 * Preload a single image URL into memory/browser cache.
 */
export function preloadImage(
	src: string,
	crossOrigin?: "anonymous" | "use-credentials",
): Promise<boolean> {
	if (!src || !IS_BROWSER) {
		return Promise.resolve(false);
	}
	if (globalPreloadedImageCache.has(src)) {
		return Promise.resolve(true);
	}

	return new Promise((resolve) => {
		const img = new Image();
		if (crossOrigin && !src.startsWith("data:") && !src.startsWith("blob:")) {
			img.crossOrigin = crossOrigin;
		}

		img.onload = () => {
			globalPreloadedImageCache.add(src);
			resolve(true);
		};

		img.onerror = () => {
			resolve(false);
		};

		img.src = src;
	});
}

/**
 * Preload a list of image URLs in parallel.
 */
export async function preloadImages(
	srcs: readonly string[],
	crossOrigin?: "anonymous" | "use-credentials",
): Promise<boolean[]> {
	if (!IS_BROWSER || !srcs.length) {
		return [];
	}
	return Promise.all(srcs.map((src) => preloadImage(src, crossOrigin)));
}

/**
 * React hook to pre-load critical images defined in the app shell or passed as arguments.
 */
export function usePreloadImages(
	images: readonly string[] = CRITICAL_SHELL_IMAGES,
	options: UsePreloadImagesOptions = EMPTY_OPTIONS,
): UsePreloadImagesResult {
	const { enabled = true, crossOrigin, onComplete, onError } = options;

	const [loadedUrls, setLoadedUrls] = useState<string[]>(() => {
		if (!IS_BROWSER) {
			return [];
		}
		return images.filter((img) => globalPreloadedImageCache.has(img));
	});
	const [failedUrls, setFailedUrls] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(() => {
		if (!enabled || !IS_BROWSER || images.length === 0) {
			return false;
		}
		return !images.every((img) => globalPreloadedImageCache.has(img));
	});

	const onCompleteRef = useRef(onComplete);
	const onErrorRef = useRef(onError);

	useEffect(() => {
		onCompleteRef.current = onComplete;
		onErrorRef.current = onError;
	}, [onComplete, onError]);

	useEffect(() => {
		if (!enabled || !IS_BROWSER || images.length === 0) {
			setIsLoading(false);
			return;
		}

		let isCancelled = false;
		const activeImages = Array.from(new Set(images.filter(Boolean)));
		const total = activeImages.length;

		if (total === 0) {
			setIsLoading(false);
			return;
		}

		const alreadyLoaded = activeImages.filter((src) => globalPreloadedImageCache.has(src));
		if (alreadyLoaded.length === total) {
			setLoadedUrls(alreadyLoaded);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		let completedCount = 0;
		const currentLoaded: string[] = [...alreadyLoaded];
		const currentFailed: string[] = [];

		const checkFinish = () => {
			if (isCancelled) {
				return;
			}
			if (completedCount >= total) {
				setIsLoading(false);
				onCompleteRef.current?.(currentLoaded, currentFailed);
			}
		};

		for (const src of activeImages) {
			if (globalPreloadedImageCache.has(src)) {
				completedCount++;
				checkFinish();
				continue;
			}

			const img = new Image();
			if (crossOrigin && !src.startsWith("data:") && !src.startsWith("blob:")) {
				img.crossOrigin = crossOrigin;
			}

			img.onload = () => {
				if (isCancelled) {
					return;
				}
				globalPreloadedImageCache.add(src);
				currentLoaded.push(src);
				setLoadedUrls((prev) => (prev.includes(src) ? prev : [...prev, src]));
				completedCount++;
				checkFinish();
			};

			img.onerror = () => {
				if (isCancelled) {
					return;
				}
				currentFailed.push(src);
				setFailedUrls((prev) => (prev.includes(src) ? prev : [...prev, src]));
				onErrorRef.current?.(src);
				completedCount++;
				checkFinish();
			};

			img.src = src;
		}

		return () => {
			isCancelled = true;
		};
	}, [images, enabled, crossOrigin]);

	const totalCount = images.length;
	const loadedCount = loadedUrls.length;
	const isLoaded =
		!isLoading && (totalCount === 0 || loadedCount + failedUrls.length >= totalCount);
	const progress =
		totalCount === 0 ? 1 : Math.min(1, (loadedCount + failedUrls.length) / totalCount);

	return {
		isLoading,
		isLoaded,
		progress,
		loadedCount,
		totalCount,
		loadedUrls,
		failedUrls,
	};
}
