/**
 * @module ErrorManager/errorTracking
 * @description Error tracking, logging, diagnostics, and AI context building.
 */

import {
  ERROR_SEVERITY,
  getGlobalScope,
  createHash,
  generateErrorId,
  ERROR_TYPES,
  determineSeverity,
  getUserFriendlyMessage,
  isRetryable,
  ParsedError,
  FormattedError,
} from "./errorUtils";

// ============================================================================
// Types
// ============================================================================

export interface Diagnostics {
  fingerprint: string;
  stackFrames: Array<{
    functionName?: string;
    file?: string;
    line?: number;
    column?: number;
    raw?: string;
  }>;
  environment: {
    userAgent?: string;
    language?: string;
    online?: boolean;
    platform?: string;
    deviceMemory?: number;
    timezone?: string;
    viewport?: {
      width?: number;
      height?: number;
    };
    location?: string;
    performance?: {
      navigationStart?: number;
      domComplete?: number;
      firstPaint?: number;
    };
  };
  debugHints: Array<{
    title: string;
    detail: string;
  }>;
  relatedIdentifiers: string[];
}

// ============================================================================
// Diagnostics & AI Context
// ============================================================================

/**
 * * Extracts stack frames from error stack trace
 */
function extractStackFrames(stack?: string | null) {
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
 */
function collectEnvironmentSnapshot() {
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
 */
function deriveDebugHints(
  errorInfo: { type: string; cause?: unknown; stack?: string | null },
  context: string,
  metadata: Record<string, unknown>,
  environment: Record<string, unknown>,
) {
  const hints: Array<{ title: string; detail: string }> = [];

  if (errorInfo.cause) {
    let causeDetail;
    if (typeof errorInfo.cause === "string") {
      causeDetail = errorInfo.cause;
    } else {
      try {
        causeDetail = JSON.stringify(errorInfo.cause);
      } catch (err: any) {
        causeDetail = `Cause available but could not be stringified (${err.message})`;
      }
    }

    hints.push({
      title: "Root cause provided",
      detail: causeDetail,
    });
  }

  if (metadata?.request) {
    const request = metadata.request as any;
    hints.push({
      title: "Network request context",
      detail: `Request to ${request?.url || "unknown URL"} failed with status ${request?.status ?? "unknown"}`,
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
        detail: "Check Supabase policies or stored procedures relevant to this operation.",
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
        detail: "Inspect recent code changes for undefined variables or null references.",
      });
      break;
  }

  if (errorInfo.stack && metadata?.componentStack) {
    hints.push({
      title: "React component stack",
      detail: metadata.componentStack as string,
    });
  }

  return hints;
}

/**
 * * Builds comprehensive diagnostics for an error
 */
export function buildDiagnostics(
  errorInfo: {
    stack?: string | null;
    type: string;
    name: string;
    message: string;
    cause?: unknown;
  },
  context: string,
  metadata: Record<string, unknown>,
): Diagnostics {
  const environment = collectEnvironmentSnapshot() as any;
  const stackFrames = extractStackFrames(errorInfo.stack);
  const debugHints = deriveDebugHints(
    errorInfo,
    context,
    metadata,
    environment,
  );

  const source = {
    type: errorInfo.type,
    name: errorInfo.name,
    message: errorInfo.message,
    context,
    metadata,
    location: environment.location,
  };
  const fingerprint = createHash(source);

  const relatedIds = new Set<string>();
  if (metadata?.userId) relatedIds.add(metadata.userId as string);
  if (metadata?.sessionId) relatedIds.add(metadata.sessionId as string);
  if ((metadata?.request as any)?.id) relatedIds.add((metadata.request as any).id);

  return {
    fingerprint,
    stackFrames,
    environment,
    debugHints,
    relatedIdentifiers: Array.from(relatedIds),
  };
}

/**
 * * Builds AI-friendly context string
 */
export function buildAIContext({ formattedError, diagnostics }: { formattedError: FormattedError, diagnostics: Diagnostics }) {
  const baseInfo = [
    `Error ID: ${formattedError.id || "unknown"}`,
    `Type: ${formattedError.type}`,
    `Severity: ${formattedError.severity}`,
    `Context: ${formattedError.context}`,
    `Message: ${formattedError.message}`,
  ];

  if ((formattedError as any).code) baseInfo.push(`Code: ${(formattedError as any).code}`);
  if ((formattedError as any).status) baseInfo.push(`Status: ${(formattedError as any).status}`);

  if (diagnostics?.debugHints?.length) {
    baseInfo.push("Hints:");
    diagnostics.debugHints.forEach((hint, index) => {
      baseInfo.push(`  ${index + 1}. ${hint.title} - ${hint.detail}`);
    });
  }

  if (diagnostics?.stackFrames?.length) {
    baseInfo.push("Top stack frame:");
    const [topFrame] = diagnostics.stackFrames;
    if (topFrame?.raw) {
      baseInfo.push(`  ${topFrame.raw}`);
    } else {
      baseInfo.push(`  ${topFrame.functionName} at ${topFrame.file}:${topFrame.line}:${topFrame.column}`);
    }
  }

  baseInfo.push(`Fingerprint: ${diagnostics?.fingerprint}`);

  return baseInfo.join("\n");
}

// ============================================================================
// Logging & External Services
// ============================================================================

/**
 * * Sends error data to external error tracking service
 */
function sendToErrorService(logData: any) {
  const GLOBAL_SCOPE = getGlobalScope();
  const { navigator = {}, location = {} } = GLOBAL_SCOPE;

  const errorData = {
    message: logData?.error?.message || "Unknown error",
    level: logData?.error?.severity || ERROR_SEVERITY.MEDIUM,
    timestamp: logData?.timestamp || new Date().toISOString(),
    context: logData?.context || "Unknown",
    metadata: logData?.metadata || {},
    userAgent: navigator?.userAgent || "Unknown",
    url: location?.href || "Unknown",
    userId: getGlobalScope().localStorage?.getItem("catNamesUser") ?? null,
    sessionId: (() => {
      const storage = getGlobalScope().sessionStorage;
      let sid = storage?.getItem("errorSessionId");
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        storage?.setItem("errorSessionId", sid);
      }
      return sid;
    })(),
    buildVersion: "1.0.0",
  };

  // Sentry
  try {
    const sentry = GLOBAL_SCOPE.Sentry;
    if (sentry?.captureException) {
      const error = new Error(errorData.message);
      error.name = errorData.context;
      sentry.captureException(error, {
        tags: { context: errorData.context, level: errorData.level, userId: errorData.userId },
        extra: { ...errorData.metadata, url: errorData.url, sessionId: errorData.sessionId },
      });
    }
  } catch (err) { console.warn("Sentry error:", err); }

  // Custom
  const errorEndpoint = process.env.REACT_APP_ERROR_ENDPOINT;
  if (errorEndpoint) {
    fetch(errorEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorData),
    }).catch(() => { });
  }
}

/**
 * * Logs error information
 */
export function logError(formattedError: FormattedError, context: string, metadata: Record<string, unknown>) {
  const logData = { error: formattedError, context, metadata, timestamp: new Date().toISOString() };

  if (process.env.NODE_ENV === "development") {
    const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|Android/i.test(navigator.userAgent);
    console.group(`🔴 Error [${formattedError?.type || "Unknown"}]${isMobile ? " (Mobile)" : ""}`);
    console.error("Context:", context);
    console.error("Message:", formattedError?.userMessage || formattedError?.message || "No message");
    console.error("Severity:", formattedError?.severity || "Unknown");
    console.error("Retryable:", formattedError?.isRetryable ?? false);
    if (formattedError?.metadata?.stack) console.error("Stack:", formattedError.metadata.stack);

    const diag = formattedError.diagnostics as Diagnostics;
    if (diag?.debugHints?.length) {
      console.group("Debug Hints");
      diag.debugHints.forEach((h, i) => console.log(`${i + 1}. ${h.title}:`, h.detail));
      console.groupEnd();
    }
    console.groupEnd();
  } else {
    sendToErrorService(logData);
  }
}

export function formatError(
  errorInfo: ParsedError,
  context: string,
  metadata: Record<string, unknown>,
): FormattedError {
  const severity = determineSeverity(errorInfo, metadata);
  const userMessage = getUserFriendlyMessage(errorInfo, context);
  const retryable = isRetryable(errorInfo, metadata);
  const diagnostics = buildDiagnostics(errorInfo, context, metadata);

  const formatted: FormattedError = {
    id: generateErrorId(),
    message: errorInfo.message,
    userMessage,
    context,
    type: errorInfo.type,
    severity,
    isRetryable: retryable,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      originalError: errorInfo,
      stack: errorInfo.stack,
    },
    diagnostics,
    aiContext: "",
    stack: errorInfo.stack || null,
  };

  formatted.aiContext = buildAIContext({
    formattedError: formatted,
    diagnostics,
  });

  return formatted;
}
