import { type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import {
	getStorageString,
	parseJsonValue,
	removeStorageItem,
	writeStorageJson,
} from "@/shared/lib/storage";

const IS_BROWSER = typeof window !== "undefined";

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (this: unknown, ...args: Parameters<T>) {
		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => func.apply(this, args), wait);
	} as T;
}

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
	options: { debounceWait?: number; onError?: (error: unknown) => void } = {},
): [T, (value: SetStateAction<T>) => void, () => void] {
	const initialRef = useRef(initialValue);
	const onErrorRef = useRef(options.onError);

	useEffect(() => {
		onErrorRef.current = options.onError;
	}, [options.onError]);

	const readValue = useCallback((): T => {
		if (!IS_BROWSER) {
			return initialRef.current;
		}

		const raw = getStorageString(key, null);
		return raw === null ? initialRef.current : parseJsonValue(raw, initialRef.current);
	}, [key]);

	const [stored, setStored] = useState<T>(readValue);
	const valueRef = useRef(stored);
	valueRef.current = stored;

	const debouncedSetItemRef = useRef<ReturnType<typeof debounce> | null>(null);

	useEffect(() => {
		if (options.debounceWait && options.debounceWait > 0) {
			debouncedSetItemRef.current = debounce((value: T) => {
				if (!IS_BROWSER) {
					return;
				}

				const success = writeStorageJson(key, value);
				if (!success) {
					onErrorRef.current?.(new Error(`localStorage write failed for key "${key}"`));
				}
			}, options.debounceWait);
			return;
		}

		debouncedSetItemRef.current = null;
	}, [key, options.debounceWait]);

	useEffect(() => {
		return () => {
			if (!options.debounceWait || !IS_BROWSER) {
				return;
			}

			const success = writeStorageJson(key, valueRef.current);
			if (!success) {
				console.error(
					`[useLocalStorage] Unmount flush failed for key "${key}". In-memory state may not have been persisted.`,
				);
			}
		};
	}, [key, options.debounceWait]);

	const setValue = useCallback(
		(next: SetStateAction<T>) => {
			try {
				const resolved =
					typeof next === "function" ? (next as (previous: T) => T)(valueRef.current) : next;

				setStored(resolved);
				valueRef.current = resolved;

				if (debouncedSetItemRef.current) {
					debouncedSetItemRef.current(resolved);
					return;
				}

				if (!IS_BROWSER) {
					return;
				}

				const success = writeStorageJson(key, resolved);
				if (!success) {
					onErrorRef.current?.(new Error(`localStorage write failed for key "${key}"`));
				}
			} catch (error) {
				console.error(`[useLocalStorage] Unexpected error for key "${key}":`, error);
				onErrorRef.current?.(error);
			}
		},
		[key],
	);

	const removeValue = useCallback(() => {
		const fallback = initialRef.current;
		setStored(fallback);
		valueRef.current = fallback;

		if (IS_BROWSER) {
			removeStorageItem(key);
		}
	}, [key]);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}

		const handleStorage = (event: StorageEvent) => {
			if (event.key !== key) {
				return;
			}

			if (event.newValue === null) {
				setStored(initialRef.current);
				valueRef.current = initialRef.current;
				return;
			}

			const parsed = parseJsonValue<T>(event.newValue, initialRef.current);
			setStored(parsed);
			valueRef.current = parsed;
		};

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [key]);

	return [stored, setValue, removeValue];
}
