import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UndoBanner } from "../UndoBanner";

// Mock dependencies
vi.mock("../../../shared/components/Button/Button", () => ({
	default: ({
		onClick,
		children,
		...props
	}: {
		onClick: () => void;
		children: React.ReactNode;
	}) => (
		<button onClick={onClick} {...props} type="button">
			{children}
		</button>
	),
}));

// Mock styles
vi.mock("../Tournament.module.css", () => ({
	default: {
		undoBanner: "undoBanner",
		undoTimer: "undoTimer",
		undoButton: "undoButton",
	},
}));

describe("UndoBanner", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders correctly when active", () => {
		const expiresAt = Date.now() + 2000;
		render(
			<UndoBanner
				undoExpiresAt={expiresAt}
				onUndo={() => {}}
				onExpire={() => {}}
			/>,
		);

		expect(screen.getByText(/Vote recorded/)).toBeInTheDocument();
		expect(screen.getByText(/Undo/)).toBeInTheDocument();
	});

	it("calls onUndo when button is clicked", () => {
		const onUndo = vi.fn();
		const expiresAt = Date.now() + 2000;
		render(
			<UndoBanner
				undoExpiresAt={expiresAt}
				onUndo={onUndo}
				onExpire={() => {}}
			/>,
		);

		screen.getByRole("button").click();
		expect(onUndo).toHaveBeenCalledTimes(1);
	});

	it("calls onExpire when time runs out", () => {
		const onExpire = vi.fn();
		// Use a fixed start time
		const now = 100000;
		vi.setSystemTime(now);

		const expiresAt = now + 1000; // 1 second duration

		render(
			<UndoBanner
				undoExpiresAt={expiresAt}
				onUndo={() => {}}
				onExpire={onExpire}
			/>,
		);

		// Initial check - should be visible
		expect(screen.queryByText(/Vote recorded/)).toBeInTheDocument();

		// Fast forward past expiration
		act(() => {
			vi.advanceTimersByTime(1100);
		});

		expect(onExpire).toHaveBeenCalled();
	});

	it("updates the timer display", () => {
		const now = 100000;
		vi.setSystemTime(now);

		const duration = 2000;
		const expiresAt = now + duration;

		render(
			<UndoBanner
				undoExpiresAt={expiresAt}
				onUndo={() => {}}
				onExpire={() => {}}
			/>,
		);

		// Initially should show full duration (approx)
		// 2.0s
		expect(screen.getByText(/2.0s/)).toBeInTheDocument();

		// Advance 400ms (because INTERVAL is 200ms, it ticks every 200ms)
		// 2000 - 400 = 1600 -> 1.6s
		act(() => {
			vi.advanceTimersByTime(400);
		});
		expect(screen.getByText(/1.6s/)).toBeInTheDocument();
	});
});
