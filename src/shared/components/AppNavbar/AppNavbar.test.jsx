import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NavbarProvider } from "../ui/navbar";
import { AppNavbar } from "./AppNavbar";

describe("AppNavbar", () => {
  it("renders navigation items without throwing", () => {
    expect(() =>
      render(
        <NavbarProvider>
          <AppNavbar
            view="tournament"
            setView={vi.fn()}
            isLoggedIn
            userName="Test User"
            isAdmin={false}
            onLogout={vi.fn()}
            onStartNewTournament={vi.fn()}
            themePreference="light"
            currentTheme="light"
            onThemePreferenceChange={vi.fn()}
          />
        </NavbarProvider>
      )
    ).not.toThrow();

    // Test that main navigation elements are present
    expect(screen.getByText("Tournament")).toBeInTheDocument();
    // UserInfo component shows username when not collapsed
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });
});
