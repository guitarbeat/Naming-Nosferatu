import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import App from "./App";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

// Mock dependencies
vi.mock("@/app/providers/Providers", () => ({
	useAuth: () => ({
		user: { id: "1", isAdmin: false },
		isLoading: false,
	}),
}));

vi.mock("@/store/appStore", () => ({
	default: () => ({
		user: { name: "Test User", isAdmin: false },
		userActions: { setAdminStatus: vi.fn() },
		tournament: { names: [], ratings: [] },
		tournamentActions: {},
	}),
	useAppStoreInitialization: vi.fn(),
}));

vi.mock("@/features/tournament/hooks", () => ({
	useTournamentHandlers: () => ({
		handleTournamentComplete: vi.fn(),
		handleStartNewTournament: vi.fn(),
	}),
}));

vi.mock("@/shared/components", () => ({
	AppLayout: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="app-layout">{children}</div>
	),
	Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	Loading: ({ text }: { text: string }) => <div>Loading: {text}</div>,
	Section: ({ children, id }: { children: React.ReactNode; id: string }) => (
		<section id={id}>{children}</section>
	),
	SectionHeading: ({ title, icon: Icon }: any) => (
		<div data-testid="section-heading">
			{Icon && <Icon />}
			<h2>{title}</h2>
		</div>
	),
}));

vi.mock("@/features/tournament/Tournament", () => ({
	default: () => <div>Tournament Component</div>,
}));

vi.mock("@/shared/hooks", () => ({
	useOfflineSync: vi.fn(),
	useNameSuggestion: () => ({
		values: { name: "", description: "" },
		isSubmitting: false,
		handleChange: vi.fn(),
		handleSubmit: vi.fn(),
		globalError: null,
		successMessage: null,
	}),
}));

vi.mock("@/shared/lib/performance", () => ({
	initializePerformanceMonitoring: vi.fn(),
	cleanupPerformanceMonitoring: vi.fn(),
}));

vi.mock("@/shared/services/errorManager", () => ({
	ErrorManager: {
		setupGlobalErrorHandling: () => vi.fn(),
	},
}));

// Mock lazy components using the alias
vi.mock("@/app/appConfig", () => ({
	errorContexts: {
		tournamentFlow: "tournamentFlow",
		analysisDashboard: "analysisDashboard",
	},
	routeComponents: {
		TournamentFlow: () => <div data-testid="tournament-flow">Tournament Flow</div>,
		DashboardLazy: () => <div data-testid="dashboard">Dashboard</div>,
		AdminDashboardLazy: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
	},
}));

describe("App Component", () => {
	it("renders the tournament flow on home route", async () => {
		document.documentElement.scrollTop = 120;
		document.body.scrollTop = 120;

		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/"]}>
					<App />
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("app-layout")).toBeInTheDocument();
			expect(screen.getByTestId("tournament-flow")).toBeInTheDocument();
		});

		expect(document.documentElement.scrollTop).toBe(0);
		expect(document.body.scrollTop).toBe(0);
	});

	it("renders the tournament page", async () => {
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/tournament"]}>
					<App />
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("app-layout")).toBeInTheDocument();
		});
	});
});
