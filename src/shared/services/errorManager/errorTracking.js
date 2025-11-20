/**
 * @module errorManager/errorTracking
 * @description Error tracking and logging utilities.
 */

import { getGlobalScope } from "./helpers";
import { ERROR_SEVERITY } from "./constants";

/**
 * * Safely converts a value to a string, handling objects, circular references, and primitives
 * @param {*} value - Value to convert to string
 * @returns {string} String representation of the value
 */
function safeStringify(value) {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    try {
      // Try JSON.stringify first (handles most cases)
      return JSON.stringify(value, null, 2);
    } catch (_err) {
      // Handle circular references or other JSON errors
      try {
        // Try to get a basic representation
        if (value.constructor && value.constructor.name) {
          return `[${value.constructor.name}]`;
        }
        return "[Object]";
      } catch {
        return "[Unable to stringify object]";
      }
    }
  }

  // Fallback for other types (symbols, functions, etc.)
  try {
    return String(value);
  } catch {
    return "[Unable to convert to string]";
  }
}

/**
 * * Logs error information for debugging
 * @param {Object} formattedError - Formatted error object
 * @param {string} context - Error context
 * @param {Object} metadata - Error metadata
 */
export function logError(formattedError, context, metadata) {
  const logData = {
    error: formattedError,
    context,
    metadata,
    timestamp: new Date().toISOString(),
  };

  // * Enhanced structured logging for development
  if (process.env.NODE_ENV === "development") {
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    try {
      const errorType = safeStringify(formattedError?.type || "Unknown");
      console.group(`🔴 Error [${errorType}]${isMobile ? " (Mobile)" : ""}`);
      console.error("Context:", safeStringify(context));
      console.error(
        "Message:",
        safeStringify(
          formattedError?.userMessage ||
            formattedError?.message ||
            "No message",
        ),
      );
      console.error(
        "Severity:",
        safeStringify(formattedError?.severity || "Unknown"),
      );
      console.error(
        "Retryable:",
        safeStringify(formattedError?.isRetryable ?? false),
      );
      if (formattedError?.metadata?.stack) {
        console.error("Stack:", safeStringify(formattedError.metadata.stack));
      }
      if (logData.diagnostics?.debugHints?.length) {
        console.group("Debug Hints");
        logData.diagnostics.debugHints.forEach((hint, i) => {
          console.log(
            `${i + 1}. ${safeStringify(hint?.title || "Untitled")}:`,
            safeStringify(hint?.detail || ""),
          );
        });
        console.groupEnd();
      }
      console.groupEnd();
    } catch (err) {
      // * Fallback if even the logging fails
      console.error("Failed to log error:", err);
      console.error("Original error data:", {
        hasFormattedError: !!formattedError,
        hasContext: !!context,
        contextType: typeof context,
      });
    }
  }

  // * Send to error tracking service in production
  if (process.env.NODE_ENV === "production") {
    sendToErrorService(logData);
  }
}

/**
 * * Sends error data to external error tracking service
 * @param {Object} logData - Error log data to send
 */
function sendToErrorService(logData) {
  const GLOBAL_SCOPE = getGlobalScope();

  try {
    const { navigator = {}, location = {} } = GLOBAL_SCOPE;

    const errorData = {
      message: logData?.error?.message || "Unknown error",
      level: logData?.error?.severity || ERROR_SEVERITY.MEDIUM,
      timestamp: logData?.timestamp || new Date().toISOString(),
      context: logData?.context || "Unknown",
      metadata: logData?.metadata || {},
      userAgent: navigator?.userAgent || "Unknown",
      url: location?.href || "Unknown",
      userId: getUserId(),
      sessionId: getSessionId(),
      buildVersion: process.env.REACT_APP_VERSION || "1.0.0",
    };

    // Send to multiple error tracking services
    sendToSentry(errorData);
    sendToCustomEndpoint(errorData);
    sendToConsole(errorData);
  } catch (err) {
    // Don't let error tracking itself cause more errors
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to send error to tracking service:", err);
    }
  }
}

/**
 * * Sends error to Sentry if available
 * @param {Object} errorData - Error data to send
 */
function sendToSentry(errorData) {
  const GLOBAL_SCOPE = getGlobalScope();

  try {
    const sentry = GLOBAL_SCOPE.Sentry;
    if (sentry && typeof sentry.captureException === "function") {
      const error = new Error(errorData.message);
      error.name = errorData.context || "ApplicationError";

      sentry.captureException(error, {
        tags: {
          context: errorData.context,
          level: errorData.level,
          userId: errorData.userId,
        },
        extra: {
          ...errorData.metadata,
          url: errorData.url,
          userAgent: errorData.userAgent,
          sessionId: errorData.sessionId,
          buildVersion: errorData.buildVersion,
        },
        level: mapSeverityToSentryLevel(errorData.level),
      });
    }
  } catch (err) {
    console.warn("Failed to send to Sentry:", err);
  }
}

/**
 * * Sends error to custom endpoint
 * @param {Object} errorData - Error data to send
 */
function sendToCustomEndpoint(errorData) {
  const GLOBAL_SCOPE = getGlobalScope();

  try {
    const errorEndpoint = process.env.REACT_APP_ERROR_ENDPOINT;
    if (errorEndpoint) {
      const fetchFn =
        GLOBAL_SCOPE.fetch || (typeof fetch === "function" ? fetch : null);
      fetchFn?.(errorEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Error-Source": "name-nosferatu",
        },
        body: (() => {
          try {
            return JSON.stringify(errorData);
          } catch (err) {
            // Handle circular references or other JSON.stringify errors
            if (process.env.NODE_ENV === "development") {
              console.warn("Failed to stringify error data:", err);
            }
            return JSON.stringify({
              message: "Error data could not be serialized",
              error: String(errorData?.message || errorData || "Unknown error"),
            });
          }
        })(),
      }).catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to send error to custom endpoint:", err);
        }
      });
    }
  } catch (err) {
    console.warn("Failed to send to custom endpoint:", err);
  }
}

/**
 * * Sends error to console for development
 * @param {Object} errorData - Error data to send
 */
function sendToConsole(errorData) {
  if (process.env.NODE_ENV === "development") {
    const GLOBAL_SCOPE = getGlobalScope();

    console.groupCollapsed("🚨 Error Tracking Service");
    console.log("Error Data:", errorData);
    console.log("Sentry Available:", !!GLOBAL_SCOPE.Sentry);
    console.log(
      "Custom Endpoint:",
      process.env.REACT_APP_ERROR_ENDPOINT || "Not configured",
    );
    console.groupEnd();
  }
}

/**
 * * Gets the current session ID for error tracking context
 * @returns {string} Session ID
 */
function getSessionId() {
  const GLOBAL_SCOPE = getGlobalScope();

  try {
    const storage = GLOBAL_SCOPE.sessionStorage;
    let sessionId = storage?.getItem("errorSessionId");
    if (!sessionId) {
      sessionId = GLOBAL_SCOPE.crypto?.randomUUID
        ? `session_${GLOBAL_SCOPE.crypto.randomUUID()}`
        : `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      storage?.setItem("errorSessionId", sessionId);
    }
    return sessionId;
  } catch {
    if (GLOBAL_SCOPE.crypto?.randomUUID) {
      return `session_${GLOBAL_SCOPE.crypto.randomUUID()}`;
    }
    return `session_${Date.now()}`;
  }
}

/**
 * * Gets the current user ID for error tracking context
 * @returns {string|null} User ID or null if not available
 */
function getUserId() {
  const GLOBAL_SCOPE = getGlobalScope();

  try {
    return GLOBAL_SCOPE.localStorage?.getItem("catNamesUser") ?? null;
  } catch {
    return null;
  }
}

/**
 * * Maps internal severity levels to Sentry levels
 * @param {string} severity - Internal severity level
 * @returns {string} Sentry-compatible level
 */
function mapSeverityToSentryLevel(severity) {
  const mapping = {
    [ERROR_SEVERITY.LOW]: "info",
    [ERROR_SEVERITY.MEDIUM]: "warning",
    [ERROR_SEVERITY.HIGH]: "error",
    [ERROR_SEVERITY.CRITICAL]: "fatal",
  };
  return mapping[severity] || "error";
}
