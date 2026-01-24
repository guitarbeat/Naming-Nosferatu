import { tournamentsAPI } from "@features/tournament/TournamentLogic";
import { useProfileNotifications } from "@hooks/useProfileNotifications";
import { syncQueue } from "@services/SyncQueue";
import { devError, devLog, devWarn } from "@utils";
import { useCallback, useEffect, useState } from "react";

export interface BrowserState {
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
