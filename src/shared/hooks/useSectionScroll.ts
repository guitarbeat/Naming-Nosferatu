import { useCallback, useRef } from "react";
import { useMediaQuery } from "./useBrowserState";

export function useSectionScroll() {
	const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
	const pendingScrollRef = useRef<number | null>(null);

	const clearPendingScroll = useCallback(() => {
		if (pendingScrollRef.current === null) return;
		window.clearTimeout(pendingScrollRef.current);
		pendingScrollRef.current = null;
	}, []);

	const scrollToSection = useCallback(
		(id: string) => {
			clearPendingScroll();
			document.getElementById(id)?.scrollIntoView({
				behavior: prefersReducedMotion ? "auto" : "smooth",
				block: "start",
			});
		},
		[clearPendingScroll, prefersReducedMotion],
	);

	const scheduleSectionScroll = useCallback(
		(id: string, delay: number = 800) => {
			clearPendingScroll();
			pendingScrollRef.current = window.setTimeout(() => {
				pendingScrollRef.current = null;
				scrollToSection(id);
			}, delay);
		},
		[clearPendingScroll, scrollToSection],
	);

	return { scrollToSection, scheduleSectionScroll, clearPendingScroll };
}
