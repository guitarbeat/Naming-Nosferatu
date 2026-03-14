import { describe, expect, it } from "vitest";
import { shouldWarnMissingSupabaseCredentials } from "./runtime";

describe("shouldWarnMissingSupabaseCredentials", () => {
	it("suppresses warnings for local fallback hosts", () => {
		expect(shouldWarnMissingSupabaseCredentials("localhost")).toBe(false);
		expect(shouldWarnMissingSupabaseCredentials("127.0.0.1")).toBe(false);
		expect(shouldWarnMissingSupabaseCredentials("0.0.0.0")).toBe(false);
	});

	it("keeps warnings for non-local hosts", () => {
		expect(shouldWarnMissingSupabaseCredentials("cats.example.com")).toBe(true);
	});
});
