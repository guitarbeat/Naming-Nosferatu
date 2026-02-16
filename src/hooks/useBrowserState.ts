/**
 * @module useBrowserState
 * @description Re-exports browser-related hooks from useHooks for backward compatibility.
 *
 * Also provides `useOfflineSync` as a thin wrapper around `useOnlineStatus`
 * for consumers that depend on the legacy API.
 */

import { useMediaQuery, useOnlineStatus } from "@/shared/hooks";

export function useBrowserState() {
	const isOnline = useOnlineStatus();
	const isMobile = useMediaQuery("(max-width: 768px)");
	const isTablet = useMediaQuery("(max-width: 1024px)");
	const isDesktop = useMediaQuery("(min-width: 1025px)");
	const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const isSlowConnection = false; // Placeholder as Network API is partial

	return {
		isOnline,
		isMobile,
		isTablet,
		isDesktop,
		prefersReducedMotion,
		isSlowConnection,
	};
}
