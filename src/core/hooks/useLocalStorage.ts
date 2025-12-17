/**
 * @module useLocalStorage
 * @description Custom hook for managing localStorage with error handling and type safety.
 * Provides a React-friendly interface for localStorage operations.
 */

import { useState, useCallback } from "react";

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
      if (process.env.NODE_ENV === "development") {
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
        if (process.env.NODE_ENV === "development") {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}
