import { afterEach, describe, expect, it } from "vitest";
import {
	determineErrorType,
	determineSeverity,
	ERROR_SEVERITY,
	ERROR_TYPES,
} from "./errorClassification";

describe("errorClassification", () => {
	describe("determineErrorType", () => {
		const originalNavigator = global.navigator;

		afterEach(() => {
			global.navigator = originalNavigator;
		});

		it("returns NETWORK if navigator is offline", () => {
			global.navigator = { onLine: false } as unknown as Navigator;
			expect(determineErrorType(new Error("test"))).toBe(ERROR_TYPES.NETWORK);
		});

		it("returns UNKNOWN for non-object errors", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType(null)).toBe(ERROR_TYPES.UNKNOWN);
			expect(determineErrorType("string error")).toBe(ERROR_TYPES.UNKNOWN);
			expect(determineErrorType(123)).toBe(ERROR_TYPES.UNKNOWN);
		});

		it("returns AUTH for PGRST301 and PGRST302", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ code: "PGRST301" })).toBe(ERROR_TYPES.AUTH);
			expect(determineErrorType({ code: "PGRST302" })).toBe(ERROR_TYPES.AUTH);
		});

		it("returns VALIDATION for PGRST116 and PGRST117", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ code: "PGRST116" })).toBe(ERROR_TYPES.VALIDATION);
			expect(determineErrorType({ code: "PGRST117" })).toBe(ERROR_TYPES.VALIDATION);
		});

		it("returns NETWORK for NETWORK_ERROR code or NetworkError name", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ code: "NETWORK_ERROR" })).toBe(ERROR_TYPES.NETWORK);
			expect(determineErrorType({ name: "NetworkError" })).toBe(ERROR_TYPES.NETWORK);
		});

		it("returns NETWORK for TypeError with fetch in message", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ name: "TypeError", message: "failed to fetch" })).toBe(
				ERROR_TYPES.NETWORK,
			);
		});

		it("returns NETWORK for TimeoutError or AbortError with timeout in message", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ name: "TimeoutError" })).toBe(ERROR_TYPES.NETWORK);
			expect(
				determineErrorType({
					name: "AbortError",
					message: "operation timeout",
				}),
			).toBe(ERROR_TYPES.NETWORK);
		});

		it("returns NETWORK for status 0 or 500", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ status: 0 })).toBe(ERROR_TYPES.NETWORK);
			expect(determineErrorType({ status: 500 })).toBe(ERROR_TYPES.NETWORK);
		});

		it("returns DATABASE for errors with database or supabase in message", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ message: "database connection failed" })).toBe(
				ERROR_TYPES.DATABASE,
			);
			expect(determineErrorType({ message: "supabase error" })).toBe(ERROR_TYPES.DATABASE);
		});

		it("returns RUNTIME for TypeError or ReferenceError without fetch", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(
				determineErrorType({
					name: "TypeError",
					message: "Cannot read property",
				}),
			).toBe(ERROR_TYPES.RUNTIME);
			expect(determineErrorType({ name: "ReferenceError" })).toBe(ERROR_TYPES.RUNTIME);
		});

		it("returns VALIDATION for VALIDATION_ERROR code or message", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ code: "VALIDATION_ERROR" })).toBe(ERROR_TYPES.VALIDATION);
			expect(determineErrorType({ message: "validation failed" })).toBe(ERROR_TYPES.VALIDATION);
		});

		it("returns UNKNOWN for unhandled objects", () => {
			global.navigator = { onLine: true } as unknown as Navigator;
			expect(determineErrorType({ some: "field" })).toBe(ERROR_TYPES.UNKNOWN);
		});
	});

	describe("determineSeverity", () => {
		it("returns CRITICAL if metadata.isCritical is true", () => {
			expect(determineSeverity(ERROR_TYPES.UNKNOWN, { isCritical: true })).toBe(
				ERROR_SEVERITY.CRITICAL,
			);
		});

		it("returns HIGH if metadata.affectsUserData is true", () => {
			expect(determineSeverity(ERROR_TYPES.UNKNOWN, { affectsUserData: true })).toBe(
				ERROR_SEVERITY.HIGH,
			);
		});

		it("returns correct severity based on ERROR_TYPES without metadata", () => {
			expect(determineSeverity(ERROR_TYPES.AUTH)).toBe(ERROR_SEVERITY.HIGH);
			expect(determineSeverity(ERROR_TYPES.DATABASE)).toBe(ERROR_SEVERITY.MEDIUM);
			expect(determineSeverity(ERROR_TYPES.NETWORK)).toBe(ERROR_SEVERITY.MEDIUM);
			expect(determineSeverity(ERROR_TYPES.RUNTIME)).toBe(ERROR_SEVERITY.MEDIUM);
			expect(determineSeverity(ERROR_TYPES.VALIDATION)).toBe(ERROR_SEVERITY.LOW);
			expect(determineSeverity(ERROR_TYPES.UNKNOWN)).toBe(ERROR_SEVERITY.MEDIUM);
		});
	});
});
