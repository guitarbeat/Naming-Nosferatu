import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import App from "./App";

const authState = {
	user: { id: "1", name: "Test User", isAdmin: false },
	isLoading: false,
};

const storeState = {
	userActions: { setAdminStatus: vi.fn() },
	ui: { isBootLoading: false },
	uiActions: { setBootLoading: vi.fn() },
};

vi.mock("@/app/providers/Providers", () => ({
	useAuth: () => authState,
}));

vi.mock("@/store/appStore", () => ({
	__esModule: true,
	default: (selector?: (state: typeof storeState) => unknown) =>
		selector ? selector(storeState) : storeState,
	useAppStoreInitialization: vi.fn(),
}));

vi.mock("@/app/AppShell", () => ({
	__esModule: true,
	default: () => <div data-testid="app-shell">App shell</div>,
}));

vi.mock("@/app/components/AppBootScreen", () => ({
	AppBootScreen: ({ message, visible = true }: { message?: string; visible?: boolean }) =>
		visible ? <div data-testid="boot-screen">{message ?? "Preparing the tournament..."}</div> : null,
}));

vi.mock("@/shared/lib/performance", () => ({
	initializePerformanceMonitoring: vi.fn(),
	cleanupPerformanceMonitoring: vi.fn(),
}));

vi.mock("@/shared/services/errorManager", () => ({
	ErrorManager: {
		setupGlobalErrorHandling: () => vi.fn(),
	},
}));

vi.mock("@/shared/services/supabase/runtime", () => ({
	updateSupabaseUserContext: vi.fn(),
}));

describe("App", () => {
	it("renders the boot screen while the app is still initializing", () => {
		authState.isLoading = true;
		storeState.ui.isBootLoading = true;

		render(<App />);

		expect(screen.getByTestId("boot-screen")).toHaveTextContent("Preparing the tournament...");
	});

	it("renders the lazy app shell after boot completes", async () => {
		authState.isLoading = false;
		storeState.ui.isBootLoading = false;

		render(<App />);

		expect(await screen.findByTestId("app-shell")).toBeInTheDocument();
	});
});
