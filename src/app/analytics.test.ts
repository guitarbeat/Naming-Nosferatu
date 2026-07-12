import { describe, expect, it } from "vitest";
import { shouldEnableAnalytics } from "./analytics";

describe("shouldEnableAnalytics", () => {
	it("disables analytics outside production", () => {
		expect(shouldEnableAnalytics({ hostname: "cats.example.com", isProd: false })).toBe(false);
	});

	it("disables analytics for exact localhost and loopback", () => {
		expect(shouldEnableAnalytics({ hostname: "localhost", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "127.0.0.1", isProd: true })).toBe(false);
	});

	it("disables analytics for replit preview environments", () => {
		expect(shouldEnableAnalytics({ hostname: "workspace.replit.dev", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "some-random-id.replit.dev", isProd: true })).toBe(
			false,
		);
	});

	it("disables analytics for hostnames containing local", () => {
		expect(shouldEnableAnalytics({ hostname: "my-local-test.com", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "local.example.com", isProd: true })).toBe(false);
		expect(shouldEnableAnalytics({ hostname: "mylocalapp.net", isProd: true })).toBe(false);
	});

	it("enables analytics for valid production hosts", () => {
		expect(shouldEnableAnalytics({ hostname: "cats.example.com", isProd: true })).toBe(true);
		expect(shouldEnableAnalytics({ hostname: "nosferatu.app", isProd: true })).toBe(true);
	});

	it("throws an error when called with null or undefined (runtime check)", () => {
		expect(() => shouldEnableAnalytics(null as any)).toThrow();
		expect(() => shouldEnableAnalytics(undefined as any)).toThrow();
	});

	it("handles edge case hostnames gracefully", () => {
		expect(shouldEnableAnalytics({ hostname: "", isProd: true })).toBe(true);
	});
});
