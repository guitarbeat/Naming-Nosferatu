import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./AppSidebar";

describe("AppSidebar", () => {
  it("renders navigation items without throwing", () => {
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
          />
        </SidebarProvider>,
      ),
    ).not.toThrow();

    // Test that main navigation elements are present
    expect(screen.getByText("Tournament")).toBeInTheDocument();
    // UserInfo component shows "Welcome, {userName}" when not collapsed
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });
});
