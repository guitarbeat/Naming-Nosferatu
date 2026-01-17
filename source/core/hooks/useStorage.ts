/**
 * @module useStorage
 * @description Storage hooks for localStorage management and collapsible state with persistence
 */

import { useCallback, useState } from "react";

// ============================================================================
// LocalStorage Hook
// ============================================================================

/**
 * Custom hook for localStorage management
 * @param {string} key - The localStorage key
 * @param {any} initialValue - The initial value if key doesn't exist
 * @returns {Array} [storedValue, setValue] - Current value and setter function
 */
export default function useLocalStorage<T>(key: string, initialValue: T) {
	const [storedValue, setStoredValue] = useState(() => {
		if (typeof window === "undefined") {
			return initialValue;
		}
		try {
			const item = window.localStorage.getItem(key);
			return item
				? (() => {
						try {
							return JSON.parse(item);
						} catch {
							return item;
						}
					})()
				: initialValue;
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error(`Error reading localStorage key "${key}":`, error);
			}
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			try {
				const valueToStore =
					value instanceof Function ? (value as (prev: T) => T)(storedValue as T) : value;
				setStoredValue(valueToStore);
				if (typeof window !== "undefined") {
					window.localStorage.setItem(key, JSON.stringify(valueToStore));
				}
			} catch (error) {
				if (import.meta.env.DEV) {
					console.error(`Error setting localStorage key "${key}":`, error);
				}
			}
		},
		[key, storedValue],
	);

	return [storedValue, setValue];
}

// ============================================================================
// Collapsible Hook
// ============================================================================

/**
 * Hook for managing collapsible state with optional localStorage persistence
 * @param {string} storageKey - Key for localStorage persistence (optional)
 * @param {boolean} defaultValue - Default collapsed state
 * @returns {Object} { isCollapsed, toggleCollapsed, setCollapsed }
 */
export function useCollapsible(storageKey: string | null = null, defaultValue: boolean = false) {
	// Use localStorage hook if storageKey provided, otherwise use local state
	const [persistedValue, setPersistedValue] = useLocalStorage(
		storageKey || "__unused__",
		defaultValue,
	);

	const [localValue, setLocalValue] = useState(defaultValue);

	// Use persisted value if storageKey is provided
	const isCollapsed = storageKey ? persistedValue : localValue;
	const setCollapsed = storageKey ? setPersistedValue : setLocalValue;

	const toggleCollapsed = useCallback(() => {
		setCollapsed((prev: boolean) => !prev);
	}, [setCollapsed]);

	return {
		isCollapsed,
		toggleCollapsed,
		setCollapsed,
	};
}
