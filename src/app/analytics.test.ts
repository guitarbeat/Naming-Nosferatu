import { describe, expect, it } from "vitest";
import { shouldEnableAnalytics } from "./analytics";

describe("shouldEnableAnalytics", () => {
	it("disables analytics outside production", () => {
		expect(shouldEnableAnalytics({ hostname: "cats.example.com", isProd: false })).toBe(false);
	});

	it("disables analytics for local preview hosts", () => {
		expect(shouldEnableAnalytics({ hostname: "localhost", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "127.0.0.1", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "0.0.0.0", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "::1", isProd: true })).toBe(false);
	});

	it("enables analytics for production hosts", () => {
		expect(shouldEnableAnalytics({ hostname: "cats.example.com", isProd: true })).toBe(true);
	});

	it("disables analytics for other local preview hosts", () => {
		expect(shouldEnableAnalytics({ hostname: "0.0.0.0", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "::1", isProd: true })).toBe(false);
	});

	it("throws an error when called with null or undefined (runtime check)", () => {
		expect(() => shouldEnableAnalytics(null as any)).toThrow();
		expect(() => shouldEnableAnalytics(undefined as any)).toThrow();
	});

	it("handles edge case hostnames gracefully", () => {
		expect(shouldEnableAnalytics({ hostname: "", isProd: true })).toBe(true);
	});
});
