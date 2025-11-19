/**
 * @module useProfileNotifications
 * @description Custom hook for profile notification functions.
 */

import { useCallback } from "react";

/**
 * * Hook for profile notification functions
 * @returns {Object} Notification functions
 */
export function useProfileNotifications() {
  const showSuccess = useCallback((message) => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅", message);
    }
  }, []);

  const showError = useCallback((message) => {
    if (process.env.NODE_ENV === "development") {
      console.error("❌", message);
    }
  }, []);

  const showToast = useCallback((message, type = "info") => {
    if (process.env.NODE_ENV === "development") {
      console.log(`📢 [${type}]`, message);
    }
  }, []);

  return { showSuccess, showError, showToast };
}
