import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileInner } from "./ProfileInner";

const mockLogout = vi.fn();
vi.mock("@/app/providers/authContext", () => ({
	useAuth: vi.fn(() => ({ logout: mockLogout })),
}));

const storeState = {
	user: {
		name: "Ada",
		isLoggedIn: true,
		isAdmin: true,
		avatarUrl: undefined,
	},
};

vi.mock("@/store/appStore", () => ({
	__esModule: true,
	default: (selector?: (state: typeof storeState) => unknown) =>
		selector ? selector(storeState) : storeState,
}));

describe("ProfileInner", () => {
	beforeEach(() => {
		storeState.user = {
			name: "Ada",
			isLoggedIn: true,
			isAdmin: true,
			avatarUrl: undefined,
		};
	});

	it("uses the auth logout handler instead of mutating only local store state", async () => {
		const onLogout = vi.fn().mockResolvedValue(undefined);

		render(<ProfileInner onLogin={vi.fn()} onLogout={onLogout} />);

		fireEvent.click(screen.getByRole("button", { name: "Logout" }));

		await waitFor(() => {
			expect(onLogout).toHaveBeenCalledTimes(1);
		});
	});

	it("keeps the profile editor open when login verification fails", async () => {
		storeState.user = {
			name: "",
			isLoggedIn: false,
			isAdmin: false,
			avatarUrl: undefined,
		};
		const onLogin = vi.fn().mockResolvedValue(false);

		render(<ProfileInner onLogin={onLogin} onLogout={vi.fn()} />);

		fireEvent.change(screen.getByPlaceholderText("Who are you?"), {
			target: { value: "Ada" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }));

		await waitFor(() => {
			expect(onLogin).toHaveBeenCalledWith("Ada");
		});
		expect(
			screen.getByText("We couldn't log you in with that name. Try again."),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Begin Journey" })).toBeInTheDocument();
	});
});
