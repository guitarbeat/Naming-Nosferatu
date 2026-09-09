import { describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
	it("logs info messages", () => {
		const spy = vi.spyOn(console, "info").mockImplementation(() => {});
		logger.info("test info");
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it("logs warn messages", () => {
		const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
		logger.warn("test warn");
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it("logs error messages", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		logger.error("test error");
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it("handles debug without crashing", () => {
		expect(() => logger.debug("test debug")).not.toThrow();
	});

	it("handles multiple arguments", () => {
		const spy = vi.spyOn(console, "info").mockImplementation(() => {});
		logger.info("arg1", "arg2", { key: "val" });
		expect(spy).toHaveBeenCalledWith("[INFO]", "arg1", "arg2", { key: "val" });
		spy.mockRestore();
	});
});
