/**
 * @module useToast
 * @description Shared hook for toast notifications with configurable options.
 */
import { useState, useCallback } from "react";

/**
 * Custom hook for managing toast notifications
 * @param {Object} options - Configuration options
 * @param {number} options.maxToasts - Maximum number of toasts to show (default: 5)
 * @param {number} options.defaultDuration - Default toast duration in ms (default: 5000)
 * @returns {Object} Toast state and handlers
 */
export function useToast(options = {}) {
  const { maxToasts = 5, defaultDuration = 5000 } = options;

  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (toast) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = {
        id,
        ...toast,
        duration: toast.duration || defaultDuration,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      return id;
    },
    [maxToasts, defaultDuration]
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "success", ...options });
    },
    [showToast]
  );

  const showError = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "error", ...options });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "info", ...options });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return showToast({ message, type: "warning", ...options });
    },
    [showToast]
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

export default useToast;
