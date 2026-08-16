import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppState } from "@/store/appStore.types";
import type { AppSet } from "./appStore.shared";

describe("appStore.shared environments", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("should have IS_BROWSER false when window is undefined", async () => {
		vi.stubGlobal("window", undefined);
		const { IS_BROWSER } = await import("./appStore.shared");
		expect(IS_BROWSER).toBe(false);
	});

	it("should have IS_BROWSER true when window is defined", async () => {
		vi.stubGlobal("window", {});
		const { IS_BROWSER } = await import("./appStore.shared");
		expect(IS_BROWSER).toBe(true);
	});

	it("should have IS_DEV defined as a boolean", async () => {
		const { IS_DEV } = await import("./appStore.shared");
		expect(typeof IS_DEV).toBe("boolean");
	});
});

describe("appStore.shared patch", () => {
	it("should merge nested object properties", async () => {
		const { patch } = await import("./appStore.shared");
		const set = vi.fn();

		const key = "testKey" as keyof AppState;
		const updates = { newProp: 2 } as unknown as Partial<AppState[typeof key]>;

		patch(set as unknown as AppSet, key, updates);

		const updater = set.mock.calls[0][0];
		const currentState = {
			testKey: { existingProp: 1 },
			otherKey: { untouched: true },
		} as unknown as AppState;

		const nextState = updater(currentState);

		expect(nextState).toEqual({
			testKey: { existingProp: 1, newProp: 2 },
			otherKey: { untouched: true },
		});

		// Ensure original state is not mutated
		expect(currentState[key as string]).not.toHaveProperty("newProp");
	});
});
