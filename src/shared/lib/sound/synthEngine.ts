import type { SynthNote } from "./resources";

/**
 * Low-level synthesis engine for generating fallback audio.
 */
export const synthEngine = {
	/**
	 * Schedules a single synth note to play at a specific time.
	 */
	scheduleNote: (
		context: AudioContext,
		note: SynthNote,
		startAt: number,
		volume: number,
	) => {
		if (note.frequency <= 0) {
			return;
		}

		const oscillator = context.createOscillator();
		const gainNode = context.createGain();
		const noteVolume = Math.max(0.001, Math.min(1, volume * (note.gain ?? 1)));
		const attack = Math.min(0.02, note.duration * 0.2);
		const release = Math.min(0.08, note.duration * 0.45);
		const releaseStart = Math.max(startAt + attack + 0.01, startAt + note.duration - release);

		oscillator.type = note.wave ?? "triangle";
		oscillator.frequency.setValueAtTime(note.frequency, startAt);

		gainNode.gain.setValueAtTime(0.0001, startAt);
		gainNode.gain.exponentialRampToValueAtTime(noteVolume, startAt + attack);
		gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart);

		oscillator.connect(gainNode);
		gainNode.connect(context.destination);
		oscillator.start(startAt);
		oscillator.stop(startAt + note.duration + 0.03);
	},

	/**
	 * Plays a sequence of notes and returns the total duration.
	 */
	playSequence: (
		context: AudioContext | null,
		notes: SynthNote[],
		volume: number,
	): number => {
		if (!context) {
			return 0;
		}

		const startTime = context.currentTime + 0.01;
		let cursor = 0;
		for (const note of notes) {
			synthEngine.scheduleNote(context, note, startTime + cursor, volume);
			cursor += note.duration;
		}
		return cursor;
	},
};
