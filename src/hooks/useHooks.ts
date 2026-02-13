/**
 * @module useHooks
 * @description Self-contained, zero-dependency (beyond React) collection of reusable hooks.
 *
 * **Primitives**
 * - {@link useEventListener}  — Type-safe, auto-cleaning event listeners
 * - {@link useMediaQuery}     — Subscribe to CSS media queries
 * - {@link useDebounce}       — Debounce a rapidly-changing value
 * - {@link useThrottle}       — Throttle a rapidly-changing value
 * - {@link useToggle}         — Boolean toggle with setter
 * - {@link usePrevious}       — Access the previous render's value
 * - {@link useClickOutside}   — Detect clicks outside a ref'd element
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
 * - {@link useValidatedForm}  — Lightweight form state + validation
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

// ═══════════════════════════════════════════════════════════════════════════════
// Internal Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simple debounce utility for internal use.
 */
function debounce<T extends (...args: any[]) => void>(
	func: T,
	wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
	let timeout: ReturnType<typeof setTimeout>;
	const debounced = ((...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	}) as ((...args: Parameters<T>) => void) & { cancel: () => void };
	debounced.cancel = () => clearTimeout(timeout);
	return debounced;
}

const IS_BROWSER = typeof window !== "undefined";
const HAS_NAVIGATOR = typeof navigator !== "undefined";

/** useLayoutEffect in the browser, useEffect on the server (avoids SSR warnings). */
const useIsomorphicLayoutEffect = IS_BROWSER ? useLayoutEffect : useEffect;

/**
 * Experimental Network Information API.
 * Defined here once to avoid `any` casts scattered throughout the file.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 */
interface NetworkInformation extends EventTarget {
	readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g";
}

/** Navigator with optional `.connection` (experimental API). */
interface NavigatorWithConnection extends Navigator {
	readonly connection?: NetworkInformation;
}

// ═══════════════════════════════════════════════════════════════════════════════
// useEventListener
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Attach an event listener that auto-cleans on unmount.
 * The handler is kept in a ref — no need to memoize it.
 *
 * @example
 * useEventListener("keydown", (e) => {
 *   if (e.key === "Escape") close();
 * });
 *
 * useEventListener("scroll", onScroll, containerRef, { passive: true });
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
	const handlerRef = useRef(handler);
	useIsomorphicLayoutEffect(() => {
		handlerRef.current = handler;
	}, [handler]);

	useEffect(() => {
		const target =
			element == null
				? IS_BROWSER
					? window
					: null
				: element instanceof EventTarget
					? element
					: (element as RefObject<EventTarget | null>).current;

		if (!target?.addEventListener) {
			return;
		}

		const listener = (e: Event) => handlerRef.current(e);
		target.addEventListener(eventName, listener, options);
		return () => target.removeEventListener(eventName, listener, options);
	}, [eventName, element, options]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// useMediaQuery
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to a CSS media query.
 *
 * @example
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 * const isMobile = useMediaQuery("(max-width: 768px)");
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() =>
		IS_BROWSER ? window.matchMedia(query).matches : false,
	);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}
		const mql = window.matchMedia(query);
		setMatches(mql.matches);
		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}

// ═══════════════════════════════════════════════════════════════════════════════
// useDebounce
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Debounce a value — returns the latest value only after `delay` ms of inactivity.
 *
 * @example
 * const debouncedSearch = useDebounce(search, 400);
 * useEffect(() => fetchResults(debouncedSearch), [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);

	return debounced;
}

// ═══════════════════════════════════════════════════════════════════════════════
// useThrottle
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Throttle a value — emits at most once per `interval` ms.
 * Always delivers the **latest** value on the trailing edge.
 *
 * @example
 * const throttledY = useThrottle(scrollY, 100);
 */
export function useThrottle<T>(value: T, interval = 300): T {
	const [throttled, setThrottled] = useState(value);
	const lastFired = useRef(0);
	const trailingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Ref to the latest value so the trailing timeout always resolves to current.
	const latestValue = useRef(value);
	latestValue.current = value;

	useEffect(() => {
		const now = Date.now();
		const elapsed = now - lastFired.current;

		if (elapsed >= interval) {
			// Leading edge: emit immediately
			lastFired.current = now;
			setThrottled(value);
			if (trailingTimer.current) {
				clearTimeout(trailingTimer.current);
				trailingTimer.current = null;
			}
		} else {
			// Schedule trailing edge with the *latest* value
			if (trailingTimer.current) {
				clearTimeout(trailingTimer.current);
			}
			trailingTimer.current = setTimeout(() => {
				lastFired.current = Date.now();
				setThrottled(latestValue.current);
				trailingTimer.current = null;
			}, interval - elapsed);
		}

		return () => {
			if (trailingTimer.current) {
				clearTimeout(trailingTimer.current);
			}
		};
	}, [value, interval]);

	return throttled;
}

// ═══════════════════════════════════════════════════════════════════════════════
// useToggle
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Boolean toggle with a stable `toggle` callback and an escape-hatch `setValue`.
 *
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

// ═══════════════════════════════════════════════════════════════════════════════
// usePrevious
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns the value from the previous render.
 *
 * @example
 * const prevCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
	const ref = useRef<T | undefined>(undefined);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref.current;
}

// ═══════════════════════════════════════════════════════════════════════════════
// useClickOutside
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fire a callback when a click/touch occurs outside the referenced element.
 * The handler is ref'd so it doesn't need to be memoized.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setOpen(false));
 */
export function useClickOutside<T extends HTMLElement>(
	ref: RefObject<T | null>,
	handler: (event: MouseEvent | TouchEvent) => void,
): void {
	const handlerRef = useRef(handler);
	useIsomorphicLayoutEffect(() => {
		handlerRef.current = handler;
	}, [handler]);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}

		const listener = (e: MouseEvent | TouchEvent) => {
			const el = ref.current;
			if (!el || el.contains(e.target as Node)) {
				return;
			}
			handlerRef.current(e);
		};

		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);
		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// useBrowserState
// ═══════════════════════════════════════════════════════════════════════════════

/** Customizable responsive breakpoints (in pixels). */
export interface Breakpoints {
	smallMobile: number;
	mobile: number;
	tablet: number;
}

/** Snapshot of the browser environment. */
export interface BrowserState {
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	isSmallMobile: boolean;
	prefersReducedMotion: boolean;
	isOnline: boolean;
	isSlowConnection: boolean;
	connectionType: string;
	viewportWidth: number;
	viewportHeight: number;
}

const DEFAULT_BREAKPOINTS: Breakpoints = {
	smallMobile: 480,
	mobile: 768,
	tablet: 1024,
};

/**
 * All-in-one hook for responsive design, network status, and accessibility prefs.
 * Internally coalesces updates via `requestAnimationFrame` and debounces resize events (150ms).
 *
 * @example
 * const { isMobile, isOnline, prefersReducedMotion } = useBrowserState();
 * const browser = useBrowserState({ mobile: 640, tablet: 1280 });
 */
export function useBrowserState(breakpoints?: Partial<Breakpoints>): BrowserState {
	const bp = useMemo(
		() => ({ ...DEFAULT_BREAKPOINTS, ...breakpoints }),
		[breakpoints?.smallMobile, breakpoints?.mobile, breakpoints?.tablet, breakpoints], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const buildSnapshot = useCallback(
		(motionMatches: boolean): BrowserState => {
			const w = IS_BROWSER ? window.innerWidth : 1200;
			const h = IS_BROWSER ? window.innerHeight : 800;
			const online = HAS_NAVIGATOR ? navigator.onLine : true;
			const conn = HAS_NAVIGATOR
				? ((navigator as NavigatorWithConnection).connection ?? null)
				: null;

			return {
				isMobile: w <= bp.mobile,
				isTablet: w > bp.mobile && w <= bp.tablet,
				isDesktop: w > bp.tablet,
				isSmallMobile: w <= bp.smallMobile,
				prefersReducedMotion: motionMatches,
				isOnline: online,
				isSlowConnection: conn
					? conn.effectiveType === "2g" || conn.effectiveType === "slow-2g"
					: false,
				connectionType: conn?.effectiveType ?? "unknown",
				viewportWidth: w,
				viewportHeight: h,
			};
		},
		[bp],
	);

	const [state, setState] = useState<BrowserState>(() => {
		const motionMatches = IS_BROWSER
			? window.matchMedia("(prefers-reduced-motion: reduce)").matches
			: false;
		return buildSnapshot(motionMatches);
	});

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}

		const motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
		const conn = (navigator as NavigatorWithConnection).connection ?? null;

		// Cache the latest motionMql.matches so we don't create a new MQL per snapshot
		let currentMotion = motionMql.matches;
		let rafId: number | null = null;

		const scheduleUpdate = () => {
			if (rafId !== null) {
				return;
			}
			rafId = requestAnimationFrame(() => {
				rafId = null;
				setState(buildSnapshot(currentMotion));
			});
		};

		const onResize = debounce(scheduleUpdate, 150);

		const onMotionChange = (e: MediaQueryListEvent) => {
			currentMotion = e.matches;
			scheduleUpdate();
		};

		window.addEventListener("resize", onResize, { passive: true });
		window.addEventListener("online", scheduleUpdate);
		window.addEventListener("offline", scheduleUpdate);
		motionMql.addEventListener("change", onMotionChange);
		conn?.addEventListener("change", scheduleUpdate);

		// Sync on mount in case state drifted between render and effect
		setState(buildSnapshot(currentMotion));

		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
			onResize.cancel();
			window.removeEventListener("resize", onResize);
			window.removeEventListener("online", scheduleUpdate);
			window.removeEventListener("offline", scheduleUpdate);
			motionMql.removeEventListener("change", onMotionChange);
			conn?.removeEventListener("change", scheduleUpdate);
		};
	}, [buildSnapshot]);

	return state;
}

// ═══════════════════════════════════════════════════════════════════════════════
// useOnlineStatus
// ═══════════════════════════════════════════════════════════════════════════════

export interface OnlineStatusOptions {
	/** Fires when the browser transitions from offline → online */
	onReconnect?: () => void;
	/** Fires when the browser transitions from online → offline */
	onDisconnect?: () => void;
}

/**
 * Lightweight online/offline tracking with lifecycle callbacks.
 *
 * @example
 * const isOnline = useOnlineStatus({
 *   onReconnect: () => syncQueue.flush(),
 *   onDisconnect: () => toast("You're offline"),
 * });
 */
export function useOnlineStatus(options: OnlineStatusOptions = {}): boolean {
	const [isOnline, setIsOnline] = useState(() => (HAS_NAVIGATOR ? navigator.onLine : true));

	const optRef = useRef(options);
	useIsomorphicLayoutEffect(() => {
		optRef.current = options;
	}, [options]);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}

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

// ═══════════════════════════════════════════════════════════════════════════════
// useLocalStorage
// ═══════════════════════════════════════════════════════════════════════════════

type SetStateAction<T> = T | ((prev: T) => T);

/**
 * Persist state in `localStorage` with:
 * - Automatic JSON serialization / deserialization
 * - Functional updates that are never stale (ref-based)
 * - Cross-tab synchronization via the `storage` event
 * - A `remove()` helper to delete the key entirely
 *
 * @returns `[value, setValue, removeValue]`
 *
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");
 * setTheme((prev) => (prev === "light" ? "dark" : "light"));
 * removeTheme(); // resets to initialValue and removes the key
 */
export function useLocalStorage<T>(
	key: string,
	initialValue: T,
): [T, (value: SetStateAction<T>) => void, () => void] {
	// Ref the initial value so an unstable object reference doesn't cause loops
	const initialRef = useRef(initialValue);

	const readValue = useCallback((): T => {
		if (!IS_BROWSER) {
			return initialRef.current;
		}
		try {
			const raw = localStorage.getItem(key);
			return raw !== null ? (JSON.parse(raw) as T) : initialRef.current;
		} catch {
			return initialRef.current;
		}
	}, [key]);

	const [stored, setStored] = useState<T>(readValue);

	// Always-current value for functional updates
	const valueRef = useRef(stored);
	valueRef.current = stored;

	const setValue = useCallback(
		(next: SetStateAction<T>) => {
			try {
				const resolved = next instanceof Function ? next(valueRef.current) : next;
				setStored(resolved);
				valueRef.current = resolved;
				if (IS_BROWSER) {
					localStorage.setItem(key, JSON.stringify(resolved));
				}
			} catch (err) {
				console.warn(`[useLocalStorage] write "${key}" failed:`, err);
			}
		},
		[key],
	);

	const removeValue = useCallback(() => {
		const fallback = initialRef.current;
		setStored(fallback);
		valueRef.current = fallback;
		if (IS_BROWSER) {
			try {
				localStorage.removeItem(key);
			} catch {
				/* quota / security errors */
			}
		}
	}, [key]);

	// Cross-tab sync
	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}
		const onStorage = (e: StorageEvent) => {
			if (e.key !== key) {
				return;
			}
			try {
				const parsed = e.newValue !== null ? (JSON.parse(e.newValue) as T) : initialRef.current;
				setStored(parsed);
				valueRef.current = parsed;
			} catch {
				setStored(initialRef.current);
				valueRef.current = initialRef.current;
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [key]);

	return [stored, setValue, removeValue];
}

// ═══════════════════════════════════════════════════════════════════════════════
// useCollapsible
// ═══════════════════════════════════════════════════════════════════════════════

export interface CollapsibleReturn {
	isCollapsed: boolean;
	toggle: () => void;
	collapse: () => void;
	expand: () => void;
	set: (value: boolean) => void;
}

/**
 * Manage collapsible/expandable UI sections.
 * Optionally persists state to localStorage across reloads.
 *
 * @example
 * const sidebar = useCollapsible(false, "sidebar-collapsed");
 * <button onClick={sidebar.toggle}>{sidebar.isCollapsed ? "▶" : "▼"}</button>
 */
export function useCollapsible(defaultValue = false, storageKey?: string): CollapsibleReturn {
	const [value, setValueRaw] = useState<boolean>(() => {
		if (storageKey && IS_BROWSER) {
			try {
				const raw = localStorage.getItem(storageKey);
				if (raw !== null) {
					return JSON.parse(raw) as boolean;
				}
			} catch {
				/* fall through */
			}
		}
		return defaultValue;
	});

	const valueRef = useRef(value);
	valueRef.current = value;

	const set = useCallback(
		(next: boolean) => {
			setValueRaw(next);
			if (storageKey && IS_BROWSER) {
				try {
					localStorage.setItem(storageKey, JSON.stringify(next));
				} catch {
					/* quota errors */
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

// ═══════════════════════════════════════════════════════════════════════════════
// useMasonryLayout
// ═══════════════════════════════════════════════════════════════════════════════

export interface MasonryOptions {
	/** Fixed column count (auto-calculated from container width if omitted) */
	columnCount?: number;
	/** Gap between items in px (default: 16) */
	gap?: number;
	/** Minimum column width in px for auto column count (default: 280) */
	minColumnWidth?: number;
}

export interface MasonryPosition {
	column: number;
	top: number;
	left: number;
}

export interface MasonryResult<T extends HTMLElement> {
	containerRef: RefObject<T | null>;
	setItemRef: (index: number) => (el: HTMLDivElement | null) => void;
	positions: MasonryPosition[];
	columnHeights: number[];
	columnWidth: number;
	columnCount: number;
	totalHeight: number;
	recalculate: () => void;
}

const MASONRY_GAP = 16;
const MASONRY_MIN_COL_WIDTH = 280;

/**
 * Greedy masonry layout: each item is placed below the shortest column.
 *
 * @example
 * const { containerRef, setItemRef, positions, totalHeight, columnWidth } =
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
 *     />
 *   ))}
 * </div>
 */
export function useMasonryLayout<T extends HTMLElement = HTMLDivElement>(
	itemCount: number,
	options: MasonryOptions = {},
): MasonryResult<T> {
	const containerRef = useRef<T>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Stabilize options to prevent recalculating layout on every render
	// when the consumer passes an inline object literal
	const fixedCols = options.columnCount;
	const gap = options.gap ?? MASONRY_GAP;
	const minColWidth = options.minColumnWidth ?? MASONRY_MIN_COL_WIDTH;

	const [positions, setPositions] = useState<MasonryPosition[]>([]);
	const [columnHeights, setColumnHeights] = useState<number[]>([]);
	const [columnWidth, setColumnWidth] = useState(minColWidth);

	const calculateLayout = useCallback(() => {
		const container = containerRef.current;
		if (!container || itemCount === 0) {
			setPositions([]);
			setColumnHeights([]);
			return;
		}

		const containerWidth = container.offsetWidth;
		if (containerWidth === 0) {
			return;
		}

		const cols = fixedCols ?? Math.max(1, Math.floor((containerWidth + gap) / (minColWidth + gap)));

		const totalGapWidth = (cols - 1) * gap;
		const colWidth = (containerWidth - totalGapWidth) / cols;
		setColumnWidth(colWidth);

		const heights = new Array<number>(cols).fill(0);
		const newPositions: MasonryPosition[] = [];

		for (let i = 0; i < itemCount; i++) {
			const el = itemRefs.current[i];
			if (!el) {
				continue;
			}

			const minHeight = Math.min(...heights);
			const col = heights.indexOf(minHeight);
			const left = col * (colWidth + gap);
			const top = heights[col];

			newPositions[i] = { column: col, left, top };
			heights[col] += el.offsetHeight + gap;
		}

		setPositions(newPositions);
		setColumnHeights(heights);
	}, [itemCount, fixedCols, gap, minColWidth]);

	const calculateLayoutRef = useRef(calculateLayout);
	useIsomorphicLayoutEffect(() => {
		calculateLayoutRef.current = calculateLayout;
	}, [calculateLayout]);

	const observerRef = useRef<ResizeObserver | null>(null);

	// Initialize observer once
	// biome-ignore lint/correctness/useExhaustiveDependencies: Observer must be stable
	useEffect(() => {
		const initTimer = setTimeout(() => calculateLayoutRef.current(), 0);

		let rafId: number | null = null;
		const observer = new ResizeObserver(() => {
			if (rafId !== null) {
				return;
			}
			rafId = requestAnimationFrame(() => {
				rafId = null;
				calculateLayoutRef.current();
			});
		});
		observerRef.current = observer;

		// Initial observation of whatever is already there
		if (containerRef.current) {
			observer.observe(containerRef.current);
		}
		for (let i = 0; i < itemCount; i++) {
			const el = itemRefs.current[i];
			if (el) {
				observer.observe(el);
			}
		}

		return () => {
			clearTimeout(initTimer);
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
			observer.disconnect();
			observerRef.current = null;
		};
	}, []); // Run once

	// Observer logic for container updates
	// We rely on itemCount change to re-check container observation as a fallback
	// biome-ignore lint/correctness/useExhaustiveDependencies: Trigger update on itemCount change
	useEffect(() => {
		const observer = observerRef.current;
		if (observer && containerRef.current) {
			observer.observe(containerRef.current);
		}
	}, [itemCount]);

	// Batch ref updates into a single layout pass (10 ms window)
	// Also handles observation of new items
	const setItemRef = useCallback(
		(index: number) => (el: HTMLDivElement | null) => {
			if (itemRefs.current[index] === el) {
				return;
			}

			const observer = observerRef.current;
			if (observer) {
				const oldEl = itemRefs.current[index];
				if (oldEl) {
					observer.unobserve(oldEl);
				}
				if (el) {
					observer.observe(el);
				}
			}

			itemRefs.current[index] = el;

			if (batchTimer.current) {
				clearTimeout(batchTimer.current);
			}
			batchTimer.current = setTimeout(() => {
				calculateLayout();
				batchTimer.current = null;
			}, 10);
		},
		[calculateLayout],
	);

	// Clean up trailing batch timer on unmount
	useEffect(
		() => () => {
			if (batchTimer.current) {
				clearTimeout(batchTimer.current);
			}
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
// ═══════════════════════════════════════════════════════════════════════════════
// useValidatedForm
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A validation rule: receives the field value and all current form values,
 * returns an error string or `undefined` if valid.
 */
export type ValidationRule<T = unknown> = (
	value: T,
	allValues: Record<string, unknown>,
) => string | undefined;

/** Configuration for a single form field. */
export interface FieldConfig<T = unknown> {
	initialValue: T;
	/** Rules run in order; first error wins. */
	validate?: ValidationRule<T>[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldConfigs = Record<string, FieldConfig<any>>;

export type FormValues<T extends FieldConfigs> = {
	[K in keyof T]: T[K]["initialValue"];
};
export type FormErrors<T extends FieldConfigs> = Partial<Record<keyof T, string>>;
export type FormTouched<T extends FieldConfigs> = Partial<Record<keyof T, boolean>>;

export interface ValidatedFormReturn<T extends FieldConfigs> {
	values: FormValues<T>;
	errors: FormErrors<T>;
	touched: FormTouched<T>;
	isValid: boolean;
	isDirty: boolean;
	isSubmitting: boolean;
	handleChange: <K extends keyof T & string>(field: K, value: T[K]["initialValue"]) => void;
	handleBlur: (field: keyof T & string) => void;
	handleSubmit: (e?: React.FormEvent) => void;
	reset: (overrides?: Partial<FormValues<T>>) => void;
	setFieldValue: <K extends keyof T & string>(field: K, value: T[K]["initialValue"]) => void;
	setFieldError: (field: keyof T & string, error: string) => void;
	clearErrors: () => void;
}

/**
 * Lightweight, zero-dependency form state + validation.
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
 *       validate: [(v) => (v.length < 8 ? "Min 8 chars" : undefined)],
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

	const fieldsRef = useRef(fields);
	fieldsRef.current = fields;

	const onSubmitRef = useRef(onSubmit);
	onSubmitRef.current = onSubmit;

	const buildInitialValues = useCallback((): Values => {
		const v: Record<string, unknown> = {};
		for (const [k, cfg] of Object.entries(fieldsRef.current)) {
			v[k] = cfg.initialValue;
		}
		return v as Values;
	}, []);

	const [values, setValues] = useState<Values>(buildInitialValues);
	const [errors, setErrors] = useState<Errors>({});
	const [touched, setTouched] = useState<Touched>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Ref for current values so handleSubmit can read without being in a state updater
	const valuesRef = useRef(values);
	valuesRef.current = values;

	// ── Validation helpers ────────────────────────────────────────────────

	const validateField = useCallback(
		(name: string, value: unknown, allVals: Record<string, unknown>): string | undefined => {
			const rules = fieldsRef.current[name]?.validate;
			if (!rules) {
				return undefined;
			}
			for (const rule of rules) {
				const error = rule(value, allVals);
				if (error) {
					return error;
				}
			}
			return undefined;
		},
		[],
	);

	const validateAll = useCallback(
		(vals: Values): Errors => {
			const errs: Record<string, string> = {};
			for (const key of Object.keys(fieldsRef.current)) {
				const err = validateField(key, vals[key], vals as Record<string, unknown>);
				if (err) {
					errs[key] = err;
				}
			}
			return errs as Errors;
		},
		[validateField],
	);

	/**
	 * Shared helper: update errors for a single field.
	 * Adds the error if present, removes the key if the field is now valid.
	 */
	const applyFieldError = useCallback((field: string, error: string | undefined) => {
		setErrors((prev) => {
			if (error) {
				// Only update if error changed
				if (prev[field as keyof T] === error) {
					return prev;
				}
				return { ...prev, [field]: error };
			}
			// Remove the field's error
			if (!(field in prev)) {
				return prev;
			}
			const next = { ...prev };
			delete next[field as keyof T];
			return next as Errors;
		});
	}, []);

	// ── Actions ───────────────────────────────────────────────────────────

	const handleChange = useCallback(
		<K extends keyof T & string>(field: K, value: T[K]["initialValue"]) => {
			setValues((prev) => {
				const next = { ...prev, [field]: value };
				const err = validateField(field, value, next as Record<string, unknown>);
				applyFieldError(field, err);
				return next;
			});
		},
		[validateField, applyFieldError],
	);

	const handleBlur = useCallback(
		(field: keyof T & string) => {
			setTouched((prev) => {
				if (prev[field]) {
					return prev; // already touched
				}
				return { ...prev, [field]: true };
			});
			// Re-validate with current values (read from ref, no state updater abuse)
			const currentVals = valuesRef.current;
			const err = validateField(field, currentVals[field], currentVals as Record<string, unknown>);
			applyFieldError(field, err);
		},
		[validateField, applyFieldError],
	);

	const handleSubmit = useCallback(
		(e?: React.FormEvent) => {
			e?.preventDefault();

			// Touch all fields
			const allTouched: Record<string, boolean> = {};
			for (const key of Object.keys(fieldsRef.current)) {
				allTouched[key] = true;
			}
			setTouched(allTouched as Touched);

			// Validate everything against current values (via ref, not state updater)
			const currentValues = valuesRef.current;
			const allErrors = validateAll(currentValues);
			setErrors(allErrors);

			if (Object.keys(allErrors).length > 0) {
				return;
			}

			// Valid — submit
			setIsSubmitting(true);
			Promise.resolve(onSubmitRef.current(currentValues))
				.catch((err) => {
					console.error("[useValidatedForm] onSubmit error:", err);
				})
				.finally(() => setIsSubmitting(false));
		},
		[validateAll],
	);

	const reset = useCallback(
		(overrides?: Partial<Values>) => {
			const base = buildInitialValues();
			setValues(overrides ? { ...base, ...overrides } : base);
			setErrors({});
			setTouched({});
			setIsSubmitting(false);
		},
		[buildInitialValues],
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

	// ── Derived state ─────────────────────────────────────────────────────

	const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

	const isDirty = useMemo(() => {
		const initial = buildInitialValues();
		return Object.keys(initial).some(
			(k) => values[k as keyof Values] !== initial[k as keyof Values],
		);
	}, [values, buildInitialValues]);

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
