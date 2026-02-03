import { beforeEach, describe, expect, it, vi } from "vitest";
import { withSupabase } from "./client";
import { hiddenNamesAPI } from "./nameService";

// Mock the client module
vi.mock("./client", () => ({
	withSupabase: vi.fn(),
}));

describe("hiddenNamesAPI.hideNames", () => {
	let mockClient: any;

	beforeEach(() => {
		// Create a mock client that supports chaining
		mockClient = {
			rpc: vi.fn(),
			from: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			// The chain ends with a promise that resolves to { error: null }
			eq: vi.fn().mockResolvedValue({ error: null }),
			in: vi.fn().mockResolvedValue({ error: null }),
		};

		// Default implementation of withSupabase runs the callback with our mock client
		(withSupabase as any).mockImplementation(async (cb: any) => {
			return cb(mockClient);
		});
	});

	it("performs 1 update call for N items using .in()", async () => {
		const ids = ["101", "102", "103"];
		const result = await hiddenNamesAPI.hideNames("testuser", ids);

		// Verify we got results for all items
		expect(result).toHaveLength(3);
		expect(result[0].success).toBe(true);

		// Verify optimization:
		// update() is called 1 time (bulk update)
		expect(mockClient.update).toHaveBeenCalledTimes(1);

		// .eq() should NOT be called
		expect(mockClient.eq).not.toHaveBeenCalled();

		// .in() should be called 1 time with all IDs
		expect(mockClient.in).toHaveBeenCalledTimes(1);
		expect(mockClient.in).toHaveBeenCalledWith("id", ids);
	});
});
