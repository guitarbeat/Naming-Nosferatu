/**
 * @module useReducedMotion
 * @description Hook to detect user's reduced motion preference
 */

import { useEffect, useState } from "react";
import { attachMediaQueryListener, getMediaQueryList } from "../utils/core";

export function useReducedMotion(): boolean {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
		const mediaQuery = getMediaQueryList("(prefers-reduced-motion: reduce)");
		return mediaQuery ? mediaQuery.matches : false;
	});

	useEffect(() => {
		const mediaQuery = getMediaQueryList("(prefers-reduced-motion: reduce)");
		if (!mediaQuery) {
			return;
		}
		const cleanup = attachMediaQueryListener(mediaQuery, (e: MediaQueryListEvent) => {
			setPrefersReducedMotion(e.matches);
		});
		return cleanup;
	}, []);

	return prefersReducedMotion;
}

export default useReducedMotion;
