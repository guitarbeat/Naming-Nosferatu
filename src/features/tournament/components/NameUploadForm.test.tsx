import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { NameUploadForm } from "./NameUploadForm";

// Mock dependencies
vi.mock("@/services/supabase/client", () => ({
	imagesAPI: {
		upload: vi.fn(),
	},
}));

vi.mock("@/shared/lib/basic", () => ({
	compressImageFile: vi.fn(),
	devError: vi.fn(),
}));

describe("NameUploadForm Accessibility", () => {
	it("renders input that is accessible (not display: none) and has sr-only class", () => {
		render(<NameUploadForm onImagesUploaded={vi.fn()} isAdmin={true} />);

		// Use querySelector to find the input within the label that contains "Upload New Cat Photos"
		const uploadText = screen.getByText(/Upload New Cat Photos/i);
		const label = uploadText.closest("label");
		const input = label?.querySelector("input");

		expect(input).toBeInTheDocument();

		// The input should be visually hidden but accessible
		expect(input).toHaveClass("sr-only");

		// It should NOT have display: none as that removes it from accessibility tree
		expect(input).not.toHaveStyle({ display: "none" });
	});
});
