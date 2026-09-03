import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GlassSurface } from "./GlassSurface";

describe("<GlassSurface />", () => {
	it("renders with default props and children", () => {
		const html = renderToString(
			<GlassSurface>
				<span>Glass Content</span>
			</GlassSurface>,
		);
		expect(html).toContain("glass-surface");
		expect(html).toContain("Glass Content");
		expect(html).toContain("glass-surface__content");
		expect(html).toContain("glass-surface__filter");
	});

	it("renders with custom dimensions and distortion props", () => {
		const html = renderToString(
			<GlassSurface
				width="100%"
				height={120}
				borderRadius={24}
				brightness={60}
				opacity={0.8}
				distortionScale={-150}
				className="custom-glass"
			>
				<h1>Distorted Glass</h1>
			</GlassSurface>,
		);
		expect(html).toContain("custom-glass");
		expect(html).toContain("Distorted Glass");
		expect(html).toContain("width:100%");
		expect(html).toContain("height:120px");
	});
});
