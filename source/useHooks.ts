/**
 * @module useHooks
 * @description A comprehensive, self-contained collection of reusable React hooks.
 * Zero external dependencies beyond React itself.
 *
 * ## Hooks
 *
 * **Primitives**
 * - {@link useEventListener}  — Type-safe, auto-cleaning event listeners
 * - {@link useMediaQuery}     — Subscribe to CSS media queries
 * - {@link useDebounce}       — Debounce a rapidly-changing value
 * - {@link useThrottle}       — Throttle a rapidly-changing value
 * - {@link useToggle}         — Boolean toggle with setter
 * - {@link usePrevious}       — Access the previous render's value
 *
 * **Browser & Environment**
 * - {@link useBrowserState}   — Responsive breakpoints, network, accessibility
 * - {@link useOnlineStatus}   — Online/offline with transition callbacks
 *
 * **Persistence**
 * - {@link useLocalStorage}   — localStorage with cross-tab sync & functional updates
 * - {@link useCollapsible}    — Collapsible state with optional persistence
 *
 * **Layout**
 * - {@link useMasonryLayout}  — Dynamic masonry grid positioning
 *
 * **Forms**
 * - {@link useValidatedForm}  — Lightweight form state + validation (no zod/yup needed)
 */

import {
	type RefObject,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ Internal Utilities                                                         ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/** SSR-safe browser environment check */
const IS_BROWSER = typeof window !== "undefined";

/** SSR-safe navigator check */
const HAS_NAVIGATOR = typeof navigator !== "undefined";

/** Use `useLayoutEffect` in the browser, `useEffect` on the server (avoids SSR warnings). */
const useIsomorphicLayoutEffect = IS_BROWSER ? useLayoutEffect : useEffect;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useEventListener                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * Attach an event listener that auto-cleans on unmount.
 * The handler is stored in a ref so you never need to memoize it.
 *
 * @param eventName - DOM event name
 * @param handler   - Event callback (doesn't need to be memoized)
 * @param element   - Target: a ref, a raw element, or omit for `window`
 * @param options   - Standard `AddEventListenerOptions`
 *
 * @example
 * useEventListener("keydown", (e) => {
 *   if (e.key === "Escape") close();
 * });
 *
 * useEventListener("scroll", handleScroll, containerRef, { passive: true });
 */
export function useEventListener<K extends keyof WindowEventMap>(
	eventName: K,
	handler: (event: WindowEventMap[K]) => void,
	element?: undefined,
	options?: boolean | AddEventListenerOptions,
): void;
export function useEventListener<K extends keyof DocumentEventMap>(
	eventName: K,
	handler: (event: DocumentEventMap[K]) => void,
	element: RefObject<Document | null> | Document,
	options?: boolean | AddEventListenerOptions,
): void;
export function useEventListener<K extends keyof HTMLElementEventMap, T extends HTMLElement>(
	eventName: K,
	handler: (event: HTMLElementEventMap[K]) => void,
	element: RefObject<T | null> | T,
	options?: boolean | AddEventListenerOptions,
): void;
export function useEventListener(
	eventName: string,
	handler: (event: Event) => void,
	element?: RefObject<EventTarget | null> | EventTarget | null,
	options?: boolean | AddEventListenerOptions,
): void {
	const savedHandler = useRef(handler);

	useIsomorphicLayoutEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(() => {
		const target: EventTarget | null | undefined =
			element == null
				? IS_BROWSER
					? window
					: null
				: element instanceof EventTarget
					? element
					: (element as RefObject<EventTarget | null>).current;

		if (!target?.addEventListener) return;

		const listener = (event: Event) => savedHandler.current(event);

		target.addEventListener(eventName, listener, options);
		return () => target.removeEventListener(eventName, listener, options);
	}, [eventName, element, options]);
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useMediaQuery                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * Subscribe to a CSS media query.
 *
 * @param query - A valid CSS media query, e.g. `"(max-width: 768px)"`
 * @returns `true` when the query matches
 *
 * @example
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 * const isMobile = useMediaQuery("(max-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState<boolean>(() => {
		if (!IS_BROWSER) return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		if (!IS_BROWSER) return;

		const mql = window.matchMedia(query);
		// Sync in case query changed between render and effect
		setMatches(mql.matches);

		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useDebounce                                                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * Debounce a value. Returns the latest value only after `delay` ms of inactivity.
 *
 * @param value - The value to debounce
 * @param delay - Milliseconds to wait (default: 300)
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 400);
 *
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useThrottle                                                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * Throttle a value. Emits at most once per `interval` ms.
 *
 * @param value    - The value to throttle
 * @param interval - Minimum time between updates in ms (default: 300)
 *
 * @example
 * const throttledScrollY = useThrottle(scrollY, 100);
 */
export function useThrottle<T>(value: T, interval = 300): T {
	const [throttled, setThrottled] = useState(value);
	const lastUpdated = useRef(Date.now());
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const now = Date.now();
		const elapsed = now - lastUpdated.current;

		if (elapsed >= interval) {
			lastUpdated.current = now;
			setThrottled(value);
		} else {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => {
				lastUpdated.current = Date.now();
				setThrottled(value);
				timeoutRef.current = null;
			}, interval - elapsed);
		}

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [value, interval]);

	return throttled;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useToggle                                                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * Boolean toggle with a stable `toggle` callback and an escape-hatch `setValue`.
 *
 * @param initial - Starting value (default: false)
 * @returns `[value, toggle, setValue]`
 *
 * @example
 * const [isOpen, toggleOpen, setOpen] = useToggle(false);
 */
export function useToggle(
	initial = false,
): [value: boolean, toggle: () => void, setValue: (v: boolean) => void] {
	const [value, setValue] = useState(initial);
	const toggle = useCallback(() => setValue((v) => !v), []);
	return [value, toggle, setValue];
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ usePrevious                                                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * Returns the value from the previous render.
 *
 * @example
 * const prevCount = usePrevious(count);
 * if (prevCount !== undefined && prevCount < count) {
 *   // count increased
 * }
 */
export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T | undefined>(undefined);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref.current;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useBrowserState                                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/** Customizable responsive breakpoints (in pixels). */
export interface Breakpoints {
	smallMobile: number;
	mobile: number;
	tablet: number;
}

/** Comprehensive snapshot of the browser environment. */
export interface BrowserState {
	/** `width ≤ mobile` */
	isMobile: boolean;
	/** `mobile < width ≤ tablet` */
	isTablet: boolean;
	/** `width > tablet` */
	isDesktop: boolean;
	/** `width ≤ smallMobile` */
	isSmallMobile: boolean;
	/** User has enabled "reduce motion" in OS settings */
	prefersReducedMotion: boolean;
	/** `navigator.onLine` */
	isOnline: boolean;
	/** Connection effectiveType is `"2g"` or `"slow-2g"` */
	isSlowConnection: boolean;
	/** Network effective type: `"4g"`, `"3g"`, `"2g"`, `"slow-2g"`, or `"unknown"` */
	connectionType: string;
	/** Current `window.innerWidth` */
	viewportWidth: number;
	/** Current `window.innerHeight` */
	viewportHeight: number;
}

const DEFAULT_BREAKPOINTS: Breakpoints = {
	smallMobile: 480,
	mobile: 768,
	tablet: 1024,
};

/**
 * All-in-one hook for responsive design, network status, and accessibility prefs.
 * Internally throttled via `requestAnimationFrame` to avoid layout thrashing.
 *
 * @param breakpoints - Override the default breakpoint thresholds
 *
 * @example
 * const { isMobile, isOnline, prefersReducedMotion, viewportWidth } = useBrowserState();
 *
 * const browser = useBrowserState({ mobile: 640, tablet: 1280 });
 */
export function useBrowserState(breakpoints?: Partial<Breakpoints>): BrowserState {
	const bp = useMemo(
		() => ({ ...DEFAULT_BREAKPOINTS, ...breakpoints }),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[breakpoints?.smallMobile, breakpoints?.mobile, breakpoints?.tablet],
	);

	const snapshot = useCallback((): BrowserState => {
		const w = IS_BROWSER ? window.innerWidth : 1200;
		const h = IS_BROWSER ? window.innerHeight : 800;
		const online = HAS_NAVIGATOR ? navigator.onLine : true;
		const reducedMotion = IS_BROWSER
			? window.matchMedia("(prefers-reduced-motion: reduce)").matches
			: false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const conn: any = HAS_NAVIGATOR ? ((navigator as any).connection ?? null) : null;

		return {
			isMobile: w <= bp.mobile,
			isTablet: w > bp.mobile && w <= bp.tablet,
			isDesktop: w > bp.tablet,
			isSmallMobile: w <= bp.smallMobile,
			prefersReducedMotion: reducedMotion,
			isOnline: online,
			isSlowConnection: conn
				? conn.effectiveType === "2g" || conn.effectiveType === "slow-2g"
				: false,
			connectionType: conn?.effectiveType ?? "unknown",
			viewportWidth: w,
			viewportHeight: h,
		};
	}, [bp]);

	const [state, setState] = useState<BrowserState>(snapshot);

	useEffect(() => {
		if (!IS_BROWSER) return;

		let rafId: number | null = null;

		const scheduleUpdate = () => {
			if (rafId !== null) return; // coalesce rapid calls
			rafId = requestAnimationFrame(() => {
				rafId = null;
				setState(snapshot());
			});
		};

		const motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const conn: any = (navigator as any).connection ?? null;

		window.addEventListener("resize", scheduleUpdate, { passive: true });
		window.addEventListener("online", scheduleUpdate);
		window.addEventListener("offline", scheduleUpdate);
		motionMql.addEventListener("change", scheduleUpdate);
		conn?.addEventListener?.("change", scheduleUpdate);

		// Sync on mount (in case state drifted between render and effect)
		setState(snapshot());

		return () => {
			if (rafId !== null) cancelAnimationFrame(rafId);
			window.removeEventListener("resize", scheduleUpdate);
			window.removeEventListener("online", scheduleUpdate);
			window.removeEventListener("offline", scheduleUpdate);
			motionMql.removeEventListener("change", scheduleUpdate);
			conn?.removeEventListener?.("change", scheduleUpdate);
		};
	}, [snapshot]);

	return state;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useOnlineStatus                                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export interface OnlineStatusOptions {
	/** Fires when the browser transitions from offline → online */
	onReconnect?: () => void;
	/** Fires when the browser transitions from online → offline */
	onDisconnect?: () => void;
}

/**
 * Lightweight online/offline tracking with lifecycle callbacks.
 * Use this when you only need connectivity info (not full browser state).
 *
 * @example
 * const isOnline = useOnlineStatus({
 *   onReconnect: () => syncQueue.flush(),
 *   onDisconnect: () => toast("You're offline"),
 * });
 */
export function useOnlineStatus(options: OnlineStatusOptions = {}): boolean {
	const [isOnline, setIsOnline] = useState(() => (HAS_NAVIGATOR ? navigator.onLine : true));

	// Keep callbacks in a ref so consumers don't need to memoize them
	const optRef = useRef(options);
	useIsomorphicLayoutEffect(() => {
		optRef.current = options;
	}, [options]);

	useEffect(() => {
		if (!IS_BROWSER) return;

		const goOnline = () => {
			setIsOnline(true);
			optRef.current.onReconnect?.();
		};
		const goOffline = () => {
			setIsOnline(false);
			optRef.current.onDisconnect?.();
		};

		window.addEventListener("online", goOnline);
		window.addEventListener("offline", goOffline);
		return () => {
			window.removeEventListener("online", goOnline);
			window.removeEventListener("offline", goOffline);
		};
	}, []);

	return isOnline;
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useLocalStorage                                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

type Setter<T> = T | ((prev: T) => T);

/**
 * Persist state in `localStorage` with:
 * - Automatic JSON serialization / deserialization
 * - Functional updates that are **never stale** (ref-based)
 * - Cross-tab synchronization via the `storage` event
 * - A `remove()` helper to delete the key entirely
 *
 * @param key          - localStorage key
 * @param initialValue - Fallback when the key doesn't exist or can't be parsed
 * @returns `[value, setValue, removeValue]`
 *
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");
 * setTheme("dark");
 * setTheme((prev) => (prev === "light" ? "dark" : "light"));
 * removeTheme(); // resets to initialValue and removes the key
 */
export function useLocalStorage<T>(
	key: string,
	initialValue: T,
): [T, (value: Setter<T>) => void, () => void] {
	const readValue = useCallback((): T => {
		if (!IS_BROWSER) return initialValue;
		try {
			const raw = localStorage.getItem(key);
			return raw !== null ? (JSON.parse(raw) as T) : initialValue;
		} catch {
			return initialValue;
		}
	}, [key, initialValue]);

	const [stored, setStored] = useState<T>(readValue);

	// Ref ensures functional updates always see the latest value
	const valueRef = useRef(stored);
	valueRef.current = stored;

	const setValue = useCallback(
		(next: Setter<T>) => {
			try {
				const resolved = next instanceof Function ? next(valueRef.current) : next;
				setStored(resolved);
				valueRef.current = resolved;
				if (IS_BROWSER) localStorage.setItem(key, JSON.stringify(resolved));
			} catch (err) {
				console.warn(`[useLocalStorage] Failed to write "${key}":`, err);
			}
		},
		[key],
	);

	const removeValue = useCallback(() => {
		setStored(initialValue);
		valueRef.current = initialValue;
		if (IS_BROWSER) {
			try {
				localStorage.removeItem(key);
			} catch {
				/* quota errors, etc. */
			}
		}
	}, [key, initialValue]);

	// Cross-tab sync: another tab changed this key → update local state
	useEffect(() => {
		if (!IS_BROWSER) return;

		const onStorage = (e: StorageEvent) => {
			if (e.key !== key) return;
			try {
				const parsed = e.newValue !== null ? (JSON.parse(e.newValue) as T) : initialValue;
				setStored(parsed);
				valueRef.current = parsed;
			} catch {
				setStored(initialValue);
				valueRef.current = initialValue;
			}
		};

		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [key, initialValue]);

	return [stored, setValue, removeValue];
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useCollapsible                                                             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export interface CollapsibleReturn {
	/** Whether the element is currently collapsed */
	isCollapsed: boolean;
	/** Toggle between collapsed / expanded */
	toggle: () => void;
	/** Force collapsed = true */
	collapse: () => void;
	/** Force collapsed = false */
	expand: () => void;
	/** Directly set the collapsed state */
	set: (value: boolean) => void;
}

/**
 * Manage collapsible/expandable UI sections.
 * Optionally persists state to localStorage so it survives page reloads.
 *
 * @param defaultValue - Initial collapsed state (default: `false`)
 * @param storageKey   - When provided, persists state to `localStorage`
 *
 * @example
 * const sidebar = useCollapsible(false, "sidebar-collapsed");
 *
 * <button onClick={sidebar.toggle}>
 *   {sidebar.isCollapsed ? "▶" : "▼"}
 * </button>
 */
export function useCollapsible(defaultValue = false, storageKey?: string): CollapsibleReturn {
	const [value, setValueRaw] = useState<boolean>(() => {
		if (storageKey && IS_BROWSER) {
			try {
				const raw = localStorage.getItem(storageKey);
				if (raw !== null) return JSON.parse(raw) as boolean;
			} catch {
				/* fall through to default */
			}
		}
		return defaultValue;
	});

	// Ref to avoid stale closures in `toggle`
	const valueRef = useRef(value);
	valueRef.current = value;

	const set = useCallback(
		(next: boolean) => {
			setValueRaw(next);
			if (storageKey && IS_BROWSER) {
				try {
					localStorage.setItem(storageKey, JSON.stringify(next));
				} catch {
					/* ignore quota errors */
				}
			}
		},
		[storageKey],
	);

	const toggle = useCallback(() => set(!valueRef.current), [set]);
	const collapse = useCallback(() => set(true), [set]);
	const expand = useCallback(() => set(false), [set]);

	return { isCollapsed: value, toggle, collapse, expand, set };
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useMasonryLayout                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export interface MasonryOptions {
	/** Fixed number of columns (auto-calculated from container width if omitted) */
	columnCount?: number;
	/** Gap between items in pixels (default: 16) */
	gap?: number;
	/** Minimum column width in pixels — used for auto column count (default: 280) */
	minColumnWidth?: number;
}

export interface MasonryPosition {
	/** Column index (0-based) */
	column: number;
	/** Top offset in pixels */
	top: number;
	/** Left offset in pixels */
	left: number;
}

export interface MasonryResult<T extends HTMLElement> {
	/** Attach this ref to your masonry container */
	containerRef: RefObject<T | null>;
	/** Call with an index to get a ref-callback for each item */
	setItemRef: (index: number) => (el: HTMLDivElement | null) => void;
	/** Computed position for each item */
	positions: MasonryPosition[];
	/** Current height of each column */
	columnHeights: number[];
	/** Computed column width in pixels */
	columnWidth: number;
	/** Number of columns currently rendered */
	columnCount: number;
	/** Maximum column height (= container scroll height) */
	totalHeight: number;
	/** Force a layout recalculation */
	recalculate: () => void;
}

const MASONRY_DEFAULT_GAP = 16;
const MASONRY_DEFAULT_MIN_COL_WIDTH = 280;

/**
 * Compute masonry layout positions.
 * Each new item is placed below the shortest column (greedy algorithm).
 *
 * @param itemCount - Total number of items to position
 * @param options   - Layout configuration
 *
 * @example
 * const { containerRef, setItemRef, positions, totalHeight } =
 *   useMasonryLayout<HTMLDivElement>(items.length, { gap: 12 });
 *
 * <div ref={containerRef} style={{ position: "relative", height: totalHeight }}>
 *   {items.map((item, i) => (
 *     <div
 *       key={item.id}
 *       ref={setItemRef(i)}
 *       style={{
 *         position: "absolute",
 *         top: positions[i]?.top ?? 0,
 *         left: positions[i]?.left ?? 0,
 *         width: columnWidth,
 *       }}
 *     >
 *       …
 *     </div>
 *   ))}
 * </div>
 */
export function useMasonryLayout<T extends HTMLElement = HTMLDivElement>(
	itemCount: number,
	options: MasonryOptions = {},
): MasonryResult<T> {
	const containerRef = useRef<T>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const batchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [positions, setPositions] = useState<MasonryPosition[]>([]);
	const [columnHeights, setColumnHeights] = useState<number[]>([]);
	const [columnWidth, setColumnWidth] = useState(
		options.minColumnWidth ?? MASONRY_DEFAULT_MIN_COL_WIDTH,
	);

	const {
		columnCount: fixedCols,
		gap = MASONRY_DEFAULT_GAP,
		minColumnWidth = MASONRY_DEFAULT_MIN_COL_WIDTH,
	} = options;

	const calculateLayout = useCallback(() => {
		const container = containerRef.current;
		if (!container || itemCount === 0) {
			setPositions([]);
			setColumnHeights([]);
			return;
		}

		const containerWidth = container.offsetWidth;
		if (containerWidth === 0) return;

		// Determine column count
		const cols =
			fixedCols ?? Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)));

		// Fill the container exactly
		const totalGap = (cols - 1) * gap;
		const colWidth = (containerWidth - totalGap) / cols;
		setColumnWidth(colWidth);

		// Greedy: place each item in the shortest column
		const heights = new Array<number>(cols).fill(0);
		const newPositions: MasonryPosition[] = [];

		for (let i = 0; i < itemCount; i++) {
			const el = itemRefs.current[i];
			if (!el) continue;

			const shortestIdx = heights.indexOf(Math.min(...heights));
			const left = shortestIdx * (colWidth + gap);
			const top = heights[shortestIdx];

			newPositions[i] = { column: shortestIdx, left, top };
			heights[shortestIdx] += el.offsetHeight + gap;
		}

		setPositions(newPositions);
		setColumnHeights(heights);
	}, [itemCount, fixedCols, gap, minColumnWidth]);

	// Observe container + item resizes
	useEffect(() => {
		const initTimer = setTimeout(calculateLayout, 0);

		let rafId: number | null = null;
		const ro = new ResizeObserver(() => {
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				calculateLayout();
			});
		});

		if (containerRef.current) ro.observe(containerRef.current);
		for (let i = 0; i < itemCount; i++) {
			const el = itemRefs.current[i];
			if (el) ro.observe(el);
		}

		return () => {
			clearTimeout(initTimer);
			if (rafId !== null) cancelAnimationFrame(rafId);
			ro.disconnect();
		};
	}, [calculateLayout, itemCount]);

	// Batch ref-setting to a single layout pass
	const setItemRef = useCallback(
		(index: number) => (el: HTMLDivElement | null) => {
			if (itemRefs.current[index] === el) return;
			itemRefs.current[index] = el;

			if (batchTimeout.current) clearTimeout(batchTimeout.current);
			batchTimeout.current = setTimeout(() => {
				calculateLayout();
				batchTimeout.current = null;
			}, 10);
		},
		[calculateLayout],
	);

	// Clean up batch timeout
	useEffect(
		() => () => {
			if (batchTimeout.current) clearTimeout(batchTimeout.current);
		},
		[],
	);

	return {
		containerRef,
		setItemRef,
		positions,
		columnHeights,
		columnWidth,
		columnCount: columnHeights.length,
		totalHeight: columnHeights.length > 0 ? Math.max(...columnHeights) : 0,
		recalculate: calculateLayout,
	};
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ useValidatedForm                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * A single validation rule: receives the field value and all form values,
 * returns an error string or `undefined` if valid.
 */
export type ValidationRule<T = unknown> = (
	value: T,
	allValues: Record<string, unknown>,
) => string | undefined;

/** Configuration for a single form field. */
export interface FieldConfig<T = unknown> {
	/** Starting value */
	initialValue: T;
	/** Array of validation rules (run in order; first error wins) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	validate?: ValidationRule<any>[];
}

/**
 * Map of field names to their configs.
 * Uses `any` so that heterogeneous field types are accepted without casting.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldConfigs = Record<string, FieldConfig<any>>;

/** Inferred values type from field configs. */
export type FormValues<T extends FieldConfigs> = {
	[K in keyof T]: T[K]["initialValue"];
};

export type FormErrors<T extends FieldConfigs> = Partial<Record<keyof T, string>>;
export type FormTouched<T extends FieldConfigs> = Partial<Record<keyof T, boolean>>;

export interface ValidatedFormReturn<T extends FieldConfigs> {
	/** Current field values */
	values: FormValues<T>;
	/** Validation errors (only for fields with failing rules) */
	errors: FormErrors<T>;
	/** Which fields have been blurred at least once */
	touched: FormTouched<T>;
	/** `true` when every field passes validation */
	isValid: boolean;
	/** `true` when any value differs from initialValue */
	isDirty: boolean;
	/** `true` during async onSubmit execution */
	isSubmitting: boolean;
	/** Update a single field's value (triggers validation) */
	handleChange: <K extends keyof T & string>(field: K, value: T[K]["initialValue"]) => void;
	/** Mark a field as touched and validate it */
	handleBlur: (field: keyof T & string) => void;
	/** Submit handler — validates all fields first, calls `onSubmit` only if valid */
	handleSubmit: (e?: React.FormEvent) => Promise<void>;
	/** Reset the form to initial values (or partial overrides) */
	reset: (overrides?: Partial<FormValues<T>>) => void;
	/** Set a field value without triggering validation */
	setFieldValue: <K extends keyof T & string>(field: K, value: T[K]["initialValue"]) => void;
	/** Manually set a field error */
	setFieldError: (field: keyof T & string, error: string) => void;
	/** Clear all errors */
	clearErrors: () => void;
}

/**
 * Lightweight, zero-dependency form validation hook.
 *
 * Define your fields with initial values and validation rules,
 * then wire `handleChange`, `handleBlur`, and `handleSubmit` into your JSX.
 *
 * @param fields   - Field configuration map
 * @param onSubmit - Called with validated values (can be async)
 *
 * @example
 * const form = useValidatedForm(
 *   {
 *     email: {
 *       initialValue: "",
 *       validate: [
 *         (v) => (!v ? "Required" : undefined),
 *         (v) => (!v.includes("@") ? "Invalid email" : undefined),
 *       ],
 *     },
 *     password: {
 *       initialValue: "",
 *       validate: [
 *         (v) => (!v ? "Required" : undefined),
 *         (v) => (v.length < 8 ? "Min 8 characters" : undefined),
 *       ],
 *     },
 *   },
 *   async (values) => {
 *     await api.login(values.email, values.password);
 *   },
 * );
 *
 * <form onSubmit={form.handleSubmit}>
 *   <input
 *     value={form.values.email}
 *     onChange={(e) => form.handleChange("email", e.target.value)}
 *     onBlur={() => form.handleBlur("email")}
 *   />
 *   {form.touched.email && form.errors.email && <span>{form.errors.email}</span>}
 * </form>
 */
export function useValidatedForm<T extends FieldConfigs>(
	fields: T,
	onSubmit: (values: FormValues<T>) => void | Promise<void>,
): ValidatedFormReturn<T> {
	type Values = FormValues<T>;
	type Errors = FormErrors<T>;
	type Touched = FormTouched<T>;

	// Stable reference to field configs
	const fieldsRef = useRef(fields);
	fieldsRef.current = fields;

	const getInitialValues = useCallback((): Values => {
		const v: Record<string, unknown> = {};
		for (const [k, cfg] of Object.entries(fieldsRef.current)) {
			v[k] = cfg.initialValue;
		}
		return v as Values;
	}, []);

	const [values, setValues] = useState<Values>(getInitialValues);
	const [errors, setErrors] = useState<Errors>({});
	const [touched, setTouched] = useState<Touched>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Validate a single field against its rules
	const validateField = useCallback(
		(
			name: keyof T & string,
			value: unknown,
			allVals: Record<string, unknown>,
		): string | undefined => {
			const rules = fieldsRef.current[name]?.validate;
			if (!rules) return undefined;
			for (const rule of rules) {
				const error = rule(value, allVals);
				if (error) return error;
			}
			return undefined;
		},
		[],
	);

	// Validate all fields and return errors map
	const validateAll = useCallback(
		(vals: Values): Errors => {
			const errs: Record<string, string> = {};
			for (const key of Object.keys(fieldsRef.current)) {
				const err = validateField(key, vals[key], vals as Record<string, unknown>);
				if (err) errs[key] = err;
			}
			return errs as Errors;
		},
		[validateField],
	);

	const handleChange = useCallback(
		<K extends keyof T & string>(field: K, value: T[K]["initialValue"]) => {
			setValues((prev) => {
				const next = { ...prev, [field]: value };
				// Validate the changed field immediately
				const err = validateField(field, value, next as Record<string, unknown>);
				setErrors((prevErr) => {
					if (err) return { ...prevErr, [field]: err };
					const { [field]: _, ...rest } = prevErr as Record<string, string>;
					return rest as Errors;
				});
				return next;
			});
		},
		[validateField],
	);

	const handleBlur = useCallback(
		(field: keyof T & string) => {
			setTouched((prev) => ({ ...prev, [field]: true }));
			// Re-validate on blur
			setValues((prev) => {
				const err = validateField(field, prev[field], prev as Record<string, unknown>);
				setErrors((prevErr) => {
					if (err) return { ...prevErr, [field]: err };
					const { [field]: _, ...rest } = prevErr as Record<string, string>;
					return rest as Errors;
				});
				return prev; // no change to values
			});
		},
		[validateField],
	);

	const handleSubmit = useCallback(
		async (e?: React.FormEvent) => {
			e?.preventDefault();

			// Touch all fields
			const allTouched: Record<string, boolean> = {};
			for (const key of Object.keys(fieldsRef.current)) {
				allTouched[key] = true;
			}
			setTouched(allTouched as Touched);

			// Validate everything
			setValues((currentValues) => {
				const allErrors = validateAll(currentValues);
				setErrors(allErrors);

				if (Object.keys(allErrors).length === 0) {
					// Valid — submit
					setIsSubmitting(true);
					Promise.resolve(onSubmit(currentValues))
						.catch((err) => {
							console.error("[useValidatedForm] onSubmit error:", err);
						})
						.finally(() => setIsSubmitting(false));
				}

				return currentValues; // no mutation
			});
		},
		[onSubmit, validateAll],
	);

	const reset = useCallback(
		(overrides?: Partial<Values>) => {
			const base = getInitialValues();
			const next = overrides ? { ...base, ...overrides } : base;
			setValues(next);
			setErrors({});
			setTouched({});
			setIsSubmitting(false);
		},
		[getInitialValues],
	);

	const setFieldValue = useCallback(
		<K extends keyof T & string>(field: K, value: T[K]["initialValue"]) => {
			setValues((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const setFieldError = useCallback((field: keyof T & string, error: string) => {
		setErrors((prev) => ({ ...prev, [field]: error }));
	}, []);

	const clearErrors = useCallback(() => setErrors({}), []);

	// Derived state
	const isValid = Object.keys(errors).length === 0;
	const isDirty = useMemo(() => {
		const initial = getInitialValues();
		return Object.keys(initial).some(
			(k) => values[k as keyof Values] !== initial[k as keyof Values],
		);
	}, [values, getInitialValues]);

	return {
		values,
		errors,
		touched,
		isValid,
		isDirty,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		setFieldValue,
		setFieldError,
		clearErrors,
	};
}
