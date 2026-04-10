import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	batchUpdateLocked,
	batchUpdateVisibility,
	softDeleteName,
	toggleNameHidden,
	toggleNameLocked,
} from "@/features/names/mutations";
import { namesQueryKeys } from "@/features/names/queries";
import { imagesAPI } from "@/shared/services/supabase/api";
import { useNameAdminActions } from "./useNameAdminActions";

vi.mock("@/features/names/mutations", () => ({
	batchUpdateLocked: vi.fn(),
	batchUpdateVisibility: vi.fn(),
	softDeleteName: vi.fn(),
	toggleNameHidden: vi.fn(),
	toggleNameLocked: vi.fn(),
}));

vi.mock("@/features/names/queries", () => ({
	namesQueryKeys: {
		all: ["names"],
	},
}));

vi.mock("@/shared/services/supabase/api", () => ({
	imagesAPI: {
		upload: vi.fn(),
	},
}));

describe("useNameAdminActions", () => {
	let queryClient: QueryClient;
	let invalidateQueriesSpy: ReturnType<typeof vi.spyOn>;

	function wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	}

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				mutations: { retry: false },
				queries: { retry: false },
			},
		});
		invalidateQueriesSpy = vi
			.spyOn(queryClient, "invalidateQueries")
			.mockResolvedValue(undefined as never);

		vi.mocked(toggleNameHidden).mockResolvedValue(undefined);
		vi.mocked(toggleNameLocked).mockResolvedValue(undefined);
		vi.mocked(softDeleteName).mockResolvedValue(undefined);
		vi.mocked(batchUpdateVisibility).mockResolvedValue(undefined);
		vi.mocked(batchUpdateLocked).mockResolvedValue(undefined);
		vi.mocked(imagesAPI.upload).mockResolvedValue({
			path: "https://example.com/cat.png",
			error: null,
			success: true,
		});
	});

	it("invalidates the names query after toggling hidden status", async () => {
		const { result } = renderHook(() => useNameAdminActions(" admin "), { wrapper });

		await act(async () => {
			await result.current.toggleHidden({ nameId: "abc", isCurrentlyHidden: false });
		});

		expect(toggleNameHidden).toHaveBeenCalledWith({
			nameId: "abc",
			isCurrentlyHidden: false,
			userName: "admin",
		});
		expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: namesQueryKeys.all });
	});

	it("routes delete and bulk update actions through the shared mutations", async () => {
		const { result } = renderHook(() => useNameAdminActions("admin"), { wrapper });

		await act(async () => {
			await result.current.deleteName({ nameId: "deadbeef" });
			await result.current.batchUpdateVisibility({ nameIds: ["1", "2"], isHidden: true });
			await result.current.batchUpdateLocked({ nameIds: ["1", "2"], isLocked: false });
		});

		expect(softDeleteName).toHaveBeenCalledWith({ nameId: "deadbeef" });
		expect(batchUpdateVisibility).toHaveBeenCalledWith({
			nameIds: ["1", "2"],
			isHidden: true,
		});
		expect(batchUpdateLocked).toHaveBeenCalledWith({
			nameIds: ["1", "2"],
			isLocked: false,
		});
		expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
	});

	it("passes trimmed user names to lock toggles", async () => {
		const { result } = renderHook(() => useNameAdminActions("  mod-user  "), { wrapper });

		await act(async () => {
			await result.current.toggleLocked({ nameId: 42, isCurrentlyLocked: true });
		});

		expect(toggleNameLocked).toHaveBeenCalledWith({
			nameId: 42,
			isCurrentlyLocked: true,
			userName: "mod-user",
		});
	});

	it("reuses the shared image upload helper", async () => {
		const { result } = renderHook(() => useNameAdminActions(" uploader "), { wrapper });
		const file = new File(["cat"], "cat.png", { type: "image/png" });

		await act(async () => {
			await result.current.uploadImage(file);
		});

		expect(imagesAPI.upload).toHaveBeenCalledWith(file, "uploader");
	});
});
