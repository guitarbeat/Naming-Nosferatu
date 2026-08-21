import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SynthNote } from "./resources";
import { synthEngine } from "./synthEngine";

describe("synthEngine", () => {
	let mockOscillator: any;
	let mockGainNode: any;
	let mockAudioContext: any;

	beforeEach(() => {
		mockOscillator = {
			type: "sine",
			frequency: {
				setValueAtTime: vi.fn(),
			},
			connect: vi.fn(),
			start: vi.fn(),
			stop: vi.fn(),
		};

		mockGainNode = {
			gain: {
				setValueAtTime: vi.fn(),
				exponentialRampToValueAtTime: vi.fn(),
			},
			connect: vi.fn(),
		};

		mockAudioContext = {
			createOscillator: vi.fn(() => mockOscillator),
			createGain: vi.fn(() => mockGainNode),
			destination: {},
			currentTime: 10,
		};
	});

	describe("scheduleNote", () => {
		it("should return early if frequency is <= 0", () => {
			const note: SynthNote = { frequency: 0, duration: 1 };
			synthEngine.scheduleNote(mockAudioContext as AudioContext, note, 0, 1);
			expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();

			const negativeNote: SynthNote = { frequency: -100, duration: 1 };
			synthEngine.scheduleNote(mockAudioContext as AudioContext, negativeNote, 0, 1);
			expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
		});

		it("should schedule a note correctly with default wave", () => {
			const note: SynthNote = { frequency: 440, duration: 1 };
			const startAt = 5;
			const volume = 0.5;

			synthEngine.scheduleNote(mockAudioContext as AudioContext, note, startAt, volume);

			expect(mockAudioContext.createOscillator).toHaveBeenCalled();
			expect(mockAudioContext.createGain).toHaveBeenCalled();

			expect(mockOscillator.type).toBe("triangle");
			expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 5);

			expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 5);
			// volume calculation: Math.max(0.001, Math.min(1, 0.5 * 1)) = 0.5
			// attack = Math.min(0.02, 1 * 0.2) = 0.02
			expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.5, 5 + 0.02);

			expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
			expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);

			expect(mockOscillator.start).toHaveBeenCalledWith(5);
			expect(mockOscillator.stop).toHaveBeenCalledWith(5 + 1 + 0.03);
		});

		it("should use provided wave and gain from note", () => {
			const note: SynthNote = { frequency: 440, duration: 1, wave: "square", gain: 0.5 };
			const startAt = 5;
			const volume = 0.5;

			synthEngine.scheduleNote(mockAudioContext as AudioContext, note, startAt, volume);

			expect(mockOscillator.type).toBe("square");
			// noteVolume: Math.max(0.001, Math.min(1, 0.5 * 0.5)) = 0.25
			expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
				0.25,
				expect.any(Number),
			);
		});

		it("should clamp volume between 0.001 and 1", () => {
			const note: SynthNote = { frequency: 440, duration: 1, gain: 10 };

			// Very high volume
			synthEngine.scheduleNote(mockAudioContext as AudioContext, note, 0, 10);
			expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
				1,
				expect.any(Number),
			);

			// Very low volume
			mockGainNode.gain.exponentialRampToValueAtTime.mockClear();
			synthEngine.scheduleNote(mockAudioContext as AudioContext, note, 0, 0);
			expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
				0.001,
				expect.any(Number),
			);
		});
	});

	describe("playSequence", () => {
		it("should return 0 if context is null", () => {
			const duration = synthEngine.playSequence(null, [{ frequency: 440, duration: 1 }], 1);
			expect(duration).toBe(0);
		});

		it("should schedule all notes and return total duration", () => {
			const scheduleSpy = vi.spyOn(synthEngine, "scheduleNote");

			const notes: SynthNote[] = [
				{ frequency: 440, duration: 0.5 },
				{ frequency: 880, duration: 1 },
			];

			const duration = synthEngine.playSequence(mockAudioContext as AudioContext, notes, 0.8);

			expect(scheduleSpy).toHaveBeenCalledTimes(2);

			// Start time should be context.currentTime (10) + 0.01 = 10.01
			expect(scheduleSpy).toHaveBeenNthCalledWith(1, mockAudioContext, notes[0], 10.01, 0.8);

			// Second note starts after first note's duration (10.01 + 0.5 = 10.51)
			expect(scheduleSpy).toHaveBeenNthCalledWith(2, mockAudioContext, notes[1], 10.51, 0.8);

			// Total duration is sum of note durations (0.5 + 1 = 1.5)
			expect(duration).toBe(1.5);

			scheduleSpy.mockRestore();
		});
	});
});
