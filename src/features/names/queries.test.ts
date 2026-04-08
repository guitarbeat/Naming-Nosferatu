import { describe, expect, it, vi } from "vitest";
import { fetchNames, namesQueryKeys, namesQueryOptions } from "./queries";

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
		await expect(fetchNames(true)).rejects.toThrow(
			"Admin privileges required to view hidden names",
		);
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

	it("allows admin to fetch hidden names", async () => {
		vi.mocked(useAppStore.getState).mockReturnValue({ user: { isAdmin: true } } as never);
		vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(mockClient as never);
		mockFrom.mockReturnValue({ select: mockSelect });
		mockSelect.mockReturnValue({ eq: mockEq });
		mockEq.mockReturnValue({ eq: mockEq, order: mockOrder });
		mockOrder.mockResolvedValueOnce({ data: [], error: null });

		await expect(fetchNames(true)).resolves.toBeDefined();
	});

	it("throws when Supabase client is unavailable", async () => {
		vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(null);
		await expect(fetchNames(false)).rejects.toThrow("Supabase client not available");
	});

	it("throws on database error", async () => {
		vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(mockClient as never);
		mockFrom.mockReturnValue({ select: mockSelect });
		mockSelect.mockReturnValue({ eq: mockEq });
		mockEq.mockReturnValue({ eq: mockEq, order: mockOrder });
		mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB Error" } });

		await expect(fetchNames(false)).rejects.toMatchObject({ message: "DB Error" });
	});
});

describe("namesQueryKeys", () => {
	it("returns correct keys", () => {
		expect(namesQueryKeys.all).toEqual(["names"]);
		expect(namesQueryKeys.lists()).toEqual(["names", "list"]);
		expect(namesQueryKeys.list(true)).toEqual(["names", "list", { includeHidden: true }]);
		expect(namesQueryKeys.hiddenList()).toEqual(["names", "hidden"]);
	});
});

describe("namesQueryOptions", () => {
	it("returns correct options", () => {
		const options = namesQueryOptions(false);
		expect(options.queryKey).toEqual(namesQueryKeys.list(false));
		expect(options.queryFn).toBeDefined();
		expect(options.staleTime).toBe(30_000);
	});
});
