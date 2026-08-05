import {
	ERROR_SEVERITY,
	ERROR_TYPES,
	type ErrorSeverity,
	type ErrorType,
} from "./errorClassification";

export const USER_FRIENDLY_MESSAGES: Record<ErrorType, Record<ErrorSeverity, string>> = {
	[ERROR_TYPES.NETWORK]: {
		[ERROR_SEVERITY.LOW]: "Connection is slow. Please try again.",
		[ERROR_SEVERITY.MEDIUM]: "Having trouble connecting. Check your internet and try again.",
		[ERROR_SEVERITY.HIGH]: "Can't connect right now. Please try again in a moment.",
		[ERROR_SEVERITY.CRITICAL]: "Service is temporarily unavailable. Please try again later.",
	},
	[ERROR_TYPES.AUTH]: {
		[ERROR_SEVERITY.LOW]: "Please log in again to continue.",
		[ERROR_SEVERITY.MEDIUM]: "Your session expired. Please log in again.",
		[ERROR_SEVERITY.HIGH]: "Sign-in failed. Please check your credentials and try again.",
		[ERROR_SEVERITY.CRITICAL]:
			"Unable to access your account. Please contact support if this continues.",
	},
	[ERROR_TYPES.DATABASE]: {
		[ERROR_SEVERITY.LOW]: "Data is loading slowly. Please wait a moment.",
		[ERROR_SEVERITY.MEDIUM]: "Having trouble loading data. Please refresh the page.",
		[ERROR_SEVERITY.HIGH]: "Unable to load data right now. Please try again later.",
		[ERROR_SEVERITY.CRITICAL]: "Data service is temporarily unavailable. Please try again later.",
	},
	[ERROR_TYPES.VALIDATION]: {
		[ERROR_SEVERITY.LOW]: "Please check your input and try again.",
		[ERROR_SEVERITY.MEDIUM]: "There's an issue with your input. Please review and try again.",
		[ERROR_SEVERITY.HIGH]: "Invalid information entered. Please check your data and try again.",
		[ERROR_SEVERITY.CRITICAL]:
			"Unable to process your request. Please contact support if this continues.",
	},
	[ERROR_TYPES.RUNTIME]: {
		[ERROR_SEVERITY.LOW]: "Something went wrong. Please try again.",
		[ERROR_SEVERITY.MEDIUM]: "An error occurred. Please refresh the page and try again.",
		[ERROR_SEVERITY.HIGH]: "Something went wrong. Please try again in a moment.",
		[ERROR_SEVERITY.CRITICAL]:
			"We're experiencing technical difficulties. Please try again later or contact support.",
	},
	[ERROR_TYPES.UNKNOWN]: {
		[ERROR_SEVERITY.LOW]: "Something unexpected happened. Please try again.",
		[ERROR_SEVERITY.MEDIUM]: "An unexpected error occurred. Please try again.",
		[ERROR_SEVERITY.HIGH]: "Something went wrong. Please try again later.",
		[ERROR_SEVERITY.CRITICAL]:
			"We encountered an unexpected issue. Please try again later or contact support.",
	},
};

const CONTEXT_MESSAGES: Record<string, string> = {
	"Tournament Completion": "Unable to complete tournament",
	"Tournament Setup": "Unable to set up tournament",
	"Rating Update": "Unable to update ratings",
	Login: "Unable to log in",
	"Profile Load": "Unable to load profile",
	"Save Rankings": "Unable to save rankings",
	vote: "Unable to submit vote",
};

export function getUserFriendlyMessage(
	type: ErrorType,
	severity: ErrorSeverity,
	context: string,
): string {
	const fallback = CONTEXT_MESSAGES[context] || "An error occurred";
	return USER_FRIENDLY_MESSAGES[type]?.[severity] || fallback;
}
