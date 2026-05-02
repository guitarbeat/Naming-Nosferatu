/**
 * Centralized error handling utilities for Supabase operations.
 * Consolidates error patterns used across multiple services.
 */

/**
 * Throws a descriptive Error when a Supabase RPC returns an error object.
 * Used by ratingService and statsService for consistent error handling.
 */
export function throwOnRpcError(
	error: { message?: string } | null,
	fallbackMsg: string,
): void {
	if (error) {
		throw new Error(error.message || fallbackMsg);
	}
}

/**
 * Throws an error when RPC data is missing or falsy.
 * Prevents silent failures when operations appear to succeed but return no data.
 */
export function throwOnMissingData(
	data: unknown,
	fallbackMsg: string,
): void {
	if (!data) {
		throw new Error(fallbackMsg);
	}
}

/**
 * Throws when the RPC returns a non-true result.
 * Used for operations that return boolean success indicators.
 */
export function throwOnFailureResponse(data: unknown, message: string): void {
	if (data !== true) {
		throw new Error(message);
	}
}
