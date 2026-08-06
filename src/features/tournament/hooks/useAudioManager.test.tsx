import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIO, STORAGE_KEYS } from "@/shared/lib/constants";
import { AudioEffects } from "@/shared/lib/sound";
import * as storage from "@/shared/lib/storage";
import { useAudioManager } from "./useAudioManager";

// Mock the sound effects
vi.mock("@/shared/lib/sound", () => ({
	AudioEffects: {
		playVote: vi.fn(),
		playUndo: vi.fn(),
		playStreak: vi.fn(),
		playLevelUp: vi.fn(),
		playWow: vi.fn(),
		playSurprise: vi.fn(),
	},
}));

// Mock the storage functions
vi.mock("@/shared/lib/storage", () => ({
	isStorageAvailable: vi.fn(),
	getStorageString: vi.fn(),
	setStorageString: vi.fn(),
}));

describe("useAudioManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default mocks for storage
		vi.mocked(storage.isStorageAvailable).mockReturnValue(true);
		vi.mocked(storage.getStorageString).mockImplementation(
			(_key: string) => null,
		);
	});

	describe("Initialization", () => {
		it("initializes with sound unmuted by default (if no storage value)", () => {
			const { result } = renderHook(() => useAudioManager());
			expect(result.current.isMuted).toBe(false);
		});

		it("initializes as muted if STORAGE_KEYS.SOUND_ENABLED is 'false'", () => {
			vi.mocked(storage.getStorageString).mockImplementation((key: string) => {
				if (key === STORAGE_KEYS.SOUND_ENABLED) return "false";
				return null;
			});
			const { result } = renderHook(() => useAudioManager());
			expect(result.current.isMuted).toBe(true);
		});

		it("initializes as unmuted if STORAGE_KEYS.SOUND_ENABLED is 'true'", () => {
			vi.mocked(storage.getStorageString).mockImplementation((key: string) => {
				if (key === STORAGE_KEYS.SOUND_ENABLED) return "true";
				return null;
			});
			const { result } = renderHook(() => useAudioManager());
			expect(result.current.isMuted).toBe(false);
		});

		it("initializes as unmuted if storage is unavailable", () => {
			vi.mocked(storage.isStorageAvailable).mockReturnValue(false);
			const { result } = renderHook(() => useAudioManager());
			expect(result.current.isMuted).toBe(false);
		});
	});

	describe("Toggling mute", () => {
		it("toggles mute state and saves to storage", () => {
			const { result } = renderHook(() => useAudioManager());

			expect(result.current.isMuted).toBe(false);

			act(() => {
				result.current.handleToggleMute();
			});

			expect(result.current.isMuted).toBe(true);
			expect(storage.setStorageString).toHaveBeenCalledWith(
				STORAGE_KEYS.SOUND_ENABLED,
				"false",
			);

			act(() => {
				result.current.handleToggleMute();
			});

			expect(result.current.isMuted).toBe(false);
			expect(storage.setStorageString).toHaveBeenCalledWith(
				STORAGE_KEYS.SOUND_ENABLED,
				"true",
			);
		});
	});

	describe("Playing sounds (unmuted)", () => {
		it("calls AudioEffects.playVote with correct volume when unmuted", () => {
			const { result } = renderHook(() => useAudioManager());
			result.current.playVoteSound();
			expect(AudioEffects.playVote).toHaveBeenCalledWith({
				volume: AUDIO.DEFAULT_EFFECTS_VOLUME,
			});
		});

		it("calls AudioEffects.playUndo with correct volume when unmuted", () => {
			const { result } = renderHook(() => useAudioManager());
			result.current.playUndoSound();
			expect(AudioEffects.playUndo).toHaveBeenCalledWith({
				volume: AUDIO.DEFAULT_EFFECTS_VOLUME,
			});
		});

		it("calls AudioEffects.playLevelUp with correct volume when unmuted", () => {
			const { result } = renderHook(() => useAudioManager());
			result.current.playLevelUpSound();
			expect(AudioEffects.playLevelUp).toHaveBeenCalledWith({
				volume: AUDIO.DEFAULT_EFFECTS_VOLUME,
			});
		});

		it("calls AudioEffects.playWow with correct volume when unmuted", () => {
			const { result } = renderHook(() => useAudioManager());
			result.current.playWowSound();
			expect(AudioEffects.playWow).toHaveBeenCalledWith({
				volume: AUDIO.DEFAULT_EFFECTS_VOLUME,
			});
		});

		it("calls AudioEffects.playSurprise with correct volume when unmuted", () => {
			const { result } = renderHook(() => useAudioManager());
			result.current.playSurpriseSound();
			expect(AudioEffects.playSurprise).toHaveBeenCalledWith({
				volume: AUDIO.DEFAULT_EFFECTS_VOLUME,
			});
		});

		describe("playStreakSound", () => {
			it("calculates correct volume boost for default streak (2)", () => {
				const { result } = renderHook(() => useAudioManager());
				result.current.playStreakSound();

				// base volume (0.3) + boost (Math.max(0, 2-1) * 0.04) = 0.3 + 0.04 = 0.34
				expect(AudioEffects.playStreak).toHaveBeenCalledWith({
					volume: expect.closeTo(0.34),
				});
			});

			it("calculates correct volume boost for large streak (capped at 0.28 boost)", () => {
				const { result } = renderHook(() => useAudioManager());
				result.current.playStreakSound(20);

				// base volume (0.3) + max boost (0.28) = 0.58
				expect(AudioEffects.playStreak).toHaveBeenCalledWith({
					volume: expect.closeTo(0.58),
				});
			});
		});

		it("reads volume from storage correctly", () => {
			vi.mocked(storage.getStorageString).mockImplementation((key: string) => {
				if (key === STORAGE_KEYS.EFFECTS_VOLUME) return "0.5";
				return null;
			});
			const { result } = renderHook(() => useAudioManager());
			result.current.playVoteSound();
			expect(AudioEffects.playVote).toHaveBeenCalledWith({ volume: 0.5 });
		});

		it("clamps volume between 0 and 1", () => {
			vi.mocked(storage.getStorageString).mockImplementation((key: string) => {
				if (key === STORAGE_KEYS.EFFECTS_VOLUME) return "1.5"; // > 1
				return null;
			});
			const { result } = renderHook(() => useAudioManager());
			result.current.playVoteSound();
			expect(AudioEffects.playVote).toHaveBeenCalledWith({ volume: 1 });
		});

		it("handles invalid volume in storage", () => {
			vi.mocked(storage.getStorageString).mockImplementation((key: string) => {
				if (key === STORAGE_KEYS.EFFECTS_VOLUME) return "invalid";
				return null;
			});
			const { result } = renderHook(() => useAudioManager());
			result.current.playVoteSound();
			expect(AudioEffects.playVote).toHaveBeenCalledWith({
				volume: AUDIO.DEFAULT_EFFECTS_VOLUME,
			});
		});
	});

	describe("Playing sounds (muted)", () => {
		beforeEach(() => {
			// Initialize as muted
			vi.mocked(storage.getStorageString).mockImplementation((key: string) => {
				if (key === STORAGE_KEYS.SOUND_ENABLED) return "false";
				return null;
			});
		});

		it("does not call AudioEffects when muted", () => {
			const { result } = renderHook(() => useAudioManager());

			result.current.playVoteSound();
			result.current.playUndoSound();
			result.current.playStreakSound();
			result.current.playLevelUpSound();
			result.current.playWowSound();
			result.current.playSurpriseSound();

			expect(AudioEffects.playVote).not.toHaveBeenCalled();
			expect(AudioEffects.playUndo).not.toHaveBeenCalled();
			expect(AudioEffects.playStreak).not.toHaveBeenCalled();
			expect(AudioEffects.playLevelUp).not.toHaveBeenCalled();
			expect(AudioEffects.playWow).not.toHaveBeenCalled();
			expect(AudioEffects.playSurprise).not.toHaveBeenCalled();
		});
	});
});
