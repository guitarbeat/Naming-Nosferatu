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
	onStartPicking,
	onSeeResults,
}: {
	onStartPicking: () => void;
	onSeeResults: () => void;
}) {
	const { HomeHeroSection } = await import("./HomeSections");

	return render(
		<HomeHeroSection
			lockedNames={lockedNames}
			selectedCount={6}
			totalNameCount={24}
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

		expect(screen.getByText("Locked Into Every Bracket")).toBeInTheDocument();
		expect(screen.getByText("Selected")).toBeInTheDocument();
		expect(screen.getByText("Pool")).toBeInTheDocument();
		expect(screen.getByText("+1 more")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Start Picking" }));
		fireEvent.click(screen.getByRole("button", { name: "See Results" }));

		expect(onStartPicking).toHaveBeenCalledTimes(1);
		expect(onSeeResults).toHaveBeenCalledTimes(1);
	});
});
