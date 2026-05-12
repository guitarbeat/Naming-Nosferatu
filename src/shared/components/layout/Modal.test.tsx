import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function ModalHarness() {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<button type="button" onClick={() => setIsOpen(true)}>
				Open Modal
			</button>
			<Modal title="Test Modal" isOpen={isOpen} onClose={() => setIsOpen(false)}>
				<div className="p-4">
					<button type="button">First Action</button>
					<button type="button">Second Action</button>
				</div>
			</Modal>
		</>
	);
}

describe("Modal", () => {
	it("renders when open and matches title", () => {
		render(
			<Modal title="Welcome" isOpen={true} onClose={() => {}}>
				<p>Modal Content</p>
			</Modal>,
		);
		expect(screen.getByText("Welcome")).toBeInTheDocument();
		expect(screen.getByText("Modal Content")).toBeInTheDocument();
	});

	it("does not render when closed", () => {
		render(
			<Modal title="Welcome" isOpen={false} onClose={() => {}}>
				<p>Modal Content</p>
			</Modal>,
		);
		expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
	});

	it("calls onClose when close button is clicked", () => {
		const onClose = vi.fn();
		render(
			<Modal title="Welcome" isOpen={true} onClose={onClose}>
				<p>Modal Content</p>
			</Modal>,
		);
		const closeButton = screen.getByLabelText("Close welcome");
		fireEvent.click(closeButton);
		expect(onClose).toHaveBeenCalled();
	});

	it("traps focus and handles keyboard navigation", () => {
		render(<ModalHarness />);

		const opener = screen.getByRole("button", { name: "Open Modal" });
		fireEvent.click(opener);

		const firstAction = screen.getByRole("button", { name: "First Action" });
		const secondAction = screen.getByRole("button", { name: "Second Action" });
		const closeButton = screen.getByLabelText("Close test modal");

		// Initial focus should be on first interactive element
		expect(closeButton).toHaveFocus();

		// Tab to first action
		fireEvent.keyDown(window, { key: "Tab" });
		expect(firstAction).toHaveFocus();

		// Tab to second action
		fireEvent.keyDown(window, { key: "Tab" });
		expect(secondAction).toHaveFocus();

		// Wrap around to close button
		fireEvent.keyDown(window, { key: "Tab" });
		expect(closeButton).toHaveFocus();
	});

	it("closes on Escape key press", () => {
		const onClose = vi.fn();
		render(
			<Modal title="Welcome" isOpen={true} onClose={onClose}>
				<p>Modal Content</p>
			</Modal>,
		);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalled();
	});

	it("restores focus to previous element after closing", () => {
		render(<ModalHarness />);
		const opener = screen.getByRole("button", { name: "Open Modal" });
		opener.focus();
		fireEvent.click(opener);

		fireEvent.keyDown(window, { key: "Escape" });
		expect(opener).toHaveFocus();
	});
});
