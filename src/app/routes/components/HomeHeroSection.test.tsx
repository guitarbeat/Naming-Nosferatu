import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import type { NameItem } from "@/shared/types";
import { HomeHeroSection } from "./HomeHeroSection";

const lockedNames: NameItem[] = [
	{ id: "1", name: "Woods" },
	{ id: "2", name: "Pickles" },
	{ id: "3", name: "Juniper" },
	{ id: "4", name: "Miso" },
];

describe("HomeHeroSection", () => {
	it("renders mobile hero actions and forwards CTA clicks", () => {
		const onStartPicking = vi.fn();
		const onSeeResults = vi.fn();

		render(
			<HomeHeroSection
				lockedNames={lockedNames}
				selectedCount={6}
				totalNameCount={24}
				onStartPicking={onStartPicking}
				onSeeResults={onSeeResults}
			/>,
		);

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
