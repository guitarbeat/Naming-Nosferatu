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
	onStartPicking,
}: {
	state?: "loading" | "ready" | "error";
	lockedNamesOverride?: NameItem[];
	onStartPicking: () => void;
}) {
	const { HomeHeroSection } = await import("./HomeSections");

	return render(
		<HomeHeroSection
			state={state}
			lockedNames={lockedNamesOverride}
			onStartPicking={onStartPicking}
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

		await renderHomeHeroSection({ onStartPicking });

		fireEvent.click(screen.getByText("Start a tournament"));

		expect(onStartPicking).toHaveBeenCalledTimes(1);
	});

	it("keeps an empty ready state honest instead of inventing a locked name", async () => {
		await renderHomeHeroSection({
			state: "ready",
			lockedNamesOverride: [],
			onStartPicking: vi.fn(),
		});

		expect(screen.getByText("Nosferatu")).toBeInTheDocument();
		expect(screen.queryByText("Woods")).not.toBeInTheDocument();
	});

	it("renders a loading state without empty-state fallback copy", async () => {
		await renderHomeHeroSection({
			state: "loading",
			lockedNamesOverride: [],
			onStartPicking: vi.fn(),
		});

		expect(screen.getByText("________")).toBeInTheDocument();
	});

	it("renders an error state without pretending the pool is empty", async () => {
		await renderHomeHeroSection({
			state: "error",
			lockedNamesOverride: [],
			onStartPicking: vi.fn(),
		});

		expect(screen.getByText("Nosferatu")).toBeInTheDocument();
	});
});
