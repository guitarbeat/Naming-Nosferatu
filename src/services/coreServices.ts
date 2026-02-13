/**
 * @module coreServices
 * @description Consolidated core services for the application.
 *
 * ## Contents
 *
 * - {@link ErrorManager}      — Structured error handling, classification, retry, circuit breaking
 * - {@link SyncQueueService}  — Offline-resilient operation queue with localStorage persistence
 * - {@link tournamentsAPI}    — Tournament CRUD and rating persistence via Supabase
 * - {@link EloRating}         — Elo rating calculation engine
 * - {@link PreferenceSorter}  — Round-robin pairwise comparison engine
 *
 * ## Design
 *
 * - **No React imports.** This module is pure service logic.
 * - **All Supabase access goes through `withSupabase`.** Handles client
 *   resolution, error fallback, and offline gracefully.
 * - **ErrorManager classifies errors automatically** by type (network, auth,
 *   database, validation, runtime) and severity, producing user-friendly
 *   messages and machine-readable diagnostics.
 */

import { withSupabase } from "@/services/supabase-client/client";
import type { NameItem } from "@/types/appTypes";
import { devLog } from "@/utils/basic";
import { ELO_RATING } from "@/utils/constants";

const IS_DEV = import.meta.env?.DEV ?? false;
const HAS_NAVIGATOR = typeof navigator !== "undefined";

// ═══════════════════════════════════════════════════════════════════════════════
// Error Manager — Types
// ═══════════════════════════════════════════════════════════════════════════════

const ERROR_TYPES = {
	NETWORK: "network",
	VALIDATION: "validation",
	AUTH: "auth",
	DATABASE: "database",
	RUNTIME: "runtime",
	UNKNOWN: "unknown",
} as const;

const ERROR_SEVERITY = {
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high",
	CRITICAL: "critical",
} as const;

type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];
type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY];

/** User-friendly messages indexed by [type][severity]. */
const USER_MESSAGES: Record<ErrorType, Record<ErrorSeverity, string>> = {
	network: {
		low: "Connection is slow. Please try again.",
		medium: "Having trouble connecting. Check your internet and try again.",
		high: "Can't connect right now. Please try again in a moment.",
		critical: "Service is temporarily unavailable. Please try again later.",
	},
	auth: {
		low: "Please log in again to continue.",
		medium: "Your session expired. Please log in again.",
		high: "Sign-in failed. Please check your credentials and try again.",
		critical: "Unable to access your account. Please contact support if this continues.",
	},
	database: {
		low: "Data is loading slowly. Please wait a moment.",
		medium: "Having trouble loading data. Please refresh the page.",
		high: "Unable to load data right now. Please try again later.",
		critical: "Data service is temporarily unavailable. Please try again later.",
	},
	validation: {
		low: "Please check your input and try again.",
		medium: "There's an issue with your input. Please review and try again.",
		high: "Invalid information entered. Please check your data and try again.",
		critical: "Unable to process your request. Please contact support if this continues.",
	},
	runtime: {
		low: "Something went wrong. Please try again.",
		medium: "An error occurred. Please refresh the page and try again.",
		high: "Something went wrong. Please try again in a moment.",
		critical:
			"We're experiencing technical difficulties. Please try again later or contact support.",
	},
	unknown: {
		low: "Something unexpected happened. Please try again.",
		medium: "An unexpected error occurred. Please try again.",
		high: "Something went wrong. Please try again later.",
		critical: "We encountered an unexpected issue. Please try again later or contact support.",
	},
};

interface ParsedError {
	message: string;
	name: string;
	stack: string | null;
	type: ErrorType;
	cause?: unknown;
	code?: string | null;
	status?: number | null;
}

export interface FormattedError {
	id: string;
	message: string;
	userMessage: string;
	context: string;
	type: ErrorType;
	severity: ErrorSeverity;
	isRetryable: boolean;
	timestamp: string;
	metadata: Record<string, unknown>;
	diagnostics: Record<string, unknown>;
	aiContext: string;
	stack?: string | null;
}

export interface ErrorMetadata {
	isRetryable?: boolean;
	affectsUserData?: boolean;
	isCritical?: boolean;
	[key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Error Manager — Internal Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function createHash(value: unknown): string {
	const str = typeof value === "string" ? value : JSON.stringify(value);
	if (!str) {
		return "hash_0";
	}
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0; // Convert to 32-bit int
	}
	return `hash_${Math.abs(hash)}`;
}

function generateErrorId(): string {
	if (globalThis.crypto?.randomUUID) {
		return `error_${globalThis.crypto.randomUUID()}`;
	}
	return `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function determineErrorType(error: unknown): ErrorType {
	if (HAS_NAVIGATOR && !navigator.onLine) {
		return ERROR_TYPES.NETWORK;
	}

	const err = error as Record<string, unknown>;
	const code = err.code as string | undefined;
	const name = err.name as string | undefined;
	const message = (err.message as string) ?? "";
	const status = err.status as number | undefined;

	// Supabase-specific codes
	if (code === "PGRST301" || code === "PGRST302") {
		return ERROR_TYPES.AUTH;
	}
	if (code === "PGRST116" || code === "PGRST117") {
		return ERROR_TYPES.VALIDATION;
	}

	// Network errors
	if (
		code === "NETWORK_ERROR" ||
		name === "NetworkError" ||
		(name === "TypeError" && message.includes("fetch")) ||
		name === "TimeoutError" ||
		(name === "AbortError" && message.includes("timeout")) ||
		status === 0 ||
		status === 500
	) {
		return ERROR_TYPES.NETWORK;
	}

	// Database
	if (message.includes("database") || message.includes("supabase")) {
		return ERROR_TYPES.DATABASE;
	}

	// Runtime
	if (name === "TypeError" || name === "ReferenceError") {
		return ERROR_TYPES.RUNTIME;
	}

	// Validation
	if (code === "VALIDATION_ERROR" || message.includes("validation")) {
		return ERROR_TYPES.VALIDATION;
	}

	return ERROR_TYPES.UNKNOWN;
}

function parseError(error: unknown): ParsedError {
	if (error instanceof Error) {
		return {
			message: error.message || "An error occurred",
			name: error.name,
			stack: error.stack ?? null,
			type: determineErrorType(error),
			cause: (error as Error & { cause?: unknown }).cause ?? null,
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
			(o.message as string) ??
			(o.error as string) ??
			(o.detail as string) ??
			(o.error_description as string) ??
			(o.hint as string) ??
			"An unexpected error occurred";
		return {
			message,
			name: (o.name as string) ?? "ObjectError",
			stack: (o.stack as string) ?? null,
			type: determineErrorType(error),
			code: (o.code as string) ?? null,
			status: (o.status as number) ?? null,
			cause: o.cause ?? null,
		};
	}

	return {
		message: "An unexpected error occurred. Please try again.",
		name: "UnknownError",
		stack: null,
		type: ERROR_TYPES.UNKNOWN,
	};
}

function determineSeverity(info: ParsedError, metadata: ErrorMetadata): ErrorSeverity {
	if (metadata.isCritical) {
		return ERROR_SEVERITY.CRITICAL;
	}
	if (metadata.affectsUserData) {
		return ERROR_SEVERITY.HIGH;
	}

	switch (info.type) {
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

function getUserMessage(info: ParsedError, context: string): string {
	// Offline override
	if (info.type === ERROR_TYPES.NETWORK && HAS_NAVIGATOR && !navigator.onLine) {
		return "You're currently offline. Please check your internet connection and try again.";
	}

	const contextLabels: Record<string, string> = {
		"Tournament Completion": "Unable to complete tournament",
		"Tournament Setup": "Unable to set up tournament",
		"Rating Update": "Unable to update ratings",
		Login: "Unable to log in",
		"Profile Load": "Unable to load profile",
		"Save Rankings": "Unable to save rankings",
		vote: "Unable to submit vote",
	};

	const severity = determineSeverity(info, {});
	return (
		USER_MESSAGES[info.type]?.[severity] ??
		`${contextLabels[context] ?? "An error occurred"}. Please try again.`
	);
}

function isRetryable(info: ParsedError, metadata: ErrorMetadata): boolean {
	if (metadata.isRetryable === false) {
		return false;
	}
	if (metadata.isRetryable === true) {
		return true;
	}
	return info.type === ERROR_TYPES.NETWORK || info.type === ERROR_TYPES.DATABASE;
}

function collectEnvironment(): Record<string, unknown> {
	try {
		return {
			userAgent: globalThis.navigator?.userAgent,
			language: globalThis.navigator?.language,
			online: globalThis.navigator?.onLine,
			platform: globalThis.navigator?.platform,
			location: globalThis.location?.href,
		};
	} catch {
		return {};
	}
}

function buildDiagnostics(
	info: ParsedError,
	context: string,
	environment: Record<string, unknown>,
): Record<string, unknown> {
	const hints: Array<{ title: string; detail: string }> = [];

	if (info.cause) {
		hints.push({ title: "Root cause provided", detail: String(info.cause) });
	}
	if (info.type === ERROR_TYPES.NETWORK) {
		hints.push({
			title: "Connectivity check",
			detail: environment.online === false ? "Offline" : "Check server",
		});
	}

	return {
		fingerprint: createHash({ type: info.type, message: info.message, context }),
		environment,
		debugHints: hints,
	};
}

function formatError(info: ParsedError, context: string, metadata: ErrorMetadata): FormattedError {
	const severity = determineSeverity(info, metadata);
	const environment = collectEnvironment();
	const diagnostics = buildDiagnostics(info, context, environment);
	const fingerprint = diagnostics.fingerprint as string;

	const formatted: FormattedError = {
		id: generateErrorId(),
		message: info.message,
		userMessage: getUserMessage(info, context),
		context,
		type: info.type,
		severity,
		isRetryable: isRetryable(info, metadata),
		timestamp: new Date().toISOString(),
		metadata: { ...metadata, stack: info.stack },
		diagnostics,
		aiContext: "",
		stack: info.stack,
	};

	formatted.aiContext = [
		`ID: ${formatted.id}`,
		`Type: ${formatted.type}`,
		`Severity: ${formatted.severity}`,
		`Context: ${formatted.context}`,
		`Message: ${formatted.message}`,
		`Fingerprint: ${fingerprint}`,
	].join("\n");

	return formatted;
}

function sendToErrorService(logData: {
	error: FormattedError;
	context: string;
	metadata: ErrorMetadata;
}): void {
	const sentry = (
		globalThis as unknown as { Sentry?: { captureException?: (e: Error, opts?: unknown) => void } }
	).Sentry;
	if (sentry?.captureException) {
		const e = new Error(logData.error.message);
		e.name = logData.context;
		sentry.captureException(e, {
			tags: { context: logData.context },
			extra: logData.metadata,
		});
	}
}

function logFormattedError(
	formatted: FormattedError,
	context: string,
	metadata: ErrorMetadata,
): void {
	if (IS_DEV) {
		console.group(`🔴 Error [${formatted.type}]`);
		console.error("Context:", context, "Message:", formatted.userMessage);
		console.groupEnd();
	} else {
		sendToErrorService({ error: formatted, context, metadata });
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Circuit Breaker
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Prevents repeated calls to a failing service.
 *
 * After `threshold` consecutive failures, the breaker opens and rejects
 * immediately for `resetTimeout` ms. After that window, it enters
 * half-open state and allows one probe call.
 */
export class CircuitBreaker {
	private failureCount = 0;
	private lastFailureTime: number | null = null;
	private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

	constructor(
		private readonly threshold = 5,
		private readonly resetTimeout = 60_000,
	) {}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		// Check if breaker should transition from OPEN → HALF_OPEN
		if (
			this.state === "OPEN" &&
			this.lastFailureTime !== null &&
			Date.now() - this.lastFailureTime >= this.resetTimeout
		) {
			this.state = "HALF_OPEN";
		}

		if (this.state === "OPEN") {
			throw new Error("Circuit breaker is OPEN — service unavailable");
		}

		try {
			const result = await fn();
			this.failureCount = 0;
			this.state = "CLOSED";
			return result;
		} catch (error) {
			this.failureCount++;
			this.lastFailureTime = Date.now();
			if (this.failureCount >= this.threshold) {
				this.state = "OPEN";
			}
			throw error;
		}
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Retry Wrapper
// ═══════════════════════════════════════════════════════════════════════════════

export interface RetryOptions {
	maxAttempts?: number;
	baseDelay?: number;
}

/**
 * Wrap an async function with exponential-backoff retry logic.
 * Non-retryable errors (per `parseError` classification) are thrown immediately.
 */
export function withRetry<TArgs extends unknown[], TReturn>(
	operation: (...args: TArgs) => Promise<TReturn>,
	options: RetryOptions = {},
): (...args: TArgs) => Promise<TReturn> {
	const { maxAttempts = 3, baseDelay = 1000 } = options;

	return async (...args: TArgs): Promise<TReturn> => {
		let lastError: unknown;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await operation(...args);
			} catch (error) {
				lastError = error;
				if (attempt === maxAttempts || !isRetryable(parseError(error), {})) {
					throw error;
				}
				await new Promise((resolve) => setTimeout(resolve, baseDelay * 2 ** (attempt - 1)));
			}
		}

		throw lastError;
	};
}

/**
 * Combine retry + circuit breaker for maximum resilience.
 */
export function createResilientFunction<TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => Promise<TReturn>,
	options: RetryOptions & { threshold?: number; timeout?: number } = {},
): (...args: TArgs) => Promise<TReturn> {
	const breaker = new CircuitBreaker(options.threshold, options.timeout);
	const retried = withRetry(fn, options);
	return async (...args: TArgs) => breaker.execute(() => retried(...args));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ErrorManager
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Centralized error handling with automatic classification, user-friendly
 * messages, retry support, and optional Sentry integration.
 *
 * @example
 * // Handle an error with context
 * const formatted = ErrorManager.handleError(error, "Tournament Completion", {
 *   affectsUserData: true,
 * });
 * showToast(formatted.userMessage, "error");
 *
 * // Setup global handlers (call once at app root)
 * const cleanup = ErrorManager.setupGlobalErrorHandling();
 */
export class ErrorManager {
	private static listeners: Array<(error: FormattedError) => void> = [];

	/**
	 * Handle an error: parse, classify, format, log, and notify listeners.
	 * Returns a structured `FormattedError` with user-friendly message.
	 */
	static handleError(
		error: unknown,
		context = "Unknown",
		metadata: ErrorMetadata = {},
	): FormattedError {
		const info = parseError(error);
		const formatted = formatError(info, context, metadata);
		logFormattedError(formatted, context, metadata);

		for (const listener of ErrorManager.listeners) {
			try {
				listener(formatted);
			} catch {
				/* don't let listener errors cascade */
			}
		}

		return formatted;
	}

	/** Parse any error value into a structured `ParsedError`. */
	static parseError = parseError;

	/** Retry wrapper with exponential backoff. */
	static withRetry = withRetry;

	/** Circuit breaker class. */
	static CircuitBreaker = CircuitBreaker;

	/** Combined retry + circuit breaker. */
	static createResilientFunction = createResilientFunction;

	/**
	 * Register a listener for handled errors. Returns an unsubscribe function.
	 */
	static onError(callback: (error: FormattedError) => void): () => void {
		ErrorManager.listeners.push(callback);
		return () => {
			ErrorManager.listeners = ErrorManager.listeners.filter((l) => l !== callback);
		};
	}

	/**
	 * Install global `error` and `unhandledrejection` handlers.
	 * Returns a cleanup function.
	 *
	 * @example
	 * useEffect(() => {
	 *   const cleanup = ErrorManager.setupGlobalErrorHandling();
	 *   return cleanup;
	 * }, []);
	 */
	static setupGlobalErrorHandling(): () => void {
		if (!globalThis.addEventListener) {
			return () => {
				/* No-op: addEventListener not available */
			};
		}

		const handler = (e: Event) => {
			const error = "reason" in e ? (e as PromiseRejectionEvent).reason : (e as ErrorEvent).error;
			ErrorManager.handleError(error, "Global", { isCritical: true });
		};

		globalThis.addEventListener("unhandledrejection", handler as EventListener);
		globalThis.addEventListener("error", handler as EventListener);

		return () => {
			globalThis.removeEventListener("unhandledrejection", handler as EventListener);
			globalThis.removeEventListener("error", handler as EventListener);
		};
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sync Queue
// ═══════════════════════════════════════════════════════════════════════════════

interface SyncPayload {
	userName: string;
	ratings: Array<{ name: string; rating: number; wins?: number; losses?: number }>;
}

export interface SyncItem {
	id: string;
	type: "SAVE_RATINGS";
	payload: SyncPayload;
	timestamp: number;
	retryCount: number;
}

/**
 * Persistent queue for operations that should be retried when connectivity
 * is restored. Serialized to localStorage so items survive page reloads.
 *
 * @example
 * // Queue a save when offline
 * syncQueue.enqueue("SAVE_RATINGS", { userName, ratings });
 *
 * // Process when back online
 * while (!syncQueue.isEmpty()) {
 *   const item = syncQueue.peek()!;
 *   const ok = await processItem(item);
 *   if (ok) syncQueue.dequeue();
 *   else break;
 * }
 */
class SyncQueueService {
	private queue: SyncItem[] = [];
	private readonly STORAGE_KEY = "offline_sync_queue";

	constructor() {
		this.load();
	}

	private load(): void {
		try {
			const raw = localStorage.getItem(this.STORAGE_KEY);
			if (raw) {
				this.queue = JSON.parse(raw) as SyncItem[];
			}
		} catch {
			/* corrupted data — start fresh */
		}
	}

	private save(): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
		} catch {
			/* quota exceeded — item stays in memory only */
		}
	}

	enqueue(type: SyncItem["type"], payload: SyncPayload): void {
		this.queue.push({
			id: globalThis.crypto?.randomUUID?.() ?? `sync_${Date.now()}`,
			type,
			payload,
			timestamp: Date.now(),
			retryCount: 0,
		});
		this.save();
	}

	dequeue(): SyncItem | undefined {
		const item = this.queue.shift();
		this.save();
		return item;
	}

	peek(): SyncItem | undefined {
		return this.queue[0];
	}

	isEmpty(): boolean {
		return this.queue.length === 0;
	}

	getQueue(): readonly SyncItem[] {
		return [...this.queue];
	}

	clear(): void {
		this.queue = [];
		this.save();
	}
}

export const syncQueue = new SyncQueueService();

// ═══════════════════════════════════════════════════════════════════════════════
// Tournament API
// ═══════════════════════════════════════════════════════════════════════════════

interface TournamentCreateResult {
	success: boolean;
	data?: {
		id: string;
		user_name: string;
		tournament_name: string;
		participant_names: NameItem[];
		status: string;
		created_at: string;
	};
	error?: string;
}

interface RatingSaveResult {
	success: boolean;
	savedCount?: number;
	offline?: boolean;
	error?: string;
}

/**
 * Tournament persistence layer.
 *
 * @example
 * const result = await tournamentsAPI.saveTournamentRatings(userName, ratings);
 * if (result.offline) showToast("Saved offline — will sync later");
 */
export const tournamentsAPI = {
	/**
	 * Create a tournament session. Creates the user account via RPC if needed.
	 */
	async createTournament(
		userName: string,
		tournamentName: string,
		participantNames: NameItem[],
	): Promise<TournamentCreateResult> {
		return withSupabase<TournamentCreateResult>(
			async (client) => {
				await client.rpc("create_user_account", { p_user_name: userName });
				return {
					success: true,
					data: {
						id: globalThis.crypto?.randomUUID?.() ?? `t_${Date.now()}`,
						user_name: userName,
						tournament_name: tournamentName,
						participant_names: participantNames,
						status: "in_progress",
						created_at: new Date().toISOString(),
					},
				};
			},
			{ success: false, error: "Supabase not configured" },
		);
	},

	/**
	 * Save tournament ratings to the database.
	 * Falls back to offline queue when disconnected.
	 *
	 * @param skipQueue - When `true`, bypasses the offline queue check
	 *   (used when processing the queue itself to prevent recursion).
	 */
	async saveTournamentRatings(
		userName: string,
		ratings: Array<{ name: string; rating: number; wins?: number; losses?: number }>,
		skipQueue = false,
	): Promise<RatingSaveResult> {
		// Offline: queue for later
		if (!skipQueue && HAS_NAVIGATOR && !navigator.onLine) {
			syncQueue.enqueue("SAVE_RATINGS", { userName, ratings });
			devLog("[TournamentAPI] Offline: queued ratings save");
			return { success: true, savedCount: ratings.length, offline: true };
		}

		return withSupabase<RatingSaveResult>(
			async (client) => {
				if (!userName || !ratings?.length) {
					return { success: false, error: "Missing data" };
				}

				// Resolve name → ID mapping
				const nameStrings = ratings.map((r) => r.name);
				const { data: nameData } = (await client
					.from("cat_name_options")
					.select("id, name")
					.in("name", nameStrings)) as unknown as {
					data: Array<{ id: string | number; name: string }> | null;
					error: unknown;
				};

				const nameToId = new Map<string, string | number>();
				for (const n of nameData ?? []) {
					nameToId.set(n.name, n.id);
				}

				// Build upsert records (only for names we found in the DB)
				const records = ratings
					.filter((r) => nameToId.has(r.name))
					.map((r) => ({
						user_name: userName,
						name_id: String(nameToId.get(r.name)),
						rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
						wins: r.wins ?? 0,
						losses: r.losses ?? 0,
						updated_at: new Date().toISOString(),
					}));

				if (records.length === 0) {
					return { success: false, error: "No valid ratings to save" };
				}

				const { error } = await client
					.from("cat_name_ratings")
					.upsert(records, { onConflict: "user_name,name_id" });

				return { success: !error, savedCount: records.length };
			},
			{ success: false, error: "Supabase offline" },
		);
	},
};

// ═══════════════════════════════════════════════════════════════════════════════
// Elo Rating
// ═══════════════════════════════════════════════════════════════════════════════

export type MatchOutcome = "left" | "right" | "tie";

interface MatchStats {
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
}

interface EloResult {
	newRatingA: number;
	newRatingB: number;
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
}

/**
 * Elo rating calculator with adaptive K-factor.
 *
 * New players (< `NEW_PLAYER_GAME_THRESHOLD` games) get double K-factor
 * so their rating converges faster.
 *
 * @example
 * const elo = new EloRating();
 * const result = elo.calculateNewRatings(1500, 1500, "left");
 * // result.newRatingA > 1500, result.newRatingB < 1500
 */
export class EloRating {
	constructor(
		public readonly defaultRating = ELO_RATING.DEFAULT_RATING,
		public readonly kFactor = ELO_RATING.DEFAULT_K_FACTOR,
	) {}

	/** Expected score of player A against player B (0–1). */
	getExpectedScore(ratingA: number, ratingB: number): number {
		return 1 / (1 + 10 ** ((ratingB - ratingA) / ELO_RATING.RATING_DIVISOR));
	}

	/** Apply the Elo update formula with adaptive K-factor. */
	updateRating(rating: number, expected: number, actual: number, gameCount = 0): number {
		const k =
			gameCount < ELO_RATING.NEW_PLAYER_GAME_THRESHOLD
				? this.kFactor * ELO_RATING.NEW_PLAYER_K_MULTIPLIER
				: this.kFactor;
		return Math.round(rating + k * (actual - expected));
	}

	/**
	 * Calculate new ratings for both players after a match.
	 *
	 * @param ratingA  - Player A's current rating
	 * @param ratingB  - Player B's current rating
	 * @param outcome  - `"left"` = A wins, `"right"` = B wins, `"tie"` = draw
	 * @param stats    - Optional existing win/loss counts
	 */
	calculateNewRatings(
		ratingA: number,
		ratingB: number,
		outcome: MatchOutcome,
		stats?: Partial<MatchStats>,
	): EloResult {
		const expectedA = this.getExpectedScore(ratingA, ratingB);
		const expectedB = this.getExpectedScore(ratingB, ratingA);

		const actualA = outcome === "left" ? 1 : outcome === "right" ? 0 : 0.5;
		const actualB = 1 - actualA;

		return {
			newRatingA: this.updateRating(ratingA, expectedA, actualA),
			newRatingB: this.updateRating(ratingB, expectedB, actualB),
			winsA: (stats?.winsA ?? 0) + (actualA === 1 ? 1 : 0),
			lossesA: (stats?.lossesA ?? 0) + (actualA === 0 ? 1 : 0),
			winsB: (stats?.winsB ?? 0) + (actualB === 1 ? 1 : 0),
			lossesB: (stats?.lossesB ?? 0) + (actualB === 0 ? 1 : 0),
		};
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Preference Sorter
// ═══════════════════════════════════════════════════════════════════════════════

interface MatchPair {
	left: string;
	right: string;
}

/**
 * Round-robin pairwise comparison engine.
 *
 * Generates all unique pairs from a set of items, tracks which have
 * been compared, and supports undo.
 *
 * Total comparisons = `n * (n - 1) / 2`.
 *
 * @example
 * const sorter = new PreferenceSorter(["Luna", "Oliver", "Milo"]);
 * const match = sorter.getNextMatch(); // { left: "Luna", right: "Oliver" }
 * sorter.addPreference("Luna", "Oliver", 1);
 * const next = sorter.getNextMatch();  // { left: "Luna", right: "Milo" }
 */
export class PreferenceSorter {
	readonly preferences = new Map<string, number>();
	currentIndex = 0;
	private lastMatch: string | null = null;

	constructor(public readonly items: string[]) {}

	/**
	 * Convert a flat pair index into (i, j) indices for a triangular matrix.
	 * Returns null if the index is out of bounds.
	 */
	private pairFromIndex(index: number): { i: number; j: number } | null {
		const n = this.items.length;
		let remaining = index;

		for (let i = 0; i < n - 1; i++) {
			const pairsInRow = n - 1 - i;
			if (remaining < pairsInRow) {
				return { i, j: i + 1 + remaining };
			}
			remaining -= pairsInRow;
		}

		return null;
	}

	/** Record a comparison result between two items. */
	addPreference(a: string, b: string, value: number): void {
		const key = `${a}-${b}`;
		this.preferences.set(key, value);
		this.lastMatch = key;
	}

	/** Undo the most recent comparison. */
	undoLastPreference(): void {
		if (this.lastMatch && this.preferences.has(this.lastMatch)) {
			this.preferences.delete(this.lastMatch);
			this.lastMatch = null;
			this.currentIndex = Math.max(0, this.currentIndex - 1);
		}
	}

	/**
	 * Get the next uncompared pair, or `null` if all pairs are done.
	 */
	getNextMatch(): MatchPair | null {
		const n = this.items.length;
		if (n < 2) {
			return null;
		}

		const totalPairs = (n * (n - 1)) / 2;

		while (this.currentIndex < totalPairs) {
			const pair = this.pairFromIndex(this.currentIndex);
			if (!pair) {
				break;
			}

			const a = this.items[pair.i];
			const b = this.items[pair.j];

			if (a && b) {
				const forward = `${a}-${b}`;
				const reverse = `${b}-${a}`;

				if (!this.preferences.has(forward) && !this.preferences.has(reverse)) {
					return { left: a, right: b };
				}
			}

			this.currentIndex++;
		}

		return null;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Exports
// ═══════════════════════════════════════════════════════════════════════════════

/** Calculate which bracket round a match falls in. */
export function calculateBracketRound(totalNames: number, currentMatch: number): number {
	if (totalNames <= 2) {
		return 1;
	}
	const matchesPerRound = Math.ceil(totalNames / 2);
	return Math.ceil(currentMatch / matchesPerRound);
}
