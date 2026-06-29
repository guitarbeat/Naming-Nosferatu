import { describe, expect, it } from "vitest";
import {
	SUPABASE_UNAVAILABLE_MSG,
	throwOnFailureResponse,
	throwOnRpcError,
	throwSupabaseUnavailable,
} from "./errorUtils";

describe("errorUtils", () => {
	describe("throwSupabaseUnavailable", () => {
		it("throws an error with the expected message", () => {
			expect(() => throwSupabaseUnavailable()).toThrowError(SUPABASE_UNAVAILABLE_MSG);
		});
	});

	describe("throwOnRpcError", () => {
		it("does not throw when error is null", () => {
			expect(() => throwOnRpcError(null, "Fallback error")).not.toThrow();
		});

		it("throws the specific error message when error object has a message", () => {
			const error = { message: "Database constraint failed" };
			expect(() => throwOnRpcError(error, "Fallback error")).toThrowError(
				"Database constraint failed",
			);
		});

		it("throws the fallback message when error object lacks a message", () => {
			const error = {};
			expect(() => throwOnRpcError(error, "Fallback error")).toThrowError("Fallback error");
		});
	});

	describe("throwOnFailureResponse", () => {
		it("does not throw when data is true", () => {
			expect(() => throwOnFailureResponse(true, "Operation failed")).not.toThrow();
		});

		it("throws the specific message when data is false", () => {
			expect(() => throwOnFailureResponse(false, "Operation failed")).toThrowError(
				"Operation failed",
			);
		});

		it("throws the specific message when data is null", () => {
			expect(() => throwOnFailureResponse(null, "Operation failed")).toThrowError(
				"Operation failed",
			);
		});

		it("throws the specific message when data is undefined", () => {
			expect(() => throwOnFailureResponse(undefined, "Operation failed")).toThrowError(
				"Operation failed",
			);
		});

		it("throws the specific message when data is an object", () => {
			expect(() => throwOnFailureResponse({ success: true }, "Operation failed")).toThrowError(
				"Operation failed",
			);
		});
	});
});
