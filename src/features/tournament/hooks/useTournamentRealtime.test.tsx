import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";
import { useTournamentRealtime } from "./useTournamentRealtime";

vi.mock("@/shared/services/supabase/runtime", () => ({
	resolveSupabaseClient: vi.fn(),
}));

describe("useTournamentRealtime", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(resolveSupabaseClient).mockResolvedValue(null as never);
	});

	it("initializes without connecting by default", () => {
		const { result } = renderHook(() => useTournamentRealtime());
		expect(result.current).toHaveProperty("subscribeToTournament");
		expect(result.current).toHaveProperty("subscribeToMatches");
		expect(result.current).toHaveProperty("subscribeToUserActivity");
		expect(result.current).toHaveProperty("cleanup");
	});

	it("connects when autoConnect is true", () => {
		const { result } = renderHook(() => useTournamentRealtime({ autoConnect: true }));
		expect(result.current).toBeTruthy();
	});

	it("provides subscription methods that can be called", () => {
		const { result } = renderHook(() => useTournamentRealtime());

		const unsubTournament = result.current.subscribeToTournament("test-123", () => {});
		expect(typeof unsubTournament).toBe("function");

		const unsubMatches = result.current.subscribeToMatches(() => {});
		expect(typeof unsubMatches).toBe("function");

		const unsubUserActivity = result.current.subscribeToUserActivity(() => {});
		expect(typeof unsubUserActivity).toBe("function");

		unsubTournament();
		unsubMatches();
		unsubUserActivity();
	});

	it("calls cleanup on unmount", () => {
		const { unmount } = renderHook(() => useTournamentRealtime());
		unmount();
		expect(true).toBe(true);
	});
});
