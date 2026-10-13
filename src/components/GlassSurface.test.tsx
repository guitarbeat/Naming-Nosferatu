import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { GlassSurface } from "./GlassSurface";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("GlassSurface component", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		return () => {
			container.remove();
		};
	});

	it("renders children successfully", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<GlassSurface>
					<span>Test Content</span>
				</GlassSurface>,
			);
		});

		expect(container.textContent).toContain("Test Content");
		await act(async () => {
			root.unmount();
		});
	});

	it("safely generates SVG filter elements in shared SVG defs", async () => {
		// Mock SVG filter element constructors to simulate SVG support
		const originalSVGFEDisplacementMapElement =
			globalThis.SVGFEDisplacementMapElement;
		const originalSVGFEColorMatrixElement = globalThis.SVGFEColorMatrixElement;

		class MockSVGFEDisplacementMapElement extends HTMLElement {}
		class MockSVGFEColorMatrixElement extends HTMLElement {}

		// @ts-expect-error
		globalThis.SVGFEDisplacementMapElement = MockSVGFEDisplacementMapElement;
		// @ts-expect-error
		globalThis.SVGFEColorMatrixElement = MockSVGFEColorMatrixElement;

		const root = createRoot(container);
		await act(async () => {
			root.render(
				<GlassSurface checkVisibility={false}>
					<span>Glass Child</span>
				</GlassSurface>,
			);
		});

		const sharedSvg = document.getElementById("glass-surface-shared-filters");
		expect(sharedSvg).not.toBeNull();

		const filter = sharedSvg?.querySelector("filter");
		expect(filter).not.toBeNull();

		// Check created SVG child elements
		const feImage = filter?.querySelector("feImage");
		expect(feImage).not.toBeNull();
		expect(feImage?.getAttribute("preserveAspectRatio")).toBe("none");

		const redDisplacement = filter?.querySelector(
			"feDisplacementMap#redchannel",
		);
		expect(redDisplacement).not.toBeNull();

		const blurFilter = filter?.querySelector("feGaussianBlur");
		expect(blurFilter).not.toBeNull();

		await act(async () => {
			root.unmount();
		});

		// Restore globals
		globalThis.SVGFEDisplacementMapElement =
			originalSVGFEDisplacementMapElement;
		globalThis.SVGFEColorMatrixElement = originalSVGFEColorMatrixElement;
	});
});
