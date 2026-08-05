export const ERROR_TYPES = {
	NETWORK: "network",
	VALIDATION: "validation",
	AUTH: "auth",
	DATABASE: "database",
	RUNTIME: "runtime",
	UNKNOWN: "unknown",
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

export const ERROR_SEVERITY = {
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high",
	CRITICAL: "critical",
} as const;

export type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY];

export function determineErrorType(error: unknown): ErrorType {
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		return ERROR_TYPES.NETWORK;
	}

	if (!error || typeof error !== "object") {
		return ERROR_TYPES.UNKNOWN;
	}

	const err = error as Record<string, unknown>;

	if (err.code === "PGRST301" || err.code === "PGRST302") {
		return ERROR_TYPES.AUTH;
	}
	if (err.code === "PGRST116" || err.code === "PGRST117") {
		return ERROR_TYPES.VALIDATION;
	}
	if (
		err.code === "NETWORK_ERROR" ||
		err.name === "NetworkError" ||
		(err.name === "TypeError" && (err.message as string)?.includes("fetch"))
	) {
		return ERROR_TYPES.NETWORK;
	}
	if (
		err.name === "TimeoutError" ||
		(err.name === "AbortError" && (err.message as string)?.includes("timeout"))
	) {
		return ERROR_TYPES.NETWORK;
	}
	if (err.status === 0 || err.status === 500) {
		return ERROR_TYPES.NETWORK;
	}
	if (
		(err.message as string)?.includes("database") ||
		(err.message as string)?.includes("supabase")
	) {
		return ERROR_TYPES.DATABASE;
	}
	if (err.name === "TypeError" || err.name === "ReferenceError") {
		return ERROR_TYPES.RUNTIME;
	}
	if (err.code === "VALIDATION_ERROR" || (err.message as string)?.includes("validation")) {
		return ERROR_TYPES.VALIDATION;
	}

	return ERROR_TYPES.UNKNOWN;
}

export function determineSeverity(
	errorType: ErrorType,
	metadata: Record<string, unknown> = {},
): ErrorSeverity {
	if (metadata.isCritical) {
		return ERROR_SEVERITY.CRITICAL;
	}
	if (metadata.affectsUserData) {
		return ERROR_SEVERITY.HIGH;
	}
	switch (errorType) {
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
