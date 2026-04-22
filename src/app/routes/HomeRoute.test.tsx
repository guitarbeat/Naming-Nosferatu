import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NameItem, RatingData } from "@/shared/types";

const mockHandleTournamentComplete = vi.fn();
const mockHandleStartNewTournament = vi.fn();
const loginMock = vi.fn();
const logoutMock = vi.fn();

const queryNames: NameItem[] = [
	{ id: "1", name: "Miso", locked_in: true },
	{ id: "2", name: "Fig", locked_in: false },
];

const storeState = {
	user: {
		name: "Ada",
		isAdmin: false,
		isLoggedIn: true,
		avatarUrl: "",
	},
	tournament: {
		selectedNames: [{ id: "1", name: "Miso" }],
		names: queryNames,
		ratings: {} as Record<string, RatingData>,
	},
	tournamentActions: {},
};

const queryState: {
	data: { names: NameItem[] } | undefined;
	isPending: boolean;
	isError: boolean;
} = {
	data: { names: queryNames },
	isPending: false,
	isError: false,
};

function createMatchMedia(prefersReducedMotion: boolean) {
	return vi.fn().mockImplementation((query: string) => ({
		matches:
			query === "(prefers-reduced-motion: reduce)" ? prefersReducedMotion : false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...actual,
		useQuery: () => queryState,
	};
});

vi.mock("@/app/providers/Providers", () => ({
	useAuth: () => ({
		login: loginMock,
		logout: logoutMock,
	}),
}));

vi.mock("@/store/appStore", () => ({
	__esModule: true,
	default: () => storeState,
}));

vi.mock("@/features/tournament/hooks", () => ({
	useTournamentHandlers: () => ({
		handleTournamentComplete: mockHandleTournamentComplete,
		handleStartNewTournament: mockHandleStartNewTournament,
	}),
}));

vi.mock("@/app/appConfig", () => ({
	errorContexts: { analysisDashboard: "Analysis dashboard" },
	routeComponents: {
		TournamentFlow: () => <div data-testid="tournament-flow">Tournament flow</div>,
		DashboardLazy: ({ onStartNew }: { onStartNew: () => void }) => (
			<button type="button" onClick={onStartNew}>
				Start New Tournament
			</button>
		),
	},
}));

vi.mock("@/app/routes/components/HomeSections", () => ({
	HomeHeroSection: ({
		onStartPicking,
		onSeeResults,
	}: {
		onStartPicking: () => void;
		onSeeResults: () => void;
	}) => (
		<div>
			<button type="button" onClick={onStartPicking}>
				Start Picking
			</button>
			<button type="button" onClick={onSeeResults}>
				See Results
			</button>
		</div>
	),
	TournamentBracketSection: ({
		onComplete,
		onGoToPicker,
	}: {
		onComplete: (ratings: Record<string, RatingData>) => void;
		onGoToPicker: () => void;
	}) => (
		<div>
			<button
				type="button"
				onClick={() =>
					onComplete({
						Miso: { rating: 1200, wins: 1, losses: 0 },
					})
				}
			>
				Complete Tournament
			</button>
			<button type="button" onClick={onGoToPicker}>
				Back To Picker
			</button>
		</div>
	),
}));

vi.mock("@/features/tournament/Tournament", () => ({
	default: () => <div data-testid="lazy-tournament" />,
}));

vi.mock("@/features/tournament/components/NameSuggestion", () => ({
	NameSuggestionInner: () => <div data-testid="name-suggestion" />,
}));

vi.mock("@/shared/components/profile/ProfileInner", () => ({
	ProfileInner: () => <div data-testid="profile-inner" />,
}));

async function renderHomeRoute() {
	const { default: HomeRoute } = await import("./HomeRoute");
	return render(<HomeRoute />);
}

describe("HomeRoute", () => {
	beforeEach(() => {
		mockHandleTournamentComplete.mockReset();
		mockHandleStartNewTournament.mockReset();
		loginMock.mockReset();
		logoutMock.mockReset();
		queryState.data = { names: queryNames };
		queryState.isPending = false;
		queryState.isError = false;

		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: createMatchMedia(false),
		});

		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	it("respects reduced motion for homepage section jumps", async () => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: createMatchMedia(true),
		});

		await renderHomeRoute();

		const pickScroll = vi.fn();
		const analysisScroll = vi.fn();
		const pickSection = document.getElementById("pick");
		const analysisSection = document.getElementById("analysis");

		expect(pickSection).not.toBeNull();
		expect(analysisSection).not.toBeNull();

		if (pickSection) {
			pickSection.scrollIntoView = pickScroll;
		}
		if (analysisSection) {
			analysisSection.scrollIntoView = analysisScroll;
		}

		fireEvent.click(screen.getByRole("button", { name: "Start Picking" }));
		fireEvent.click(screen.getByRole("button", { name: "Complete Tournament" }));
		act(() => {
			vi.advanceTimersByTime(800);
		});

		expect(pickScroll).toHaveBeenCalledWith({
			behavior: "auto",
			block: "start",
		});
		expect(analysisScroll).toHaveBeenCalledWith({
			behavior: "auto",
			block: "start",
		});
	});

	it("cancels a pending analysis jump when the user starts a new tournament", async () => {
		await renderHomeRoute();

		const analysisScroll = vi.fn();
		const analysisSection = document.getElementById("analysis");
		expect(analysisSection).not.toBeNull();
		if (analysisSection) {
			analysisSection.scrollIntoView = analysisScroll;
		}

		fireEvent.click(screen.getByRole("button", { name: "Complete Tournament" }));
		fireEvent.click(screen.getByRole("button", { name: "Start New Tournament" }));
		act(() => {
			vi.advanceTimersByTime(800);
		});

		expect(mockHandleStartNewTournament).toHaveBeenCalledTimes(1);
		expect(analysisScroll).not.toHaveBeenCalled();
	});
});
