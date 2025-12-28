/**
 * @module ErrorManager/errorUtils
 * @description Core utilities, constants, and formatting for error management.
 */

// ============================================================================
// Helpers & Scope
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
 * @returns {Object} Global scope object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGlobalScope = (): any => GLOBAL_SCOPE;

/**
 * * Deep freeze an object to prevent mutations
 * @param {Object} object - Object to freeze
 * @returns {Object} Frozen object
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
 * @param {*} value - Value to hash
 * @returns {string} Hash string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createHash = (value: any) => {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 0;
    if (!stringValue) {
        return "hash_0";
    }

    for (let index = 0; index < stringValue.length; index += 1) {
        hash = (hash << 5) - hash + stringValue.charCodeAt(index);
        hash |= 0; // Convert to 32bit integer
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
// Error ID Generation
// ============================================================================

/**
 * * Generates unique error ID
 * @returns {string} Unique error identifier
 */
export function generateErrorId() {
    if (GLOBAL_SCOPE.crypto?.randomUUID) {
        return `error_${GLOBAL_SCOPE.crypto.randomUUID()}`;
    }

    const randomSegment = Math.random().toString(36).slice(2, 11);
    return `error_${Date.now()}_${randomSegment}`;
}

// ============================================================================
// Parsing & Types
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

/**
 * * Determines the type of error based on error properties
 * @param {Error|Object} error - The error to analyze
 * @returns {string} Error type
 */
function determineErrorType(error: unknown): string {
    const err = error as Record<string, unknown>;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
        return ERROR_TYPES.NETWORK;
    }

    if (err.code === "PGRST301" || err.code === "PGRST302") {
        return ERROR_TYPES.AUTH;
    }

    if (err.code === "PGRST116" || err.code === "PGRST117") {
        return ERROR_TYPES.VALIDATION;
    }

    if (
        err.code === "NETWORK_ERROR" ||
        err.name === "NetworkError" ||
        (err.name === "TypeError" &&
            (err.message as string | undefined)?.includes("fetch")) ||
        (err.message as string | undefined)?.includes("fetch") ||
        (err.message as string | undefined)?.includes("network") ||
        (err.message as string | undefined)?.includes("Failed to fetch") ||
        (err.message as string | undefined)?.includes("Network request failed")
    ) {
        return ERROR_TYPES.NETWORK;
    }

    if (
        err.name === "TimeoutError" ||
        (err.name === "AbortError" &&
            (err.message as string | undefined)?.includes("timeout")) ||
        (err.message as string | undefined)?.includes("timeout") ||
        (err.message as string | undefined)?.includes("timed out")
    ) {
        return ERROR_TYPES.NETWORK;
    }

    if (err.status === 0 || err.status === 500) {
        return ERROR_TYPES.NETWORK;
    }

    if (
        (err.message as string | undefined)?.includes("database") ||
        (err.message as string | undefined)?.includes("supabase")
    ) {
        return ERROR_TYPES.DATABASE;
    }

    if (err.name === "TypeError" || err.name === "ReferenceError") {
        return ERROR_TYPES.RUNTIME;
    }

    if (
        err.code === "VALIDATION_ERROR" ||
        (err.message as string | undefined)?.includes("validation")
    ) {
        return ERROR_TYPES.VALIDATION;
    }

    return ERROR_TYPES.UNKNOWN;
}

/**
 * * Parses different types of error objects
 * @param {Error|Object} error - The error to parse
 * @returns {ParsedError} Parsed error information
 */
export function parseError(error: unknown): ParsedError {
    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
            stack: error.stack || null,
            type: determineErrorType(error),
            cause: (error as { cause?: unknown }).cause || null,
        };
    }

    if (typeof error === "string") {
        return {
            message: error,
            name: "StringError",
            stack: null,
            type: ERROR_TYPES.UNKNOWN,
        };
    }

    if (error && typeof error === "object") {
        const errObj = error as Record<string, unknown>;
        return {
            message:
                (errObj.message as string) ||
                (errObj.error as string) ||
                "Unknown error occurred",
            name: (errObj.name as string) || "ObjectError",
            stack: (errObj.stack as string) || null,
            type: determineErrorType(error),
            code: (errObj.code as string) || null,
            status: (errObj.status as number) || null,
            cause: errObj.cause || null,
        };
    }

    return {
        message: "An unexpected error occurred",
        name: "UnknownError",
        stack: null,
        type: ERROR_TYPES.UNKNOWN,
    };
}

// ============================================================================
// Formatting & Severity
// ============================================================================

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
    diagnostics: Record<string, unknown>; // Built later in errorTracking
    aiContext: string; // Built later in errorTracking
    stack?: string | null;
}

/**
 * * Determines error severity based on type and metadata
 */
export function determineSeverity(
    errorInfo: ParsedError,
    metadata: Record<string, unknown>,
): string {
    if (metadata.isCritical) return ERROR_SEVERITY.CRITICAL;
    if (metadata.affectsUserData) return ERROR_SEVERITY.HIGH;

    switch (errorInfo.type) {
        case ERROR_TYPES.AUTH:
            return ERROR_SEVERITY.HIGH;
        case ERROR_TYPES.DATABASE:
        case ERROR_TYPES.NETWORK:
        case ERROR_TYPES.RUNTIME:
            return ERROR_SEVERITY.MEDIUM;
        case ERROR_TYPES.VALIDATION:
            return ERROR_SEVERITY.LOW;
        default:
            return ERROR_SEVERITY.MEDIUM;
    }
}

/**
 * * Generates user-friendly error messages
 */
export function getUserFriendlyMessage(
    errorInfo: ParsedError,
    context: string,
): string {
    const contextMap: Record<string, string> = {
        "Tournament Completion": "Failed to complete tournament",
        "Tournament Setup": "Failed to set up tournament",
        "Rating Update": "Failed to update ratings",
        "Save Rankings": "Failed to save ranking changes",
        Login: "Failed to log in",
        "User Login": "Unable to log in",
        "Profile Load": "Failed to load profile",
        "Database Query": "Failed to fetch data",
        "Load Cat Name": "Failed to load cat name",
        "Fetch Cat Fact": "Unable to load cat fact",
        "Audio Playback": "Unable to play audio",
        "React Component Error": "A component error occurred",
    };

    const contextMessage = contextMap[context] || "An error occurred";
    const severity = determineSeverity(errorInfo, {});

    if (errorInfo.type === ERROR_TYPES.NETWORK) {
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        if (isOffline) {
            return "You appear to be offline. Please check your internet connection and try again.";
        }
        const messages = USER_FRIENDLY_MESSAGES as Record<string, Record<string, string>>;
        return messages[errorInfo.type]?.[severity] ||
            `${contextMessage}. Please check your connection and try again.`;
    }

    const messages = USER_FRIENDLY_MESSAGES as Record<string, Record<string, string>>;
    return messages[errorInfo.type]?.[severity] ||
        `${contextMessage}. Please try again.`;
}

/**
 * * Determines if an error is retryable
 */
export function isRetryable(
    errorInfo: ParsedError,
    metadata: Record<string, unknown>,
): boolean {
    if (metadata.isRetryable === false) return false;
    if (metadata.isRetryable === true) return true;

    if (errorInfo.type === ERROR_TYPES.NETWORK || errorInfo.type === ERROR_TYPES.DATABASE) {
        return true;
    }

    if (errorInfo.type === ERROR_TYPES.AUTH || errorInfo.type === ERROR_TYPES.VALIDATION) {
        return false;
    }

    return false;
}
