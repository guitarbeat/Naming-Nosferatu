import React, { useSyncExternalStore } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(target, source) {
  const startingPoint = isPlainObject(target) ? { ...target } : {};

  if (!isPlainObject(source)) {
    return startingPoint;
  }

  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value)) {
      startingPoint[key] = deepMerge(target?.[key], value);
    } else {
      startingPoint[key] = value;
    }
  }

  return startingPoint;
}

function createMockStoreState(overrides = {}) {
  const baseState = {
    user: {
      isLoggedIn: true,
      name: "Admin Cat",
      isAdmin: false,
    },
    tournament: {
      names: [],
      ratings: {},
      isComplete: false,
      isLoading: false,
      voteHistory: [],
      currentView: "tournament",
    },
    ui: {
      theme: "light",
      showGlobalAnalytics: false,
      showUserComparison: false,
      matrixMode: false,
    },
    errors: {
      current: null,
      history: [],
    },
    tournamentActions: {
      addVote: vi.fn(),
      setView: vi.fn(),
      resetTournament: vi.fn(),
      setRatings: vi.fn(),
      setNames: vi.fn(),
      setLoading: vi.fn(),
      setComplete: vi.fn(),
    },
    userActions: {
      login: vi.fn(),
      logout: vi.fn(),
      setAdminStatus: vi.fn(),
      setUser: vi.fn(),
      initializeFromStorage: vi.fn(),
    },
    uiActions: {},
    errorActions: {
      clearError: vi.fn(),
    },
  };

  return deepMerge(baseState, overrides);
}

vi.mock("@core/store/useAppStore", () => {
  let storeState = createMockStoreState();
  const listeners = new Set();

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useAppStore = (selector = (state) => state) =>
    useSyncExternalStore(
      subscribe,
      () => selector(storeState),
      () => selector(storeState)
    );

  const mergeState = (partial) => {
    if (!isPlainObject(partial)) {
      return storeState;
    }

    storeState = deepMerge(storeState, partial);
    listeners.forEach((listener) => listener());
    return storeState;
  };

  const setState = (update) => {
    const partial = typeof update === "function" ? update(storeState) : update;
    return mergeState(partial);
  };

  const resetState = (overrides = {}) => {
    storeState = createMockStoreState(overrides);
    listeners.forEach((listener) => listener());
    return storeState;
  };

  useAppStore.getState = () => storeState;
  useAppStore.setState = setState;

  return {
    default: useAppStore,
    useAppStoreInitialization: () => {},
    __setMockState: setState,
    __resetMockState: resetState,
  };
});

vi.mock("@hooks/useUserSession", () => ({
  default: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    isInitialized: true,
  }),
}));

vi.mock("@hooks/useRouting", () => ({
  useRouting: () => ({
    currentRoute: "/",
    navigateTo: vi.fn(),
    isRoute: vi.fn(),
  }),
}));

vi.mock("@hooks/useTournamentRoutingSync", () => ({
  useTournamentRoutingSync: () => "/",
}));

vi.mock("@components/CatBackground/CatBackground", () => ({
  default: () => <div data-testid="cat-background" />,
}));

vi.mock("@components/ViewRouter/ViewRouter", () => ({
  default: () => <div data-testid="view-router" />,
}));

vi.mock("./shared/components/AppNavbar/AppNavbar", () => ({
  AppNavbar: () => (
    <aside>
      <button type="button" aria-label="Go to home page">
        Home
      </button>
    </aside>
  ),
}));

import App from "./App";
import { __resetMockState } from "@core/store/useAppStore";

describe("App", () => {
  beforeEach(() => {
    __resetMockState();
  });

  it("renders primary navigation landmarks for users", () => {
    render(<App />);

    const skipLink = screen.getByRole("link", {
      name: /skip to main content/i,
    });
    expect(skipLink).toBeVisible();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    const homeButton = screen.getByRole("button", { name: /go to home page/i });
    expect(homeButton).toBeInTheDocument();
  });

  it("displays the global loading overlay while the tournament initializes", async () => {
    __resetMockState({
      tournament: { isLoading: true },
      user: { isLoggedIn: true },
    });

    render(<App />);

    const overlayMessage = await screen.findByText(/initializing tournament/i);
    expect(overlayMessage).toBeInTheDocument();
    expect(overlayMessage.closest(".global-loading-overlay")).not.toBeNull();
  });

  //     ui: { showPerformanceDashboard: false },
  //   });
});
