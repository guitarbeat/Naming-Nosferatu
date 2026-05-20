import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
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
	it("closes and returns to the opener control", async () => {
		render(<LightboxHarness />);
		const opener = screen.getByRole("button", { name: "Open lightbox" });

		fireEvent.click(opener);

		const closeButton = await screen.findByRole("button", {
			name: "Close lightbox and return to gallery",
		});
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(
				screen.queryByRole("button", { name: "Close lightbox and return to gallery" }),
			).not.toBeInTheDocument();
		});
		expect(opener).toBeInTheDocument();
	});
});
