import { describe, expect, it } from "vitest";
import {
	SUPABASE_UNAVAILABLE_MSG,
	throwOnFailureResponse,
	throwOnRpcError,
	throwSupabaseUnavailable,
} from "./errorUtils";

describe("errorUtils", () => {
	describe("throwSupabaseUnavailable", () => {
		it("should throw an error with the correct message", () => {
			expect(() => throwSupabaseUnavailable()).toThrowError(SUPABASE_UNAVAILABLE_MSG);
		});
	});

	describe("throwOnRpcError", () => {
		it("should not throw if error is null", () => {
			expect(() => throwOnRpcError(null, "Fallback message")).not.toThrow();
		});

		it("should throw error with the provided error message", () => {
			const error = { message: "Custom error message" };
			expect(() => throwOnRpcError(error, "Fallback message")).toThrowError("Custom error message");
		});

		it("should throw error with the fallback message if error object has no message", () => {
			const error = {};
			expect(() => throwOnRpcError(error, "Fallback message")).toThrowError("Fallback message");
		});
	});

	describe("throwOnFailureResponse", () => {
		it("should not throw if data is true", () => {
			expect(() => throwOnFailureResponse(true, "Failure message")).not.toThrow();
		});

		it("should throw if data is false", () => {
			expect(() => throwOnFailureResponse(false, "Failure message")).toThrowError(
				"Failure message",
			);
		});

		it("should throw if data is null", () => {
			expect(() => throwOnFailureResponse(null, "Failure message")).toThrowError("Failure message");
		});

		it("should throw if data is undefined", () => {
			expect(() => throwOnFailureResponse(undefined, "Failure message")).toThrowError(
				"Failure message",
			);
		});

		it("should throw if data is a truthy value other than boolean true", () => {
			expect(() => throwOnFailureResponse("true", "Failure message")).toThrowError(
				"Failure message",
			);
			expect(() => throwOnFailureResponse(1, "Failure message")).toThrowError("Failure message");
			expect(() => throwOnFailureResponse({}, "Failure message")).toThrowError("Failure message");
		});
	});
});
