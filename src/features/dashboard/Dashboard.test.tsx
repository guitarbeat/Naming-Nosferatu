import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Dashboard } from "./Dashboard";

vi.mock("./components/admin/AdminDashboard", () => ({
	AdminDashboard: () => (
		<div data-testid="admin-dashboard">Admin Dashboard</div>
	),
}));

vi.mock("./components/analytics/Dashboard", () => ({
	Dashboard: () => (
		<div data-testid="analytics-dashboard">Analytics Dashboard</div>
	),
}));

describe("Dashboard", () => {
	it("renders only AnalyticsDashboard when user is not an admin", () => {
		render(<Dashboard isAdmin={false} />);

		expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
		expect(screen.queryByTestId("admin-dashboard")).not.toBeInTheDocument();
		expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
		expect(screen.queryByText("Moderation")).not.toBeInTheDocument();
	});

	it("renders view toggles and AnalyticsDashboard by default when user is an admin", () => {
		render(<Dashboard isAdmin={true} />);

		expect(screen.getByText("Analytics")).toBeInTheDocument();
		expect(screen.getByText("Moderation")).toBeInTheDocument();
		expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
		expect(screen.queryByTestId("admin-dashboard")).not.toBeInTheDocument();
	});

	it("switches to Moderation view when the Moderation toggle is clicked", () => {
		render(<Dashboard isAdmin={true} />);

		const moderationButton = screen.getByText("Moderation");
		fireEvent.click(moderationButton);

		expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
		expect(screen.queryByTestId("analytics-dashboard")).not.toBeInTheDocument();
	});

	it("switches back to Analytics view when the Analytics toggle is clicked", () => {
		render(<Dashboard isAdmin={true} />);

		const moderationButton = screen.getByText("Moderation");
		fireEvent.click(moderationButton);

		expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();

		const analyticsButton = screen.getByText("Analytics");
		fireEvent.click(analyticsButton);

		expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
		expect(screen.queryByTestId("admin-dashboard")).not.toBeInTheDocument();
	});
});
