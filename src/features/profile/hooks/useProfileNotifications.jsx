/**
 * @module useProfileNotifications
 * @description Custom hook for profile notification functions with visible toast notifications.
 */

import { useCallback } from "react";
import { useToast } from "../../../shared/hooks/useToast";
import Toast from "../../../shared/components/Toast/Toast";
import { devLog, devError } from "../../../shared/utils/logger";
import { NOTIFICATION } from "../../../core/constants";

/**
 * * Hook for profile notification functions with toast UI
 * @returns {Object} Notification functions and Toast component
 */
export function useProfileNotifications() {
  const {
    toasts,
    showSuccess: showSuccessToast,
    showError: showErrorToast,
    showToast: showToastMessage,
    removeToast,
  } = useToast();

  const showSuccess = useCallback(
    (message) => {
      devLog("✅", message);
      showSuccessToast(message, { duration: 5000 });
    },
    [showSuccessToast],
  );

  const showError = useCallback(
    (message) => {
      devError("❌", message);
      showErrorToast(message, { duration: NOTIFICATION.ERROR_DURATION_MS });
    },
    [showErrorToast],
  );

  const showToast = useCallback(
    (message, type = "info") => {
      devLog(`📢 [${type}]`, message);
      showToastMessage({
        message,
        type,
        duration: type === "error" ? 7000 : 5000,
      });
    },
    [showToastMessage],
  );

  const ToastContainer = useCallback(() => {
    return (
      <Toast
        variant="container"
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
        maxToasts={NOTIFICATION.MAX_TOASTS}
      />
    );
  }, [toasts, removeToast]);

  return { showSuccess, showError, showToast, ToastContainer };
}
