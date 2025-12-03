/**
 * @module useAsyncOperation
 * @description Hook for managing async operations with loading state, error handling,
 * and automatic cleanup on unmount.
 */

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook for managing async operations with proper cleanup
 * @param {Object} options
 * @param {Function} options.operation - Async function to execute
 * @param {boolean} options.immediate - Whether to run immediately on mount (default: false)
 * @param {Function} options.onSuccess - Callback on success
 * @param {Function} options.onError - Callback on error
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @returns {Object} { data, isLoading, error, execute, reset }
 */
export function useAsyncOperation({
  operation,
  immediate = false,
  onSuccess,
  onError,
  timeout = 30000,
} = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      if (!operation) return;

      // Abort any previous operation
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsLoading(true);
      setError(null);

      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          const id = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeout}ms`));
          }, timeout);
          signal.addEventListener("abort", () => clearTimeout(id));
        });

        // Race operation against timeout
        const result = await Promise.race([
          operation(...args, { signal }),
          timeoutPromise,
        ]);

        if (!isMountedRef.current) return;

        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        if (!isMountedRef.current) return;
        if (err.name === "AbortError") return;

        setError(err);
        onError?.(err);
        throw err;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [operation, timeout, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Run immediately if requested
  useEffect(() => {
    if (immediate && operation) {
      execute();
    }
  }, [immediate, execute, operation]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    isMounted: isMountedRef.current,
  };
}

/**
 * Simpler hook for just tracking mounted state
 * @returns {Object} { isMounted }
 */
export function useMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { isMounted: () => isMountedRef.current };
}

export default useAsyncOperation;
