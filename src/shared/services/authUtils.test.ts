import { afterEach, describe, expect, it, vi } from "vitest";
import { assertAdmin } from "./authUtils";

// Mock the app store to control the returned user state
vi.mock("@/store/appStore", () => {
	const getState = vi.fn();
	return {
		default: { getState },
	};
});

import useAppStore from "@/store/appStore";

describe("authUtils", () => {
	describe("assertAdmin", () => {
		afterEach(() => {
			vi.clearAllMocks();
		});

		it("should not throw when the user is an admin", () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: { isAdmin: true },
			} as any);

			expect(() => assertAdmin()).not.toThrow();
		});

		it("should throw the default error message when the user is logged in but not an admin", () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: { isAdmin: false },
			} as any);

			expect(() => assertAdmin()).toThrow("Admin privileges required");
		});

		it("should throw the default error message when the user is not logged in (user is undefined)", () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: undefined,
			} as any);

			expect(() => assertAdmin()).toThrow("Admin privileges required");
		});

		it("should throw a custom error message when provided and the user is not an admin", () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: { isAdmin: false },
			} as any);

			expect(() => assertAdmin("Custom admin error")).toThrow("Custom admin error");
		});
	});
});
