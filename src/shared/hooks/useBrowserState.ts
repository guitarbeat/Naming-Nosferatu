import { useCallback, useEffect, useRef, useState } from "react";

const IS_BROWSER = typeof window !== "undefined";

interface NetworkInformation extends EventTarget {
	effectiveType?: string;
	rtt?: number;
	downlink?: number;
	saveData?: boolean;
}

type NavigatorWithConnection = Navigator & {
	connection?: NetworkInformation;
	mozConnection?: NetworkInformation;
	webkitConnection?: NetworkInformation;
};

function useEventListener<K extends keyof WindowEventMap>(
	eventName: K,
	handler: (event: WindowEventMap[K]) => void,
	element?: Window | HTMLElement | null,
	options?: boolean | AddEventListenerOptions,
): void {
	const savedHandler = useRef(handler);

	useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(() => {
		const targetElement = element ?? (IS_BROWSER ? window : null);
		if (!targetElement?.addEventListener) {
			return;
		}

		const eventListener: EventListener = (event) => {
			savedHandler.current(event as WindowEventMap[K]);
		};

		targetElement.addEventListener(eventName, eventListener, options);

		return () => {
			targetElement.removeEventListener(eventName, eventListener, options);
		};
	}, [element, eventName, options]);
}

function useOnlineStatus(options?: {
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

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}

		const media = window.matchMedia(query);
		setMatches(media.matches);

		const handleChange = () => {
			setMatches(media.matches);
		};

		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, [query]);

	return matches;
}

function getConnectionInfo(): NetworkInformation | null {
	if (!IS_BROWSER) {
		return null;
	}

	const navigatorWithConnection = navigator as NavigatorWithConnection;
	return (
		navigatorWithConnection.connection ??
		navigatorWithConnection.mozConnection ??
		navigatorWithConnection.webkitConnection ??
		null
	);
}

function isSlowNetwork(connection: NetworkInformation | null): boolean {
	if (!connection) {
		return false;
	}

	const type = connection.effectiveType ?? "";
	const saveData = Boolean(connection.saveData);
	const rtt = connection.rtt ?? 0;
	const downlink = connection.downlink ?? 10;

	return type === "slow-2g" || type === "2g" || saveData || rtt > 300 || downlink < 1.5;
}

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

		let animationFrameId = 0;
		const handleResize = () => {
			if (animationFrameId) {
				return;
			}

			animationFrameId = window.requestAnimationFrame(() => {
				animationFrameId = 0;
				setViewport(readViewport());
			});
		};

		window.addEventListener("resize", handleResize, { passive: true });
		window.addEventListener("orientationchange", handleResize, { passive: true });

		return () => {
			if (animationFrameId) {
				window.cancelAnimationFrame(animationFrameId);
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

		const handleChange = () => {
			setIsSlowConnection(isSlowNetwork(connection));
		};

		handleChange();
		connection.addEventListener("change", handleChange);
		return () => connection.removeEventListener("change", handleChange);
	}, []);

	return {
		...viewport,
		isOnline,
		prefersReducedMotion,
		isSlowConnection,
	};
}
