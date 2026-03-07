import { useState } from "react";
import { useEventListener } from "./shared";

export function useOnlineStatus(options?: {
	onReconnect?: () => void;
	onDisconnect?: () => void;
}): boolean {
	const [isOnline, setIsOnline] = useState(
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);

	useEventListener("online", () => {
		setIsOnline(true);
		options?.onReconnect?.();
	});

	useEventListener("offline", () => {
		setIsOnline(false);
		options?.onDisconnect?.();
	});

	return isOnline;
}

export function useOfflineSync(): void {
	useOnlineStatus();
}
