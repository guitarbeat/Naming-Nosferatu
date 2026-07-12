import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isStorageAvailable } from "@/shared/lib/storage";

// Mock the storage utility
vi.mock("@/shared/lib/storage", async () => {
	const actual = await vi.importActual("@/shared/lib/storage");
	return {
		...(actual as any),
		isStorageAvailable: vi.fn(),
	};
});

describe("sound initialization", () => {
	let originalAudio: typeof globalThis.Audio | undefined;
	let originalAudioContext: typeof globalThis.AudioContext | undefined;

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
		originalAudio = globalThis.Audio;
		originalAudioContext = globalThis.AudioContext;

		// Default to not having Audio or AudioContext to start clean
		// @ts-expect-error
		globalThis.Audio = undefined;
		// @ts-expect-error
		globalThis.AudioContext = undefined;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
		if (originalAudio === undefined) {
			// @ts-expect-error
			globalThis.Audio = undefined;
		} else {
			globalThis.Audio = originalAudio;
		}
		if (originalAudioContext === undefined) {
			// @ts-expect-error
			globalThis.AudioContext = undefined;
		} else {
			globalThis.AudioContext = originalAudioContext;
		}
	});

	it("should skip initialization if not in a browser environment", async () => {
		vi.mocked(isStorageAvailable).mockReturnValue(false);
		globalThis.Audio = MockAudio as any;

		// Dynamic import to get a fresh instance of the module
		await import("./sound.ts");

		expect(isStorageAvailable).toHaveBeenCalled();
		expect(mockAddEventListener).not.toHaveBeenCalled();
	});

	it("should handle initialization when Audio is undefined in browser environment", async () => {
		vi.mocked(isStorageAvailable).mockReturnValue(true);
		// Explicitly ensure Audio is undefined
		// @ts-expect-error
		globalThis.Audio = undefined;

		// Should not throw
		await import("./sound.ts");

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

		globalThis.Audio = SpiedMockAudio as any;

		await import("./sound.ts");

		expect(isStorageAvailable).toHaveBeenCalled();

		// It should have called Audio constructor for preloading sounds and background music
		// SOUND_EFFECTS length (6) + 1 background music track = 7
		expect(audioSpy).toHaveBeenCalled();
		expect(audioSpy.mock.calls.length).toBeGreaterThan(0);

		// Verify some expected files were preloaded
		const calledUrls = audioSpy.mock.calls.map((call) => call[0]);
		expect(calledUrls.some((url) => url.includes("vote.mp3"))).toBe(true);
		expect(calledUrls.some((url) => url.includes("undo.mp3"))).toBe(true);
		expect(mockAddEventListener).toHaveBeenCalledWith("error", expect.any(Function), {
			once: true,
		});
	});
});
