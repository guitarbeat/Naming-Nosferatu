import { type AnimationPlaybackControls, animate, useMotionValue } from "framer-motion";
import {
	type RefObject,
	type SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import { useToast } from "@/components/AppChrome";
import { ratingsAPI } from "@/lib/api";
import {
	decryptValue,
	getStorageString,
	parseJsonValue,
	removeStorageItem,
	writeStorageJson,
} from "@/lib/storage";
import {
	CRITICAL_SHELL_IMAGES,
	createSortedKey,
	ELO_RATING,
	shuffleArray,
	TIMING,
} from "@/lib/utils";
import useAppStore from "@/store";
import {
	calculateTournamentMetrics,
	computeUpdatedRatings,
	createIdToNameMap,
	createMatchRecord,
	createTeamsById,
	deriveBracketState,
	generateRandomTeams,
	type HistoryEntry,
	isBye,
	resolveCurrentMatch,
	resolveTournamentMode,
} from "@/tournament/tournamentEngine";
import type {
	Match,
	MatchRecord,
	NameItem,
	PersistentTournamentState,
	RatingData,
	Team,
	TeamMatch,
	TournamentMode,
} from "@/types";

const IS_BROWSER = typeof window !== "undefined";
const IS_DEV = import.meta.env?.DEV ?? false;
const EMPTY_OPTIONS: Record<string, never> = {};

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	return function (this: unknown, ...args: Parameters<T>) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => func.apply(this, args), wait);
	} as T;
}

/* ==========================================================================
   1. usePrefersReducedMotion
   ========================================================================== */

export function usePrefersReducedMotion(): boolean {
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

/* ==========================================================================
   2. useLocalStorage
   ========================================================================== */

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

	useEffect(() => {
		isUnmountingRef.current = false;
		return () => {
			isUnmountingRef.current = true;
		};
	}, []);

	useEffect(() => {
		return () => {
			if (!isUnmountingRef.current || !options.debounceWait || !IS_BROWSER) {
				return;
			}
			const success = writeStorageJson(currentKeyRef.current, valueRef.current);
			if (!success && IS_DEV) {
				console.error(`[useLocalStorage] Unmount flush failed for key "${currentKeyRef.current}".`);
			}
		};
	}, [options.debounceWait]);

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

/* ==========================================================================
   4. usePreloadImages
   ========================================================================== */

interface UsePreloadImagesOptions {
	enabled?: boolean;
	crossOrigin?: "anonymous" | "use-credentials";
	onComplete?: (loadedUrls: string[], failedUrls: string[]) => void;
	onError?: (failedUrl: string) => void;
}

interface UsePreloadImagesResult {
	isLoading: boolean;
	isLoaded: boolean;
	progress: number;
	loadedCount: number;
	totalCount: number;
	loadedUrls: string[];
	failedUrls: string[];
}

const globalPreloadedImageCache = new Set<string>();

export function usePreloadImages(
	images: readonly string[] = CRITICAL_SHELL_IMAGES,
	options: UsePreloadImagesOptions = EMPTY_OPTIONS,
): UsePreloadImagesResult {
	const { enabled = true, crossOrigin, onComplete, onError } = options;

	const [{ initialLoadedUrls, initialIsLoading }] = useState(() => {
		if (!IS_BROWSER) {
			return { initialLoadedUrls: [], initialIsLoading: false };
		}
		const loaded: string[] = [];
		let allCached = true;
		for (let i = 0; i < images.length; i++) {
			const img = images[i];
			if (globalPreloadedImageCache.has(img)) {
				loaded.push(img);
			} else {
				allCached = false;
			}
		}
		return {
			initialLoadedUrls: loaded,
			initialIsLoading: enabled && images.length > 0 ? !allCached : false,
		};
	});

	const [loadedUrls, setLoadedUrls] = useState<string[]>(initialLoadedUrls);
	const [failedUrls, setFailedUrls] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(initialIsLoading);

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
		const activeImages: string[] = [];
		const alreadyLoaded: string[] = [];
		const seen = new Set<string>();

		for (let i = 0; i < images.length; i++) {
			const src = images[i];
			if (src && !seen.has(src)) {
				seen.add(src);
				activeImages.push(src);
				if (globalPreloadedImageCache.has(src)) {
					alreadyLoaded.push(src);
				}
			}
		}

		const total = activeImages.length;
		if (total === 0) {
			setIsLoading(false);
			return;
		}

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

/* ==========================================================================
   5. useDebounce
   ========================================================================== */

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

/* ==========================================================================
   6. useIntersectionObserver
   ========================================================================== */

export interface UseIntersectionObserverOptions {
	root?: Element | Document | null;
	rootMargin?: string;
	threshold?: number | number[];
	enabled?: boolean;
	initialIsVisible?: boolean;
}

interface PooledObserverRecord {
	observer: IntersectionObserver;
	callbacks: Map<Element, (entry: IntersectionObserverEntry) => void>;
}

const observerPool = new Map<string, PooledObserverRecord>();

function getObserverPoolKey(
	root: Element | Document | null,
	rootMargin: string,
	threshold: number | number[],
): string {
	const threshStr = Array.isArray(threshold) ? threshold.join(",") : String(threshold);
	return `${root ? "custom" : "viewport"}_${rootMargin}_${threshStr}`;
}

function observeWithPool(
	element: Element,
	callback: (entry: IntersectionObserverEntry) => void,
	options: { root: Element | Document | null; rootMargin: string; threshold: number | number[] },
): () => void {
	const key = getObserverPoolKey(options.root, options.rootMargin, options.threshold);
	let record = observerPool.get(key);

	if (!record) {
		const callbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const cb = callbacks.get(entry.target);
					if (cb) {
						cb(entry);
					}
				}
			},
			{ root: options.root, rootMargin: options.rootMargin, threshold: options.threshold },
		);
		record = { observer, callbacks };
		observerPool.set(key, record);
	}

	record.callbacks.set(element, callback);
	record.observer.observe(element);

	return () => {
		record?.callbacks.delete(element);
		record?.observer.unobserve(element);
		if (record && record.callbacks.size === 0) {
			record.observer.disconnect();
			observerPool.delete(key);
		}
	};
}

export function useIntersectionObserver(
	targetRef: React.RefObject<Element | null>,
	options: UseIntersectionObserverOptions = EMPTY_OPTIONS,
): boolean {
	const {
		root = null,
		rootMargin = "80px",
		threshold = 0,
		enabled = true,
		initialIsVisible = true,
	} = options;

	const [isVisible, setIsVisible] = useState<boolean>(() => {
		if (!enabled) {
			return true;
		}
		return initialIsVisible;
	});

	useEffect(() => {
		if (!enabled) {
			setIsVisible(true);
			return;
		}

		const element = targetRef.current;
		if (!element || typeof window === "undefined" || !("IntersectionObserver" in window)) {
			setIsVisible(true);
			return;
		}

		const unobserve = observeWithPool(
			element,
			(entry) => {
				setIsVisible(entry.isIntersecting);
			},
			{ root, rootMargin, threshold },
		);

		return unobserve;
	}, [targetRef, root, rootMargin, threshold, enabled]);

	return isVisible;
}

/* ==========================================================================
   7. useTimedState
   ========================================================================== */

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

/* ==========================================================================
   8. useTournamentState
   ========================================================================== */

function createDefaultPersistentState(userName: string): PersistentTournamentState {
	return {
		matchHistory: [],
		currentRound: 1,
		currentMatch: 1,
		totalMatches: 0,
		userName: userName || "anonymous",
		lastUpdated: Date.now(),
		namesKey: "",
		ratings: {},
		mode: "1v1",
		teams: [],
		teamMatches: [],
		teamMatchIndex: 0,
		bracketEntrants: [],
	};
}

function buildInitialRatings(names: NameItem[]): Record<string, number> {
	const initial: Record<string, number> = {};
	for (const name of names) {
		initial[String(name.id)] = name.rating || ELO_RATING.DEFAULT_RATING;
	}
	return initial;
}

function createNamesKey(names: NameItem[]): string {
	return createSortedKey(names.map((n) => n?.id || ""));
}

function createTournamentId(
	namesKey: string,
	userName: string | undefined,
	namesLength: number,
): string {
	const prefix = userName || "anonymous";
	let hash = 0;
	for (let i = 0; i < namesKey.length; i++) {
		hash = ((hash << 5) - hash + namesKey.charCodeAt(i)) | 0;
	}
	return `tournament-${prefix}-${Math.abs(hash).toString(36)}-${namesLength}`;
}

function createBracketEntrants(participantIds: string[]): string[] {
	return shuffleArray(participantIds);
}

function isValidTeam(value: unknown): value is Team {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as Team;
	return (
		typeof candidate.id === "string" &&
		Array.isArray(candidate.memberIds) &&
		candidate.memberIds.length === 2 &&
		Array.isArray(candidate.memberNames) &&
		candidate.memberNames.length === 2
	);
}

function isValidTeamMatch(value: unknown): value is TeamMatch {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as TeamMatch;
	return typeof candidate.leftTeamId === "string" && typeof candidate.rightTeamId === "string";
}

function sanitizePersistentState(
	persistentStateRaw: unknown,
	userName: string,
): PersistentTournamentState {
	if (
		!persistentStateRaw ||
		typeof persistentStateRaw !== "object" ||
		Array.isArray(persistentStateRaw)
	) {
		return createDefaultPersistentState(userName || "anonymous");
	}

	const merged = {
		...createDefaultPersistentState(userName || "anonymous"),
		...(persistentStateRaw as Record<string, unknown>),
	};

	const mode: TournamentMode = merged.mode === "2v2" ? "2v2" : "1v1";
	const teams: Team[] = [];
	if (Array.isArray(merged.teams)) {
		for (let i = 0; i < merged.teams.length; i++) {
			const team = merged.teams[i];
			if (isValidTeam(team)) {
				teams.push(team);
			}
		}
	}

	const teamMatches: TeamMatch[] = [];
	if (Array.isArray(merged.teamMatches)) {
		for (let i = 0; i < merged.teamMatches.length; i++) {
			const match = merged.teamMatches[i];
			if (isValidTeamMatch(match)) {
				teamMatches.push(match);
			}
		}
	}

	return {
		...merged,
		mode,
		matchHistory: Array.isArray(merged.matchHistory) ? merged.matchHistory : [],
		ratings: merged.ratings && typeof merged.ratings === "object" ? merged.ratings : {},
		namesKey: typeof merged.namesKey === "string" ? merged.namesKey : "",
		teams,
		teamMatches,
		teamMatchIndex:
			typeof merged.teamMatchIndex === "number" && merged.teamMatchIndex >= 0
				? merged.teamMatchIndex
				: 0,
		bracketEntrants: Array.isArray(merged.bracketEntrants)
			? merged.bracketEntrants.map(String)
			: [],
	} as PersistentTournamentState;
}

type TournamentAction =
	| {
			type: "INIT";
			payload: {
				ratings: Record<string, number>;
				persistentState: PersistentTournamentState;
			};
	  }
	| {
			type: "VOTE";
			payload: {
				currentMatch: Match;
				winnerId: string;
				loserId: string;
				matchNumber: number;
				round: number;
				voteTimestamp: number;
				userName: string;
			};
	  }
	| {
			type: "UNDO";
			payload: {
				lastEntry: HistoryEntry;
			};
	  }
	| {
			type: "QUIT";
			payload: {
				defaultState: PersistentTournamentState;
			};
	  };

interface TournamentReducerState {
	ratings: Record<string, number>;
	history: HistoryEntry[];
	persistentState: PersistentTournamentState;
	refreshKey: number;
}

function tournamentReducer(
	state: TournamentReducerState,
	action: TournamentAction,
): TournamentReducerState {
	switch (action.type) {
		case "INIT": {
			return {
				ratings: action.payload.ratings,
				history: [],
				persistentState: action.payload.persistentState,
				refreshKey: state.refreshKey + 1,
			};
		}
		case "VOTE": {
			const { currentMatch, winnerId, loserId, matchNumber, round, voteTimestamp } = action.payload;
			const newRatings = computeUpdatedRatings({
				currentMatch,
				ratingsSnapshot: state.ratings,
				winnerId,
			});
			const matchRecord: MatchRecord = createMatchRecord({
				currentMatch,
				winnerId,
				loserId,
				matchNumber,
				round,
			});
			const newHistoryEntry: HistoryEntry = {
				match: currentMatch,
				ratings: { ...state.ratings },
				round,
				matchNumber,
			};

			return {
				...state,
				ratings: newRatings,
				history: [...state.history, newHistoryEntry],
				persistentState: {
					...state.persistentState,
					matchHistory: [...(state.persistentState.matchHistory || []), matchRecord],
					currentMatch: matchNumber + 1,
					currentRound: round,
					ratings: newRatings,
					lastUpdated: voteTimestamp,
				},
				refreshKey: state.refreshKey + 1,
			};
		}
		case "UNDO": {
			const { lastEntry } = action.payload;
			const newHistory = state.history.slice(0, -1);
			const newMatchHistory = (state.persistentState.matchHistory || []).slice(0, -1);

			return {
				...state,
				ratings: lastEntry.ratings,
				history: newHistory,
				persistentState: {
					...state.persistentState,
					matchHistory: newMatchHistory,
					ratings: lastEntry.ratings,
					currentMatch: lastEntry.matchNumber,
					currentRound: lastEntry.round,
				},
				refreshKey: state.refreshKey + 1,
			};
		}
		case "QUIT": {
			return {
				ratings: {},
				history: [],
				persistentState: action.payload.defaultState,
				refreshKey: state.refreshKey + 1,
			};
		}
		default:
			return state;
	}
}

function haveSameIds(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	let match = true;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			match = false;
			break;
		}
	}
	if (match) {
		return true;
	}

	const counts: Record<string, number> = Object.create(null);
	for (let i = 0; i < a.length; i++) {
		const val = a[i];
		counts[val] = (counts[val] || 0) + 1;
	}
	for (let i = 0; i < b.length; i++) {
		const val = b[i];
		const count = counts[val];
		if (!count) {
			return false;
		}
		counts[val] = count - 1;
	}
	return true;
}

const VOTE_COOLDOWN = TIMING.VOTE_COOLDOWN_MS;

export function useTournamentState(names: NameItem[], userName?: string) {
	const toast = useToast();
	const [isVoting, setIsVoting] = useState(false);

	const tournamentMode = useMemo(() => resolveTournamentMode(names.length), [names.length]);
	const tournamentActions = useAppStore((state) => state.tournamentActions);

	const namesKey = useMemo(() => createNamesKey(names), [names]);
	const tournamentId = useMemo(
		() => createTournamentId(namesKey, userName, names.length),
		[namesKey, userName, names.length],
	);

	const defaultPersistentState = useMemo(
		() => createDefaultPersistentState(userName || "anonymous"),
		[userName],
	);

	const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentTournamentState>(
		tournamentId,
		defaultPersistentState,
		{
			onError: () => {
				toast.showWarning(
					"Your progress could not be saved locally. Voting will continue but may not persist after a page refresh.",
				);
			},
		},
	);

	const persistentState = useMemo(
		(): PersistentTournamentState =>
			sanitizePersistentState(persistentStateRaw, userName || "anonymous"),
		[persistentStateRaw, userName],
	);

	const [state, dispatch] = useReducer(tournamentReducer, {
		ratings: {},
		history: [],
		persistentState: defaultPersistentState,
		refreshKey: 0,
	});

	const ratingsRef = useRef(state.ratings);
	const initializedRef = useRef(false);
	const lastNamesKeyRef = useRef("");
	const lastRatingsUpdateRef = useRef(0);

	useEffect(() => {
		if (initializedRef.current) {
			setPersistentState(state.persistentState);
			const ratings = state.ratings;
			const ratingsData: Record<string, RatingData> = {};
			const ratingIds = Object.keys(ratings);
			for (let i = 0; i < ratingIds.length; i++) {
				const id = ratingIds[i];
				ratingsData[id] = { rating: ratings[id], wins: 0, losses: 0 };
			}
			tournamentActions.syncTournamentProgress({
				ratings: ratingsData,
				matchHistory: state.persistentState.matchHistory,
				currentRound: state.persistentState.currentRound,
				currentMatch: state.persistentState.currentMatch,
				totalMatches: state.persistentState.totalMatches,
				mode: state.persistentState.mode,
				teams: state.persistentState.teams,
				bracketEntrants: state.persistentState.bracketEntrants,
				lastUpdated: state.persistentState.lastUpdated,
			});
		}
	}, [state.persistentState, state.ratings, setPersistentState, tournamentActions]);

	useEffect(() => {
		ratingsRef.current = state.ratings;
	}, [state.ratings]);

	useEffect(() => {
		if (lastNamesKeyRef.current !== namesKey) {
			initializedRef.current = false;
			lastNamesKeyRef.current = namesKey;
		}
	}, [namesKey]);

	useEffect(() => {
		if (initializedRef.current) {
			return;
		}
		if (!Array.isArray(names) || names.length < 2) {
			return;
		}

		const initializeTournament = () => {
			const storeTournament = useAppStore.getState().tournament;
			const effectivePersistentState: PersistentTournamentState =
				persistentState.bracketEntrants && persistentState.bracketEntrants.length > 0
					? persistentState
					: {
							...persistentState,
							matchHistory: storeTournament.matchHistory ?? persistentState.matchHistory,
							currentRound: storeTournament.currentRound ?? persistentState.currentRound,
							currentMatch: storeTournament.currentMatch ?? persistentState.currentMatch,
							totalMatches: storeTournament.totalMatches ?? persistentState.totalMatches,
							teams: storeTournament.teams ?? persistentState.teams,
							bracketEntrants: storeTournament.bracketEntrants ?? persistentState.bracketEntrants,
							mode: (storeTournament.mode ?? tournamentMode) as TournamentMode,
						};

			const hasValidPersistence =
				(persistentState.namesKey === namesKey && persistentState.mode === tournamentMode) ||
				(Boolean(
					effectivePersistentState.bracketEntrants &&
						effectivePersistentState.bracketEntrants.length > 0,
				) &&
					storeTournament.names?.length === names.length);
			const initialRatings = buildInitialRatings(names);

			let teams = effectivePersistentState.teams;
			if (tournamentMode === "2v2" && teams.length < 2) {
				teams = generateRandomTeams(
					names.map((name) => ({ id: String(name.id), name: name.name })),
				);
			}

			const participantIds =
				tournamentMode === "2v2"
					? teams.map((team) => team.id)
					: names.map((name) => String(name.id));
			const shouldResetBracket =
				!hasValidPersistence ||
				effectivePersistentState.bracketEntrants.length === 0 ||
				!haveSameIds(
					effectivePersistentState.bracketEntrants.filter((id) => !isBye(id)),
					participantIds,
				);
			const bracketEntrants = shouldResetBracket
				? createBracketEntrants(participantIds)
				: effectivePersistentState.bracketEntrants;

			const stateUpdates: Partial<PersistentTournamentState> = {
				matchHistory: shouldResetBracket ? [] : effectivePersistentState.matchHistory,
				currentRound: shouldResetBracket ? 1 : effectivePersistentState.currentRound,
				currentMatch: shouldResetBracket ? 1 : effectivePersistentState.currentMatch,
				totalMatches: Math.max(0, participantIds.length - 1),
				teams,
				bracketEntrants,
			};

			if (!hasValidPersistence) {
				Object.assign(stateUpdates, {
					namesKey,
					ratings: initialRatings,
					mode: tournamentMode,
					teamMatches: [],
					teamMatchIndex: 0,
				});
			} else if (
				shouldResetBracket ||
				(tournamentMode === "2v2" && teams !== effectivePersistentState.teams)
			) {
				stateUpdates.ratings = shouldResetBracket
					? initialRatings
					: effectivePersistentState.ratings;
			}

			const storedRatingsAreFresh =
				(effectivePersistentState.lastUpdated ?? 0) >= lastRatingsUpdateRef.current;

			let activeRatings = initialRatings;
			if (
				hasValidPersistence &&
				effectivePersistentState.ratings &&
				Object.keys(effectivePersistentState.ratings).length > 0 &&
				storedRatingsAreFresh
			) {
				activeRatings = effectivePersistentState.ratings;
			} else if (lastRatingsUpdateRef.current > 0) {
				activeRatings = ratingsRef.current;
			} else {
				if (!stateUpdates.ratings) {
					stateUpdates.ratings = initialRatings;
				}
			}

			dispatch({
				type: "INIT",
				payload: {
					ratings: activeRatings,
					persistentState: { ...effectivePersistentState, ...stateUpdates },
				},
			});

			initializedRef.current = true;
		};

		const frameId = requestAnimationFrame(initializeTournament);
		return () => {
			cancelAnimationFrame(frameId);
		};
	}, [names, namesKey, tournamentMode, persistentState]);

	const idToNameMap = useMemo(() => createIdToNameMap(names), [names]);
	const teamsById = useMemo(
		() => createTeamsById(state.persistentState.teams),
		[state.persistentState.teams],
	);
	const bracketDerived = useMemo(
		() =>
			deriveBracketState(state.persistentState.bracketEntrants, state.persistentState.matchHistory),
		[state.persistentState.bracketEntrants, state.persistentState.matchHistory],
	);

	const currentMatch = useMemo(() => {
		void state.refreshKey;
		return resolveCurrentMatch({
			tournamentMode,
			pendingMatchIds: bracketDerived.pendingMatchIds,
			teamsById,
			idToNameMap,
		});
	}, [state.refreshKey, idToNameMap, tournamentMode, bracketDerived.pendingMatchIds, teamsById]);

	const openingEntrants = useMemo(() => {
		const entrants = state.persistentState.bracketEntrants;
		const acc: { id: string; label: string }[] = [];
		for (let i = 0; i < entrants.length; i++) {
			const entrantKey = String(entrants[i]);
			if (!isBye(entrantKey)) {
				if (tournamentMode === "2v2") {
					const team = teamsById.get(entrantKey);
					acc.push({
						id: entrantKey,
						label: team ? team.memberNames.join(" + ") : entrantKey,
					});
				} else {
					const name = idToNameMap.get(entrantKey);
					acc.push({
						id: entrantKey,
						label: name?.name ?? entrantKey,
					});
				}
			}
		}
		return acc;
	}, [state.persistentState.bracketEntrants, tournamentMode, teamsById, idToNameMap]);

	const isComplete = bracketDerived.isComplete;
	const metrics = useMemo(
		() => calculateTournamentMetrics({ derived: bracketDerived }),
		[bracketDerived],
	);
	const { totalMatches, matchNumber, round, totalRounds, stageLabel, progress, etaMinutes } =
		metrics;

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}
			const voteTimestamp = Date.now();
			lastRatingsUpdateRef.current = voteTimestamp;

			const leftIds =
				currentMatch.mode === "2v2"
					? currentMatch.left.memberIds
					: [
							String(
								typeof currentMatch.left === "string" ? currentMatch.left : currentMatch.left.id,
							),
						];
			const rightIds =
				currentMatch.mode === "2v2"
					? currentMatch.right.memberIds
					: [
							String(
								typeof currentMatch.right === "string" ? currentMatch.right : currentMatch.right.id,
							),
						];

			const isLeftWinner =
				leftIds.includes(winnerId) ||
				(currentMatch.mode === "2v2" && currentMatch.left.id === winnerId);
			const winnerSideIds = isLeftWinner ? leftIds : rightIds;
			const loserSideIds = isLeftWinner ? rightIds : leftIds;

			tournamentActions.recordVote(
				winnerId,
				loserId,
				winnerSideIds.length > 1 ? winnerSideIds : undefined,
				loserSideIds.length > 1 ? loserSideIds : undefined,
			);

			const winnerSide = isLeftWinner ? "left" : "right";
			ratingsAPI
				.applyTournamentMatch({
					userName: userName ?? "anonymous",
					leftNameIds: leftIds,
					rightNameIds: rightIds,
					winnerSide,
				})
				.catch((err: unknown) => {
					console.warn("[tournament] apply_tournament_match_elo failed (non-fatal):", err);
				});

			dispatch({
				type: "VOTE",
				payload: {
					currentMatch,
					winnerId,
					loserId,
					matchNumber,
					round,
					voteTimestamp,
					userName: userName || "anonymous",
				},
			});
		},
		[currentMatch, matchNumber, round, userName, tournamentActions.recordVote],
	);

	const voteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const currentMatchRef = useRef(currentMatch);

	useEffect(() => {
		currentMatchRef.current = currentMatch;
	}, [currentMatch]);

	const handleVoteWithAnimation = useCallback(
		(winnerId: string, loserId: string) => {
			if (isVoting) {
				return;
			}
			const matchAtVoteTime = currentMatchRef.current;
			setIsVoting(true);
			voteTimeoutRef.current = setTimeout(() => {
				if (currentMatchRef.current === matchAtVoteTime) {
					handleVote(winnerId, loserId);
				} else {
					toast.showWarning("Match changed, vote not counted");
				}
				setIsVoting(false);
			}, VOTE_COOLDOWN);
		},
		[handleVote, isVoting, toast],
	);

	useEffect(() => {
		return () => {
			if (voteTimeoutRef.current) {
				clearTimeout(voteTimeoutRef.current);
			}
		};
	}, []);

	const handleUndo = useCallback(() => {
		if (state.history.length === 0) {
			toast.showWarning("No more moves to undo");
			return;
		}
		const lastEntry = state.history[state.history.length - 1];
		if (!lastEntry) {
			return;
		}
		dispatch({ type: "UNDO", payload: { lastEntry } });
		tournamentActions.undoVote();
	}, [state.history, toast, tournamentActions]);

	const handleQuit = useCallback(() => {
		const emptyState = createDefaultPersistentState(userName);
		dispatch({ type: "QUIT", payload: { defaultState: emptyState } });
		setPersistentState(emptyState);
		tournamentActions.clearVoteHistory();
		tournamentActions.resetTournament();
	}, [setPersistentState, tournamentActions, userName]);

	return {
		currentMatch,
		ratings: state.ratings,
		openingEntrants,
		round,
		totalRounds,
		bracketStage: stageLabel,
		matchNumber,
		totalMatches,
		isComplete,
		tournamentMode,
		handleVote,
		handleUndo,
		canUndo: state.history.length > 0,
		handleQuit,
		progress,
		etaMinutes,
		isVoting,
		handleVoteWithAnimation,
		matchHistory: state.persistentState.matchHistory,
		bracketEntrants: state.persistentState.bracketEntrants,
		teams: state.persistentState.teams,
	};
}

/* ==========================================================================
   9. useInertiaScroll
   ========================================================================== */

export function useInertiaScroll(
	containerRef: RefObject<HTMLElement | null>,
	prefersReducedMotion: boolean | null,
) {
	const scrollY = useMotionValue(0);
	const rafThrottleRef = useRef<number | null>(null);
	const inertiaControlsRef = useRef<AnimationPlaybackControls | null>(null);
	const lastWheelTsRef = useRef<number>(0);
	const isIntertiaActiveRef = useRef(false);
	const isAutoScrollPausedRef = useRef(false);
	const autoScrollRafRef = useRef<number | null>(null);
	const lastAutoScrollTimeRef = useRef<number>(0);
	const tilesCacheRef = useRef<HTMLElement[] | null>(null);

	useEffect(() => {
		const unsubscribe = scrollY.on("change", (latest) => {
			const el = containerRef.current;
			const threshold = 180;

			if (el && el.scrollHeight > el.clientHeight) {
				const scrollHeight = el.scrollHeight;
				const clientHeight = el.clientHeight;

				if (latest + clientHeight >= scrollHeight - threshold) {
					const offset = latest + clientHeight - (scrollHeight - threshold);
					const wrapped = threshold + offset;
					el.scrollTop = wrapped;
					scrollY.set(wrapped);
					return;
				}
				if (latest <= threshold) {
					const wrapped = scrollHeight - (clientHeight + threshold * 2) + latest;
					el.scrollTop = wrapped;
					scrollY.set(wrapped);
					return;
				}
				el.scrollTop = latest;
			} else {
				const docEl = document.documentElement;
				const scrollHeight = docEl.scrollHeight;
				const clientHeight = window.innerHeight;

				if (scrollHeight > clientHeight) {
					if (latest + clientHeight >= scrollHeight - threshold) {
						const offset = latest + clientHeight - (scrollHeight - threshold);
						const wrapped = threshold + offset;
						window.scrollTo({ top: wrapped, behavior: "instant" });
						scrollY.set(wrapped);
						return;
					}
					if (latest <= threshold && latest > 0) {
						const wrapped = scrollHeight - (clientHeight + threshold * 2) + latest;
						window.scrollTo({ top: wrapped, behavior: "instant" });
						scrollY.set(wrapped);
						return;
					}
					window.scrollTo({ top: latest, behavior: "instant" });
				}
			}
		});

		return () => {
			unsubscribe();
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}
		};
	}, [scrollY, containerRef]);

	useEffect(() => {
		const targetEl = containerRef.current;
		if (!targetEl) {
			return;
		}

		scrollY.set(targetEl.scrollTop || window.scrollY || 0);

		const handleWheel = (e: WheelEvent) => {
			if (prefersReducedMotion) {
				return;
			}
			const currentY = scrollY.get();
			const now = performance.now();
			const dt = Math.max(1, Math.min(100, now - (lastWheelTsRef.current || now)));
			lastWheelTsRef.current = now;

			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}

			const impulse = e.deltaY;
			const initialVelocity = (impulse / dt) * 45;
			isIntertiaActiveRef.current = true;

			inertiaControlsRef.current = animate(scrollY, currentY + impulse * 1.5, {
				type: "inertia",
				velocity: initialVelocity,
				power: 0.8,
				timeConstant: 325,
				restDelta: 0.5,
				onComplete: () => {
					isIntertiaActiveRef.current = false;
					inertiaControlsRef.current = null;
				},
			});
		};

		const handleScroll = () => {
			if (rafThrottleRef.current !== null) {
				return;
			}
			rafThrottleRef.current = window.requestAnimationFrame(() => {
				rafThrottleRef.current = null;
				if (!isIntertiaActiveRef.current) {
					const currentTop = targetEl.scrollTop || window.scrollY || 0;
					scrollY.set(currentTop);
				}
			});
		};

		const handlePointerMove = (e: PointerEvent) => {
			const target = e.target as HTMLElement | null;
			if (target?.closest?.("[data-tile-id], .drift-wall__tile")) {
				if (inertiaControlsRef.current) {
					inertiaControlsRef.current.stop();
					inertiaControlsRef.current = null;
					isIntertiaActiveRef.current = false;
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			if (
				active &&
				(active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)
			) {
				return;
			}

			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
				isIntertiaActiveRef.current = false;
			}

			const key = e.key;
			if (
				key !== "ArrowUp" &&
				key !== "ArrowDown" &&
				key !== "ArrowLeft" &&
				key !== "ArrowRight" &&
				key !== "Home" &&
				key !== "End" &&
				key !== "PageUp" &&
				key !== "PageDown"
			) {
				return;
			}

			const container = containerRef.current;
			if (!container) {
				return;
			}

			if (!tilesCacheRef.current || tilesCacheRef.current.length === 0) {
				tilesCacheRef.current = Array.from(
					container.querySelectorAll<HTMLElement>(
						'[data-tile-id], .drift-wall__tile, [role="button"]',
					),
				).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
			}

			const tiles = tilesCacheRef.current;
			if (!tiles || tiles.length === 0) {
				return;
			}

			const activeTileIndex = tiles.findIndex((el) => el === active || el.contains(active));
			let nextTile: HTMLElement | null = null;

			if (activeTileIndex === -1) {
				if (key === "ArrowUp" || key === "End") {
					nextTile = tiles[tiles.length - 1];
				} else {
					nextTile = tiles[0];
				}
			} else {
				const currentTile = tiles[activeTileIndex];
				const currentCol = currentTile.getAttribute("data-col");

				if (currentCol === null) {
					if (key === "ArrowDown") {
						const isAtBottom = activeTileIndex >= tiles.length - 1;
						nextTile = isAtBottom ? tiles[0] : tiles[activeTileIndex + 1];
					} else if (key === "ArrowUp") {
						const isAtTop = activeTileIndex <= 0;
						nextTile = isAtTop ? tiles[tiles.length - 1] : tiles[activeTileIndex - 1];
					} else if (key === "Home") {
						nextTile = tiles[0];
					} else if (key === "End") {
						nextTile = tiles[tiles.length - 1];
					}
				} else {
					const colTiles = tiles.filter((t) => t.getAttribute("data-col") === currentCol);
					const indexInCol = colTiles.indexOf(currentTile);

					if (key === "ArrowDown") {
						const isAtBottom = indexInCol >= colTiles.length - 1;
						nextTile = isAtBottom ? colTiles[0] : colTiles[indexInCol + 1];
					} else if (key === "ArrowUp") {
						const isAtTop = indexInCol <= 0;
						nextTile = isAtTop ? colTiles[colTiles.length - 1] : colTiles[indexInCol - 1];
					} else if (key === "PageDown") {
						const stepIndex = (indexInCol + 4) % colTiles.length;
						nextTile = colTiles[stepIndex];
					} else if (key === "PageUp") {
						const stepIndex = (indexInCol - 4 + colTiles.length) % colTiles.length;
						nextTile = colTiles[stepIndex];
					} else if (key === "Home") {
						nextTile = colTiles[0];
					} else if (key === "End") {
						nextTile = colTiles[colTiles.length - 1];
					} else if (key === "ArrowRight" || key === "ArrowLeft") {
						const allCols: number[] = [];
						for (let i = 0; i < tiles.length; i++) {
							const colAttr = tiles[i].getAttribute("data-col");
							if (colAttr !== null) {
								const col = Number(colAttr);
								if (allCols.indexOf(col) === -1) {
									allCols.push(col);
								}
							}
						}
						allCols.sort((a, b) => a - b);

						if (allCols.length > 0) {
							const currentNum = Number(currentCol);
							const colIdx = allCols.indexOf(currentNum);
							if (colIdx !== -1) {
								const targetColNum =
									key === "ArrowRight"
										? allCols[(colIdx + 1) % allCols.length]
										: allCols[(colIdx - 1 + allCols.length) % allCols.length];

								const targetColTiles: HTMLElement[] = [];
								for (let i = 0; i < tiles.length; i++) {
									const t = tiles[i];
									if (Number(t.getAttribute("data-col")) === targetColNum) {
										targetColTiles.push(t);
									}
								}
								const targetIdx = Math.min(indexInCol, targetColTiles.length - 1);
								nextTile = targetColTiles[targetIdx] || targetColTiles[0] || null;
							}
						}
					}
				}
			}

			if (nextTile) {
				e.preventDefault();
				nextTile.focus({ preventScroll: true });

				const rect = nextTile.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				if (rect.top < containerRect.top + 60) {
					const diff = containerRect.top + 80 - rect.top;
					scrollY.set(scrollY.get() - diff);
				} else if (rect.bottom > containerRect.bottom - 60) {
					const diff = rect.bottom - (containerRect.bottom - 80);
					scrollY.set(scrollY.get() + diff);
				}
			}
		};

		const handleMouseEnter = () => {
			isAutoScrollPausedRef.current = true;
		};

		const handleMouseLeave = () => {
			isAutoScrollPausedRef.current = false;
			lastAutoScrollTimeRef.current = performance.now();
		};

		const autoScrollLoop = (time: number) => {
			if (document.hidden) {
				autoScrollRafRef.current = null;
				return;
			}
			const lastTime = lastAutoScrollTimeRef.current || time;
			const dt = Math.min(50, Math.max(1, time - lastTime));
			lastAutoScrollTimeRef.current = time;

			if (!isAutoScrollPausedRef.current && !isIntertiaActiveRef.current) {
				const speed = 0.02;
				const delta = speed * dt;
				scrollY.set(scrollY.get() + delta);
			}

			autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
		};

		if (!prefersReducedMotion) {
			lastAutoScrollTimeRef.current = performance.now();
			autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				if (autoScrollRafRef.current !== null) {
					window.cancelAnimationFrame(autoScrollRafRef.current);
					autoScrollRafRef.current = null;
				}
			} else if (!prefersReducedMotion && autoScrollRafRef.current === null) {
				lastAutoScrollTimeRef.current = performance.now();
				autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		const observer = new MutationObserver(() => {
			tilesCacheRef.current = null;
		});
		observer.observe(targetEl, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["disabled", "aria-hidden", "data-tile-id", "class"],
		});

		targetEl.addEventListener("mouseenter", handleMouseEnter);
		targetEl.addEventListener("mouseleave", handleMouseLeave);
		targetEl.addEventListener("wheel", handleWheel, { passive: true });
		targetEl.addEventListener("scroll", handleScroll, { passive: true });
		targetEl.addEventListener("pointermove", handlePointerMove, { passive: true });
		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			observer.disconnect();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			targetEl.removeEventListener("mouseenter", handleMouseEnter);
			targetEl.removeEventListener("mouseleave", handleMouseLeave);
			targetEl.removeEventListener("wheel", handleWheel);
			targetEl.removeEventListener("scroll", handleScroll);
			targetEl.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("keydown", handleKeyDown);

			if (autoScrollRafRef.current !== null) {
				window.cancelAnimationFrame(autoScrollRafRef.current);
				autoScrollRafRef.current = null;
			}
			if (rafThrottleRef.current !== null) {
				window.cancelAnimationFrame(rafThrottleRef.current);
				rafThrottleRef.current = null;
			}
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}
		};
	}, [prefersReducedMotion, scrollY, containerRef]);

	return scrollY;
}
