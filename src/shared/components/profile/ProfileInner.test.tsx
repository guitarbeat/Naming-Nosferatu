import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { ProfileInner } from "./ProfileInner";

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
	it("uses the auth logout handler instead of mutating only local store state", async () => {
		const onLogout = vi.fn().mockResolvedValue(undefined);

		render(<ProfileInner onLogin={vi.fn()} onLogout={onLogout} />);

		fireEvent.click(screen.getByRole("button", { name: /logout/i }));

		await waitFor(() => {
			expect(onLogout).toHaveBeenCalledTimes(1);
		});
	});
});
