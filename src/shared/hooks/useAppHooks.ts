/**
 * @module useAppHooks
 * @description Consolidated shared hooks for admin status and toast notifications
 */

import { useState, useEffect, useCallback } from "react";
import { isUserAdmin } from "../utils/coreUtils";

// ============================================================================
// Admin Status Hook
// ============================================================================

/**
 * Custom hook for checking if a user is an admin
 * @param {string} userName - User name to check
 * @returns {Object} { isAdmin, isLoading, error }
 */
export function useAdminStatus(userName: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      if (!userName) {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const adminStatus = await isUserAdmin(userName);
        if (isMounted) {
          setIsAdmin(adminStatus);
        }
      } catch (err) {
        if (isMounted) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error checking admin status:", err);
          }
          setIsAdmin(false);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [userName]);

  return { isAdmin, isLoading, error };
}

// ============================================================================
// Toast Hook
// ============================================================================

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
  autoDismiss: boolean;
}

interface UseToastOptions {
  maxToasts?: number;
  defaultDuration?: number;
}

/**
 * Custom hook for managing toast notifications
 * @param {Object} options - Configuration options
 * @param {number} options.maxToasts - Maximum number of toasts to show (default: 5)
 * @param {number} options.defaultDuration - Default toast duration in ms (default: 5000)
 * @returns {Object} Toast state and handlers
 */
export function useToast(options: UseToastOptions = {}) {
  const { maxToasts = 5, defaultDuration = 5000 } = options;

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (toast: Partial<ToastItem>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastItem = {
        id,
        message: toast.message || "",
        type: toast.type || "info",
        duration: toast.duration || defaultDuration,
        autoDismiss: toast.autoDismiss !== undefined ? toast.autoDismiss : true,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      return id;
    },
    [maxToasts, defaultDuration],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "success", ...options });
    },
    [showToast],
  );

  const showError = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "error", ...options });
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "info", ...options });
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "warning", ...options });
    },
    [showToast],
  );

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}

