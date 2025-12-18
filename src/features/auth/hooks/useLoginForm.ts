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
export function useLoginForm(onLogin: (name: string) => Promise<void> | void) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (error) {
        setError("");
      }
    },
    [error],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();

      // * Prevent duplicate submissions
      if (isLoading) {
        return;
      }

      const finalName = name.trim() || generateFunName();

      // Validate the username
      const validation = validateUsername(finalName);
      if (!validation.success) {
        setError(validation.error || "Invalid username");
        return;
      }

      try {
        setIsLoading(true);
        setError(""); // Clear any previous errors
        await onLogin(validation.value || finalName);
      } catch (err) {
        // * Use ErrorManager for consistent error handling
        const formattedError = ErrorManager.handleError(err, "User Login", {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        });

        const error = err as Error;
        // * Set user-friendly error message
        setError(
          formattedError.userMessage ||
            error.message ||
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
