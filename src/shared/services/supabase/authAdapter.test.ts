import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/shared/lib/constants";
import { readStoredUserSnapshot, writeStoredUserSnapshot } from "@/shared/lib/userStorage";

vi.mock("@/shared/services/supabase/runtime", () => ({
	resolveSupabaseClient: vi.fn(),
}));

import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";
import { supabaseAuthAdapter } from "./authAdapter";

function createRoleQuery(result: {
	data: { role: string } | null;
	error: { message: string } | null;
}) {
	const maybeSingle = vi.fn().mockResolvedValue(result);
	const roleEq = vi.fn(() => ({ maybeSingle }));
	const fieldEq = vi.fn(() => ({ eq: roleEq, maybeSingle }));
	const select = vi.fn(() => ({ eq: fieldEq, maybeSingle }));

	return { fieldEq, maybeSingle, roleEq, select };
}

describe("supabaseAuthAdapter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
	});

	it("restores the stored admin snapshot when Supabase is unavailable", async () => {
		writeStoredUserSnapshot({
			id: "user-1",
			name: "Ada",
			isAdmin: true,
		});
		vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(null);

		await expect(supabaseAuthAdapter.getCurrentUser()).resolves.toMatchObject({
			id: "user-1",
			name: "Ada",
			isAdmin: true,
			role: "admin",
		});
	});

	it("uses the secure is_admin RPC before falling back to role queries", async () => {
		const client = {
			rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
		};
		vi.mocked(resolveSupabaseClient).mockResolvedValue(client as never);

		await expect(supabaseAuthAdapter.checkAdminStatus("user-1")).resolves.toBe(true);
		expect(client.rpc).toHaveBeenCalledWith("is_admin");
	});

	it("falls back to the stored user name when the RPC cannot determine admin status", async () => {
		writeStoredUserSnapshot({
			name: "Ada",
			isAdmin: false,
		});

		const userIdQuery = createRoleQuery({ data: null, error: null });
		const userNameQuery = createRoleQuery({
			data: { role: "admin" },
			error: null,
		});
		const client = {
			rpc: vi.fn().mockResolvedValue({
				data: null,
				error: { message: "rpc unavailable" },
			}),
			from: vi
				.fn()
				.mockReturnValueOnce({ select: userIdQuery.select })
				.mockReturnValueOnce({ select: userNameQuery.select }),
		};
		vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(client as never);

		await expect(supabaseAuthAdapter.checkAdminStatus("user-1")).resolves.toBe(true);
		expect(client.from).toHaveBeenNthCalledWith(1, "cat_user_roles");
		expect(userIdQuery.fieldEq).toHaveBeenCalledWith("user_id", "user-1");
		expect(userNameQuery.fieldEq).toHaveBeenCalledWith("user_name", "Ada");
	});

	it("persists the authenticated user with admin status after a successful lookup", async () => {
		const client = {
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: {
						user: {
							id: "user-7",
							email: "ada@example.com",
							user_metadata: { user_name: "Ada" },
						},
					},
				}),
			},
			rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
		};
		vi.mocked(resolveSupabaseClient).mockResolvedValueOnce(client as never);

		await expect(supabaseAuthAdapter.getCurrentUser()).resolves.toMatchObject({
			id: "user-7",
			name: "Ada",
			isAdmin: true,
		});

		expect(readStoredUserSnapshot()).toMatchObject({
			id: "user-7",
			name: "Ada",
			isAdmin: true,
			email: "ada@example.com",
		});
		expect(window.localStorage.getItem(STORAGE_KEYS.USER)).toBe("Ada");
	});
});
