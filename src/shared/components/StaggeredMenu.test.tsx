import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StaggeredMenu } from "./StaggeredMenu";

describe("<StaggeredMenu />", () => {
	it("renders closed staggered menu with toggle button and items", () => {
		const items = [
			{ label: "Home", link: "/" },
			{ label: "About", link: "/about" },
			{ label: "Contact", link: "/contact" },
		];
		const socials = [
			{ label: "GitHub", link: "https://github.com" },
			{ label: "Twitter", link: "https://twitter.com" },
		];

		const html = renderToString(
			<StaggeredMenu
				items={items}
				socialItems={socials}
				displaySocials={true}
				displayItemNumbering={true}
				position="right"
			/>,
		);

		expect(html).toContain("staggered-menu-wrapper");
		expect(html).toContain("sm-toggle");
		expect(html).toContain("Home");
		expect(html).toContain("About");
		expect(html).toContain("Contact");
		expect(html).toContain("GitHub");
	});

	it("renders with left position and custom colors", () => {
		const html = renderToString(
			<StaggeredMenu
				position="left"
				colors={["#FF5722", "#9C27B0"]}
				items={[{ label: "Play", link: "#play" }]}
			/>,
		);

		expect(html).toContain('data-position="left"');
		expect(html).toContain("Play");
	});

	it("does not render logo when logoUrl is omitted", () => {
		const html = renderToString(<StaggeredMenu items={[{ label: "Home", link: "/" }]} />);
		expect(html).not.toContain("sm-logo");
	});

	it("renders logo when logoUrl is provided", () => {
		const html = renderToString(
			<StaggeredMenu items={[{ label: "Home", link: "/" }]} logoUrl="/custom-logo.svg" />,
		);
		expect(html).toContain("sm-logo");
		expect(html).toContain('src="/custom-logo.svg"');
	});
});
