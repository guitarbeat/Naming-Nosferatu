import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TextLoop } from "./TextLoop";

describe("<TextLoop />", () => {
	it("renders with default props", () => {
		const html = renderToString(<TextLoop text="React ✦ Bits" />);
		expect(html).toContain("text-loop");
		expect(html).toContain("React ✦ Bits");
		expect(html).toContain("<svg");
	});

	it("renders with custom shape, ribbon, and speed", () => {
		const html = renderToString(
			<TextLoop
				text="Nosferatu Champions"
				shape="circle"
				speed={120}
				ribbon={true}
				ribbonColor="#ff0055"
				ribbonWidth={40}
			/>,
		);
		expect(html).toContain("text-loop");
		expect(html).toContain('stroke="#ff0055"');
		expect(html).toContain("NOSFERATU CHAMPIONS");
	});
});
