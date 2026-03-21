import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CircuitBreaker, ErrorManager } from "./errorManager";

describe("CircuitBreaker", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should initialize with CLOSED state", () => {
		const cb = new CircuitBreaker();
		expect(cb.state).toBe("CLOSED");
		expect(cb.failureCount).toBe(0);
	});

	it("should successfully execute a function when CLOSED", async () => {
		const cb = new CircuitBreaker();
		const fn = vi.fn().mockResolvedValue("success");

		const result = await cb.execute(fn);

		expect(result).toBe("success");
		expect(cb.state).toBe("CLOSED");
		expect(cb.failureCount).toBe(0);
		expect(fn).toHaveBeenCalledOnce();
	});

	it("should transition to OPEN after failureThreshold is reached", async () => {
		const threshold = 3;
		const cb = new CircuitBreaker(threshold);
		const error = new Error("Test error");
		const fn = vi.fn().mockRejectedValue(error);

		// Fail threshold - 1 times
		for (let i = 0; i < threshold - 1; i++) {
			await expect(cb.execute(fn)).rejects.toThrow("Test error");
			expect(cb.state).toBe("CLOSED");
			expect(cb.failureCount).toBe(i + 1);
		}

		// Fail the threshold-th time
		await expect(cb.execute(fn)).rejects.toThrow("Test error");
		expect(cb.state).toBe("OPEN");
		expect(cb.failureCount).toBe(threshold);
	});

	it("should reject immediately when OPEN without calling the function", async () => {
		const cb = new CircuitBreaker(2);
		const fn = vi.fn().mockRejectedValue(new Error("Test error"));

		await expect(cb.execute(fn)).rejects.toThrow("Test error");
		await expect(cb.execute(fn)).rejects.toThrow("Test error");

		expect(cb.state).toBe("OPEN");

		const nextFn = vi.fn().mockResolvedValue("should not be called");
		await expect(cb.execute(nextFn)).rejects.toThrow("Circuit breaker is OPEN");
		expect(nextFn).not.toHaveBeenCalled();
	});

	it("should transition to HALF_OPEN after resetTimeout", async () => {
		const timeout = 1000;
		const cb = new CircuitBreaker(1, timeout);
		const fn = vi.fn().mockRejectedValue(new Error("Test error"));

		// Trip the circuit
		await expect(cb.execute(fn)).rejects.toThrow("Test error");
		expect(cb.state).toBe("OPEN");

		// Advance time by timeout
		vi.advanceTimersByTime(timeout);

		// The first call after timeout should be allowed to try and will succeed here
		const successFn = vi.fn().mockResolvedValue("success recovery");
		const result = await cb.execute(successFn);

		// During execution of execute(fn), the state transitions to HALF_OPEN
		// Then since the fn succeeds, it transitions back to CLOSED
		expect(result).toBe("success recovery");
		expect(cb.state).toBe("CLOSED");
		expect(cb.failureCount).toBe(0);
		expect(successFn).toHaveBeenCalledOnce();
	});

	it("should transition from HALF_OPEN back to OPEN if it fails again", async () => {
		const timeout = 1000;
		const cb = new CircuitBreaker(1, timeout);
		const failFn = vi.fn().mockRejectedValue(new Error("Test error"));

		// Trip the circuit
		await expect(cb.execute(failFn)).rejects.toThrow("Test error");
		expect(cb.state).toBe("OPEN");

		// Advance time by timeout
		vi.advanceTimersByTime(timeout);

		// Try again, but it fails
		const anotherFailFn = vi.fn().mockRejectedValue(new Error("Another error"));
		await expect(cb.execute(anotherFailFn)).rejects.toThrow("Another error");

		// State goes back to OPEN immediately, and failure count increments (or stays at threshold depending on implementation, here it increments)
		expect(cb.state).toBe("OPEN");
		expect(cb.failureCount).toBe(2);
	});
});

describe("ErrorManager", () => {
	afterEach(() => {
		ErrorManager.setErrorService(null);
		vi.restoreAllMocks();
	});

	it("sends captured errors to the configured error service", () => {
		const captureException = vi.fn();
		ErrorManager.setErrorService({ captureException });

		ErrorManager.handleError(new Error("boom"), "Unit Test");

		expect(captureException).toHaveBeenCalledTimes(1);
		const [capturedError, context] = captureException.mock.calls[0] ?? [];
		expect(capturedError).toBeInstanceOf(Error);
		expect((capturedError as Error).name).toBe("Unit Test");
		expect(context).toEqual(
			expect.objectContaining({
				tags: expect.objectContaining({ context: "Unit Test" }),
			}),
		);
	});

	it("ignores resource load errors in the global handler", () => {
		const handleSpy = vi.spyOn(ErrorManager, "handleError");
		const listeners = new Map<string, EventListener>();
		const addSpy = vi.spyOn(globalThis, "addEventListener").mockImplementation((type, listener) => {
			listeners.set(type, listener as EventListener);
		});
		const removeSpy = vi
			.spyOn(globalThis, "removeEventListener")
			.mockImplementation((type, listener) => {
				if (listeners.get(type) === listener) {
					listeners.delete(type);
				}
			});

		const cleanup = ErrorManager.setupGlobalErrorHandling();

		const errorEvent = new Event("error");
		Object.defineProperty(errorEvent, "target", {
			value: document.createElement("img"),
		});
		Object.defineProperty(errorEvent, "error", {
			value: undefined,
		});

		listeners.get("error")?.(errorEvent);

		expect(handleSpy).not.toHaveBeenCalled();

		cleanup();
		addSpy.mockRestore();
		removeSpy.mockRestore();
	});

	it("captures runtime errors and unhandled rejections", () => {
		const handleSpy = vi.spyOn(ErrorManager, "handleError");
		const listeners = new Map<string, EventListener>();
		const addSpy = vi.spyOn(globalThis, "addEventListener").mockImplementation((type, listener) => {
			listeners.set(type, listener as EventListener);
		});

		const cleanup = ErrorManager.setupGlobalErrorHandling();

		const runtimeError = new Error("Runtime boom");
		const errorEvent = new ErrorEvent("error", {
			message: "Runtime boom",
			error: runtimeError,
			filename: "app.ts",
			lineno: 10,
			colno: 5,
		});

		listeners.get("error")?.(errorEvent);

		expect(handleSpy).toHaveBeenCalledWith(
			runtimeError,
			"Global",
			expect.objectContaining({
				isCritical: true,
				filename: "app.ts",
				line: 10,
				column: 5,
			}),
		);

		const rejectionError = new Error("Promise boom");
		const rejectionEvent = { reason: rejectionError } as PromiseRejectionEvent;
		listeners.get("unhandledrejection")?.(rejectionEvent as unknown as Event);

		expect(handleSpy).toHaveBeenCalledWith(
			rejectionError,
			"Global",
			expect.objectContaining({ isCritical: true }),
		);

		cleanup();
		addSpy.mockRestore();
	});
});
