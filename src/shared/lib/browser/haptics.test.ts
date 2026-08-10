import { afterEach, describe, expect, it, vi } from "vitest";
import { hapticNavTap, hapticTournamentStart } from "./haptics";

describe("haptics utilities", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("should call navigator.vibrate with 10 on hapticNavTap", () => {
		const mockVibrate = vi.fn();
		vi.stubGlobal("navigator", { vibrate: mockVibrate });

		hapticNavTap();

		expect(mockVibrate).toHaveBeenCalledWith(10);
	});

	it("should call navigator.vibrate with [50, 50, 50] on hapticTournamentStart", () => {
		const mockVibrate = vi.fn();
		vi.stubGlobal("navigator", { vibrate: mockVibrate });

		hapticTournamentStart();

		expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
	});

	it("should not throw if navigator is undefined", () => {
		vi.stubGlobal("navigator", undefined);

		expect(() => hapticNavTap()).not.toThrow();
		expect(() => hapticTournamentStart()).not.toThrow();
	});

	it("should not throw if navigator.vibrate is undefined", () => {
		vi.stubGlobal("navigator", {});

		expect(() => hapticNavTap()).not.toThrow();
		expect(() => hapticTournamentStart()).not.toThrow();
	});
});
