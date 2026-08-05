import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TournamentFlow from "./TournamentFlow";

const mockResetTournament = vi.fn();

const mockStore = {
	user: { name: "Test User" },
	tournament: {
		isComplete: false,
		names: null as null | string[],
		ratings: {} as Record<string, number>,
		voteHistory: [],
	},
	tournamentActions: {
		resetTournament: mockResetTournament,
	},
};

vi.mock("@/store/appStore", () => ({
	default: (selector?: (state: typeof mockStore) => unknown) =>
		selector ? selector(mockStore) : mockStore,
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
		mockResetTournament.mockReset();
		mockStore.tournament.isComplete = false;
		mockStore.tournament.names = null;
	});

	it("shows the setup selector when tournament is not complete", () => {
		renderWithProviders();

		expect(screen.getByTestId("name-selector")).toBeInTheDocument();
	});

	it("hides the setup selector when tournament is complete", () => {
		mockStore.tournament.isComplete = true;
		mockStore.tournament.names = ["A", "B"];

		renderWithProviders();

		expect(screen.queryByTestId("name-selector")).not.toBeInTheDocument();
	});
});
