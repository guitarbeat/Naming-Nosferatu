/**
 * @module TournamentSetup/hooks/useToast
 * @description Custom hook for toast notifications
 */
import { useState, useCallback } from 'react';

/**
 * Custom hook for managing toast notifications
 * @param {Object} options - Configuration options
 * @param {number} options.maxToasts - Maximum number of toasts to show
 * @param {number} options.defaultDuration - Default toast duration in milliseconds
 * @returns {Object} Toast state and handlers
 */
export function useToast(options = {}) {
  const {
    maxToasts = 5,
    defaultDuration = 5000
  } = options;

  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
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
  }, [maxToasts, defaultDuration]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message) => {
    showToast({ message, type: 'success' });
  }, [showToast]);

  const showError = useCallback((message) => {
    showToast({ message, type: 'error' });
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
  };
}

