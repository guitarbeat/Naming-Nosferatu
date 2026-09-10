import { type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { CRITICAL_SHELL_IMAGES } from "@/lib/constants";
import {
	decryptValue,
	getStorageString,
	parseJsonValue,
	removeStorageItem,
	writeStorageJson,
} from "@/lib/storage";

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

function usePrefersReducedMotion() {
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
// ============================================================================
// 4. useSectionScroll
// ============================================================================
export function useSectionScroll() {
	const prefersReducedMotion = usePrefersReducedMotion();
	const pendingScrollRef = useRef<number | null>(null);
	const pendingRafRef = useRef<number | null>(null);

	const clearPendingScroll = useCallback(() => {
		if (pendingScrollRef.current !== null) {
			window.clearTimeout(pendingScrollRef.current);
			pendingScrollRef.current = null;
		}
		if (pendingRafRef.current !== null) {
			window.cancelAnimationFrame(pendingRafRef.current);
			pendingRafRef.current = null;
		}
	}, []);

	const scrollToSection = useCallback(
		(id: string) => {
			clearPendingScroll();
			pendingRafRef.current = window.requestAnimationFrame(() => {
				const targetId =
					id === "stats" || id === "stats-section" || id === "results"
						? "analysis"
						: id === "pick-names-section" ||
								id === "tournament" ||
								id === "tournament-section" ||
								id === "contenders"
							? "pick"
							: id;
				const element = document.getElementById(targetId) || document.getElementById(id);
				if (element) {
					element.scrollIntoView?.({
						behavior: prefersReducedMotion ? "auto" : "smooth",
						block: "start",
					});
				} else if (id === "landing" || id === "top") {
					window.scrollTo({
						top: 0,
						behavior: prefersReducedMotion ? "auto" : "smooth",
					});
				}
				pendingRafRef.current = null;
			});
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
// 5. usePreloadImages (Critical Shell Image Preloader)
// ============================================================================

interface UsePreloadImagesOptions {
	enabled?: boolean;
	crossOrigin?: "anonymous" | "use-credentials";
	onComplete?: (loadedUrls: string[], failedUrls: string[]) => void;
	onError?: (failedUrl: string) => void;
}

interface UsePreloadImagesResult {
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

// ============================================================================
// 7. useDebounce
// ============================================================================
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}
