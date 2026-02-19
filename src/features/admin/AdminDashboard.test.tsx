import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "./AdminDashboard";

// Mock dependencies
vi.mock("@/store/appStore", () => ({
	default: () => ({
		user: { name: "TestAdmin", isAdmin: true },
	}),
}));

vi.mock("@/services/supabase/api", () => ({
	coreAPI: {
		getTrendingNames: vi.fn().mockResolvedValue([
			{ id: 1, name: "Fluffy", isHidden: false, lockedIn: false },
			{ id: 2, name: "Spot", isHidden: true, lockedIn: false },
		]),
	},
	hiddenNamesAPI: {
		hideName: vi.fn(),
		unhideName: vi.fn(),
	},
	imagesAPI: {
		upload: vi.fn(),
	},
}));

vi.mock("@/services/supabase/runtime", () => ({
	withSupabase: vi.fn(),
}));

// Mock icons
vi.mock("@/shared/lib/icons", () => ({
	BarChart3: () => <span data-testid="icon-bar-chart" />,
	Eye: () => <span data-testid="icon-eye" />,
	EyeOff: () => <span data-testid="icon-eye-off" />,
	Loader2: () => <span data-testid="icon-loader" />,
	Lock: () => <span data-testid="icon-lock" />,
}));

// Mock components
vi.mock("@/shared/components/layout/Button", () => ({
	default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock("@/shared/components/layout/Card", () => ({
	Card: ({ children, className }: any) => (
		<div className={className} data-testid="card">
			{children}
		</div>
	),
}));
vi.mock("@/shared/components/layout/Feedback", () => ({
	Loading: () => <div>Loading...</div>,
}));
vi.mock("@/shared/components/layout/FormPrimitives", () => ({
	Input: (props: any) => <input {...props} />,
}));

describe("AdminDashboard", () => {
	it("renders loading state initially", () => {
		render(<AdminDashboard />);
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("renders dashboard content after loading", async () => {
		render(<AdminDashboard />);

		await waitFor(() => {
			expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
		});

		// Check tabs exist
		expect(screen.getByText("Overview")).toBeInTheDocument();
		expect(screen.getByText("Names")).toBeInTheDocument();
		expect(screen.getByText("Users")).toBeInTheDocument();
		expect(screen.getByText("Analytics")).toBeInTheDocument();
	});

	it("switches tabs correctly", async () => {
		render(<AdminDashboard />);

		await waitFor(() => {
			expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
		});

		// Default is Overview
		expect(screen.getByText("Quick Actions")).toBeInTheDocument();

		// Click Names tab
		fireEvent.click(screen.getByText("Names"));

		await waitFor(() => {
			// Check for elements specific to Names tab
			expect(screen.getByPlaceholderText("Search names...")).toBeInTheDocument();
			expect(screen.getByText("Fluffy")).toBeInTheDocument();
		});

		// Click Users tab
		fireEvent.click(screen.getByText("Users"));
		await waitFor(() => {
			expect(screen.getByText("User Analytics")).toBeInTheDocument();
		});
	});
});
