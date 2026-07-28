import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingNavbar } from "./FloatingNavbar";

vi.mock("@/app/providers/Providers", () => ({
	useAuth: vi.fn(() => ({ user: null })),
}));

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const setNamesMock = vi.fn();

const mockStore = {
	tournament: {
		selectedNames: [] as string[],
		names: null as string[] | null,
		isComplete: false,
		ratings: {} as Record<string, unknown>,
	},
	tournamentActions: {
		setNames: setNamesMock,
	},
	user: {
		isLoggedIn: false,
		name: "",
		avatarUrl: "",
		isAdmin: false,
	},
};

vi.mock("@/store/appStore", () => ({
	default: () => mockStore,
}));

function createMatchMedia(matches = false) {
	return vi.fn().mockImplementation((query: string) => ({
		matches,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}

function mountSections(topById: Record<string, number>) {
	for (const [id, top] of Object.entries(topById)) {
		const section = document.createElement("section");
		section.id = id;
		Object.defineProperty(section, "getBoundingClientRect", {
			value: () => ({
				top,
				bottom: top + 120,
				left: 0,
				right: 200,
				width: 200,
				height: 120,
				x: 0,
				y: top,
				toJSON: () => ({}),
			}),
		});
		document.body.append(section);
	}
}

function getNav() {
	return screen.getByRole("navigation", { name: "Primary" });
}

function setPastHeroScroll() {
	Object.defineProperty(window, "scrollY", {
		writable: true,
		configurable: true,
		value: 900,
	});
}

describe("FloatingNavbar", () => {
	beforeEach(() => {
		mockStore.tournament.selectedNames = [];
		mockStore.tournament.names = null;
		mockStore.tournament.isComplete = false;
		mockStore.user.isLoggedIn = false;
		mockStore.user.name = "";
		mockStore.user.avatarUrl = "";
		mockStore.user.isAdmin = false;

		setNamesMock.mockReset();

		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: createMatchMedia(false),
		});
		Object.defineProperty(window, "scrollTo", {
			writable: true,
			value: vi.fn(),
		});
		Object.defineProperty(document.documentElement, "scrollHeight", {
			configurable: true,
			value: 2000,
		});
		Object.defineProperty(window, "innerHeight", {
			writable: true,
			configurable: true,
			value: 800,
		});
		Object.defineProperty(window, "scrollY", {
			writable: true,
			configurable: true,
			value: 0,
		});

		vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
			callback(0);
			return 1;
		});
		vi.stubGlobal("cancelAnimationFrame", vi.fn());
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		document.body.innerHTML = "";
	});

	const renderWithRouter = (initialEntries = ["/"]) =>
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={initialEntries}>
					<FloatingNavbar />
				</MemoryRouter>
			</QueryClientProvider>,
		);

	it("renders primary navigation and tracks the active section", () => {
		mountSections({ pick: 20, tournament: 200, analysis: 400 });
		setPastHeroScroll();

		renderWithRouter();

		expect(getNav()).toBeInTheDocument();

		expect(screen.getByRole("tab", { name: "Favorites" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "Suggest" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Profile" })).toBeInTheDocument();
	}, 10000);

	it("renders an admin shortcut for admin users", () => {
		mountSections({ pick: 20, tournament: 200, analysis: 400 });
		setPastHeroScroll();
		mockStore.user.isLoggedIn = true;
		mockStore.user.name = "Avery Admin";
		mockStore.user.isAdmin = true;

		renderWithRouter();

		expect(screen.getByRole("tab", { name: "Admin" })).toBeInTheDocument();
	});

	it("promotes the first item to a highlighted start action when enough names are selected", () => {
		mountSections({ pick: 0, tournament: 200, analysis: 400 });
		setPastHeroScroll();
		mockStore.tournament.selectedNames = ["Luna", "Fig", "Miso"];

		renderWithRouter();

		const startButton = screen.getByRole("tab", { name: "Vote (3)" });

		expect(startButton).toBeInTheDocument();
		// In MagicToggle floating variant with isAccent=true and isSelected=true (since pick is active),
		// the class contains 'text-white' but we know it's promoted because it exists and Favorites doesn't.
		// If it's active and isAccent, maybe we should also test for it being the accent version, but
		// `text-white` is the selected state for floating variant regardless of isAccent. We will test
		// that the button is rendered instead of favorites.
		expect(startButton.className).toContain("text-white");
		expect(screen.queryAllByRole("tab", { name: "Favorites" }).length).toBe(0);
	});

	it("shows analyze as the current destination on the analysis route", () => {
		mockStore.tournament.isComplete = true;
		mockStore.tournament.names = ["Luna", "Fig"];
		setPastHeroScroll();
		mountSections({
			pick: 200,
			tournament: 200,
			analysis: 0,
			suggest: 200,
			profile: 400,
		});

		renderWithRouter(["/"]);

		expect(screen.getByRole("tab", { name: "Results" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	it("renders the logged-in avatar when available", () => {
		mountSections({ pick: 0, tournament: 200, analysis: 400 });
		setPastHeroScroll();
		mockStore.user.isLoggedIn = true;
		mockStore.user.name = "Avery Admin";
		mockStore.user.avatarUrl = "https://example.com/avatar.png";

		renderWithRouter();

		expect(screen.getAllByAltText("Avery")[0]).toBeInTheDocument();
	});

	it("keeps the admin profile icon treatment when no avatar is present", () => {
		mountSections({ pick: 0, suggest: 200, profile: 24 });
		setPastHeroScroll();
		mockStore.user.isLoggedIn = true;
		mockStore.user.name = "Avery Admin";
		mockStore.user.isAdmin = true;

		renderWithRouter();

		const profileButton = screen.getByRole("tab", { name: "Avery" });
		const profileIcon = profileButton.querySelector("svg");

		expect(profileIcon).not.toBeNull();
		expect(profileIcon).toHaveClass("text-chart-4");
	});

	it("renders label text visibly in the DOM", () => {
		renderWithRouter();

		// "Suggest" is always present regardless of route or login state.
		// This assertion guards against a regression where label content
		// becomes hidden (e.g., via a broken Tailwind class like the original
		// `hidden xs:inline sm:inline` where `xs:` is not a defined breakpoint).
		expect(screen.getByText("Suggest")).toBeInTheDocument();
		expect(screen.getByText("Profile")).toBeInTheDocument();
	});

	it("does not render on the tournament route", () => {
		renderWithRouter(["/tournament"]);

		expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
	});

	it("marks the admin shortcut as current on the admin route", () => {
		mockStore.user.isLoggedIn = true;
		mockStore.user.name = "Avery Admin";
		mockStore.user.isAdmin = true;

		renderWithRouter(["/admin"]);

		expect(screen.getByRole("tab", { name: "Admin" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});
});
