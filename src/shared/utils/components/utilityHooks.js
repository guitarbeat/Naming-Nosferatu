/**
 * @module components/utilityHooks
 * @description Utility hooks for common patterns (debounce, throttle, media queries, etc.)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { attachMediaQueryListener, getMediaQueryList } from "../mediaQueries";
import { UI } from "../../../core/constants";

/**
 * * Creates a standardized debounced value
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = UI.DEBOUNCE_DELAY) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * * Creates a standardized throttled callback
 * @param {Function} callback - Callback to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} Throttled callback
 */
export function useThrottle(callback, delay = UI.THROTTLE_DELAY) {
  const [lastRun, setLastRun] = useState(() => Date.now());

  return useCallback(
    (...args) => {
      if (Date.now() - lastRun >= delay) {
        callback(...args);
        setLastRun(Date.now());
      }
    },
    [callback, delay, lastRun],
  );
}

/**
 * * Creates a standardized media query hook
 * @param {string} query - Media query string
 * @returns {boolean} Whether the query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    const mediaQuery = getMediaQueryList(query);
    return mediaQuery ? mediaQuery.matches : false;
  });

  useEffect(() => {
    const mediaQuery = getMediaQueryList(query);
    if (!mediaQuery) {
      return undefined;
    }

    const handleChange = (event) => {
      const nextValue =
        typeof event?.matches === "boolean"
          ? event.matches
          : mediaQuery.matches;

      setMatches((current) => {
        if (current === nextValue) {
          return current;
        }

        return nextValue;
      });
    };

    handleChange();

    return attachMediaQueryListener(mediaQuery, handleChange);
  }, [query]);

  return matches;
}

/**
 * * Creates a standardized visibility manager
 * @param {Object} options - Visibility options
 * @returns {Object} Visibility state and handlers
 */
export function useVisibilityManager(options = {}) {
  const {
    initialVisible = false,
    threshold = 0.1,
    rootMargin = "0px",
  } = options;

  const [isVisible, setIsVisible] = useState(initialVisible);
  const [hasBeenVisible, setHasBeenVisible] = useState(initialVisible);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold, rootMargin },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasBeenVisible, ref]);

  return {
    isVisible,
    hasBeenVisible,
    ref,
  };
}

/**
 * * Creates a standardized previous value hook
 * @param {any} value - Value to track
 * @returns {any} Previous value
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}

/**
 * * Creates a standardized force update hook
 * @returns {Function} Force update function
 */
export function useForceUpdate() {
  const [, setTick] = useState(0);

  return useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);
}

