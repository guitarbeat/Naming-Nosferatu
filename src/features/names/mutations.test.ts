import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { batchUpdateVisibility, softDeleteName, toggleNameHidden, toggleNameLocked } from "./mutations";

vi.mock("@/store/appStore", () => ({
        default: {
                getState: vi.fn(() => ({
                        user: { isAdmin: true },
                })),
        },
}));

import useAppStore from "@/store/appStore";

const mockRpc = vi.fn();

vi.mock("@/shared/services/supabase/runtime", () => ({
        resolveSupabaseClient: vi.fn(),
        withSupabase: vi.fn(async (op, fb) => {
                const { resolveSupabaseClient } = await import("@/shared/services/supabase/runtime");
                const client = await resolveSupabaseClient();
                if (!client) return fb;
                return op(client);
        }),
}));

import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";

const mockClient = { rpc: mockRpc };

beforeEach(() => {
        vi.mocked(resolveSupabaseClient).mockResolvedValue(mockClient as never);
        mockRpc.mockReset();
});

afterEach(() => {
        vi.clearAllMocks();
});

describe("softDeleteName", () => {
        it("calls soft_delete_cat_name RPC and resolves on success", async () => {
                mockRpc.mockResolvedValueOnce({ data: true, error: null });
                await expect(softDeleteName({ nameId: "abc-123" })).resolves.toBeUndefined();
                expect(mockRpc).toHaveBeenCalledWith("soft_delete_cat_name", { p_name_id: "abc-123" });
        });

        it("throws when the RPC returns an error", async () => {
                mockRpc.mockResolvedValueOnce({ data: null, error: { message: "not admin" } });
                await expect(softDeleteName({ nameId: "abc-123" })).rejects.toMatchObject({
                        message: "not admin",
                });
        });

        it("throws when RPC returns data !== true", async () => {
                mockRpc.mockResolvedValueOnce({ data: false, error: null });
                await expect(softDeleteName({ nameId: "abc-123" })).rejects.toThrow("Failed to delete name");
        });

        it("throws when Supabase client is unavailable", async () => {
                vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(null);
                await expect(softDeleteName({ nameId: "abc-123" })).rejects.toThrow(
                        "Supabase client not available",
                );
        });

        it("throws when user is not an admin", async () => {
                vi.mocked(useAppStore.getState).mockReturnValueOnce({ user: { isAdmin: false } } as never);
                await expect(softDeleteName({ nameId: "abc-123" })).rejects.toThrow(
                        "Admin privileges required",
                );
        });
});

describe("batchUpdateVisibility", () => {
        it("calls batch_update_name_visibility RPC with p_is_hidden=true to hide names", async () => {
                mockRpc.mockResolvedValueOnce({ data: true, error: null });
                await expect(
                        batchUpdateVisibility({ nameIds: ["id-1", "id-2"], isHidden: true }),
                ).resolves.toBeUndefined();
                expect(mockRpc).toHaveBeenCalledWith("batch_update_name_visibility", {
                        p_name_ids: ["id-1", "id-2"],
                        p_is_hidden: true,
                });
        });

        it("calls batch_update_name_visibility RPC with p_is_hidden=false to unhide names", async () => {
                mockRpc.mockResolvedValueOnce({ data: true, error: null });
                await expect(
                        batchUpdateVisibility({ nameIds: ["id-3"], isHidden: false }),
                ).resolves.toBeUndefined();
                expect(mockRpc).toHaveBeenCalledWith("batch_update_name_visibility", {
                        p_name_ids: ["id-3"],
                        p_is_hidden: false,
                });
        });

        it("throws when the RPC returns an error", async () => {
                mockRpc.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });
                await expect(
                        batchUpdateVisibility({ nameIds: ["id-1"], isHidden: true }),
                ).rejects.toMatchObject({ message: "permission denied" });
        });

        it("throws when RPC returns data !== true", async () => {
                mockRpc.mockResolvedValueOnce({ data: false, error: null });
                await expect(
                        batchUpdateVisibility({ nameIds: ["id-1"], isHidden: true }),
                ).rejects.toThrow("Failed to batch update name visibility");
        });

        it("throws when Supabase client is unavailable", async () => {
                vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(null);
                await expect(
                        batchUpdateVisibility({ nameIds: ["id-1"], isHidden: true }),
                ).rejects.toThrow("Supabase client not available");
        });

        it("throws when user is not an admin", async () => {
                vi.mocked(useAppStore.getState).mockReturnValueOnce({ user: { isAdmin: false } } as never);
                await expect(
                        batchUpdateVisibility({ nameIds: ["id-1"], isHidden: true }),
                ).rejects.toThrow("Admin privileges required");
        });
});

describe("toggleNameHidden", () => {
        it("calls toggle_name_visibility with p_hide=true to hide a name", async () => {
                mockRpc.mockResolvedValueOnce({ data: true, error: null });
                await toggleNameHidden({ nameId: "abc", isCurrentlyHidden: false, userName: "admin" });
                expect(mockRpc).toHaveBeenCalledWith("toggle_name_visibility", {
                        p_name_id: "abc",
                        p_hide: true,
                        p_user_name: "admin",
                });
        });

        it("calls toggle_name_visibility with p_hide=false to unhide a name", async () => {
                mockRpc.mockResolvedValueOnce({ data: true, error: null });
                await toggleNameHidden({ nameId: "abc", isCurrentlyHidden: true, userName: "admin" });
                expect(mockRpc).toHaveBeenCalledWith("toggle_name_visibility", {
                        p_name_id: "abc",
                        p_hide: false,
                        p_user_name: "admin",
                });
        });

        it("throws on RPC error", async () => {
                mockRpc.mockResolvedValueOnce({ data: null, error: { message: "rpc failed" } });
                await expect(
                        toggleNameHidden({ nameId: "abc", isCurrentlyHidden: false, userName: "admin" }),
                ).rejects.toMatchObject({ message: "rpc failed" });
        });

        it("throws when user is not an admin", async () => {
                vi.mocked(useAppStore.getState).mockReturnValueOnce({ user: { isAdmin: false } } as never);
                await expect(
                        toggleNameHidden({ nameId: "abc", isCurrentlyHidden: false, userName: "admin" }),
                ).rejects.toThrow("Admin privileges required");
        });
});

describe("toggleNameLocked", () => {
        it("calls toggle_name_locked_in RPC to lock a name", async () => {
                mockRpc.mockResolvedValueOnce({ data: true, error: null });
                await toggleNameLocked({ nameId: "xyz", isCurrentlyLocked: false, userName: "admin" });
                expect(mockRpc).toHaveBeenCalledWith("toggle_name_locked_in", {
                        p_name_id: "xyz",
                        p_locked_in: true,
                });
        });

        it("falls back to include p_user_name on signature error", async () => {
                mockRpc
                        .mockResolvedValueOnce({ error: { message: "no function matches the given name" } })
                        .mockResolvedValueOnce({ data: true, error: null });

                await toggleNameLocked({ nameId: "xyz", isCurrentlyLocked: false, userName: "admin" });

                expect(mockRpc).toHaveBeenCalledTimes(2);
                expect(mockRpc).toHaveBeenNthCalledWith(2, "toggle_name_locked_in", {
                        p_name_id: "xyz",
                        p_locked_in: true,
                        p_user_name: "admin",
                });
        });

        it("throws when Supabase client unavailable", async () => {
                vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(null);
                await expect(
                        toggleNameLocked({ nameId: "xyz", isCurrentlyLocked: false, userName: "admin" }),
                ).rejects.toThrow("Supabase client not available");
        });

        it("throws when user is not an admin", async () => {
                vi.mocked(useAppStore.getState).mockReturnValueOnce({ user: { isAdmin: false } } as never);
                await expect(
                        toggleNameLocked({ nameId: "xyz", isCurrentlyLocked: false, userName: "admin" }),
                ).rejects.toThrow("Admin privileges required");
        });
});
