/**
 * @module useTimedState
 * @description Hook for state that auto-clears after a timeout (DRYs up announcement patterns)
 */

import { useCallback, useEffect, useRef, useState } from "react";

export function useTimedState<T>(defaultValue: T) {
	const [value, setValue] = useState<T>(defaultValue);
	const timeoutRef = useRef<number | null>(null);

	const clear = useCallback(() => {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const setTimed = useCallback(
		(newValue: T, durationMs: number) => {
			clear();
			setValue(newValue);
			timeoutRef.current = window.setTimeout(() => {
				setValue(defaultValue);
				timeoutRef.current = null;
			}, durationMs);
		},
		[clear, defaultValue],
	);

	useEffect(() => clear, [clear]);

	return { value, set: setValue, setTimed, clear } as const;
}
