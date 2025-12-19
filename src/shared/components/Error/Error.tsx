/**
 * @module Error
 * @description Unified error component that consolidates ErrorBoundary, ErrorDisplay, and InlineError
 * Supports multiple error display variants: boundary (full-page), list (multiple errors), and inline (single error)
 */

import React, { useState } from "react";
import {
  ERROR_SEVERITY,
  getSeverityClass,
  ErrorManager,
} from "../../services/errorManager/index";

interface AppError {
  message?: string;
  severity?: string;
  isRetryable?: boolean;
  timestamp?: number | string;
  details?: string;
  suggestion?: string;
  errorType?: string;
  attempts?: number;
  originalError?: unknown;
  stack?: string;
  context?: string;
}
import styles from "./Error.module.css";
import ErrorBoundaryFallback, {
  ErrorBoundaryFallbackProps,
} from "./ErrorBoundaryFallback";

interface ErrorProps {
  variant?: "boundary" | "list" | "inline" | "toast";
  error: AppError | string | unknown;
  onRetry?: (...args: unknown[]) => void;
  onDismiss?: (...args: unknown[]) => void;
  onClearAll?: () => void;
  context?: string;
  position?: "above" | "below" | "inline";
  showDetails?: boolean;
  showRetry?: boolean;
  showDismiss?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Unified Error Component
 * @param {ErrorProps} props - Component props
 * @returns {JSX.Element|null} The error component or null
 */
const ErrorComponent: React.FC<ErrorProps> = ({
  variant = "inline",
  error,
  onRetry,
  onDismiss,
  onClearAll,
  context = "general",
  position = "below",
  showDetails = false,
  showRetry = true,
  showDismiss = true,
  size = "medium",
  className = "",
  children,
}) => {
  // Boundary variant (React error boundary)
  if (variant === "boundary") {
    return (
      <ErrorBoundary
        FallbackComponent={(fallbackProps: ErrorBoundaryFallbackProps) => (
          <ErrorBoundaryFallback
            {...fallbackProps}
            onRetry={onRetry as () => void}
          />
        )}
        onReset={onRetry as () => void}
      >
        {children}
      </ErrorBoundary>
    );
  }

  // List variant (multiple errors from store)
  if (variant === "list") {
    // * Ensure errors is always an array for list variant
    const errorsArray = Array.isArray(error) ? error : [error];
    return (
      <ErrorList
        errors={errorsArray}
        onRetry={onRetry as (error: unknown, index: number) => void}
        onDismiss={onDismiss as (index: number) => void}
        onClearAll={onClearAll as () => void}
        showDetails={showDetails}
        className={className}
      />
    );
  }

  // Inline variant (single error)
  return (
    <ErrorInline
      error={error}
      context={context}
      position={position}
      onRetry={onRetry as () => void}
      onDismiss={onDismiss as () => void}
      showRetry={showRetry}
      showDismiss={showDismiss}
      size={size}
      className={className}
    />
  );
};

interface ErrorListProps {
  errors?: (AppError | string | unknown)[];
  onRetry?: (error: AppError | string | unknown, index: number) => void;
  onDismiss?: (index: number) => void;
  onClearAll?: () => void;
  showDetails?: boolean;
  className?: string;
}

/**
 * Error List Component (multiple errors)
 */
const ErrorList: React.FC<ErrorListProps> = ({
  errors = [],
  onRetry,
  onDismiss,
  onClearAll,
  showDetails,
  className,
}) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  if (!errors || errors.length === 0) {
    return null;
  }

  const toggleErrorExpansion = (errorId: string) => {
    setExpandedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return "🚨";
      case ERROR_SEVERITY.HIGH:
        return "⚠️";
      case ERROR_SEVERITY.MEDIUM:
        return "⚠️";
      case ERROR_SEVERITY.LOW:
        return "ℹ️";
      default:
        return "❓";
    }
  };

  const formatTimestamp = (timestamp: number | string | unknown) => {
    if (!timestamp) {
      return "";
    }
    try {
      const date = new Date(timestamp as number | string);
      // * Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleTimeString();
    } catch {
      return "";
    }
  };

  return (
    <div className={`${styles.list} ${className}`}>
      {/* Header with clear all button */}
      {errors.length > 1 && onClearAll && (
        <div className={styles.listHeader}>
          <span className={styles.listCount}>
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClearAll}
            className={styles.listClearAllButton}
            aria-label="Clear all errors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Error list */}
      <div className={styles.listItems}>
        {errors.map((errorItem, index) => {
          const error = errorItem as AppError;
          return (
            <div
              key={`${error.timestamp}-${index}`}
              className={`${styles.listItem} ${getSeverityClass((error.severity || ERROR_SEVERITY.MEDIUM) as string, styles)}`}
            >
              {/* Error header */}
              <div className={styles.listItemHeader}>
                <div className={styles.listItemInfo}>
                  <span className={styles.listSeverityIcon}>
                    {getSeverityIcon(error.severity || ERROR_SEVERITY.MEDIUM)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className={styles.listMessage}>{error.message}</div>
                    {error.details && (
                      <div className={styles.listDescription}>
                        {error.details}
                      </div>
                    )}
                    {error.suggestion && (
                      <div className={styles.listSuggestion}>
                        💡 <strong>Suggestion:</strong> {error.suggestion}
                      </div>
                    )}
                  </div>
                  <span className={styles.listTime}>
                    {formatTimestamp(error.timestamp)}
                  </span>
                </div>

                <div className={styles.listItemActions}>
                  {error.isRetryable && onRetry && (
                    <button
                      onClick={() => onRetry(error, index)}
                      className={styles.listRetryButton}
                      aria-label="Retry operation"
                    >
                      ↻ Retry
                    </button>
                  )}

                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(index)}
                      className={styles.listDismissButton}
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  )}

                  {showDetails && (
                    <button
                      onClick={() =>
                        toggleErrorExpansion(`${error.timestamp}-${index}`)
                      }
                      className={styles.listDetailsButton}
                      aria-label="Toggle error details"
                    >
                      {expandedErrors.has(`${error.timestamp}-${index}`)
                        ? "Hide Details"
                        : "Show Details"}
                    </button>
                  )}
                </div>
              </div>

              {/* Error details */}
              {showDetails &&
                expandedErrors.has(`${error.timestamp}-${index}`) && (
                  <div className={styles.listDetails}>
                    {error.errorType && (
                      <div className={styles.listDetailRow}>
                        <strong>Error Type:</strong>{" "}
                        <code>{error.errorType}</code>
                      </div>
                    )}
                    {error.severity && (
                      <div className={styles.listDetailRow}>
                        <strong>Severity Level:</strong>{" "}
                        <code>{error.severity}</code>
                      </div>
                    )}
                    {error.context && (
                      <div className={styles.listDetailRow}>
                        <strong>Context:</strong> {error.context}
                      </div>
                    )}
                    {error.attempts && (
                      <div className={styles.listDetailRow}>
                        <strong>Retry Attempts:</strong> {error.attempts}
                      </div>
                    )}
                    {!!error.originalError && (
                      <div className={styles.listDetailRow}>
                        <strong>Technical Details:</strong>
                        <pre className={styles.listErrorStack}>
                          {typeof error.originalError === "object"
                            ? JSON.stringify(error.originalError, null, 2)
                            : String(error.originalError)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ErrorInlineProps {
  error: AppError | string | unknown;
  context?: string;
  position?: "above" | "below" | "inline";
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

/**
 * Inline Error Component (single error)
 */
const ErrorInline: React.FC<ErrorInlineProps> = ({
  error,
  context = "general",
  position = "below",
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = true,
  size = "medium",
  className = "",
}) => {
  if (!error) {
    return null;
  }

  const errorMessage =
    typeof error === "string"
      ? error
      : (error as AppError).message || "An error occurred";
  const isRetryable = (error as AppError)?.isRetryable !== false && onRetry;
  const severity = (error as AppError)?.severity || ERROR_SEVERITY.MEDIUM;

  const getContextClass = () => {
    switch (context) {
      case "vote":
        return styles.inlineVote;
      case "form":
        return styles.inlineForm;
      case "submit":
        return styles.inlineSubmit;
      case "validation":
        return styles.inlineValidation;
      default:
        return styles.inlineGeneral;
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return styles.inlineSmall;
      case "large":
        return styles.inlineLarge;
      default:
        return styles.inlineMedium;
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case "above":
        return styles.inlineAbove;
      case "inline":
        return styles.inlineInline;
      default:
        return styles.inlineBelow;
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return "🚨";
      case ERROR_SEVERITY.HIGH:
        return "⚠️";
      case ERROR_SEVERITY.MEDIUM:
        return "⚠️";
      case ERROR_SEVERITY.LOW:
        return "ℹ️";
      default:
        return "❓";
    }
  };

  return (
    <div
      className={`
        ${styles.inline}
        ${getContextClass()}
        ${getSeverityClass(severity, styles)}
        ${getSizeClass()}
        ${getPositionClass()}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.inlineContent}>
        <span className={styles.inlineIcon}>{getSeverityIcon()}</span>

        <span className={styles.inlineMessage}>{errorMessage}</span>

        <div className={styles.inlineActions}>
          {isRetryable && showRetry && (
            <button
              onClick={onRetry}
              className={styles.inlineRetryButton}
              aria-label="Retry operation"
              type="button"
            >
              <span className={styles.inlineRetryIcon}>↻</span>
              Retry
            </button>
          )}

          {onDismiss && showDismiss && (
            <button
              onClick={onDismiss}
              className={styles.inlineDismissButton}
              aria-label="Dismiss error"
              type="button"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Development error details */}
      {process.env.NODE_ENV === "development" && (error as AppError)?.stack && (
        <details className={styles.inlineDevDetails}>
          <summary>Error Details (Development)</summary>
          <pre className={styles.inlineDevStack}>
            {(error as AppError).stack}
          </pre>
        </details>
      )}
    </div>
  );
};

ErrorComponent.displayName = "Error";

interface ErrorBoundaryProps {
  FallbackComponent: React.ComponentType<ErrorBoundaryFallbackProps> | React.ReactElement;
  children?: React.ReactNode;
  onError?: (error: unknown, errorInfo: { componentStack: string }) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  error: unknown;
}

/**
 * Minimal React error boundary implementation that mirrors the key ergonomics
 * of the previously used `react-error-boundary` helper. It supports
 * reset-driven recovery, an optional `onReset` callback, and an
 * optionally-supplied `resetKeys` array to automatically clear captured
 * errors when external state changes.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static defaultProps = {
    children: null,
    onError: undefined,
    onReset: undefined,
    resetKeys: undefined,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = { error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown, errorInfo: { componentStack: string }) {
    const { onError } = this.props;

    // * Use ErrorManager for consistent error handling
    const context = errorInfo?.componentStack
      ? `React Component Error in ${errorInfo.componentStack.split("\n")[1]?.trim() || "Unknown Component"}`
      : "React Component Error";

    ErrorManager.handleError(error, context, {
      isRetryable: true,
      affectsUserData: false,
      isCritical: false,
      componentStack: errorInfo?.componentStack,
      errorBoundary: true,
    });

    if (onError) {
      onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { error } = this.state;

    if (!error) {
      return;
    }

    if (Array.isArray(resetKeys) && Array.isArray(prevProps.resetKeys)) {
      const hasChanges =
        resetKeys.length !== prevProps.resetKeys.length ||
        resetKeys.some(
          (key: unknown, index: number) =>
            !Object.is(key, (prevProps.resetKeys as unknown[])[index]),
        );

      if (hasChanges) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary() {
    const { onReset } = this.props;

    this.setState({ error: null });

    if (typeof onReset === "function") {
      onReset();
    }
  }

  renderFallback(error: unknown) {
    const { FallbackComponent } = this.props;

    if (typeof FallbackComponent === "function") {
      return (
        <FallbackComponent
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    if (React.isValidElement(FallbackComponent)) {
      const fallbackElement = FallbackComponent as React.ReactElement<ErrorBoundaryFallbackProps>;
      return React.cloneElement(fallbackElement, {
        error: error as Error,
        resetErrorBoundary: this.resetErrorBoundary,
      } as Partial<ErrorBoundaryFallbackProps>);
    }

    return null;
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (error) {
      return this.renderFallback(error);
    }

    return children;
  }
}

export default ErrorComponent;
