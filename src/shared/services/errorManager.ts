import {
	determineErrorType,
	determineSeverity,
	ERROR_SEVERITY,
	ERROR_TYPES,
	type ErrorSeverity,
	type ErrorType,
} from "./error/errorClassification";
import { getUserFriendlyMessage as getCatalogMessage } from "./error/errorMessages";
import { getTelemetryAdapter } from "./telemetrySeam";

export type { ErrorSeverity, ErrorType };
export { ERROR_SEVERITY, ERROR_TYPES };

const GLOBAL_SCOPE =
	typeof globalThis === "undefined"
		? typeof window === "undefined"
			? {}
			: window
		: globalThis;

function getGlobalScope() {
	return GLOBAL_SCOPE;
}

function createHash(value: unknown): string {
	const stringValue = typeof value === "string" ? value : JSON.stringify(value);
	let hash = 0;
	if (!stringValue) {
		return "hash_0";
	}
	for (let index = 0; index < stringValue.length; index += 1) {
		hash = (hash << 5) - hash + stringValue.charCodeAt(index);
		hash |= 0;
	}
	return `hash_${Math.abs(hash)}`;
}

interface ParsedError {
	message: string;
	name: string;
	stack: string | null;
	type: ErrorType;
	cause?: unknown;
	code?: string | null;
	status?: number | null;
}

interface FormattedError {
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

function generateErrorId() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return `error_${crypto.randomUUID()}`;
	}
	return `error_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseError(error: unknown): ParsedError {
	if (error instanceof Error) {
		return {
			message: error.message || "An error occurred",
			name: error.name,
			stack: error.stack || null,
			type: determineErrorType(error),
			cause: (error as unknown as { cause: unknown }).cause || null,
		};
	}
	if (typeof error === "string") {
		return {
			message: error || "An error occurred",
			name: "StringError",
			stack: null,
			type: ERROR_TYPES.UNKNOWN,
		};
	}
	if (error && typeof error === "object") {
		const o = error as Record<string, unknown>;
		const message =
			(o.message as string) ||
			(o.error as string) ||
			(o.detail as string) ||
			(o.error_description as string) ||
			(o.hint as string) ||
			"An unexpected error occurred";
		return {
			message,
			name: (o.name as string) || "ObjectError",
			stack: (o.stack as string) || null,
			type: determineErrorType(error),
			code: (o.code as string) || null,
			status: (o.status as number) || null,
			cause: o.cause || null,
		};
	}
	return {
		message: "An unexpected error occurred. Please try again.",
		name: "UnknownError",
		stack: null,
		type: ERROR_TYPES.UNKNOWN,
	};
}

function getUserFriendlyMessage(
	errorInfo: ParsedError,
	context: string,
): string {
	if (
		errorInfo.type === ERROR_TYPES.NETWORK &&
		typeof navigator !== "undefined" &&
		!navigator.onLine
	) {
		return "You're currently offline. Please check your internet connection and try again.";
	}
	const severity = determineSeverity(errorInfo.type, {});
	return getCatalogMessage(errorInfo.type, severity, context);
}

function isRetryable(
	errorInfo: ParsedError,
	metadata: Record<string, unknown>,
): boolean {
	if (metadata.isRetryable === false) {
		return false;
	}
	if (metadata.isRetryable === true) {
		return true;
	}
	if (
		errorInfo.type === ERROR_TYPES.NETWORK ||
		errorInfo.type === ERROR_TYPES.DATABASE
	) {
		return true;
	}
	return false;
}

// ============================================================================
// Tracking & Diagnostics (Internal)
// ============================================================================

function collectEnvironmentSnapshot() {
	const g = getGlobalScope();
	try {
		const { navigator = {}, location = {} } = g as typeof globalThis;
		return {
			userAgent: (navigator as Navigator).userAgent,
			language: (navigator as Navigator).language,
			online: (navigator as Navigator).onLine,
			platform: (navigator as Navigator).platform,
			location: (location as Location).href,
		};
	} catch {
		return {};
	}
}

interface DebugHint {
	title: string;
	detail: string;
}

function deriveDebugHints(
	errorInfo: ParsedError,
	_context: string,
	_metadata: Record<string, unknown>,
	environment: Record<string, unknown>,
): DebugHint[] {
	const hints: DebugHint[] = [];
	if (errorInfo.cause) {
		hints.push({
			title: "Root cause provided",
			detail: String(errorInfo.cause),
		});
	}
	if (errorInfo.type === ERROR_TYPES.NETWORK) {
		hints.push({
			title: "Connectivity check",
			detail: environment.online === false ? "Offline" : "Check server",
		});
	}
	return hints;
}

function buildDiagnostics(
	errorInfo: ParsedError,
	context: string,
	metadata: Record<string, unknown>,
): Record<string, unknown> {
	const environment = collectEnvironmentSnapshot();
	const debugHints = deriveDebugHints(
		errorInfo,
		context,
		metadata,
		environment,
	);
	return {
		fingerprint: createHash({
			type: errorInfo.type,
			message: errorInfo.message,
			context,
		}),
		environment,
		debugHints,
	};
}

function buildAIContext(f: FormattedError, d: { fingerprint: string }): string {
	return `ID: ${f.id}\nType: ${f.type}\nSeverity: ${f.severity}\nContext: ${f.context}\nMessage: ${f.message}\nFingerprint: ${d.fingerprint}`;
}

interface ErrorServiceLogData {
	error: FormattedError;
	context: string;
	metadata: Record<string, unknown>;
}

function sendToErrorService(logData: ErrorServiceLogData): void {
	const e = new Error(logData.error.message);
	e.name = logData.context;
	e.stack = logData.error.stack || undefined;
	getTelemetryAdapter().captureException(
		e,
		logData.context,
		{
			errorType: logData.error.type,
			severity: logData.error.severity,
		},
		{
			...logData.metadata,
			errorId: logData.error.id,
			userMessage: logData.error.userMessage,
			isRetryable: logData.error.isRetryable,
		},
	);
}

function logError(
	formattedError: FormattedError,
	context: string,
	metadata: Record<string, unknown>,
) {
	getTelemetryAdapter().logError(formattedError, context);
	if (!import.meta.env?.DEV) {
		sendToErrorService({ error: formattedError, context, metadata });
	}
}

function formatError(
	errorInfo: ParsedError,
	context: string,
	metadata: Record<string, unknown>,
): FormattedError {
	const severity = determineSeverity(errorInfo.type, metadata);
	const userMessage = getUserFriendlyMessage(errorInfo, context);
	const diagnostics = buildDiagnostics(errorInfo, context, metadata);
	const formatted: FormattedError = {
		id: generateErrorId(),
		message: errorInfo.message,
		userMessage,
		context,
		type: errorInfo.type,
		severity,
		isRetryable: isRetryable(errorInfo, metadata),
		timestamp: new Date().toISOString(),
		metadata: { ...metadata, stack: errorInfo.stack },
		diagnostics,
		aiContext: "",
		stack: errorInfo.stack,
	};
	formatted.aiContext = buildAIContext(
		formatted,
		diagnostics as { fingerprint: string },
	);
	return formatted;
}

// ============================================================================
// Retry & Circuit Breaker
// ============================================================================

export class CircuitBreaker {
	failureThreshold: number;
	resetTimeout: number;
	failureCount: number = 0;
	lastFailureTime: number | null = null;
	state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
	constructor(threshold = 5, timeout = 60000) {
		this.failureThreshold = threshold;
		this.resetTimeout = timeout;
	}
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		if (
			this.state === "OPEN" &&
			Date.now() - (this.lastFailureTime || 0) >= this.resetTimeout
		) {
			this.state = "HALF_OPEN";
		}
		if (this.state === "OPEN") {
			throw new Error("Circuit breaker is OPEN");
		}
		try {
			const r = await fn();
			this.failureCount = 0;
			this.state = "CLOSED";
			return r;
		} catch (e) {
			this.failureCount++;
			this.lastFailureTime = Date.now();
			if (this.failureCount >= this.failureThreshold) {
				this.state = "OPEN";
			}
			throw e;
		}
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
	operation: T,
	options: Record<string, unknown> = {},
): T {
	const { maxAttempts = 3, baseDelay = 1000 } = options as {
		maxAttempts?: number;
		baseDelay?: number;
	};
	return (async (...args: unknown[]) => {
		let lastErr;
		for (let a = 1; a <= maxAttempts; a++) {
			try {
				return await operation(...args);
			} catch (e) {
				lastErr = e;
				if (a === maxAttempts || !isRetryable(parseError(e), {})) {
					throw e;
				}
				const delay = baseDelay << (a - 1);
				if (delay > 0) {
					await sleep(delay);
				}
			}
		}
		throw lastErr;
	}) as T;
}

function createResilientFunction<
	T extends (...args: unknown[]) => Promise<unknown>,
>(
	fn: T,
	options: {
		threshold?: number;
		timeout?: number;
		maxAttempts?: number;
		baseDelay?: number;
	} = {},
): T {
	const cb = new CircuitBreaker(options.threshold, options.timeout);
	const retried = withRetry(fn, options);
	return (async (...args: unknown[]) =>
		cb.execute(() => retried(...args))) as T;
}

// ============================================================================
// ErrorManager Class
// ============================================================================

export class ErrorManager {
	static handleError(
		error: unknown,
		context: string = "Unknown",
		metadata: Record<string, unknown> = {},
	): FormattedError {
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
		const g = getGlobalScope() as typeof globalThis;
		if (!g.addEventListener) {
			return () => {
				// Intentional no-op: addEventListener not available
			};
		}
		const h = (e: ErrorEvent | PromiseRejectionEvent) => {
			const error = "reason" in e ? e.reason : e.error;
			ErrorManager.handleError(error, "Global", {
				isCritical: true,
			});
		};
		g.addEventListener("unhandledrejection", h);
		g.addEventListener("error", h);
		return () => {
			g.removeEventListener("unhandledrejection", h);
			g.removeEventListener("error", h);
		};
	}
}
