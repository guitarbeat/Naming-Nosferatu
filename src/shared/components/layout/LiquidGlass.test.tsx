import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LiquidGlass, { DEFAULT_GLASS_CONFIG, resolveGlassConfig } from "./LiquidGlass";

describe("resolveGlassConfig", () => {
	const defaultConfig = {
		width: 100,
		height: 50,
		radius: 10,
	};

	it("returns defaultConfig when liquidGlass is true", () => {
		expect(resolveGlassConfig(true, defaultConfig)).toEqual(defaultConfig);
	});

	it("returns defaultConfig when liquidGlass is false", () => {
		expect(resolveGlassConfig(false, defaultConfig)).toEqual(defaultConfig);
	});

	it("returns defaultConfig when liquidGlass is undefined", () => {
		expect(resolveGlassConfig(undefined, defaultConfig)).toEqual(defaultConfig);
	});

	it("returns defaultConfig when liquidGlass is null", () => {
		// Even though types say boolean | Record<string, unknown> | undefined,
		// runtime check handles null
		expect(resolveGlassConfig(null as any, defaultConfig)).toEqual(defaultConfig);
	});

	it("merges liquidGlass object with defaultConfig", () => {
		const customConfig = { width: 200, radius: 20 };
		const result = resolveGlassConfig(customConfig, defaultConfig);
		expect(result).toEqual({
			width: 200,
			height: 50,
			radius: 20,
		});
	});
});

describe("LiquidGlass", () => {
	it("renders children correctly", () => {
		render(
			<LiquidGlass>
				<span data-testid="child">Hello World</span>
			</LiquidGlass>,
		);
		expect(screen.getByTestId("child")).toBeInTheDocument();
		expect(screen.getByText("Hello World")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<LiquidGlass className="custom-class">
				<div>Content</div>
			</LiquidGlass>,
		);
		const glassElement = container.querySelector(".liquid-glass");
		expect(glassElement).toHaveClass("custom-class");
	});

	it("sets default CSS variables from DEFAULT_GLASS_CONFIG", () => {
		const { container } = render(
			<LiquidGlass>
				<div>Content</div>
			</LiquidGlass>,
		);
		const glassElement = container.querySelector(".liquid-glass") as HTMLElement;
		expect(glassElement.style.getPropertyValue("--width")).toBe(String(DEFAULT_GLASS_CONFIG.width));
		expect(glassElement.style.getPropertyValue("--height")).toBe(
			String(DEFAULT_GLASS_CONFIG.height),
		);
		expect(glassElement.style.getPropertyValue("--glass-radius")).toBe(
			`${DEFAULT_GLASS_CONFIG.radius}px`,
		);
	});

	it("overrides CSS variables with props", () => {
		const { container } = render(
			<LiquidGlass width={500} height={300} radius={50}>
				<div>Content</div>
			</LiquidGlass>,
		);
		const glassElement = container.querySelector(".liquid-glass") as HTMLElement;
		expect(glassElement.style.getPropertyValue("--width")).toBe("500");
		expect(glassElement.style.getPropertyValue("--height")).toBe("300");
		expect(glassElement.style.getPropertyValue("--glass-radius")).toBe("50px");
	});

	it("overrides dimensions with style prop", () => {
		const { container } = render(
			<LiquidGlass style={{ width: "100%", height: "200px" }}>
				<div>Content</div>
			</LiquidGlass>,
		);
		const glassElement = container.querySelector(".liquid-glass") as HTMLElement;
		expect(glassElement.style.width).toBe("100%");
		expect(glassElement.style.height).toBe("200px");
	});

	it("renders crosshair when showCrosshair is true", () => {
		const { container } = render(
			<LiquidGlass showCrosshair={true}>
				<div>Content</div>
			</LiquidGlass>,
		);
		const crosshair = container.querySelector(".liquid-glass-crosshair");
		expect(crosshair).toBeInTheDocument();
	});

	it("does not render crosshair when showCrosshair is false", () => {
		const { container } = render(
			<LiquidGlass showCrosshair={false}>
				<div>Content</div>
			</LiquidGlass>,
		);
		const crosshair = container.querySelector(".liquid-glass-crosshair");
		expect(crosshair).not.toBeInTheDocument();
	});
});
