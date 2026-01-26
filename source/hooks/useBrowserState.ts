/**
 * @module useBrowserState
 * @description Browser state and storage hooks for responsive design, network status, and localStorage management
 */

import { tournamentsAPI } from "@features/tournament/hooks/TournamentLogic";
import { syncQueue } from "@services/SyncQueue";
import { useCallback, useEffect, useState } from "react";
import { useProfileNotifications } from "@/features/tournament/hooks/useProfile";
import { devError, devLog, devWarn } from "@/utils/basic";

// ============================================================================
// Browser State Hook
// ============================================================================

interface BrowserState {
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	isSmallMobile: boolean;
	prefersReducedMotion: boolean;
	isOnline: boolean;
	isSlowConnection: boolean;
	connectionType: string;
}

export const useBrowserState = (): BrowserState => {
	const [browserState, setBrowserState] = useState<BrowserState>(() => ({
		isMobile: typeof window !== "undefined" ? window.innerWidth <= 768 : false,
		isTablet:
			typeof window !== "undefined" ? window.innerWidth > 768 && window.innerWidth <= 1024 : false,
		isDesktop: typeof window !== "undefined" ? window.innerWidth > 1024 : true,
		isSmallMobile: typeof window !== "undefined" ? window.innerWidth <= 480 : false,
		prefersReducedMotion:
			typeof window !== "undefined"
				? window.matchMedia("(prefers-reduced-motion: reduce)").matches
				: false,
		isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
		isSlowConnection: false,
		connectionType: "unknown",
	}));

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		// biome-ignore lint/suspicious/noExplicitAny: Experimental Network Information API
		const connection = (navigator as any).connection;
		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

		const updateBrowserState = () => {
			const width = window.innerWidth;

			setBrowserState({
				isMobile: width <= 768,
				isTablet: width > 768 && width <= 1024,
				isDesktop: width > 1024,
				isSmallMobile: width <= 480,
				prefersReducedMotion: motionQuery.matches,
				isOnline: navigator.onLine,
				isSlowConnection: connection
					? connection.effectiveType === "2g" || connection.effectiveType === "slow-2g"
					: false,
				connectionType: connection ? connection.effectiveType : "unknown",
			});
		};

		window.addEventListener("resize", updateBrowserState);
		window.addEventListener("online", updateBrowserState);
		window.addEventListener("offline", updateBrowserState);
		motionQuery.addEventListener("change", updateBrowserState);

		if (connection) {
			connection.addEventListener("change", updateBrowserState);
		}

		updateBrowserState();

		return () => {
			window.removeEventListener("resize", updateBrowserState);
			window.removeEventListener("online", updateBrowserState);
			window.removeEventListener("offline", updateBrowserState);
			motionQuery.removeEventListener("change", updateBrowserState);
			if (connection) {
				connection.removeEventListener("change", updateBrowserState);
			}
		};
	}, []);

	return browserState;
};

/**
 * Hook for offline sync functionality - processes queued operations when coming back online
 */
export function useOfflineSync() {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const { showToast } = useProfileNotifications();

	const processQueue = useCallback(async () => {
		if (syncQueue.isEmpty()) {
			return;
		}

		let processedCount = 0;
		const total = syncQueue.getQueue().length;

		devLog(`[Sync] Processing ${total} items...`);

		while (!syncQueue.isEmpty()) {
			const item = syncQueue.peek();
			if (!item) {
				break;
			}

			try {
				if (item.type === "SAVE_RATINGS") {
					const { userName, ratings } = item.payload;
					const result = await tournamentsAPI.saveTournamentRatings(userName, ratings, true); // true = skip queue check

					if (result.success) {
						syncQueue.dequeue();
						processedCount++;
					} else {
						devWarn(
							"[Sync] Failed to process item, keeping in queue",
							(result as { error?: string }).error,
						);
						// If permanent error, maybe remove? For now, we simple break to retry later
						break;
					}
				}
			} catch (e) {
				devError("[Sync] Error processing queue item", e);
				break;
			}
		}

		if (processedCount > 0) {
			showToast(`Synced ${processedCount} offline updates to cloud`, "success");
		}
	}, [showToast]);

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			processQueue();
		};
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Initial check
		if (navigator.onLine) {
			processQueue();
		}

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [processQueue]);

	return { isOnline };
}

// ============================================================================
// LocalStorage Hook
// ============================================================================

/**
 * Custom hook for localStorage management
 * @param {string} key - The localStorage key
 * @param {T} initialValue - The initial value if key doesn't exist
 * @returns {Array} [storedValue, setValue] - Current value and setter function
 */
export default function useLocalStorage<T>(key: string, initialValue: T) {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") {
			return initialValue;
		}
		try {
			const storedJson = window.localStorage.getItem(key);
			return storedJson
				? (() => {
						try {
							return JSON.parse(storedJson) as T;
						} catch {
							return storedJson as unknown as T;
						}
					})()
				: initialValue;
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error(`Error reading localStorage key "${key}":`, error);
			}
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			try {
				const valueToStore =
					value instanceof Function ? (value as (prev: T) => T)(storedValue as T) : value;
				setStoredValue(valueToStore);
				if (typeof window !== "undefined") {
					window.localStorage.setItem(key, JSON.stringify(valueToStore));
				}
			} catch (error) {
				if (import.meta.env.DEV) {
					console.error(`Error setting localStorage key "${key}":`, error);
				}
			}
		},
		[key, storedValue],
	);

	return [storedValue, setValue] as const;
}

// ============================================================================
// Collapsible Hook
// ============================================================================

/**
 * Hook for managing collapsible state with optional localStorage persistence
 * @param {string} storageKey - Key for localStorage persistence (optional)
 * @param {boolean} defaultValue - Default collapsed state
 * @returns {Object} { isCollapsed, toggleCollapsed, setCollapsed }
 */
export function useCollapsible(storageKey: string | null = null, defaultValue: boolean = false) {
	// Use localStorage hook if storageKey provided, otherwise use local state
	const [persistedValue, setPersistedValue] = useLocalStorage(
		storageKey || "__unused__",
		defaultValue,
	);

	const [localValue, setLocalValue] = useState(defaultValue);

	// Use persisted value if storageKey is provided
	const isCollapsed = storageKey ? persistedValue : localValue;
	const setCollapsed = storageKey ? setPersistedValue : setLocalValue;

	const toggleCollapsed = useCallback(() => {
		setCollapsed((prev: boolean) => !prev);
	}, [setCollapsed]);

	return {
		isCollapsed,
		toggleCollapsed,
		setCollapsed,
	};
}
