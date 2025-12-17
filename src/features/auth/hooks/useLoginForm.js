/**
 * @module useLoginForm
 * @description Hook for managing login form state and handlers
 */

import { useState, useCallback } from "react";
import { validateUsername } from "../../../shared/utils/validationUtils";
import { ErrorManager } from "../../../shared/services/errorManager";
import { generateFunName } from "../../../shared/utils/nameGenerationUtils";

/**
 * Hook to manage login form state and submission
 * @param {Function} onLogin - Callback function when login succeeds
 * @returns {Object} Form state and handlers
 */
export function useLoginForm(onLogin) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = useCallback(
    (e) => {
      setName(e.target.value);
      if (error) {
        setError("");
      }
    },
    [error],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // * Prevent duplicate submissions
      if (isLoading) {
        return;
      }

      const finalName = name.trim() || generateFunName();

      // Validate the username
      const validation = validateUsername(finalName);
      if (!validation.success) {
        setError(validation.error);
        return;
      }

      try {
        setIsLoading(true);
        setError(""); // Clear any previous errors
        await onLogin(validation.value);
      } catch (err) {
        // * Use ErrorManager for consistent error handling
        const formattedError = ErrorManager.handleError(err, "User Login", {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        });

        // * Set user-friendly error message
        setError(
          formattedError.userMessage ||
            err.message ||
            "Unable to log in. Please check your connection and try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [name, isLoading, onLogin],
  );

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    name,
    setName,
    isLoading,
    error,
    handleNameChange,
    handleSubmit,
    clearError,
  };
}
