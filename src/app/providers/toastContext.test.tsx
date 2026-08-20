import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toastContext";

function createWrapper(defaultDuration = 3000, maxToasts = 3, position: "top-right" = "top-right") {
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<ToastProvider defaultDuration={defaultDuration} maxToasts={maxToasts} position={position}>
				{children}
			</ToastProvider>
		);
	};
}

describe("ToastContext", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		act(() => {
			vi.runOnlyPendingTimers();
		});
		vi.useRealTimers();
	});

	describe("useToast", () => {
		it("initializes with empty toasts", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(),
			});

			expect(result.current.toasts).toHaveLength(0);
		});

		it("shows a toast with default options", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current.showToast("Test message");
			});

			expect(result.current.toasts).toHaveLength(1);
			expect(result.current.toasts[0]).toMatchObject({
				message: "Test message",
				type: "info",
				duration: 3000,
				autoDismiss: true,
			});
		});

		it("shows success, error, info, warning toasts", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current.showSuccess("Success message");
				result.current.showError("Error message");
				result.current.showInfo("Info message");
				result.current.showWarning("Warning message");
			});

			expect(result.current.toasts).toHaveLength(3); // capped at maxToasts=3
			expect(result.current.toasts[0].type).toBe("warning"); // most recent first
			expect(result.current.toasts[1].type).toBe("info");
			expect(result.current.toasts[2].type).toBe("error");
		});

		it("limits the number of toasts to maxToasts", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(3000, 2),
			});

			act(() => {
				result.current.showToast("1");
				result.current.showToast("2");
				result.current.showToast("3");
			});

			expect(result.current.toasts).toHaveLength(2);
			expect(result.current.toasts[0].message).toBe("3");
			expect(result.current.toasts[1].message).toBe("2");
		});

		it("hides a specific toast", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(),
			});

			let id1: string;
			act(() => {
				id1 = result.current.showToast("1");
				result.current.showToast("2");
			});

			expect(result.current.toasts).toHaveLength(2);

			act(() => {
				result.current.hideToast(id1);
			});

			expect(result.current.toasts).toHaveLength(1);
			expect(result.current.toasts[0].message).toBe("2");
		});

		it("clears all toasts", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(),
			});

			act(() => {
				result.current.showToast("1");
				result.current.showToast("2");
			});

			expect(result.current.toasts).toHaveLength(2);

			act(() => {
				result.current.clearToasts();
			});

			expect(result.current.toasts).toHaveLength(0);
		});

		it("auto-dismisses toasts after duration", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(1000),
			});

			act(() => {
				result.current.showToast("Test", "info", { duration: 1000 });
			});

			expect(result.current.toasts).toHaveLength(1);

			act(() => {
				vi.advanceTimersByTime(500);
			});
			expect(result.current.toasts).toHaveLength(1);

			act(() => {
				vi.advanceTimersByTime(500);
			});
			expect(result.current.toasts).toHaveLength(0);
		});

		it("does not auto-dismiss when autoDismiss is false", () => {
			const { result } = renderHook(() => useToast(), {
				wrapper: createWrapper(1000),
			});

			act(() => {
				result.current.showToast("Test", "info", { autoDismiss: false });
			});

			expect(result.current.toasts).toHaveLength(1);

			act(() => {
				vi.advanceTimersByTime(5000);
			});
			expect(result.current.toasts).toHaveLength(1);
		});
	});

	describe("ToastProvider DOM", () => {
		function ToastProbe() {
			const { showSuccess } = useToast();
			return (
				<button type="button" onClick={() => showSuccess("DOM Toast Message")}>
					Trigger DOM toast
				</button>
			);
		}

		it("renders toasts in the DOM", async () => {
			render(
				<ToastProvider defaultDuration={3000} maxToasts={3} position="bottom-right">
					<ToastProbe />
				</ToastProvider>,
			);

			expect(screen.queryByRole("alert")).not.toBeInTheDocument();

			act(() => {
				fireEvent.click(screen.getByRole("button", { name: "Trigger DOM toast" }));
			});

			// Since we use fake timers globally, findByRole will timeout waiting for real time unless we use a synchronous query or advance timers.
			// Let's use getByRole directly since state updates are wrapped in act() and should be synchronous in the test environment (unless they rely on promises).
			const alert = screen.getByRole("alert");
			expect(alert).toHaveTextContent("DOM Toast Message");
		});

		it("allows manual dismissal via DOM button", async () => {
			render(
				<ToastProvider defaultDuration={3000} maxToasts={3} position="top-right">
					<ToastProbe />
				</ToastProvider>,
			);

			act(() => {
				fireEvent.click(screen.getByRole("button", { name: "Trigger DOM toast" }));
			});

			const alert = screen.getByRole("alert");
			expect(alert).toBeInTheDocument();

			const dismissButton = screen.getByRole("button", { name: "Dismiss" });
			act(() => {
				fireEvent.click(dismissButton);
			});

			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
	});
});
