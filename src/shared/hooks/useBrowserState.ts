import { useCallback, useEffect, useState } from "react";
import { getConnectionInfo, IS_BROWSER, isSlowNetwork } from "./shared";
import { useMediaQuery } from "./useMediaQuery";
import { useOnlineStatus } from "./useOnlineStatus";

export function useBrowserState() {
	const isOnline = useOnlineStatus();
	const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const readViewport = useCallback(() => {
		if (!IS_BROWSER) {
			return {
				isMobile: false,
				isTablet: false,
				isDesktop: true,
			};
		}
		const width = window.innerWidth;
		return {
			isMobile: width < 768,
			isTablet: width >= 768 && width < 1024,
			isDesktop: width >= 1024,
		};
	}, []);
	const [viewport, setViewport] = useState(readViewport);
	const [isSlowConnection, setIsSlowConnection] = useState(() =>
		isSlowNetwork(getConnectionInfo()),
	);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}
		let rafId = 0;
		const handleResize = () => {
			if (rafId) {
				return;
			}
			rafId = window.requestAnimationFrame(() => {
				rafId = 0;
				setViewport(readViewport());
			});
		};
		window.addEventListener("resize", handleResize, { passive: true });
		window.addEventListener("orientationchange", handleResize, { passive: true });
		return () => {
			if (rafId) {
				window.cancelAnimationFrame(rafId);
			}
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleResize);
		};
	}, [readViewport]);

	useEffect(() => {
		const connection = getConnectionInfo();
		if (!connection) {
			return;
		}
		const onChange = () => setIsSlowConnection(isSlowNetwork(connection));
		onChange();
		connection.addEventListener("change", onChange);
		return () => connection.removeEventListener("change", onChange);
	}, []);

	return {
		...viewport,
		isOnline,
		prefersReducedMotion,
		isSlowConnection,
	};
}
