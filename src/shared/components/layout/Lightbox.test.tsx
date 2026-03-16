import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Lightbox } from "./Lightbox";

function LightboxHarness() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button type="button" onClick={() => setOpen(true)}>
				Open lightbox
			</button>
			{open && (
				<Lightbox
					images={["/cats/one.jpg"]}
					currentIndex={0}
					onClose={() => setOpen(false)}
					onNavigate={() => undefined}
				/>
			)}
		</>
	);
}

describe("Lightbox", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("restores focus to the opener after closing", () => {
		render(<LightboxHarness />);
		const opener = screen.getByRole("button", { name: "Open lightbox" });

		opener.focus();
		fireEvent.click(opener);

		act(() => {
			vi.advanceTimersByTime(100);
		});

		const closeButton = screen.getByRole("button", {
			name: "Close lightbox and return to gallery",
		});
		expect(closeButton).toHaveFocus();

		fireEvent.click(closeButton);

		expect(opener).toHaveFocus();
	});
});
