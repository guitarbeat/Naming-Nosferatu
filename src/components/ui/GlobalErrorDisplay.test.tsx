import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import useAppStore from "@/store";
import { GlobalErrorDisplay } from "./GlobalErrorDisplay";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("GlobalErrorDisplay component", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);

		// Reset error state in store
		act(() => {
			useAppStore.getState().errorActions.clearError();
		});

		return () => {
			container.remove();
		};
	});

	it("renders nothing when there is no current error", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(<GlobalErrorDisplay />);
		});

		expect(container.innerHTML).toBe("");

		await act(async () => {
			root.unmount();
		});
	});

	it("renders error message when an error string exists in store", async () => {
		act(() => {
			useAppStore.getState().errorActions.setError("Something went wrong!");
		});

		const root = createRoot(container);
		await act(async () => {
			root.render(<GlobalErrorDisplay />);
		});

		expect(container.textContent).toContain("Something went wrong!");

		await act(async () => {
			root.unmount();
		});
	});

	it("clears error when dismiss button is clicked", async () => {
		act(() => {
			useAppStore.getState().errorActions.setError("Dismissable error");
		});

		const root = createRoot(container);
		await act(async () => {
			root.render(<GlobalErrorDisplay />);
		});

		expect(container.textContent).toContain("Dismissable error");

		const dismissButton = container.querySelector('button[aria-label="Dismiss error"]');
		expect(dismissButton).not.toBeNull();

		await act(async () => {
			dismissButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(useAppStore.getState().errors.current).toBeNull();
		expect(container.innerHTML).toBe("");

		await act(async () => {
			root.unmount();
		});
	});
});
