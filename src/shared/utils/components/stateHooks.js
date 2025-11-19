/**
 * @module components/stateHooks
 * @description State management hooks for loading, error, and async operations
 */

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * * Creates a standardized loading state manager
 * @param {boolean} initialLoading - Initial loading state
 * @returns {Object} Loading state and handlers
 */
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState("");

  const startLoading = useCallback((message = "Loading...") => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage("");
  }, []);

  const withLoading = useCallback(
    async (asyncFn, message) => {
      startLoading(message);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * * Creates a standardized error state manager
 * @param {Object} initialError - Initial error state
 * @returns {Object} Error state and handlers
 */
export function useErrorState(initialError = null) {
  const [error, setError] = useState(initialError);
  const [errors, setErrors] = useState([]);

  const setSingleError = useCallback((error) => {
    setError(error);
    setErrors([]);
  }, []);

  const setMultipleErrors = useCallback((errorList) => {
    setError(null);
    setErrors(Array.isArray(errorList) ? errorList : [errorList]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrors([]);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasError = useMemo(() => {
    return error !== null || errors.length > 0;
  }, [error, errors]);

  return {
    error,
    errors,
    hasError,
    setSingleError,
    setMultipleErrors,
    clearError,
    clearErrors,
  };
}

/**
 * * Creates a standardized async operation manager
 * @param {Function} asyncFn - Async function to manage
 * @param {Object} options - Options for the operation
 * @returns {Object} Operation state and handlers
 */
export function useAsyncOperation(asyncFn, options = {}) {
  const { immediate = false, onSuccess, onError, onFinally } = options;

  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const execute = useCallback(
    async (...args) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await asyncFn(...args);
        setState({
          data,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error,
          isLoading: false,
          isSuccess: false,
          isError: true,
        }));

        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        if (onFinally) {
          onFinally();
        }
      }
    },
    [asyncFn, onSuccess, onError, onFinally],
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}

