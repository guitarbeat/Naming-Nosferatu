/**
 * @module errorManager/diagnostics
 * @description Error diagnostics and environment collection utilities.
 */

import { ERROR_TYPES } from "./constants";
import { createHash, getGlobalScope } from "./helpers";

/**
 * * Builds comprehensive diagnostics for an error
 * @param {Object} errorInfo - Parsed error information
 * @param {string} context - Error context
 * @param {Object} metadata - Error metadata
 * @returns {Object} Diagnostics object
 */
export function buildDiagnostics(errorInfo, context, metadata) {
  const environment = collectEnvironmentSnapshot();
  const stackFrames = extractStackFrames(errorInfo.stack);
  const debugHints = deriveDebugHints(
    errorInfo,
    context,
    metadata,
    environment,
  );
  const fingerprint = generateFingerprint(
    errorInfo,
    context,
    metadata,
    environment,
  );

  return {
    fingerprint,
    stackFrames,
    environment,
    debugHints,
    relatedIdentifiers: collectRelatedIdentifiers(metadata),
  };
}

/**
 * * Extracts stack frames from error stack trace
 * @param {string} stack - Error stack trace
 * @returns {Array} Array of parsed stack frames
 */
export function extractStackFrames(stack) {
  if (!stack || typeof stack !== "string") {
    return [];
  }

  return stack
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .map((frame) => {
      const stackRegex =
        /at (?:(?<functionName>[^\s]+)\s+)?\(?(?<file>[^:]+):(?<line>\d+):(?<column>\d+)\)?/;
      const match = frame.match(stackRegex);
      if (!match || !match.groups) {
        return { raw: frame };
      }

      return {
        functionName: match.groups.functionName || "anonymous",
        file: match.groups.file,
        line: Number.parseInt(match.groups.line, 10),
        column: Number.parseInt(match.groups.column, 10),
      };
    });
}

/**
 * * Collects environment snapshot for error diagnostics
 * @returns {Object} Environment information
 */
export function collectEnvironmentSnapshot() {
  const GLOBAL_SCOPE = getGlobalScope();

  try {
    const { navigator = {}, location = {}, performance = {} } = GLOBAL_SCOPE;
    const memory = navigator.deviceMemory ?? navigator.hardwareConcurrency;
    const timing = performance?.timing || {};
    const timezone = (() => {
      try {
        if (
          typeof Intl !== "undefined" &&
          typeof Intl.DateTimeFormat === "function"
        ) {
          return new Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
      } catch (_) {
        return undefined;
      }
      return undefined;
    })();

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      platform: navigator.platform,
      deviceMemory: memory,
      timezone,
      viewport: {
        width: GLOBAL_SCOPE.innerWidth,
        height: GLOBAL_SCOPE.innerHeight,
      },
      location: location.href,
      performance: {
        navigationStart: timing.navigationStart,
        domComplete: timing.domComplete,
        firstPaint:
          performance?.getEntriesByName?.("first-paint")?.[0]?.startTime,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to collect environment snapshot:", error);
    }
    return {};
  }
}

/**
 * * Derives debug hints based on error type and context
 * @param {Object} errorInfo - Parsed error information
 * @param {string} context - Error context
 * @param {Object} metadata - Error metadata
 * @param {Object} environment - Environment snapshot
 * @returns {Array} Array of debug hints
 */
export function deriveDebugHints(errorInfo, context, metadata, environment) {
  const hints = [];

  if (errorInfo.cause) {
    let causeDetail;
    if (typeof errorInfo.cause === "string") {
      causeDetail = errorInfo.cause;
    } else {
      try {
        causeDetail = JSON.stringify(errorInfo.cause);
      } catch (err) {
        causeDetail = `Cause available but could not be stringified (${err.message})`;
      }
    }

    hints.push({
      title: "Root cause provided",
      detail: causeDetail,
    });
  }

  if (metadata?.request) {
    hints.push({
      title: "Network request context",
      detail: `Request to ${metadata.request?.url || "unknown URL"} failed with status ${metadata.request?.status ?? "unknown"}`,
    });
  }

  switch (errorInfo.type) {
    case ERROR_TYPES.NETWORK:
      hints.push({
        title: "Connectivity check",
        detail:
          environment.online === false
            ? "Navigator reports the client is offline."
            : "Verify the network request payload and server availability.",
      });
      break;
    case ERROR_TYPES.AUTH:
      hints.push({
        title: "Authentication hint",
        detail: "Confirm that the session token is valid and has not expired.",
      });
      break;
    case ERROR_TYPES.DATABASE:
      hints.push({
        title: "Database hint",
        detail:
          "Check Supabase policies or stored procedures relevant to this operation.",
      });
      break;
    case ERROR_TYPES.VALIDATION:
      hints.push({
        title: "Validation hint",
        detail: "Compare the provided payload against the schema definition.",
      });
      break;
    case ERROR_TYPES.RUNTIME:
      hints.push({
        title: "Runtime hint",
        detail:
          "Inspect recent code changes for undefined variables or null references.",
      });
      break;
    default:
      break;
  }

  if (errorInfo.stack && metadata?.componentStack) {
    hints.push({
      title: "React component stack",
      detail: metadata.componentStack,
    });
  }

  return hints;
}

/**
 * * Generates error fingerprint for grouping similar errors
 * @param {Object} errorInfo - Parsed error information
 * @param {string} context - Error context
 * @param {Object} metadata - Error metadata
 * @param {Object} environment - Environment snapshot
 * @returns {string} Error fingerprint
 */
export function generateFingerprint(errorInfo, context, metadata, environment) {
  const source = {
    type: errorInfo.type,
    name: errorInfo.name,
    message: errorInfo.message,
    context,
    metadata,
    location: environment.location,
  };

  return createHash(source);
}

/**
 * * Collects related identifiers from metadata
 * @param {Object} metadata - Error metadata
 * @returns {Array} Array of related identifiers
 */
export function collectRelatedIdentifiers(metadata) {
  const identifiers = new Set();

  if (metadata?.userId) {
    identifiers.add(metadata.userId);
  }

  if (metadata?.sessionId) {
    identifiers.add(metadata.sessionId);
  }

  if (metadata?.request?.id) {
    identifiers.add(metadata.request.id);
  }

  return Array.from(identifiers);
}
