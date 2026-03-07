import { useCallback, useEffect, useRef, useState } from "react";
import { debounce, IS_BROWSER } from "./shared";

type SetStateAction<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
	options: { debounceWait?: number } = {},
): [T, (value: SetStateAction<T>) => void, () => void] {
	const initialRef = useRef(initialValue);

	const readValue = useCallback((): T => {
		if (!IS_BROWSER) {
			return initialRef.current;
		}
		try {
			const raw = localStorage.getItem(key);
			return raw !== null ? (JSON.parse(raw) as T) : initialRef.current;
		} catch {
			return initialRef.current;
		}
	}, [key]);

	const [stored, setStored] = useState<T>(readValue);
	const valueRef = useRef(stored);
	valueRef.current = stored;
	const debouncedSetItemRef = useRef<ReturnType<typeof debounce> | null>(null);

	useEffect(() => {
		if (options.debounceWait && options.debounceWait > 0) {
			debouncedSetItemRef.current = debounce((val: T) => {
				if (IS_BROWSER) {
					localStorage.setItem(key, JSON.stringify(val));
				}
			}, options.debounceWait);
		} else {
			debouncedSetItemRef.current = null;
		}
	}, [options.debounceWait, key]);

	const setValue = useCallback(
		(next: SetStateAction<T>) => {
			try {
				const resolved = next instanceof Function ? next(valueRef.current) : next;
				setStored(resolved);
				valueRef.current = resolved;
				if (debouncedSetItemRef.current) {
					debouncedSetItemRef.current(resolved);
				} else if (IS_BROWSER) {
					localStorage.setItem(key, JSON.stringify(resolved));
				}
			} catch (err) {
				console.warn(`[useLocalStorage] write "${key}" failed:`, err);
			}
		},
		[key],
	);

	const removeValue = useCallback(() => {
		const fallback = initialRef.current;
		setStored(fallback);
		valueRef.current = fallback;
		if (IS_BROWSER) {
			try {
				localStorage.removeItem(key);
			} catch {
				/* quota / security errors */
			}
		}
	}, [key]);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}
		const onStorage = (e: StorageEvent) => {
			if (e.key !== key) {
				return;
			}
			try {
				const parsed = e.newValue !== null ? (JSON.parse(e.newValue) as T) : initialRef.current;
				setStored(parsed);
				valueRef.current = parsed;
			} catch {
				setStored(initialRef.current);
				valueRef.current = initialRef.current;
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [key]);

	return [stored, setValue, removeValue];
}
