import { useCallback, useEffect, useRef, useState } from "react";

function usePrefersReducedMotion() {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		setMatches(media.matches);
		const handleChange = () => setMatches(media.matches);
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, []);

	return matches;
}

export function useSectionScroll() {
	const prefersReducedMotion = usePrefersReducedMotion();
	const pendingScrollRef = useRef<number | null>(null);

	const clearPendingScroll = useCallback(() => {
		if (pendingScrollRef.current === null) {
			return;
		}
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
