import {
	type RefObject,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	decryptValue,
	getStorageString,
	parseJsonValue,
	removeStorageItem,
	writeStorageJson,
} from "@/lib/storage";
import { CRITICAL_SHELL_IMAGES } from "@/lib/utils";

const IS_BROWSER = typeof window !== "undefined";

/* ==========================================================================
   1. usePrefersReducedMotion
   ========================================================================== */

export function usePrefersReducedMotion(): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (!IS_BROWSER || typeof window.matchMedia !== "function") {
			return;
		}
		try {
			const media = window.matchMedia("(prefers-reduced-motion: reduce)");
			setMatches(media.matches);
			const handleChange = () => setMatches(media.matches);
			media.addEventListener?.("change", handleChange);
			return () => media.removeEventListener?.("change", handleChange);
		} catch {
			// Ignore unsupported matchMedia
		}
	}, []);

	return matches;
}

/* ==========================================================================
   2. useLocalStorage
   ========================================================================== */

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
	options: { onError?: (error: unknown) => void } = {},
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

	useEffect(() => {
		valueRef.current = stored;
	}, [stored]);

	const setValue = useCallback(
		(next: SetStateAction<T>) => {
			try {
				const resolved =
					typeof next === "function" ? (next as (previous: T) => T)(valueRef.current) : next;
				setStored(resolved);
				valueRef.current = resolved;
				if (IS_BROWSER && !writeStorageJson(key, resolved)) {
					onErrorRef.current?.(new Error(`localStorage write failed for key "${key}"`));
				}
			} catch (error) {
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
			const parsed = parseJsonValue<T>(decryptValue(event.newValue), initialRef.current);
			setStored(parsed);
			valueRef.current = parsed;
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [key]);

	return [stored, setValue, removeValue];
}

/* ==========================================================================
   3. useSectionScroll
   ========================================================================== */

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
		(id: string, delay: number = 600) => {
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

/* ==========================================================================
   4. usePreloadImages, useDebounce, useTimedState, useInertiaScroll
   ========================================================================== */

const globalPreloadedImageCache = new Set<string>();

export function usePreloadImages(images: readonly string[] = CRITICAL_SHELL_IMAGES): void {
	useEffect(() => {
		if (!IS_BROWSER || images.length === 0) {
			return;
		}
		for (const src of images) {
			if (src && !globalPreloadedImageCache.has(src)) {
				const img = new Image();
				img.onload = () => {
					globalPreloadedImageCache.add(src);
				};
				img.src = src;
			}
		}
	}, [images]);
}

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
}

export function useTimedState<T>(defaultValue: T) {
	const [value, setValue] = useState<T>(defaultValue);
	const timeoutRef = useRef<number | null>(null);
	const defaultRef = useRef(defaultValue);

	useEffect(() => {
		defaultRef.current = defaultValue;
	}, [defaultValue]);

	const clear = useCallback(() => {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const setTimed = useCallback(
		(newValue: T, durationMs: number) => {
			clear();
			setValue(newValue);
			timeoutRef.current = window.setTimeout(() => {
				setValue(defaultRef.current);
				timeoutRef.current = null;
			}, durationMs);
		},
		[clear],
	);

	useEffect(() => clear, [clear]);

	return { value, set: setValue, setTimed, clear } as const;
}

export function useInertiaScroll(
	_containerRef: RefObject<HTMLElement | null>,
	_prefersReducedMotion: boolean | null,
): void {
	// Native CSS smooth scrolling handles inertia cleanly without main-thread RAF overhead
}
