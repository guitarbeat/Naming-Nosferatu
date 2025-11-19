import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./AppSidebar";

describe("AppSidebar", () => {
  it("renders breadcrumb items without throwing", () => {
    const breadcrumbItems = [
      {
        id: "home",
        label: "Home",
        onClick: vi.fn(),
      },
      {
        id: "dashboard",
        label: "Dashboard",
      },
    ];

    expect(() =>
      render(
        <SidebarProvider>
          <AppSidebar
            view="tournament"
            setView={vi.fn()}
            isLoggedIn
            userName="Test User"
            isAdmin={false}
            onLogout={vi.fn()}
            onStartNewTournament={vi.fn()}
            isLightTheme
            onThemeChange={vi.fn()}
            onTogglePerformanceDashboard={vi.fn()}
            breadcrumbItems={breadcrumbItems}
          />
        </SidebarProvider>,
      ),
    ).not.toThrow();

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
