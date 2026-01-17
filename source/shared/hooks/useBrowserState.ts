import { useEffect, useState } from "react";

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

// Backward compatibility exports
export const useScreenSize = () => {
	const { isMobile, isTablet, isDesktop, isSmallMobile } = useBrowserState();
	return { isMobile, isTablet, isDesktop, isSmallMobile };
};

export const useReducedMotion = () => {
	const { prefersReducedMotion } = useBrowserState();
	return prefersReducedMotion;
};

export const useNetworkStatus = () => {
	const { isOnline, isSlowConnection, connectionType } = useBrowserState();
	return { isOnline, isSlowConnection, connectionType };
};
