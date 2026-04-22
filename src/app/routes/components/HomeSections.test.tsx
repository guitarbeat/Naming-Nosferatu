import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NameItem } from "@/shared/types";

const lockedNames: NameItem[] = [
	{ id: "1", name: "Woods" },
	{ id: "2", name: "Pickles" },
	{ id: "3", name: "Juniper" },
	{ id: "4", name: "Miso" },
];

async function renderHomeHeroSection({
	state = "ready",
	lockedNamesOverride = lockedNames,
	selectedCount = 6,
	totalNameCount = 24,
	onStartPicking,
	onSeeResults,
}: {
	state?: "loading" | "ready" | "error";
	lockedNamesOverride?: NameItem[];
	selectedCount?: number;
	totalNameCount?: number | null;
	onStartPicking: () => void;
	onSeeResults: () => void;
}) {
	const { HomeHeroSection } = await import("./HomeSections");

	return render(
		<HomeHeroSection
			state={state}
			lockedNames={lockedNamesOverride}
			selectedCount={selectedCount}
			totalNameCount={totalNameCount}
			onStartPicking={onStartPicking}
			onSeeResults={onSeeResults}
		/>,
	);
}

describe("HomeHeroSection", () => {
	beforeEach(() => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});
	});

	it("renders mobile hero actions and forwards CTA clicks", async () => {
		const onStartPicking = vi.fn();
		const onSeeResults = vi.fn();

		await renderHomeHeroSection({ onStartPicking, onSeeResults });

		expect(
			screen.getByRole("heading", {
				name: "Choose the shortlist. Run the bracket.",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Locked Names")).toBeInTheDocument();
		expect(screen.getByText("Selected")).toBeInTheDocument();
		expect(screen.getByText("Pool")).toBeInTheDocument();
		expect(screen.getByText("Juniper")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Start Picking" }));
		fireEvent.click(screen.getByRole("button", { name: "See Results" }));

		expect(onStartPicking).toHaveBeenCalledTimes(1);
		expect(onSeeResults).toHaveBeenCalledTimes(1);
	});

	it("keeps an empty ready state honest instead of inventing a locked name", async () => {
		await renderHomeHeroSection({
			state: "ready",
			lockedNamesOverride: [],
			selectedCount: 0,
			totalNameCount: 0,
			onStartPicking: vi.fn(),
			onSeeResults: vi.fn(),
		});

		expect(screen.getByText(/No names are locked yet\./i)).toBeInTheDocument();
		expect(screen.queryByText("Woods")).not.toBeInTheDocument();
	});

	it("renders a loading state without empty-state fallback copy", async () => {
		await renderHomeHeroSection({
			state: "loading",
			lockedNamesOverride: [],
			totalNameCount: null,
			onStartPicking: vi.fn(),
			onSeeResults: vi.fn(),
		});

		expect(screen.getByText("Loading Shortlist")).toBeInTheDocument();
		expect(
			screen.getByText(/reflects live bracket data instead of a fake empty state/i),
		).toBeInTheDocument();
		expect(screen.queryByText("No names are locked yet.")).not.toBeInTheDocument();
	});

	it("renders an error state without pretending the pool is empty", async () => {
		await renderHomeHeroSection({
			state: "error",
			lockedNamesOverride: [],
			totalNameCount: null,
			onStartPicking: vi.fn(),
			onSeeResults: vi.fn(),
		});

		expect(screen.getByText("Live Pool Unavailable")).toBeInTheDocument();
		expect(
			screen.getByText(/waiting on fresh data instead of pretending there are zero locked names/i),
		).toBeInTheDocument();
		expect(screen.queryByText("No names are locked yet.")).not.toBeInTheDocument();
	});
});
