import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DriftWallTile } from "./DriftWallTile";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("DriftWallTile component", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		return () => {
			container.remove();
		};
	});

	it("renders tile with basic name and aria-label", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(<DriftWallTile tileId="tile-1" col={0} name="Nosferatu" />);
		});

		const tileEl = container.querySelector('[data-tile-id="tile-1"]');
		expect(tileEl).not.toBeNull();
		expect(tileEl?.getAttribute("aria-label")).toBe("Nosferatu");
		expect(tileEl?.getAttribute("role")).toBe("button");
		expect(tileEl?.textContent).toContain("Nosferatu");

		await act(async () => {
			root.unmount();
		});
	});

	it("renders orbitText and formats fullLabel correctly", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="tile-2"
					col={1}
					name="Count"
					orbitText="The Vampire Cat"
				/>,
			);
		});

		const tileEl = container.querySelector('[data-tile-id="tile-2"]');
		expect(tileEl?.getAttribute("aria-label")).toBe("Count - The Vampire Cat");

		const textPath = container.querySelector("textPath");
		expect(textPath).not.toBeNull();
		expect(textPath?.textContent).toBe("The Vampire Cat");

		await act(async () => {
			root.unmount();
		});
	});

	it("renders as anchor tag when href prop is provided", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="tile-link"
					col={0}
					name="Link Tile"
					href="https://example.com"
				/>,
			);
		});

		const linkEl = container.querySelector("a");
		expect(linkEl).not.toBeNull();
		expect(linkEl?.getAttribute("href")).toBe("https://example.com");
		expect(linkEl?.getAttribute("target")).toBe("_blank");
		expect(linkEl?.getAttribute("rel")).toBe("noreferrer noopener");

		await act(async () => {
			root.unmount();
		});
	});

	it("handles selection state correctly", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="tile-selected"
					col={2}
					name="Selected Tile"
					isSelected={true}
				/>,
			);
		});

		const tileEl = container.querySelector('[data-tile-id="tile-selected"]');
		expect(tileEl?.classList.contains("is-selected")).toBe(true);
		expect(tileEl?.getAttribute("aria-pressed")).toBe("true");

		await act(async () => {
			root.unmount();
		});
	});

	it("renders image when image prop is provided", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="tile-img"
					col={0}
					name="Image Tile"
					image="/test-image.jpg"
				/>,
			);
		});

		const imgEl = container.querySelector("img");
		expect(imgEl).not.toBeNull();
		expect(imgEl?.getAttribute("src")).toBe("/test-image.jpg");
		expect(imgEl?.getAttribute("alt")).toBe("Image Tile");

		await act(async () => {
			root.unmount();
		});
	});

	it("invokes onClick handler when clicked or on Enter/Space keypress", async () => {
		const handleClick = vi.fn();
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="tile-click"
					col={0}
					name="Clickable"
					onClick={handleClick}
				/>,
			);
		});

		const tileEl = container.querySelector(
			'[data-tile-id="tile-click"]',
		) as HTMLDivElement;

		await act(async () => {
			tileEl.click();
		});
		expect(handleClick).toHaveBeenCalledTimes(1);

		await act(async () => {
			const enterEvent = new KeyboardEvent("keydown", {
				key: "Enter",
				bubbles: true,
			});
			tileEl.dispatchEvent(enterEvent);
		});
		expect(handleClick).toHaveBeenCalledTimes(2);

		await act(async () => {
			const spaceEvent = new KeyboardEvent("keydown", {
				key: " ",
				bubbles: true,
			});
			tileEl.dispatchEvent(spaceEvent);
		});
		expect(handleClick).toHaveBeenCalledTimes(3);

		await act(async () => {
			root.unmount();
		});
	});

	it("triggers default click when Enter key pressed without explicit onClick handler", async () => {
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<DriftWallTile tileId="tile-noclick" col={0} name="Keyboard Tile" />,
			);
		});

		const tileEl = container.querySelector(
			'[data-tile-id="tile-noclick"]',
		) as HTMLDivElement;
		const clickSpy = vi.spyOn(tileEl, "click");

		await act(async () => {
			const enterEvent = new KeyboardEvent("keydown", {
				key: "Enter",
				bubbles: true,
			});
			tileEl.dispatchEvent(enterEvent);
		});

		expect(clickSpy).toHaveBeenCalled();

		await act(async () => {
			root.unmount();
		});
	});

	it("handles focus and blur events", async () => {
		const handleFocus = vi.fn();
		const handleBlur = vi.fn();
		const root = createRoot(container);
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="tile-focus"
					col={0}
					name="Focus Tile"
					onFocus={handleFocus}
					onBlur={handleBlur}
				/>,
			);
		});

		const tileEl = container.querySelector(
			'[data-tile-id="tile-focus"]',
		) as HTMLDivElement;

		await act(async () => {
			tileEl.focus();
			tileEl.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
		});
		expect(handleFocus).toHaveBeenCalled();

		await act(async () => {
			tileEl.blur();
			tileEl.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
		});
		expect(handleBlur).toHaveBeenCalled();

		await act(async () => {
			root.unmount();
		});
	});

	it("applies title and orbit text typography scaling based on text length", async () => {
		const root = createRoot(container);

		// Short name (<= 5)
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="t1"
					col={0}
					name="Short"
					orbitText="Short desc"
				/>,
			);
		});
		let centerText = container.querySelector(".drift-wall__center-name");
		expect(centerText?.getAttribute("style")).toContain("font-size: 24.5px");

		// Medium name (> 5, <= 8)
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="t2"
					col={0}
					name="Medium"
					orbitText="This is a medium length orbit text for tile"
				/>,
			);
		});
		centerText = container.querySelector(".drift-wall__center-name");
		expect(centerText?.getAttribute("style")).toContain("font-size: 21.5px");

		// Long name (> 8, <= 11)
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="t3"
					col={0}
					name="LongerName"
					orbitText="This is a very very long orbit text description exceeding fifty-five characters long"
				/>,
			);
		});
		centerText = container.querySelector(".drift-wall__center-name");
		expect(centerText?.getAttribute("style")).toContain("font-size: 18.5px");

		// Very long name (> 11)
		await act(async () => {
			root.render(
				<DriftWallTile
					tileId="t4"
					col={0}
					name="VeryVeryLongName"
					orbitText="Short"
				/>,
			);
		});
		centerText = container.querySelector(".drift-wall__center-name");
		expect(centerText?.getAttribute("style")).toContain("font-size: 16px");

		await act(async () => {
			root.unmount();
		});
	});
});
