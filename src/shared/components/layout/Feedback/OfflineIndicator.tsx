import { useEffect, useState } from "react";

export function OfflineIndicator() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator === "undefined" ? true : navigator.onLine,
	);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (isOnline) {
		return null;
	}

	return (
		<div className="indicator" role="status" aria-live="polite">
			<div className="indicator-content">
				<span className="indicator-dot" />
				<span className="indicator-message">You are offline</span>
			</div>
		</div>
	);
}
