import { useCallback, useEffect, useRef, useState } from "react";

export function useTimedState<T>(defaultValue: T) {
	const [value, setValue] = useState<T>(defaultValue);
	const timeoutRef = useRef<number | null>(null);
	const defaultRef = useRef(defaultValue);
	defaultRef.current = defaultValue;

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
				setValue(defaultRef.current);
				timeoutRef.current = null;
			}, durationMs);
		},
		[clear],
	);

	useEffect(() => clear, [clear]);

	return { value, set: setValue, setTimed, clear } as const;
}
