/**
 * @module useAsyncOperation
 * @description Hook for managing async operations with loading and error states
 */

import { useState, useCallback } from "react";
import { ErrorManager } from "../services/errorManager";

/**
 * Hook for managing async operations with loading and error states
 * @param {Object} options - Configuration options
 * @param {Function} options.onError - Custom error handler (optional)
 * @param {string} options.errorContext - Context for error reporting (optional)
 * @param {Object} options.errorMetadata - Metadata for error reporting (optional)
 * @param {boolean} options.useErrorManager - Whether to use ErrorManager (default: true)
 * @returns {Object} Async operation state and handlers
 */
export function useAsyncOperation(options = {}) {
  const {
    onError,
    errorContext = "Async Operation",
    errorMetadata = {},
    useErrorManager = true,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute an async operation with loading and error handling
   * @param {Function} operation - Async function to execute
   * @param {Function} onSuccess - Success callback (optional)
   * @returns {Promise} Promise that resolves when operation completes
   */
  const execute = useCallback(
    async (operation, onSuccess) => {
      if (isLoading) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await operation();
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (err) {
        let formattedError = err;

        if (useErrorManager) {
          formattedError = ErrorManager.handleError(err, errorContext, {
            isRetryable: true,
            affectsUserData: false,
            isCritical: false,
            ...errorMetadata,
          });
        }

        setError(
          formattedError?.userMessage ||
            formattedError?.message ||
            "An error occurred. Please try again.",
        );

        if (onError) {
          onError(err, formattedError);
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, errorContext, errorMetadata, useErrorManager, onError],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    clearError,
    setError,
  };
}
