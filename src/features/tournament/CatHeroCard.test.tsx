import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { Providers } from "@/app/Providers";
import { FALLBACK_CAT_IMAGE } from "@/shared/lib/constants";
import { CatHeroCard } from "./CatHeroCard";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("CatHeroCard", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		localStorage.clear();
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	it("renders with the default real cat photo and default name", () => {
		const root = createRoot(container);
		act(() => {
			root.render(
				<Providers>
					<CatHeroCard />
				</Providers>,
			);
		});

		const img = container.querySelector("img");
		expect(img).not.toBeNull();
		expect(img?.src).toContain(FALLBACK_CAT_IMAGE);
		expect(container.textContent).toContain("Nosferatu");
		expect(container.textContent).toContain("Upload My Cat");
	});

	it("allows toggling visibility (hide and show)", () => {
		const root = createRoot(container);
		act(() => {
			root.render(
				<Providers>
					<CatHeroCard />
				</Providers>,
			);
		});

		// Find hide button (EyeOff)
		const hideBtn = container.querySelector('button[title="Remove / Hide this card"]');
		expect(hideBtn).not.toBeNull();

		act(() => {
			(hideBtn as HTMLButtonElement).click();
		});

		// Now card should be hidden and show-button should appear
		const showBtn = container.querySelector("#btn-show-cat-photo");
		expect(showBtn).not.toBeNull();
		expect(showBtn?.textContent).toContain("Show Nosferatu's Photo");

		// Click show button
		act(() => {
			(showBtn as HTMLButtonElement).click();
		});

		// Restored
		expect(container.querySelector("#cat-hero-card")).not.toBeNull();
	});

	it("opens the gallery and allows choosing a different cat photo", () => {
		const root = createRoot(container);
		act(() => {
			root.render(
				<Providers>
					<CatHeroCard />
				</Providers>,
			);
		});

		const galleryBtn = container.querySelector('button[title="Browse cat photos gallery"]');
		expect(galleryBtn).not.toBeNull();

		act(() => {
			(galleryBtn as HTMLButtonElement).click();
		});

		expect(container.textContent).toContain("Choose from Cat Gallery");
		const galleryCatButtons = container.querySelectorAll(".grid button");
		expect(galleryCatButtons.length).toBeGreaterThan(0);

		// Click second cat
		act(() => {
			(galleryCatButtons[1] as HTMLButtonElement).click();
		});

		const img = container.querySelector("#cat-hero-card img");
		expect(img?.getAttribute("src")).toContain("cat_02.webp");
		expect(localStorage.getItem("user_custom_cat_photo")).toContain("cat_02.webp");
	});
});
