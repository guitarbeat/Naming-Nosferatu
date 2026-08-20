import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NameSelector } from "./NameSelector";
import { SUPABASE_UNAVAILABLE_MSG } from "@/shared/services/supabase/errorUtils";

// Mock dependencies
const mockToast = { showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn() };
vi.mock("@/app/providers/Providers", () => ({
	useToast: () => mockToast,
}));

const mockToggleHidden = vi.fn();
const mockToggleLocked = vi.fn();
vi.mock("@/shared/api/names/hooks/useNameAdminActions", () => ({
	useNameAdminActions: () => ({
		toggleHidden: mockToggleHidden,
		toggleLocked: mockToggleLocked,
	}),
}));

const mockNamesQueryOptions = vi.fn();
vi.mock("@/shared/api/names/api", () => ({
	namesQueryOptions: (...args: unknown[]) => mockNamesQueryOptions(...args),
}));

const mockTournamentActions = {
	setSelection: vi.fn(),
};

const mockStore = {
	user: { isAdmin: false, name: "Test User" },
	tournament: { selectedNames: [] },
	tournamentActions: mockTournamentActions,
};

vi.mock("@/store/appStore", () => ({
	default: (selector?: (state: typeof mockStore) => unknown) =>
		selector ? selector(mockStore) : mockStore,
}));

// Mock useQuery
let queryState = { isPending: true, data: undefined as { names: unknown[] } | undefined, error: null as Error | null };
vi.mock("@tanstack/react-query", async (importOriginal) => {
	const mod = await importOriginal<Record<string, unknown>>();
	return {
		...mod,
		useQuery: () => ({ ...queryState, refetch: vi.fn() }),
	};
});

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async (importOriginal) => {
	const mod = await importOriginal<Record<string, unknown>>();
	return {
		...mod,
		motion: {
			div: ({ children, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
			button: ({ children, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
		},
		useReducedMotion: () => false,
	};
});

describe("NameSelector", () => {
	const renderComponent = () => {
		const queryClient = new QueryClient();
		return render(
			<QueryClientProvider client={queryClient}>
				<NameSelector />
			</QueryClientProvider>
		);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		queryState = { isPending: true, data: undefined, error: null };
		mockStore.user.isAdmin = false;
		mockStore.tournament.selectedNames = [];
	});

	it("should show loading state when data is pending", () => {
		queryState = { isPending: true, data: undefined, error: null };
		renderComponent();
		expect(screen.getByText("Loading cat names...")).toBeInTheDocument();
	});

	it("should display sample names when Supabase is unavailable", () => {
		queryState = {
			isPending: false,
			data: undefined,
			error: new Error(SUPABASE_UNAVAILABLE_MSG)
		};
		renderComponent();
		expect(screen.getByText("Luna")).toBeInTheDocument();
	});

	it("should display names from query data", () => {
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat" }] },
			error: null
		};
		renderComponent();
		expect(screen.getByText("CustomCat")).toBeInTheDocument();
		expect(screen.getByText("A custom cat")).toBeInTheDocument();
	});

	it("should handle error state when not Supabase unavailable message", () => {
		queryState = { isPending: false, data: undefined, error: new Error("Some random error") };
		renderComponent();
		expect(screen.getByText("Some random error")).toBeInTheDocument();
		expect(screen.getByText("We couldn't load the current shortlist.")).toBeInTheDocument();
	});

	it("should trigger selection toggle on clicking a name", () => {
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat" }] },
			error: null
		};
		renderComponent();

		const nameCard = screen.getByRole("button", { name: /Select name: CustomCat/i });
		fireEvent.click(nameCard);

		expect(mockTournamentActions.setSelection).toHaveBeenCalledWith([
			expect.objectContaining({ id: "100", name: "CustomCat" })
		]);
	});

	it("should trigger deselection when a selected name is clicked", () => {
		mockStore.tournament.selectedNames = [{ id: "100", name: "CustomCat", description: "A custom cat" }] as any;
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat" }] },
			error: null
		};
		renderComponent();

		const nameCard = screen.getByRole("button", { name: /Deselect name: CustomCat/i });
		fireEvent.click(nameCard);

		expect(mockTournamentActions.setSelection).toHaveBeenCalledWith([]);
	});

	it("should auto-select names that are locked in", () => {
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat", lockedIn: true }] },
			error: null
		};
		renderComponent();

		expect(mockTournamentActions.setSelection).toHaveBeenCalledWith([
			expect.objectContaining({ id: "100", name: "CustomCat", lockedIn: true })
		]);
	});

	it("should not trigger selection toggle when name is locked", () => {
		// When locked in, it's auto-selected. Clicking it should not deselect it.
		mockStore.tournament.selectedNames = [{ id: "100", name: "CustomCat", description: "A custom cat", lockedIn: true }] as any;
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat", lockedIn: true }] },
			error: null
		};
		renderComponent();

		// It's selected, so label is "Deselect name: CustomCat"
		const nameCard = screen.getByRole("button", { name: /Deselect name: CustomCat/i });

		// Clear mocks before clicking
		mockTournamentActions.setSelection.mockClear();

		fireEvent.click(nameCard);

		expect(mockTournamentActions.setSelection).not.toHaveBeenCalled();
	});

	it("should show admin actions when user is admin", () => {
		mockStore.user.isAdmin = true;
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat" }] },
			error: null
		};
		renderComponent();

		const hideButtons = screen.getAllByRole("button", { name: /Hide/i });
		const lockButtons = screen.getAllByRole("button", { name: /Lock/i });
		expect(hideButtons.length).toBeGreaterThan(0);
		expect(lockButtons.length).toBeGreaterThan(0);
	});

	it("should open admin confirmation modal on hide click", async () => {
		mockStore.user.isAdmin = true;
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat" }] },
			error: null
		};
		renderComponent();

		const hideButtons = screen.getAllByRole("button", { name: /Hide/i });
		fireEvent.click(hideButtons[0]); // The one on the card

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Hide this name?")).toBeInTheDocument();
		// There might be multiple text nodes containing this string due to responsive design or screen reader text
		const descriptions = screen.getAllByText("CustomCat will be removed from public view.");
		expect(descriptions.length).toBeGreaterThan(0);
	});

	it("should confirm admin hide action", async () => {
		mockStore.user.isAdmin = true;
		queryState = {
			isPending: false,
			data: { names: [{ id: "100", name: "CustomCat", description: "A custom cat" }] },
			error: null
		};
		renderComponent();

		const hideButtons = screen.getAllByRole("button", { name: /Hide/i });
		fireEvent.click(hideButtons[0]); // Click the button on the card

		// In modal, find the specific button (it will be inside the dialog)
		const confirmButtons = screen.getAllByRole("button", { name: /^Hide$/i });
		// The confirm button should be the last one, or the one inside the dialog
		const confirmButton = confirmButtons[confirmButtons.length - 1];

		fireEvent.click(confirmButton);

		await waitFor(() => {
			expect(mockToggleHidden).toHaveBeenCalledWith({ nameId: "100", isCurrentlyHidden: false });
		});
	});
});
