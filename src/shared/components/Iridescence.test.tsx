import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Iridescence } from "./Iridescence";

describe("<Iridescence />", () => {
	it("renders container element safely in SSR / test environment", () => {
		const html = renderToString(<Iridescence color={[0.3, 0.2, 0.5]} speed={1.0} />);
		expect(html).toContain("iridescence-container");
	});
});
