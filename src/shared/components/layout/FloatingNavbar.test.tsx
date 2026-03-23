import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingNavbar } from "./FloatingNavbar";

const setSwipeModeMock = vi.fn();
const startTournamentMock = vi.fn();

const mockStore = {
	tournament: {
		selectedNames: [] as string[],
		names: null as string[] | null,
		isComplete: false,
	},
	tournamentActions: {
		startTournament: startTournamentMock,
	},
	user: {
		isLoggedIn: false,
		name: "",
		avatarUrl: "",
		isAdmin: false,
	},
	ui: {
		isSwipeMode: false,
	},
	uiActions: {
		setSwipeMode: setSwipeModeMock,
	},
};

vi.mock("framer-motion", () => ({
	motion: {
		button: ({ whileTap: _whileTap, ...props }: Record<string, unknown>) => <button {...props} />,
		div: ({ whileTap: _whileTap, ...props }: Record<string, unknown>) => <div {...props} />,
	},
}));

vi.mock("./LiquidGlass", () => ({
	default: ({
		children,
		className,
		style,
	}: {
		children: ReactNode;
		className?: string;
		style?: CSSProperties;
	}) => (
		<div data-testid="liquid-glass" className={className} style={style}>
			{children}
		</div>
	),
}));

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

function createSection(id: string, top: number) {
	const section = document.createElement("section");
	const scrollIntoView = vi.fn();

	section.id = id;
	section.scrollIntoView = scrollIntoView;
	Object.defineProperty(section, "getBoundingClientRect", {
		configurable: true,
		value: () => ({
			top,
			bottom: top + 280,
			left: 0,
			right: 1024,
			width: 1024,
			height: 280,
			x: 0,
			y: top,
			toJSON: () => ({}),
		}),
	});

	document.body.appendChild(section);
	return { section, scrollIntoView };
}

function mountSections(activeSection: "pick" | "suggest" | "profile" = "pick") {
	const topMap = {
		pick: { pick: 32, suggest: 520, profile: 920 },
		suggest: { pick: -480, suggest: 40, profile: 520 },
		profile: { pick: -920, suggest: -460, profile: 36 },
	}[activeSection];

	return {
		pick: createSection("pick", topMap.pick),
		suggest: createSection("suggest", topMap.suggest),
		profile: createSection("profile", topMap.profile),
	};
}

describe("FloatingNavbar", () => {
	beforeEach(() => {
		mockStore.tournament.selectedNames = [];
		mockStore.tournament.names = null;
		mockStore.tournament.isComplete = false;
		startTournamentMock.mockReset();
		mockStore.user.isLoggedIn = false;
		mockStore.user.name = "";
		mockStore.user.avatarUrl = "";
		mockStore.user.isAdmin = false;
		mockStore.ui.isSwipeMode = false;

		setSwipeModeMock.mockReset();

		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: createMatchMedia(false),
		});
		Object.defineProperty(window, "scrollTo", {
			writable: true,
			value: vi.fn(),
		});
		Object.defineProperty(window, "innerHeight", {
			writable: true,
			configurable: true,
			value: 800,
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

	it("renders home navigation items and marks the current visible section", () => {
		mountSections("suggest");

		render(
			<MemoryRouter initialEntries={["/"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		expect(screen.getByRole("button", { name: "Pick Names" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Analyze" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Suggest" })).toHaveAttribute(
			"aria-current",
			"location",
		);
		expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
	}, 10000);

	it("surfaces the ready tournament action without dropping the nav", () => {
		mockStore.tournament.selectedNames = ["Luna", "Fig", "Miso"];
		mountSections("pick");

		render(
			<MemoryRouter initialEntries={["/"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		const pickButton = screen.getByRole("button", { name: "Start (3)" });

		expect(pickButton).toBeInTheDocument();
		expect(pickButton).toHaveClass("floating-navbar__item--accent");

		fireEvent.click(pickButton);
		expect(startTournamentMock).toHaveBeenCalledWith(["Luna", "Fig", "Miso"]);
	});

	it("scrolls to the requested home section instead of switching hidden panels", () => {
		const sections = mountSections("pick");

		render(
			<MemoryRouter initialEntries={["/"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Suggest" }));
		expect(sections.suggest.scrollIntoView).toHaveBeenCalled();
	});

	it("shows analyze as the current destination on the analysis route", () => {
		render(
			<MemoryRouter initialEntries={["/analysis"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		expect(screen.getByRole("button", { name: "Analyze" })).toHaveAttribute(
			"aria-current",
			"location",
		);
	});

	it("uses pressed semantics for the layout mode chip without treating it as the current destination", () => {
		mockStore.ui.isSwipeMode = true;
		mountSections("pick");

		render(
			<MemoryRouter initialEntries={["/"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		const modeChip = screen.getByRole("button", { name: "Swipe mode active" });

		expect(modeChip).toHaveAttribute("aria-pressed", "true");
		expect(modeChip).not.toHaveAttribute("aria-current");

		fireEvent.click(modeChip);
		expect(setSwipeModeMock).toHaveBeenCalledWith(false);
	});

	it("renders the logged-in avatar when available", () => {
		mockStore.user.isLoggedIn = true;
		mockStore.user.name = "Avery Admin";
		mockStore.user.avatarUrl = "https://example.com/avatar.png";
		mountSections("pick");

		render(
			<MemoryRouter initialEntries={["/"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		expect(screen.getByAltText("Avery")).toBeInTheDocument();
	});

	it("keeps the admin profile icon treatment when no avatar is present", () => {
		mockStore.user.isLoggedIn = true;
		mockStore.user.name = "Avery Admin";
		mockStore.user.isAdmin = true;
		mountSections("pick");

		render(
			<MemoryRouter initialEntries={["/"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		const profileButton = screen.getByRole("button", { name: "Avery" });
		const profileIcon = profileButton.querySelector("svg");

		expect(profileIcon).not.toBeNull();
		expect(profileIcon).toHaveClass("text-chart-4");
	});

	it("does not render on the tournament route", () => {
		render(
			<MemoryRouter initialEntries={["/tournament"]}>
				<FloatingNavbar />
			</MemoryRouter>,
		);

		expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
	});
});
