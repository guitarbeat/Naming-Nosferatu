// @ts-nocheck
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
export default function useLocalStorage(key, initialValue) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      // Try to parse as JSON, but fallback to raw value if parsing fails
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
      // Silently handle parsing errors in production
      if (process.env.NODE_ENV === "development") {
        console.error(`Error reading localStorage key "${key}":`, error);
      }
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        // Silently handle storage errors in production
        if (process.env.NODE_ENV === "development") {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}
