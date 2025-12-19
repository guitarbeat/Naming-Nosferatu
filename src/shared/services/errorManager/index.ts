/**
 * @module ErrorManager
 * @description Comprehensive error handling service for the application.
 * Consolidates error handling, logging, retry logic, and circuit breaker patterns.
 */

import {
  parseError,
  ParsedError,
  FormattedError,
  getGlobalScope,
  ERROR_SEVERITY,
} from "./errorUtils";
import { logError, formatError } from "./errorTracking";
import { withRetry, createResilientFunction, CircuitBreaker } from "./retry";

export { ERROR_SEVERITY } from "./errorUtils";

/**
 * * Comprehensive error management class
 */
export class ErrorManager {
  /**
   * * Handles errors with consistent formatting and logging
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

  static parseError(error: unknown): ParsedError {
    return parseError(error);
  }

  static determineErrorType(error: unknown): string {
    return parseError(error).type;
  }

  static formatError(
    errorInfo: ParsedError,
    context: string,
    metadata: Record<string, unknown>,
  ): FormattedError {
    return formatError(errorInfo, context, metadata);
  }

  static logError(
    formattedError: FormattedError,
    context: string,
    metadata: Record<string, unknown>,
  ): void {
    return logError(formattedError, context, metadata);
  }

  static withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
    operation: T,
    options: Record<string, unknown> = {},
  ): T {
    return withRetry(operation, options) as T;
  }

  static get CircuitBreaker(): typeof CircuitBreaker {
    return CircuitBreaker;
  }

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
      return () => { };
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      this.handleError(event.reason, "Unhandled Promise Rejection", {
        isRetryable: false,
        affectsUserData: false,
        isCritical: true,
      });
    };
    GLOBAL_SCOPE.addEventListener("unhandledrejection", rejectionHandler);

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
      GLOBAL_SCOPE.removeEventListener?.("unhandledrejection", rejectionHandler);
      GLOBAL_SCOPE.removeEventListener?.("error", errorHandler);
    };
  }

  /**
   * * Get CSS class name for error severity
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
      stack: (error as Error)?.stack || null,
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
