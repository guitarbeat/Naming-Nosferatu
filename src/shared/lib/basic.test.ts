import { describe, expect, it, vi } from "vitest";
import { cn } from "./basic";

// Mock @/services/supabase/client to avoid side effects
vi.mock("@/services/supabase/client", () => ({
	queryClient: {},
}));

describe("cn utility", () => {
	it("merges class names", () => {
		expect(cn("c1", "c2")).toBe("c1 c2");
	});

	it("handles conditional classes", () => {
		expect(cn("c1", true && "c2", false && "c3")).toBe("c1 c2");
		expect(cn("c1", null, undefined, "c2")).toBe("c1 c2");
	});

	it("resolves Tailwind conflicts", () => {
		expect(cn("p-4", "p-2")).toBe("p-2");
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
	});

	it("handles mixed inputs (arrays/objects)", () => {
		expect(cn("c1", ["c2", { c3: true, c4: false }])).toBe("c1 c2 c3");
	});

	it("handles empty inputs", () => {
		expect(cn()).toBe("");
		expect(cn(undefined, null, "")).toBe("");
	});
});
