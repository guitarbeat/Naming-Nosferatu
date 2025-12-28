/**
 * @module Toast
 * @description Unified toast notification system that consolidates individual toasts and container management.
 * Supports both individual toast rendering and container management with multiple toasts.
 */

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import LiquidGlass from "../LiquidGlass/LiquidGlass";
import styles from "./Toast.module.css";

/**
 * Individual Toast Component
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display
 * @param {string} props.type - Type of toast ('success', 'error', 'info', 'warning')
 * @param {number} props.duration - Duration in milliseconds before auto-dismiss
 * @param {Function} props.onDismiss - Function to call when toast is dismissed
 * @param {boolean} props.autoDismiss - Whether to auto-dismiss the toast
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element|null} The toast component or null if not visible
 */
const ToastItem = ({
  message,
  type = "info",
  duration = 5000,
  onDismiss,
  autoDismiss = true,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const toastGlassId = useId();

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Match CSS transition duration
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismiss && duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, duration, handleDismiss]);

  if (!isVisible) return null;

  const getTypeIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case "success":
        return styles.success;
      case "error":
        return styles.error;
      case "warning":
        return styles.warning;
      case "info":
      default:
        return styles.info;
    }
  };

  return (
    <LiquidGlass
      id={`toast-glass-${toastGlassId.replace(/:/g, "-")}`}
      width={280}
      height={60}
      radius={10}
      scale={-100}
      saturation={1.0}
      frost={0.02}
      inputBlur={6}
      outputBlur={0.4}
      className={styles.toastGlass}
      style={{
        width: "auto",
        height: "auto",
        minWidth: "240px",
        maxWidth: "320px",
      }}
    >
      <div
        className={`
          ${styles.item}
          ${getTypeClass()}
          ${isExiting ? styles.exiting : ""}
          ${className}
        `}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={styles.content}>
          <span className={styles.icon}>{getTypeIcon()}</span>
          <span className={styles.message}>{message}</span>
          <button
            onClick={handleDismiss}
            className={styles.dismissButton}
            aria-label="Dismiss notification"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {autoDismiss && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                animationDuration: `${duration}ms`,
                animationPlayState: isExiting ? "paused" : "running",
              }}
            />
          </div>
        )}
      </div>
    </LiquidGlass>
  );
};

/**
 * Toast Container Component
 * @param {Object} props - Component props
 * @param {Array} props.toasts - Array of toast objects
 * @param {Function} props.removeToast - Function to remove a toast by id
 * @param {string} props.position - Position of the toast container
 * @param {number} props.maxToasts - Maximum number of toasts to show
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element|null} The toast container component or null if no toasts
 */
interface IToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
  autoDismiss: boolean;
}

const ToastContainer = ({
  toasts = [] as IToastItem[],
  removeToast,
  position = "top-right",
  maxToasts = 5,
  className = "",
}: {
  toasts?: IToastItem[];
  removeToast?: (id: string) => void;
  position?: string;
  maxToasts?: number;
  className?: string;
}) => {
  const containerRef = useRef(null);

  // Limit the number of visible toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  const getPositionClass = () => {
    switch (position) {
      case "top-left":
        return styles.topLeft;
      case "top-center":
        return styles.topCenter;
      case "top-right":
        return styles.topRight;
      case "bottom-left":
        return styles.bottomLeft;
      case "bottom-center":
        return styles.bottomCenter;
      case "bottom-right":
        return styles.bottomRight;
      default:
        return styles.topRight;
    }
  };

  const handleToastDismiss = useCallback(
    (toastId) => {
      removeToast?.(toastId);
    },
    [removeToast],
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${getPositionClass()} ${className}`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {visibleToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          autoDismiss={toast.autoDismiss}
          onDismiss={() => handleToastDismiss(toast.id)}
          className={styles.toastItem}
        />
      ))}

      {/* Show count of hidden toasts */}
      {toasts.length > maxToasts && (
        <div className={styles.hiddenCount}>
          +{toasts.length - maxToasts} more
        </div>
      )}
    </div>
  );
};

/**
 * Unified Toast Component
 * @param {Object} props - Component props
 * @param {string} props.variant - 'item' for single toast, 'container' for multiple toasts
 * @param {Array|Object} props.toasts - Toast data (array for container, object for item)
 * @param {Function} props.onDismiss - Dismiss callback
 * @param {Function} props.removeToast - Remove toast callback (for container)
 * @param {string} props.position - Container position
 * @param {number} props.maxToasts - Max toasts to show
 * @param {string} props.message - Message (for item variant)
 * @param {string} props.type - Type (for item variant)
 * @param {number} props.duration - Duration (for item variant)
 * @param {boolean} props.autoDismiss - Auto-dismiss (for item variant)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element|null} The appropriate toast component
 */
const Toast = ({
  variant = "item",
  toasts,
  onDismiss,
  removeToast,
  position = "top-right",
  maxToasts = 5,
  message,
  type = "info",
  duration = 5000,
  autoDismiss = true,
  className = "",
}) => {
  if (variant === "container") {
    return (
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position={position}
        maxToasts={maxToasts}
        className={className}
      />
    );
  }

  // Default to item variant
  return (
    <ToastItem
      message={message}
      type={type}
      duration={duration}
      onDismiss={onDismiss}
      autoDismiss={autoDismiss}
      className={className}
    />
  );
};

// PropTypes
Toast.propTypes = {
  variant: PropTypes.oneOf(["item", "container"]),
  toasts: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.shape({
      id: PropTypes.string,
      message: PropTypes.string,
      type: PropTypes.oneOf(["success", "error", "info", "warning"]),
      duration: PropTypes.number,
      autoDismiss: PropTypes.bool,
    }),
  ]),
  onDismiss: PropTypes.func,
  removeToast: PropTypes.func,
  position: PropTypes.oneOf([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]),
  maxToasts: PropTypes.number,
  message: PropTypes.string,
  type: PropTypes.oneOf(["success", "error", "info", "warning"]),
  duration: PropTypes.number,
  autoDismiss: PropTypes.bool,
  className: PropTypes.string,
};

ToastItem.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info", "warning"]),
  duration: PropTypes.number,
  onDismiss: PropTypes.func,
  autoDismiss: PropTypes.bool,
  className: PropTypes.string,
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["success", "error", "info", "warning"]),
      duration: PropTypes.number,
      autoDismiss: PropTypes.bool,
    }),
  ),
  removeToast: PropTypes.func.isRequired,
  position: PropTypes.oneOf([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]),
  maxToasts: PropTypes.number,
  className: PropTypes.string,
};

Toast.displayName = "Toast";

export default Toast;
