/**
 * @module ErrorManager
 * @description Comprehensive error handling service for the application.
 * Consolidates error handling, logging, retry logic, and circuit breaker patterns.
 */

import { parseError, ParsedError } from "./errorParser";
import {
  formatError,
  FormattedError,
  determineSeverity,
  getUserFriendlyMessage,
  isRetryable,
} from "./errorFormatter";
import { logError } from "./errorTracking";
import { withRetry, createResilientFunction, CircuitBreaker } from "./retry";
import { getGlobalScope } from "./helpers";
import { ERROR_SEVERITY } from "./constants";

export { ERROR_SEVERITY } from "./constants";

/**
 * * Comprehensive error management class
 */
export class ErrorManager {
  /**
   * * Handles errors with consistent formatting and logging
   * @param {Error|Object} error - The error object or error-like object
   * @param {string} context - Context where the error occurred
   * @param {Object} metadata - Additional metadata about the error
   * @returns {Object} Formatted error object for UI display
   */
  static handleError(
    error: unknown,
    context: string = "Unknown",
    metadata: Record<string, unknown> = {},
  ): FormattedError {
    const errorInfo = parseError(error);
    const formattedError = formatError(errorInfo, context, metadata);

    // * Log error for debugging
    logError(formattedError, context, metadata);

    return formattedError;
  }

  /**
   * * Parses different types of error objects
   * @param {Error|Object} error - The error to parse
   * @returns {Object} Parsed error information
   */
  static parseError(error: unknown): ParsedError {
    return parseError(error);
  }

  /**
   * * Determines the type of error based on error properties
   * @param {Error|Object} error - The error to analyze
   * @returns {string} Error type
   */
  static determineErrorType(error: unknown): string {
    return parseError(error).type;
  }

  /**
   * * Formats error for consistent UI display
   * @param {Object} errorInfo - Parsed error information
   * @param {string} context - Context where error occurred
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Formatted error for UI
   */
  static formatError(
    errorInfo: ParsedError,
    context: string,
    metadata: Record<string, unknown>,
  ): FormattedError {
    return formatError(errorInfo, context, metadata);
  }

  /**
   * * Determines error severity based on type and metadata
   * @param {Object} errorInfo - Parsed error information
   * @param {Object} metadata - Error metadata
   * @returns {string} Severity level
   */
  static determineSeverity(
    errorInfo: ParsedError,
    metadata: Record<string, unknown>,
  ): string {
    return determineSeverity(errorInfo, metadata);
  }

  /**
   * * Generates user-friendly error messages
   * @param {Object} errorInfo - Parsed error information
   * @param {string} context - Error context
   * @returns {string} User-friendly message
   */
  static getUserFriendlyMessage(
    errorInfo: ParsedError,
    context: string,
  ): string {
    return getUserFriendlyMessage(errorInfo, context);
  }

  /**
   * * Determines if an error is retryable
   * @param {Object} errorInfo - Parsed error information
   * @param {Object} metadata - Error metadata
   * @returns {boolean} Whether error is retryable
   */
  static isRetryable(
    errorInfo: ParsedError,
    metadata: Record<string, unknown>,
  ): boolean {
    return isRetryable(errorInfo, metadata);
  }

  /**
   * * Logs error information for debugging
   * @param {Object} formattedError - Formatted error object
   * @param {string} context - Error context
   * @param {Object} metadata - Error metadata
   */
  static logError(
    formattedError: FormattedError,
    context: string,
    metadata: Record<string, unknown>,
  ): void {
    return logError(formattedError, context, metadata);
  }

  /**
   * * Creates a retry wrapper for async operations
   * @param {Function} operation - Async operation to retry
   * @param {Object} options - Retry options
   * @returns {Function} Wrapped function with retry logic
   */
  static withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
    operation: T,
    options: Record<string, unknown> = {},
  ): T {
    return withRetry(operation, options) as T;
  }

  /**
   * * Circuit breaker implementation
   */
  static get CircuitBreaker(): typeof CircuitBreaker {
    return CircuitBreaker;
  }

  /**
   * * Create a retry wrapper with circuit breaker
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Options for retry and circuit breaker
   * @returns {Function} Wrapped function with retry and circuit breaker
   */
  static createResilientFunction<
    T extends (...args: unknown[]) => Promise<unknown>,
  >(fn: T, options: Record<string, unknown> = {}): T {
    return createResilientFunction(fn, options) as T;
  }

  /**
   * * Global error handler setup
   */
  static setupGlobalErrorHandling(): () => void {
    const GLOBAL_SCOPE = getGlobalScope() as Window;

    if (!GLOBAL_SCOPE.addEventListener) {
      return () => {}; // Return a no-op cleanup function if no addEventListener
    }

    // Handle unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      this.handleError(event.reason, "Unhandled Promise Rejection", {
        isRetryable: false,
        affectsUserData: false,
        isCritical: true,
      });
    };
    GLOBAL_SCOPE.addEventListener("unhandledrejection", rejectionHandler);

    // Handle unhandled errors
    const errorHandler = (event: ErrorEvent) => {
      event.preventDefault();
      this.handleError(event.error, "Unhandled Error", {
        isRetryable: false,
        affectsUserData: false,
        isCritical: true,
      });
    };
    GLOBAL_SCOPE.addEventListener("error", errorHandler);

    return () => {
      GLOBAL_SCOPE.removeEventListener?.(
        "unhandledrejection",
        rejectionHandler,
      );
      GLOBAL_SCOPE.removeEventListener?.("error", errorHandler);
    };
  }

  /**
   * * Get CSS class name for error severity
   * @param {string} severity - The error severity level
   * @param {Object} styles - The styles object containing severity classes
   * @returns {string} CSS class name for the severity
   */
  static getSeverityClass(
    severity: string,
    styles: Record<string, string>,
  ): string {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return styles.critical;
      case ERROR_SEVERITY.HIGH:
        return styles.high;
      case ERROR_SEVERITY.MEDIUM:
        return styles.medium;
      case ERROR_SEVERITY.LOW:
        return styles.low;
      default:
        return styles.unknown || styles.medium;
    }
  }

  /**
   * * Create a standardized error object
   * @param {Error|Object} error - The original error
   * @param {string} context - Where the error occurred
   * @param {Object} additionalInfo - Additional context
   * @param {number} timestamp - Timestamp for the error
   * @returns {Object} Standardized error object
   */
  static createStandardizedError(
    error: unknown,
    context: string = "Unknown",
    additionalInfo: Record<string, unknown> = {},
    timestamp: number = Date.now(),
  ): FormattedError & { originalError: unknown; retry: () => void } {
    const GLOBAL_SCOPE = getGlobalScope() as Window;
    const errorInfo = this.handleError(error, context, additionalInfo);

    return {
      ...errorInfo,
      stack: (error as Error)?.stack || null, // Added stack property
      originalError: error,
      context,
      timestamp: new Date(timestamp).toISOString(),
      retry: () => {
        if (errorInfo.isRetryable) {
          GLOBAL_SCOPE.location?.reload?.();
        }
      },
    };
  }
}

export const getSeverityClass = (
  severity: string,
  styles: Record<string, string>,
) => ErrorManager.getSeverityClass(severity, styles);
export const createStandardizedError = (
  error: unknown,
  context: string = "Unknown",
  additionalInfo: Record<string, unknown> = {},
  timestamp: number = Date.now(),
) =>
  ErrorManager.createStandardizedError(
    error,
    context,
    additionalInfo,
    timestamp,
  );
