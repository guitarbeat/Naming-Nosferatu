/**
 * @module ErrorManager
 * @description Comprehensive error handling service for the application.
 * Consolidates error handling, logging, retry logic, and circuit breaker patterns.
 */

// ============================================================================
// Internal Helpers & Scope
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GLOBAL_SCOPE: any =
    typeof globalThis !== "undefined"
        ? globalThis
        : typeof window !== "undefined"
            ? window
            : {};

/**
 * * Get the global scope object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGlobalScope = (): any => GLOBAL_SCOPE;

/**
 * * Deep freeze an object to prevent mutations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deepFreeze = (object: any) => {
    if (object && typeof object === "object" && !Object.isFrozen(object)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(object).forEach((value: any) => {
            if (typeof value === "object" && value !== null) {
                deepFreeze(value);
            }
        });
        Object.freeze(object);
    }
    return object;
};

/**
 * * Create a hash from a value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createHash = (value: any) => {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 0;
    if (!stringValue) return "hash_0";
    for (let index = 0; index < stringValue.length; index += 1) {
        hash = (hash << 5) - hash + stringValue.charCodeAt(index);
        hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
};

// ============================================================================
// Constants
// ============================================================================

export const ERROR_TYPES = {
    NETWORK: "network",
    VALIDATION: "validation",
    AUTH: "auth",
    DATABASE: "database",
    RUNTIME: "runtime",
    UNKNOWN: "unknown",
};

export const ERROR_SEVERITY = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
};

const USER_FRIENDLY_MESSAGES = {
    [ERROR_TYPES.NETWORK]: {
        [ERROR_SEVERITY.LOW]: "Connection is slow. Please try again.",
        [ERROR_SEVERITY.MEDIUM]: "Network issue. Check your connection and try again.",
        [ERROR_SEVERITY.HIGH]: "Can't connect to the server. Try again soon.",
        [ERROR_SEVERITY.CRITICAL]: "Service unavailable. Please try again later.",
    },
    [ERROR_TYPES.AUTH]: {
        [ERROR_SEVERITY.LOW]: "Please log in again.",
        [ERROR_SEVERITY.MEDIUM]: "Session expired. Please log in again.",
        [ERROR_SEVERITY.HIGH]: "Sign-in failed. Check your credentials.",
        [ERROR_SEVERITY.CRITICAL]: "Account access issue. Please contact support.",
    },
    [ERROR_TYPES.DATABASE]: {
        [ERROR_SEVERITY.LOW]: "Data is loading slowly. Please try again.",
        [ERROR_SEVERITY.MEDIUM]: "Can't load data. Please refresh.",
        [ERROR_SEVERITY.HIGH]: "Data access error. Try again later.",
        [ERROR_SEVERITY.CRITICAL]: "Database connection issue. Please try again later.",
    },
    [ERROR_TYPES.VALIDATION]: {
        [ERROR_SEVERITY.LOW]: "Please check your input and try again.",
        [ERROR_SEVERITY.MEDIUM]: "Invalid input. Please review and try again.",
        [ERROR_SEVERITY.HIGH]: "Validation failed. Please check your data.",
        [ERROR_SEVERITY.CRITICAL]: "Critical validation error. Please contact support.",
    },
    [ERROR_TYPES.RUNTIME]: {
        [ERROR_SEVERITY.LOW]: "Something went wrong. Please try again.",
        [ERROR_SEVERITY.MEDIUM]: "An error occurred. Please refresh.",
        [ERROR_SEVERITY.HIGH]: "App error. Please try again later.",
        [ERROR_SEVERITY.CRITICAL]: "Critical application error. Please contact support.",
    },
    [ERROR_TYPES.UNKNOWN]: {
        [ERROR_SEVERITY.LOW]: "Something unexpected happened. Please try again.",
        [ERROR_SEVERITY.MEDIUM]: "Unexpected error. Please try again.",
        [ERROR_SEVERITY.HIGH]: "Unexpected error. Try again later.",
        [ERROR_SEVERITY.CRITICAL]: "Critical unexpected error. Please contact support.",
    },
};

export const RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: 0.1,
};

deepFreeze(ERROR_TYPES);
deepFreeze(ERROR_SEVERITY);
deepFreeze(USER_FRIENDLY_MESSAGES);
deepFreeze(RETRY_CONFIG);

// ============================================================================
// Core Utility Logic (Internal)
// ============================================================================

export interface ParsedError {
    message: string;
    name: string;
    stack: string | null;
    type: string;
    cause?: unknown;
    code?: string | null;
    status?: number | null;
}

export interface FormattedError {
    id: string;
    message: string;
    userMessage: string;
    context: string;
    type: string;
    severity: string;
    isRetryable: boolean;
    timestamp: string;
    metadata: Record<string, unknown>;
    diagnostics: Record<string, unknown>;
    aiContext: string;
    stack?: string | null;
}

export function generateErrorId() {
    if (GLOBAL_SCOPE.crypto?.randomUUID) return `error_${GLOBAL_SCOPE.crypto.randomUUID()}`;
    return `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function determineErrorType(error: unknown): string {
    const err = error as Record<string, unknown>;
    if (typeof navigator !== "undefined" && !navigator.onLine) return ERROR_TYPES.NETWORK;
    if (err.code === "PGRST301" || err.code === "PGRST302") return ERROR_TYPES.AUTH;
    if (err.code === "PGRST116" || err.code === "PGRST117") return ERROR_TYPES.VALIDATION;
    if (err.code === "NETWORK_ERROR" || err.name === "NetworkError" || (err.name === "TypeError" && (err.message as string)?.includes("fetch"))) return ERROR_TYPES.NETWORK;
    if (err.name === "TimeoutError" || (err.name === "AbortError" && (err.message as string)?.includes("timeout"))) return ERROR_TYPES.NETWORK;
    if (err.status === 0 || err.status === 500) return ERROR_TYPES.NETWORK;
    if ((err.message as string)?.includes("database") || (err.message as string)?.includes("supabase")) return ERROR_TYPES.DATABASE;
    if (err.name === "TypeError" || err.name === "ReferenceError") return ERROR_TYPES.RUNTIME;
    if (err.code === "VALIDATION_ERROR" || (err.message as string)?.includes("validation")) return ERROR_TYPES.VALIDATION;
    return ERROR_TYPES.UNKNOWN;
}

export function parseError(error: unknown): ParsedError {
    if (error instanceof Error) return { message: error.message, name: error.name, stack: error.stack || null, type: determineErrorType(error), cause: (error as any).cause || null };
    if (typeof error === "string") return { message: error, name: "StringError", stack: null, type: ERROR_TYPES.UNKNOWN };
    if (error && typeof error === "object") {
        const o = error as any;
        return { message: o.message || o.error || "Unknown error", name: o.name || "ObjectError", stack: o.stack || null, type: determineErrorType(error), code: o.code || null, status: o.status || null, cause: o.cause || null };
    }
    return { message: "An unexpected error occurred", name: "UnknownError", stack: null, type: ERROR_TYPES.UNKNOWN };
}

export function determineSeverity(errorInfo: ParsedError, metadata: Record<string, unknown>): string {
    if (metadata.isCritical) return ERROR_SEVERITY.CRITICAL;
    if (metadata.affectsUserData) return ERROR_SEVERITY.HIGH;
    switch (errorInfo.type) {
        case ERROR_TYPES.AUTH: return ERROR_SEVERITY.HIGH;
        case ERROR_TYPES.DATABASE: case ERROR_TYPES.NETWORK: case ERROR_TYPES.RUNTIME: return ERROR_SEVERITY.MEDIUM;
        case ERROR_TYPES.VALIDATION: return ERROR_SEVERITY.LOW;
        default: return ERROR_SEVERITY.MEDIUM;
    }
}

export function getUserFriendlyMessage(errorInfo: ParsedError, context: string): string {
    const contextMap: Record<string, string> = {
        "Tournament Completion": "Failed to complete tournament",
        "Tournament Setup": "Failed to set up tournament",
        "Rating Update": "Failed to update ratings",
        Login: "Failed to log in",
        "Profile Load": "Failed to load profile",
    };
    const contextMessage = contextMap[context] || "An error occurred";
    const severity = determineSeverity(errorInfo, {});
    const messages = USER_FRIENDLY_MESSAGES as any;
    if (errorInfo.type === ERROR_TYPES.NETWORK && typeof navigator !== "undefined" && !navigator.onLine) {
        return "You appear to be offline. Please check your internet connection and try again.";
    }
    return messages[errorInfo.type]?.[severity] || `${contextMessage}. Please try again.`;
}

export function isRetryable(errorInfo: ParsedError, metadata: Record<string, unknown>): boolean {
    if (metadata.isRetryable === false) return false;
    if (metadata.isRetryable === true) return true;
    if (errorInfo.type === ERROR_TYPES.NETWORK || errorInfo.type === ERROR_TYPES.DATABASE) return true;
    return false;
}

// ============================================================================
// Tracking & Diagnostics (Internal)
// ============================================================================

function collectEnvironmentSnapshot() {
    const g = getGlobalScope();
    try {
        const { navigator = {}, location = {}, performance = {} } = g;
        return { userAgent: navigator.userAgent, language: navigator.language, online: navigator.onLine, platform: navigator.platform, location: location.href };
    } catch { return {}; }
}

function deriveDebugHints(errorInfo: any, context: string, metadata: any, environment: any) {
    const hints: any[] = [];
    if (errorInfo.cause) hints.push({ title: "Root cause provided", detail: String(errorInfo.cause) });
    if (errorInfo.type === ERROR_TYPES.NETWORK) hints.push({ title: "Connectivity check", detail: environment.online === false ? "Offline" : "Check server" });
    return hints;
}

function buildDiagnostics(errorInfo: any, context: string, metadata: any): any {
    const environment = collectEnvironmentSnapshot();
    const debugHints = deriveDebugHints(errorInfo, context, metadata, environment);
    return { fingerprint: createHash({ type: errorInfo.type, message: errorInfo.message, context }), environment, debugHints };
}

function buildAIContext(f: FormattedError, d: any) {
    return `ID: ${f.id}\nType: ${f.type}\nSeverity: ${f.severity}\nContext: ${f.context}\nMessage: ${f.message}\nFingerprint: ${d.fingerprint}`;
}

function sendToErrorService(logData: any) {
    const g = getGlobalScope();
    const sentry = g.Sentry;
    if (sentry?.captureException) {
        const e = new Error(logData.error.message);
        e.name = logData.context;
        sentry.captureException(e, { tags: { context: logData.context }, extra: logData.metadata });
    }
}

function logError(formattedError: FormattedError, context: string, metadata: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
        console.group(`🔴 Error [${formattedError.type}]`);
        console.error("Context:", context, "Message:", formattedError.userMessage);
        console.groupEnd();
    } else {
        sendToErrorService({ error: formattedError, context, metadata });
    }
}

function formatError(errorInfo: ParsedError, context: string, metadata: Record<string, unknown>): FormattedError {
    const severity = determineSeverity(errorInfo, metadata);
    const userMessage = getUserFriendlyMessage(errorInfo, context);
    const diagnostics = buildDiagnostics(errorInfo, context, metadata);
    const formatted: FormattedError = {
        id: generateErrorId(), message: errorInfo.message, userMessage, context, type: errorInfo.type, severity,
        isRetryable: isRetryable(errorInfo, metadata), timestamp: new Date().toISOString(),
        metadata: { ...metadata, stack: errorInfo.stack }, diagnostics, aiContext: "", stack: errorInfo.stack
    };
    formatted.aiContext = buildAIContext(formatted, diagnostics);
    return formatted;
}

// ============================================================================
// Retry & Circuit Breaker
// ============================================================================

export class CircuitBreaker {
    failureThreshold: number; resetTimeout: number; failureCount: number = 0;
    lastFailureTime: number | null = null; state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
    constructor(threshold = 5, timeout = 60000) { this.failureThreshold = threshold; this.resetTimeout = timeout; }
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === "OPEN" && (Date.now() - (this.lastFailureTime || 0) >= this.resetTimeout)) this.state = "HALF_OPEN";
        if (this.state === "OPEN") throw new Error("Circuit breaker is OPEN");
        try { const r = await fn(); this.failureCount = 0; this.state = "CLOSED"; return r; }
        catch (e) { this.failureCount++; this.lastFailureTime = Date.now(); if (this.failureCount >= this.failureThreshold) this.state = "OPEN"; throw e; }
    }
}

export function withRetry<T extends (...args: any[]) => Promise<any>>(operation: T, options: any = {}): T {
    const { maxAttempts = 3, baseDelay = 1000 } = options;
    return (async (...args: any[]) => {
        let lastErr;
        for (let a = 1; a <= maxAttempts; a++) {
            try { return await operation(...args); }
            catch (e) { lastErr = e; if (a === maxAttempts || !isRetryable(parseError(e), {})) throw e; await new Promise(r => setTimeout(r, baseDelay * (2 ** (a - 1)))); }
        }
        throw lastErr;
    }) as T;
}

export function createResilientFunction<T extends (...args: any[]) => Promise<any>>(fn: T, options: any = {}): T {
    const cb = new CircuitBreaker(options.threshold, options.timeout);
    const retried = withRetry(fn, options);
    return (async (...args: any[]) => cb.execute(() => retried(...args))) as T;
}

// ============================================================================
// ErrorManager Class
// ============================================================================

export class ErrorManager {
    static handleError(error: unknown, context: string = "Unknown", metadata: Record<string, unknown> = {}): FormattedError {
        const info = parseError(error);
        const formatted = formatError(info, context, metadata);
        logError(formatted, context, metadata);
        return formatted;
    }
    static parseError = parseError;
    static withRetry = withRetry;
    static CircuitBreaker = CircuitBreaker;
    static createResilientFunction = createResilientFunction;

    static setupGlobalErrorHandling(): () => void {
        const g = getGlobalScope();
        if (!g.addEventListener) return () => { };
        const h = (e: any) => this.handleError(e.reason || e.error, "Global", { isCritical: true });
        g.addEventListener("unhandledrejection", h);
        g.addEventListener("error", h);
        return () => { g.removeEventListener("unhandledrejection", h); g.removeEventListener("error", h); };
    }
}

export const createStandardizedError = (error: unknown, context: string = "Unknown", metadata: any = {}) => ErrorManager.handleError(error, context, metadata);
