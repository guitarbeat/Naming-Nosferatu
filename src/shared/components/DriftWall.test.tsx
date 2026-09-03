import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DriftWall } from "./DriftWall";

describe("<DriftWall />", () => {
	it("renders without crashing with default props", () => {
		const html = renderToString(<DriftWall />);
		expect(html).toContain("drift-wall");
		expect(html).toContain("drift-wall__plane");
	});

	it("renders custom items with titles and images", () => {
		const customItems = [
			{ image: "https://example.com/cat1.jpg", title: "Nosferatu" },
			{ image: "https://example.com/cat2.jpg", title: "Luna" },
		];
		const html = renderToString(
			<DriftWall items={customItems} columns={2} speed={50} direction="up" />,
		);
		expect(html).toContain("drift-wall");
		expect(html).toContain("Nosferatu");
		expect(html).toContain("Luna");
	});
});
