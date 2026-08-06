import { describe, expect, it } from "vitest";
import {
	ERROR_SEVERITY,
	ERROR_TYPES,
	type ErrorSeverity,
	type ErrorType,
} from "./errorClassification";
import { getUserFriendlyMessage, USER_FRIENDLY_MESSAGES } from "./errorMessages";

describe("getUserFriendlyMessage", () => {
	it("returns specific message for known error type and severity", () => {
		// Test one from each type just to be sure it looks up correctly
		expect(
			getUserFriendlyMessage(ERROR_TYPES.NETWORK, ERROR_SEVERITY.CRITICAL, "Any Context"),
		).toBe(USER_FRIENDLY_MESSAGES[ERROR_TYPES.NETWORK][ERROR_SEVERITY.CRITICAL]);

		expect(
			getUserFriendlyMessage(ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM, "Any Context"),
		).toBe(USER_FRIENDLY_MESSAGES[ERROR_TYPES.VALIDATION][ERROR_SEVERITY.MEDIUM]);
	});

	it("returns fallback message from CONTEXT_MESSAGES when type or severity is not found", () => {
		// Mock an unknown type (should use fallback)
		expect(
			getUserFriendlyMessage(
				"UNKNOWN_TEST_TYPE" as ErrorType,
				ERROR_SEVERITY.LOW,
				"Tournament Completion",
			),
		).toBe("Unable to complete tournament");

		// Mock a known type but unknown severity
		expect(
			getUserFriendlyMessage(
				ERROR_TYPES.NETWORK,
				"UNKNOWN_SEVERITY" as ErrorSeverity,
				"Tournament Setup",
			),
		).toBe("Unable to set up tournament");
	});

	it("returns 'An error occurred' when both type/severity and context are unknown", () => {
		expect(
			getUserFriendlyMessage(
				"UNKNOWN_TEST_TYPE" as ErrorType,
				ERROR_SEVERITY.LOW,
				"Unknown Context",
			),
		).toBe("An error occurred");
	});

	it("handles undefined or empty string contexts gracefully", () => {
		expect(getUserFriendlyMessage("UNKNOWN_TEST_TYPE" as ErrorType, ERROR_SEVERITY.LOW, "")).toBe(
			"An error occurred",
		);

		expect(
			getUserFriendlyMessage(
				"UNKNOWN_TEST_TYPE" as ErrorType,
				ERROR_SEVERITY.LOW,
				undefined as unknown as string,
			),
		).toBe("An error occurred");
	});
});
