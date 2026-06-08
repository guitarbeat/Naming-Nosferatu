import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type TelemetryAdapter,
	getTelemetryAdapter,
	registerTelemetryAdapter,
} from "./telemetrySeam";

describe("telemetrySeam", () => {
	let originalAdapter: TelemetryAdapter;

	beforeEach(() => {
		originalAdapter = getTelemetryAdapter();
	});

	afterEach(() => {
		registerTelemetryAdapter(originalAdapter);
		vi.restoreAllMocks();
	});

	describe("ConsoleTelemetryAdapter (default adapter)", () => {
		it("should capture exception and log to console.error", () => {
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const adapter = getTelemetryAdapter();
			const error = new Error("Test exception");
			const tags = { tag1: "val1" };
			const extra = { extra1: "val2" };

			adapter.captureException(error, "TestContext", tags, extra);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"🔴 [Telemetry Exception] Context:",
				"TestContext",
				error,
				"Tags:",
				tags,
				"Extra:",
				extra,
			);
		});

		it("should log error and log to console.error", () => {
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const adapter = getTelemetryAdapter();
			const formattedError = { type: "TEST_TYPE", userMessage: "Test user message" };

			adapter.logError(formattedError, "TestContext");

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"🔴 [Telemetry Error] [TEST_TYPE] Context: TestContext. Msg: Test user message",
			);
		});
	});

	describe("Adapter Management", () => {
		it("should allow registering and retrieving a custom adapter", () => {
			const customAdapter: TelemetryAdapter = {
				captureException: vi.fn(),
				logError: vi.fn(),
			};

			registerTelemetryAdapter(customAdapter);

			const activeAdapter = getTelemetryAdapter();
			expect(activeAdapter).toBe(customAdapter);

			// Verify it's actually the one we set by calling a method
			const error = new Error("Custom error");
			activeAdapter.captureException(error, "CustomContext");
			expect(customAdapter.captureException).toHaveBeenCalledWith(error, "CustomContext");
		});
	});
});
