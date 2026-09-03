import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FluidGlass } from "./FluidGlass";

// Mock @react-three/fiber Canvas for headless test environments
vi.mock("@react-three/fiber", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@react-three/fiber")>();
	return {
		...actual,
		Canvas: ({ children, style }: any) => (
			<div data-testid="r3f-canvas" style={style}>
				{children}
			</div>
		),
	};
});

describe("<FluidGlass />", () => {
	it("renders fluid glass container with custom class and styles", () => {
		const html = renderToString(
			<FluidGlass
				mode="lens"
				backgroundColor="#120F17"
				textColor="#ffffff"
				className="custom-fluid-glass"
				style={{ height: 400 }}
			/>,
		);
		expect(html).toContain("fluid-glass-container");
		expect(html).toContain("custom-fluid-glass");
		expect(html).toContain('data-testid="r3f-canvas"');
	});

	it("renders with bar mode overrides", () => {
		const html = renderToString(
			<FluidGlass
				mode="bar"
				barProps={{
					navItems: [
						{ label: "Dashboard", link: "#dashboard" },
						{ label: "Explore", link: "#explore" },
					],
				}}
			/>,
		);
		expect(html).toContain("fluid-glass-container");
	});
});
