import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeroUIProvider } from "@heroui/react";

import { NavbarProvider } from "../ui/navbar";
import { AppNavbar } from "./AppNavbar";

describe("AppNavbar", () => {
  it("renders navigation items without throwing", () => {
    expect(() =>
      render(
        <HeroUIProvider>
          <NavbarProvider>
            <AppNavbar
              view="tournament"
              setView={vi.fn()}
              isLoggedIn
              userName="Test User"
              isAdmin={false}
              onLogout={vi.fn()}
              themePreference="light"
              currentTheme="light"
              onThemePreferenceChange={vi.fn()}
            />
          </NavbarProvider>
        </HeroUIProvider>,
      ),
    ).not.toThrow();

    // Test that main navigation elements are present
    const homeButtons = screen.getAllByLabelText("Go to Tournament home");
    expect(homeButtons.length).toBeGreaterThan(0);
    // UserInfo component shows username when not collapsed
    const userLabels = screen.getAllByText(/Test User/i);
    expect(userLabels.length).toBeGreaterThan(0);
  });
});
