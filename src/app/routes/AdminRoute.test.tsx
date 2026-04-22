import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();

const authState = {
	user: { id: "1", name: "Ada", isAdmin: false },
	isLoading: false,
};

vi.mock("react-router-dom", async () => {
	const actual =
		await vi.importActual<typeof import("react-router-dom")>(
			"react-router-dom",
		);
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

vi.mock("@/app/providers/Providers", () => ({
	useAuth: () => authState,
}));

vi.mock("@/app/appConfig", () => ({
	errorContexts: { analysisDashboard: "Analysis Dashboard" },
	routeComponents: {
		AdminDashboardLazy: () => (
			<div data-testid="admin-dashboard">Admin dashboard</div>
		),
	},
}));

async function renderAdminRoute() {
	const { default: AdminRoute } = await import("./AdminRoute");
	return render(
		<MemoryRouter>
			<AdminRoute />
		</MemoryRouter>,
	);
}

describe("AdminRoute", () => {
	beforeEach(() => {
		navigateMock.mockReset();
		authState.user = { id: "1", name: "Ada", isAdmin: false };
		authState.isLoading = false;
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

	it("shows a recovery path when the user is not an admin", async () => {
		await renderAdminRoute();

		expect(screen.getByText("Access Denied")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Back Home" }),
		).toBeInTheDocument();
	});

	it("navigates home from the access denied state", async () => {
		await renderAdminRoute();

		fireEvent.click(screen.getByRole("button", { name: "Back Home" }));
		expect(navigateMock).toHaveBeenCalledWith("/");
	});

	it("renders the admin dashboard for admins", async () => {
		authState.user = { id: "1", name: "Ada", isAdmin: true };

		await renderAdminRoute();

		expect(await screen.findByTestId("admin-dashboard")).toBeInTheDocument();
	});
});
