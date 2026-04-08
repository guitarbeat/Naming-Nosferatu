import { describe, expect, it, vi } from "vitest";
import { fetchNames } from "./queries";

vi.mock("@/store/appStore", () => ({
	default: {
		getState: vi.fn(() => ({
			user: { isAdmin: true },
		})),
	},
}));

import useAppStore from "@/store/appStore";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/shared/services/supabase/runtime", () => ({
	resolveSupabaseClient: vi.fn(),
}));

import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";

const mockClient = {
	from: mockFrom,
};

describe("fetchNames", () => {
	it("throws when user is not an admin and includeHidden is true", async () => {
		vi.mocked(useAppStore.getState).mockReturnValueOnce({ user: { isAdmin: false } } as never);
		await expect(fetchNames(true)).rejects.toThrow("Admin privileges required to view hidden names");
	});

	it("allows non-admin to fetch non-hidden names", async () => {
		vi.mocked(useAppStore.getState).mockReturnValue({ user: { isAdmin: false } } as never);
		vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(mockClient as never);
		mockFrom.mockReturnValue({ select: mockSelect });
		mockSelect.mockReturnValue({ eq: mockEq });
		mockEq.mockReturnValue({ eq: mockEq, order: mockOrder });
		mockOrder.mockResolvedValueOnce({ data: [], error: null });

		await expect(fetchNames(false)).resolves.toBeDefined();
	});
});
