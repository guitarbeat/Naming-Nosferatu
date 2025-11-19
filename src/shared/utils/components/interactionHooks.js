/**
 * @module components/interactionHooks
 * @description Hooks for user interactions (click outside, keyboard, focus)
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * * Creates a standardized click outside handler
 * @param {Function} handler - Handler to call when clicking outside
 * @returns {Object} Ref to attach to element
 */
export function useClickOutside(handler) {
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handler]);

  return ref;
}

/**
 * * Creates a standardized keyboard handler
 * @param {Object} keyHandlers - Object mapping keys to handlers
 * @param {Array} dependencies - Dependencies for the effect
 * @returns {void}
 */
export function useKeyboardHandler(keyHandlers, dependencies = []) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const handler = keyHandlers[event.key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyHandlers, ...dependencies]);
}

/**
 * * Creates a standardized focus manager
 * @param {Object} options - Focus management options
 * @returns {Object} Focus state and handlers
 */
export function useFocusManager(options = {}) {
  const { initialFocus = false, restoreFocus = true } = options;

  const [isFocused, setIsFocused] = useState(initialFocus);
  const previousActiveElement = useRef(null);

  const focus = useCallback(() => {
    if (restoreFocus && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
    setIsFocused(true);
  }, [restoreFocus]);

  const blur = useCallback(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement;
    }
    setIsFocused(false);
  }, [restoreFocus]);

  const toggleFocus = useCallback(() => {
    if (isFocused) {
      blur();
    } else {
      focus();
    }
  }, [isFocused, focus, blur]);

  return {
    isFocused,
    focus,
    blur,
    toggleFocus,
  };
}
