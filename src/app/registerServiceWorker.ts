/**
 * Registers the app service worker in production so installability criteria are met.
 */
export function registerServiceWorker(): void {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
		return;
	}

	window.addEventListener(
		"load",
		() => {
			navigator.serviceWorker.register("/sw.js").catch((error) => {
				console.warn("Service worker registration failed:", error);
			});
		},
		{ once: true },
	);
}
