import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isStorageAvailable } from "@/shared/lib/storage";

// Mock the storage utility
vi.mock("@/shared/lib/storage", async () => {
	const actual = await vi.importActual("@/shared/lib/storage");
	return {
		...(actual as Record<string, unknown>),
		isStorageAvailable: vi.fn(),
	};
});

describe("sound initialization", () => {
	// We need to use a real class for the Audio mock so it can be instantiated with `new`
	const mockAddEventListener = vi.fn();
	class MockAudio {
		addEventListener = mockAddEventListener;
		pause = vi.fn();
		play = vi.fn().mockResolvedValue(undefined);
		cloneNode = vi.fn().mockReturnValue(this);
		volume = 1;
		currentTime = 0;
		loop = false;
		preload = "auto";
		constructor(public src?: string) {}
	}

	beforeEach(() => {
		vi.clearAllMocks();
		mockAddEventListener.mockClear();
		// Default to not having Audio or AudioContext to start clean
		vi.stubGlobal("Audio", undefined);
		vi.stubGlobal("AudioContext", undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
		vi.unstubAllGlobals();
	});

	it("should skip initialization if not in a browser environment", async () => {
		vi.mocked(isStorageAvailable).mockReturnValue(false);
		vi.stubGlobal("Audio", MockAudio);

		const { soundManager } = await import("./sound.ts");
		expect(soundManager.canPlaySounds()).toBe(false);

		expect(isStorageAvailable).toHaveBeenCalled();
		expect(mockAddEventListener).not.toHaveBeenCalled();
	});

	it("should handle initialization when Audio is undefined in browser environment", async () => {
		vi.mocked(isStorageAvailable).mockReturnValue(true);
		// Explicitly ensure Audio is undefined
		vi.stubGlobal("Audio", undefined);

		const { soundManager } = await import("./sound.ts");
		expect(soundManager.canPlaySounds()).toBe(true);

		expect(isStorageAvailable).toHaveBeenCalled();
	});

	it("should initialize correctly in a browser environment with Audio available", async () => {
		vi.mocked(isStorageAvailable).mockReturnValue(true);

		// Setup a spy on the constructor
		const audioSpy = vi.fn();
		class SpiedMockAudio extends MockAudio {
			constructor(src?: string) {
				super(src);
				audioSpy(src);
			}
		}

		vi.stubGlobal("Audio", SpiedMockAudio);

		const { AudioEffects } = await import("./sound.ts");
		AudioEffects.playVote();

		expect(isStorageAvailable).toHaveBeenCalled();

		// It should have called Audio constructor for playing sound
		expect(audioSpy).toHaveBeenCalled();
		expect(audioSpy.mock.calls.length).toBeGreaterThan(0);

		// Verify expected file was preloaded
		const calledUrls = audioSpy.mock.calls.map((call) => call[0]);
		expect(calledUrls.some((url) => url.includes("vote.mp3"))).toBe(true);
		expect(calledUrls.some((url) => url.includes("undo.mp3"))).toBe(true);
		expect(mockAddEventListener).toHaveBeenCalledWith("error", expect.any(Function), {
			once: true,
		});
	});
});
