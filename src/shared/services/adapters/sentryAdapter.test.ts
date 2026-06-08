import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SentryTelemetryAdapter } from "./sentryAdapter";

describe("SentryTelemetryAdapter", () => {
	let adapter: SentryTelemetryAdapter;
	let originalEnv: string | undefined;

	beforeEach(() => {
		adapter = new SentryTelemetryAdapter();
		originalEnv = process.env.NODE_ENV;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		process.env.NODE_ENV = originalEnv;
		vi.restoreAllMocks();
	});

	describe("captureException", () => {
		it("should call globalThis.Sentry.captureException when Sentry is available", () => {
			const captureExceptionMock = vi.fn();
			vi.stubGlobal("Sentry", { captureException: captureExceptionMock });

			const error = new Error("Test error");
			adapter.captureException(error, "TestContext", { tag1: "val1" }, { extra1: "val2" });

			expect(captureExceptionMock).toHaveBeenCalledWith(error, {
				tags: {
					context: "TestContext",
					tag1: "val1",
				},
				extra: {
					extra1: "val2",
				},
			});
		});

		it("should not throw when Sentry is not available globally", () => {
			vi.stubGlobal("Sentry", undefined);
			const error = new Error("Test error");

			expect(() => {
				adapter.captureException(error, "TestContext");
			}).not.toThrow();
		});

		it("should not throw when Sentry.captureException is not a function", () => {
			vi.stubGlobal("Sentry", { captureException: undefined });
			const error = new Error("Test error");

			expect(() => {
				adapter.captureException(error, "TestContext");
			}).not.toThrow();
		});
	});

	describe("logError", () => {
		it("should log to console in development environment", () => {
			process.env.NODE_ENV = "development";
			const groupMock = vi.spyOn(console, "group").mockImplementation(() => {});
			const errorMock = vi.spyOn(console, "error").mockImplementation(() => {});
			const groupEndMock = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

			adapter.logError({ type: "TEST_ERROR", userMessage: "Test message" }, "TestContext");

			expect(groupMock).toHaveBeenCalledWith("🔴 Error [TEST_ERROR]");
			expect(errorMock).toHaveBeenCalledWith("Context:", "TestContext", "Message:", "Test message");
			expect(groupEndMock).toHaveBeenCalled();
		});

		it("should not log to console in non-development environment", () => {
			process.env.NODE_ENV = "production";
			const groupMock = vi.spyOn(console, "group").mockImplementation(() => {});
			const errorMock = vi.spyOn(console, "error").mockImplementation(() => {});
			const groupEndMock = vi.spyOn(console, "groupEnd").mockImplementation(() => {});

			adapter.logError({ type: "TEST_ERROR", userMessage: "Test message" }, "TestContext");

			expect(groupMock).not.toHaveBeenCalled();
			expect(errorMock).not.toHaveBeenCalled();
			expect(groupEndMock).not.toHaveBeenCalled();
		});
	});
});
