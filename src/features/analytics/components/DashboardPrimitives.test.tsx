import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Activity } from "lucide-react";
import { ChartFrame, ContextBadge, Panel, SectionHeader, StatTile } from "./DashboardPrimitives";

const MockChild = ({ width, height }: { width?: number; height?: number }) => (
	<div data-testid="mock-child">
		Child - {width}x{height}
	</div>
);

describe("ChartFrame", () => {
	let resizeObserverCallback: ResizeObserverCallback;

	beforeEach(() => {
		// Mock getBoundingClientRect
		vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
			width: 500,
			height: 300,
			top: 0,
			left: 0,
			bottom: 300,
			right: 500,
			x: 0,
			y: 0,
			toJSON: () => {
				/* noop */
			},
		});

		// Mock ResizeObserver
		global.ResizeObserver = class ResizeObserver {
			constructor(callback: ResizeObserverCallback) {
				resizeObserverCallback = callback;
			}
			observe() {
				/* noop */
			}
			unobserve() {
				/* noop */
			}
			disconnect() {
				/* noop */
			}
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders wrapper div with default class", () => {
		const { container } = render(
			<ChartFrame>
				<MockChild />
			</ChartFrame>,
		);

		expect(container.firstChild).toHaveClass("chart-frame");
		expect(container.firstChild).not.toHaveClass("chart-frame--tall");
	});

	it("applies tall variant class", () => {
		const { container } = render(
			<ChartFrame variant="tall">
				<MockChild />
			</ChartFrame>,
		);

		expect(container.firstChild).toHaveClass("chart-frame--tall");
	});

	it("does not render children when dimensions are 0", () => {
		vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
			width: 0,
			height: 0,
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			x: 0,
			y: 0,
			toJSON: () => {
				/* noop */
			},
		});

		render(
			<ChartFrame>
				<MockChild />
			</ChartFrame>,
		);

		expect(screen.queryByTestId("mock-child")).not.toBeInTheDocument();
	});

	it("renders children with cloned width and height props when dimensions > 0", () => {
		render(
			<ChartFrame>
				<MockChild />
			</ChartFrame>,
		);

		const child = screen.getByTestId("mock-child");
		expect(child).toBeInTheDocument();
		expect(child).toHaveTextContent("Child - 500x300");
	});

	it("updates dimensions on resize", () => {
		vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
			width: 100,
			height: 100,
			top: 0,
			left: 0,
			bottom: 100,
			right: 100,
			x: 0,
			y: 0,
			toJSON: () => {
				/* noop */
			},
		});

		render(
			<ChartFrame>
				<MockChild />
			</ChartFrame>,
		);

		expect(screen.getByTestId("mock-child")).toHaveTextContent("Child - 100x100");

		// Simulate resize
		vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
			width: 800,
			height: 600,
			top: 0,
			left: 0,
			bottom: 600,
			right: 800,
			x: 0,
			y: 0,
			toJSON: () => {
				/* noop */
			},
		});

		act(() => {
			resizeObserverCallback(
				[
					{
						target: document.createElement("div"),
						contentRect: {
							width: 800,
							height: 600,
							top: 0,
							left: 0,
							bottom: 600,
							right: 800,
							x: 0,
							y: 0,
							toJSON: () => {
								/* noop */
							},
						},
						borderBoxSize: [],
						contentBoxSize: [],
						devicePixelContentBoxSize: [],
					},
				],
				new ResizeObserver(() => {
					/* noop */
				}),
			);
		});

		expect(screen.getByTestId("mock-child")).toHaveTextContent("Child - 800x600");
	});
});

describe("Panel", () => {
	it("renders children with optional class name", () => {
		const { container } = render(
			<Panel className="test-class">
				<div>Panel Content</div>
			</Panel>,
		);
		expect(container.firstChild).toHaveClass("test-class");
	});
});

describe("StatTile", () => {
	it("renders label and value correctly", () => {
		render(<StatTile label="Total Score" value={100} />);
		expect(screen.getByText("Total Score")).toBeInTheDocument();
		expect(screen.getByText("100")).toBeInTheDocument();
	});

	it("renders with icon and accent when provided", () => {
		const { container } = render(
			<StatTile label="Activity" value="High" icon={Activity} accent={true} />,
		);
		// Check that icon is rendered (SVG presence)
		const icon = container.querySelector("svg");
		expect(icon).toBeInTheDocument();
		// Check that accent classes are applied
		expect(screen.getByText("High")).toHaveClass("text-primary");
	});
});

describe("ContextBadge", () => {
	it("renders correctly with default tone", () => {
		render(<ContextBadge label="Status" />);
		const badge = screen.getByText("Status");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("border-white/[0.07]");
	});

	it("renders correctly with accent tone", () => {
		render(<ContextBadge label="Active" tone="accent" />);
		const badge = screen.getByText("Active");
		expect(badge).toHaveClass("bg-primary/8");
	});
});

describe("SectionHeader", () => {
	it("renders title correctly", () => {
		render(<SectionHeader title="Dashboard" icon={Activity} />);
		expect(screen.getByText("Dashboard")).toBeInTheDocument();
		expect(document.querySelector("svg")).toBeInTheDocument();
	});

	it("renders subtitle and action when provided", () => {
		render(
			<SectionHeader
				title="Settings"
				icon={Activity}
				subtitle="Manage your preferences"
				action={<button type="button">Save</button>}
			/>,
		);
		expect(screen.getByText("Manage your preferences")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
	});
});
