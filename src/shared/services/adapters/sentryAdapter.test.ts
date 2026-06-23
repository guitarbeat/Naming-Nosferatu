import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SentryTelemetryAdapter } from "./sentryAdapter";

describe("SentryTelemetryAdapter", () => {
	let adapter: SentryTelemetryAdapter;
	let mockCaptureException: ReturnType<typeof vi.fn>;

	const originalNodeEnv = process.env.NODE_ENV;

	beforeEach(() => {
		adapter = new SentryTelemetryAdapter();
		mockCaptureException = vi.fn();

		// Mock the global Sentry object
		// @ts-expect-error
		globalThis.Sentry = {
			captureException: mockCaptureException,
		};

		// Reset NODE_ENV and console mocks
		process.env.NODE_ENV = "test";
		vi.spyOn(console, "group").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "groupEnd").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env.NODE_ENV = originalNodeEnv;
		// @ts-expect-error
		globalThis.Sentry = undefined;
	});

	describe("captureException", () => {
		it("should capture exception when Sentry is globally available", () => {
			const error = new Error("Test error");
			const context = "testContext";
			const tags = { myTag: "value" };
			const extra = { myExtra: "extraValue" };

			adapter.captureException(error, context, tags, extra);

			expect(mockCaptureException).toHaveBeenCalledTimes(1);
			expect(mockCaptureException).toHaveBeenCalledWith(error, {
				tags: {
					context,
					myTag: "value",
				},
				extra,
			});
		});

		it("should safely do nothing if Sentry object is missing", () => {
			// @ts-expect-error
			globalThis.Sentry = undefined;
			const error = new Error("Test error");

			expect(() => adapter.captureException(error, "context")).not.toThrow();
			expect(mockCaptureException).not.toHaveBeenCalled();
		});

		it("should safely do nothing if Sentry.captureException is missing", () => {
			// @ts-expect-error
			globalThis.Sentry = {};
			const error = new Error("Test error");

			expect(() => adapter.captureException(error, "context")).not.toThrow();
			expect(mockCaptureException).not.toHaveBeenCalled();
		});

		it("should handle calls without optional tags and extra parameters", () => {
			const error = new Error("Test error");
			const context = "testContext";

			adapter.captureException(error, context);

			expect(mockCaptureException).toHaveBeenCalledTimes(1);
			expect(mockCaptureException).toHaveBeenCalledWith(error, {
				tags: {
					context,
				},
				extra: undefined,
			});
		});
	});

	describe("logError", () => {
		it("should log to console in development environment", () => {
			process.env.NODE_ENV = "development";
			const formattedError = { type: "TestType", userMessage: "Test message" };
			const context = "testContext";

			adapter.logError(formattedError, context);

			expect(console.group).toHaveBeenCalledTimes(1);
			expect(console.group).toHaveBeenCalledWith("🔴 Error [TestType]");
			expect(console.error).toHaveBeenCalledTimes(1);
			expect(console.error).toHaveBeenCalledWith(
				"Context:",
				"testContext",
				"Message:",
				"Test message",
			);
			expect(console.groupEnd).toHaveBeenCalledTimes(1);
		});

		it("should not log to console in non-development environment", () => {
			process.env.NODE_ENV = "production";
			const formattedError = { type: "TestType", userMessage: "Test message" };

			adapter.logError(formattedError, "testContext");

			expect(console.group).not.toHaveBeenCalled();
			expect(console.error).not.toHaveBeenCalled();
			expect(console.groupEnd).not.toHaveBeenCalled();
		});
	});
});
