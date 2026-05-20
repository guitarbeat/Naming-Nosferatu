import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function ModalHarness() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button type="button" onClick={() => setOpen(true)}>
				Open Modal
			</button>
			<Modal title="Test Modal" open={open} onClose={() => setOpen(false)}>
				<button type="button">First Action</button>
				<button type="button">Second Action</button>
			</Modal>
		</>
	);
}

describe("Modal", () => {
	it("renders when open and matches title", () => {
		render(
			<Modal title="Welcome" open={true} onClose={() => {}}>
				<p>Modal Content</p>
			</Modal>,
		);
		expect(screen.getByText("Welcome")).toBeInTheDocument();
		expect(screen.getByText("Modal Content")).toBeInTheDocument();
	});

	it("does not render when closed", () => {
		render(
			<Modal title="Welcome" open={false} onClose={() => {}}>
				<p>Modal Content</p>
			</Modal>,
		);
		expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
	});

	it("calls onClose when close button is clicked", () => {
		const onClose = vi.fn();
		render(
			<Modal title="Welcome" open={true} onClose={onClose}>
				<p>Modal Content</p>
			</Modal>,
		);
		const closeButton = screen.getByLabelText("Close welcome");
		fireEvent.click(closeButton);
		expect(onClose).toHaveBeenCalled();
	});

	it("renders harness actions when opened", () => {
		render(<ModalHarness />);

		fireEvent.click(screen.getByRole("button", { name: "Open Modal" }));

		expect(screen.getByRole("button", { name: "First Action" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Second Action" })).toBeInTheDocument();
		expect(screen.getByLabelText("Close test modal")).toBeInTheDocument();
	});

	it("calls onClose when the overlay close button is clicked", () => {
		const onClose = vi.fn();
		render(
			<Modal title="Test Modal" open={true} onClose={onClose}>
				<p>Modal Content</p>
			</Modal>,
		);

		fireEvent.click(screen.getByLabelText("Close test modal"));
		expect(onClose).toHaveBeenCalled();
	});
});
