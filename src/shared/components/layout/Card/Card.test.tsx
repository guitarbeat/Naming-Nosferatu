import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CardName, CardStats } from "./Card";

describe("Card subcomponents", () => {
	const originalMatchMedia = window.matchMedia;

	afterEach(() => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			configurable: true,
			value: originalMatchMedia,
		});
	});

	it("renders CardStats content", () => {
		render(<CardStats title="Stats Card" value="summary" />);
		expect(screen.getByText("Stats Card")).toBeTruthy();
		expect(screen.getByText("summary")).toBeTruthy();
	});

	it("renders CardName content", () => {
		render(<CardName name="Nosferatu" />);
		expect(screen.getByText("Nosferatu")).toBeTruthy();
	});

	it("renders CardName safely when matchMedia is unavailable", () => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			configurable: true,
			value: undefined,
		});

		render(<CardName name="Orlok" />);
		expect(screen.getByText("Orlok")).toBeTruthy();
	});
});
