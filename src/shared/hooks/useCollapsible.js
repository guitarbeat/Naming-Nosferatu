/**
 * @module useCollapsible
 * @description Hook for managing collapsible state with localStorage persistence.
 * Provides consistent collapse/expand behavior across components.
 */

import { useState, useCallback } from "react";
import useLocalStorage from "@core/hooks/useLocalStorage";

/**
 * Hook for managing collapsible state with optional localStorage persistence
 * @param {string} storageKey - Key for localStorage persistence (optional)
 * @param {boolean} defaultValue - Default collapsed state
 * @returns {Object} { isCollapsed, toggleCollapsed, setCollapsed }
 */
export function useCollapsible(storageKey = null, defaultValue = false) {
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
    setCollapsed((prev) => !prev);
  }, [setCollapsed]);

  return {
    isCollapsed,
    toggleCollapsed,
    setCollapsed,
  };
}

