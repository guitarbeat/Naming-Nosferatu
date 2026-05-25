import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WinLossChart } from "./WinLossChart";

vi.mock("recharts", async (importOriginal) => {
	const OriginalRechartsModule = await importOriginal();
	return {
		...OriginalRechartsModule,
		ResponsiveContainer: ({ children }: any) => (
			<div data-testid="recharts-responsive-container" style={{ width: 800, height: 400 }}>
				{children}
			</div>
		),
		BarChart: ({ children, data }: any) => (
			<div data-testid="recharts-bar-chart" data-chart-data={JSON.stringify(data)}>
				{children}
			</div>
		),
		Bar: ({ dataKey }: any) => <div data-testid={`recharts-bar-${dataKey}`} />,
		XAxis: () => <div data-testid="recharts-xaxis" />,
		YAxis: () => <div data-testid="recharts-yaxis" />,
		CartesianGrid: () => <div data-testid="recharts-cartesian-grid" />,
		Tooltip: () => <div data-testid="recharts-tooltip" />,
		Legend: () => <div data-testid="recharts-legend" />,
	};
});

describe("WinLossChart", () => {
	let originalResizeObserver: any;

	beforeEach(() => {
		originalResizeObserver = globalThis.ResizeObserver;
		globalThis.ResizeObserver = class ResizeObserver {
			callback: ResizeObserverCallback;

			constructor(callback: ResizeObserverCallback) {
				this.callback = callback;
			}

			observe(target: Element) {
				target.getBoundingClientRect = () => ({
					width: 800,
					height: 400,
					top: 0,
					left: 0,
					right: 800,
					bottom: 400,
					x: 0,
					y: 0,
					toJSON: () => {
						/* intentional empty block */
					},
				});

				Promise.resolve()
					.then(() => {
						this.callback(
							[
								{
									target,
									contentRect: { width: 800, height: 400 } as DOMRectReadOnly,
									borderBoxSize: [],
									contentBoxSize: [],
									devicePixelContentBoxSize: [],
								},
							],
							this,
						);
					})
					.catch(() => {
						/* intentional empty block */
					});
			}

			unobserve() {
				/* intentional empty block */
			}
			disconnect() {
				/* intentional empty block */
			}
		};
	});

	afterEach(() => {
		globalThis.ResizeObserver = originalResizeObserver;
	});

	it("renders empty state when no leaderboard data is provided", () => {
		render(<WinLossChart leaderboard={[]} />);
		expect(
			screen.getByText(
				"No head-to-head matches recorded yet. Run a tournament to populate this chart.",
			),
		).toBeInTheDocument();
	});

	it("renders empty state when leaderboard has items with 0 wins and losses", () => {
		render(
			<WinLossChart
				leaderboard={[{ name: "Alice", avg_rating: 1500, wins: 0, losses: 0, total_ratings: 0 }]}
			/>,
		);
		expect(
			screen.getByText(
				"No head-to-head matches recorded yet. Run a tournament to populate this chart.",
			),
		).toBeInTheDocument();
	});

	it("renders chart with formatted data when valid leaderboard is provided", async () => {
		render(
			<WinLossChart
				leaderboard={[
					{ name: "Alice", avg_rating: 1500, wins: 5, losses: 2, total_ratings: 7 },
					{ name: "BobTheBuilder", avg_rating: 1400, wins: 1, losses: 6, total_ratings: 7 },
				]}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("recharts-bar-chart")).toBeInTheDocument();
		});

		expect(screen.getByTestId("recharts-bar-wins")).toBeInTheDocument();
		expect(screen.getByTestId("recharts-bar-losses")).toBeInTheDocument();

		const chartNode = screen.getByTestId("recharts-bar-chart");
		const chartData = JSON.parse(chartNode.getAttribute("data-chart-data") || "[]");

		expect(chartData).toHaveLength(2);

		// Name <= 8 characters remains the same
		expect(chartData[0].name).toBe("Alice");
		expect(chartData[0].wins).toBe(5);
		expect(chartData[0].losses).toBe(2);

		// Name > 8 characters gets truncated
		expect(chartData[1].name).toBe("BobTheB…");
		expect(chartData[1].wins).toBe(1);
		expect(chartData[1].losses).toBe(6);
	});

	it("limits the number of items displayed based on the limit prop", async () => {
		render(
			<WinLossChart
				limit={2}
				leaderboard={[
					{ name: "Name1", avg_rating: 1500, wins: 1, losses: 0, total_ratings: 1 },
					{ name: "Name2", avg_rating: 1500, wins: 1, losses: 0, total_ratings: 1 },
					{ name: "Name3", avg_rating: 1500, wins: 1, losses: 0, total_ratings: 1 },
				]}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("recharts-bar-chart")).toBeInTheDocument();
		});

		const chartNode = screen.getByTestId("recharts-bar-chart");
		const chartData = JSON.parse(chartNode.getAttribute("data-chart-data") || "[]");

		expect(chartData).toHaveLength(2);
	});

	it("uses default limit of 8 when not provided", async () => {
		const manyItems = Array.from({ length: 10 }, (_, i) => ({
			name: `Name${i}`,
			avg_rating: 1500,
			wins: 1,
			losses: 0,
			total_ratings: 1,
		}));

		render(<WinLossChart leaderboard={manyItems} />);

		await waitFor(() => {
			expect(screen.getByTestId("recharts-bar-chart")).toBeInTheDocument();
		});

		const chartNode = screen.getByTestId("recharts-bar-chart");
		const chartData = JSON.parse(chartNode.getAttribute("data-chart-data") || "[]");

		expect(chartData).toHaveLength(8);
	});

	it("handles null/undefined wins and losses gracefully", async () => {
		// Since the interface dictates numbers, but the implementation handles null/undefined
		const mockData = [
			{ name: "NullTest", avg_rating: 1500, wins: null, losses: 1, total_ratings: 1 },
			{ name: "UndefinedTest", avg_rating: 1500, wins: 2, losses: undefined, total_ratings: 2 },
		] as unknown as Array<{
			name: string;
			avg_rating: number;
			wins: number;
			losses: number;
			total_ratings: number;
		}>;

		render(<WinLossChart leaderboard={mockData} />);

		await waitFor(() => {
			expect(screen.getByTestId("recharts-bar-chart")).toBeInTheDocument();
		});

		const chartNode = screen.getByTestId("recharts-bar-chart");
		const chartData = JSON.parse(chartNode.getAttribute("data-chart-data") || "[]");

		expect(chartData).toHaveLength(2);
		expect(chartData[0].wins).toBe(0);
		expect(chartData[0].losses).toBe(1);
		expect(chartData[1].wins).toBe(2);
		expect(chartData[1].losses).toBe(0);
	});
});
