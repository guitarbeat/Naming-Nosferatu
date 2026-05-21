import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { PwaInstallPrompt } from "./PwaInstallPrompt";

describe("PwaInstallPrompt", () => {
	it("renders the pwa-install custom element", () => {
		const { container } = render(<PwaInstallPrompt />);
		expect(container.querySelector("pwa-install")).toBeInTheDocument();
	});
});
