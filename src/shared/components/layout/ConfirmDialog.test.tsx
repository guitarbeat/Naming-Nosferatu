import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

function ConfirmDialogHarness() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button type="button" onClick={() => setOpen(true)}>
				Open dialog
			</button>
			<ConfirmDialog
				open={open}
				title="Confirm action"
				description="A confirmation is required."
				onConfirm={() => setOpen(false)}
				onCancel={() => setOpen(false)}
			/>
		</>
	);
}

describe("ConfirmDialog", () => {
	it("traps focus within the dialog controls", () => {
		render(<ConfirmDialogHarness />);

		const opener = screen.getByRole("button", { name: "Open dialog" });
		fireEvent.click(opener);

		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		const confirmButton = screen.getByRole("button", { name: "Confirm" });

		expect(cancelButton).toHaveFocus();

		confirmButton.focus();
		fireEvent.keyDown(window, { key: "Tab" });
		expect(cancelButton).toHaveFocus();

		cancelButton.focus();
		fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
		expect(confirmButton).toHaveFocus();
	});

	it("restores focus to the opener when dismissed", () => {
		render(<ConfirmDialogHarness />);

		const opener = screen.getByRole("button", { name: "Open dialog" });
		opener.focus();
		fireEvent.click(opener);

		fireEvent.keyDown(window, { key: "Escape" });

		expect(opener).toHaveFocus();
	});
});
