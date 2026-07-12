import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Card } from "@heroui/react";
import { RankingAdjustment } from "./RankingAdjustment";

const mockRankings = [
	{ id: "1", name: "Luna", rating: 1200, wins: 5, losses: 2 },
	{ id: "2", name: "Milo", rating: 1100, wins: 3, losses: 4 },
];

describe("RankingAdjustment", () => {
	it("renders the rankings correctly", () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const onCancel = vi.fn();

		render(
			<Card>
				<RankingAdjustment rankings={mockRankings as any} onSave={onSave} onCancel={onCancel} />
			</Card>,
		);

		expect(screen.getByText("Your Cat Name Rankings")).toBeInTheDocument();
		expect(screen.getByText("Luna")).toBeInTheDocument();
		expect(screen.getByText("Milo")).toBeInTheDocument();
		expect(screen.getByText("1200")).toBeInTheDocument();
		expect(screen.getByText("1100")).toBeInTheDocument();
	});

	it("calls onCancel when 'Back to Tournament' is clicked", () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const onCancel = vi.fn();

		render(
			<Card>
				<RankingAdjustment rankings={mockRankings as any} onSave={onSave} onCancel={onCancel} />
			</Card>,
		);

		const cancelButton = screen.getByRole("button", { name: /Back to Tournament/i });
		fireEvent.click(cancelButton);

		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
