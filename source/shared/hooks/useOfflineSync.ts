import { useEffect, useState } from "react";
import { useProfileNotifications } from "../../core/hooks/useProfileNotifications";
import { tournamentsAPI } from "../../features/tournament/TournamentLogic";
import { devError, devLog, devWarn } from "../../shared/utils";
import { syncQueue } from "../services/sync/SyncQueue";

export function useOfflineSync() {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const { showToast } = useProfileNotifications();

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
	}, []);

	const processQueue = async () => {
		if (syncQueue.isEmpty()) return;

		let processedCount = 0;
		const total = syncQueue.getQueue().length;

		devLog(`[Sync] Processing ${total} items...`);

		while (!syncQueue.isEmpty()) {
			const item = syncQueue.peek();
			if (!item) break;

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
	};

	return { isOnline };
}
