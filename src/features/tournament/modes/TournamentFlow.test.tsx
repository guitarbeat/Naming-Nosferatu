import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TournamentFlow from "./TournamentFlow";

const mockHandleStartNewTournament = vi.fn();

const mockStore = {
	user: { name: "Test User" },
	tournament: {
		isComplete: false,
		names: null as null | string[],
		ratings: {} as Record<string, number>,
	},
	tournamentActions: {},
};

vi.mock("@/store/appStore", () => ({
	default: () => mockStore,
}));

vi.mock("../hooks", () => ({
	useTournamentHandlers: () => ({
		handleStartNewTournament: mockHandleStartNewTournament,
	}),
}));

vi.mock("../components/NameSelector", () => ({
	NameSelector: () => <div data-testid="name-selector">Name Selector</div>,
}));

describe("TournamentFlow responsive behavior", () => {
	const renderWithProviders = () =>
		render(
			<QueryClientProvider client={new QueryClient()}>
				<MemoryRouter>
					<TournamentFlow />
				</MemoryRouter>
			</QueryClientProvider>,
		);

	beforeEach(() => {
		mockHandleStartNewTournament.mockReset();
		mockStore.tournament.isComplete = false;
		mockStore.tournament.names = null;
	});

	it("shows the setup selector when tournament is not complete", () => {
		renderWithProviders();

		expect(screen.getByTestId("name-selector")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Analyze Results" })).not.toBeInTheDocument();
	});

	it("keeps completion actions mobile-friendly with stacked buttons", () => {
		mockStore.tournament.isComplete = true;
		mockStore.tournament.names = ["A", "B"];

		renderWithProviders();

		const analyzeButton = screen.getByRole("button", { name: "Analyze Results" });
		const startButton = screen.getByRole("button", { name: "Start New Tournament" });
		const heading = screen.getByRole("heading", {
			name: "A victor emerges from the eternal tournament",
		});
		const actionsRow = analyzeButton.parentElement;

		expect(heading).toHaveClass("text-2xl", "sm:text-3xl", "md:text-4xl");
		expect(actionsRow).toHaveClass("flex-col", "sm:flex-row");
		expect(analyzeButton).toHaveClass("w-full", "sm:w-auto");
		expect(startButton).toHaveClass("w-full", "sm:w-auto");
	});
});
