export interface SynthNote {
	frequency: number;
	duration: number;
	gain?: number;
	wave?: OscillatorType;
}

// Background music tracks (songs)
export const BACKGROUND_TRACKS = [
	"Main Menu 1 (Ruins)",
	"AdhesiveWombat - Night Shade",
	"Lemon Demon - The Ultimate Showdown (8-Bit Remix)",
	"what-is-love",
	"MiseryBusiness",
];

// Sound effect identifiers
export const SOUND_EFFECTS = ["vote", "undo", "level-up", "wow", "surprise", "streak"];

// Synthesis fallback patterns for music when files are missing
export const FALLBACK_MUSIC_PATTERNS: SynthNote[][] = [
	[
		{ frequency: 261.63, duration: 0.18 },
		{ frequency: 329.63, duration: 0.18 },
		{ frequency: 392, duration: 0.18 },
		{ frequency: 523.25, duration: 0.18 },
		{ frequency: 392, duration: 0.18 },
		{ frequency: 329.63, duration: 0.18 },
		{ frequency: 293.66, duration: 0.18 },
		{ frequency: 349.23, duration: 0.18 },
	],
	[
		{ frequency: 220, duration: 0.18 },
		{ frequency: 293.66, duration: 0.18 },
		{ frequency: 329.63, duration: 0.18 },
		{ frequency: 440, duration: 0.18 },
		{ frequency: 392, duration: 0.18 },
		{ frequency: 329.63, duration: 0.18 },
		{ frequency: 293.66, duration: 0.18 },
		{ frequency: 261.63, duration: 0.18 },
	],
	[
		{ frequency: 174.61, duration: 0.18 },
		{ frequency: 220, duration: 0.18 },
		{ frequency: 261.63, duration: 0.18 },
		{ frequency: 349.23, duration: 0.18 },
		{ frequency: 392, duration: 0.18 },
		{ frequency: 349.23, duration: 0.18 },
		{ frequency: 261.63, duration: 0.18 },
		{ frequency: 220, duration: 0.18 },
	],
	[
		{ frequency: 196, duration: 0.18 },
		{ frequency: 246.94, duration: 0.18 },
		{ frequency: 293.66, duration: 0.18 },
		{ frequency: 392, duration: 0.18 },
		{ frequency: 329.63, duration: 0.18 },
		{ frequency: 293.66, duration: 0.18 },
		{ frequency: 246.94, duration: 0.18 },
		{ frequency: 220, duration: 0.18 },
	],
	[
		{ frequency: 233.08, duration: 0.18 },
		{ frequency: 293.66, duration: 0.18 },
		{ frequency: 349.23, duration: 0.18 },
		{ frequency: 466.16, duration: 0.18 },
		{ frequency: 392, duration: 0.18 },
		{ frequency: 349.23, duration: 0.18 },
		{ frequency: 293.66, duration: 0.18 },
		{ frequency: 261.63, duration: 0.18 },
	],
];

/**
 * Returns a synth note sequence for fallback sound effects.
 */
export function getFallbackEffectPattern(soundName: string): SynthNote[] | null {
	switch (soundName) {
		case "vote":
			return [
				{ frequency: 523.25, duration: 0.05 },
				{ frequency: 659.25, duration: 0.08 },
			];
		case "undo":
			return [
				{ frequency: 659.25, duration: 0.06 },
				{ frequency: 523.25, duration: 0.08 },
			];
		case "level-up":
			return [
				{ frequency: 392, duration: 0.08 },
				{ frequency: 523.25, duration: 0.08 },
				{ frequency: 659.25, duration: 0.08 },
				{ frequency: 783.99, duration: 0.12 },
			];
		case "wow":
			return [
				{ frequency: 440, duration: 0.09, wave: "sawtooth" },
				{ frequency: 554.37, duration: 0.09, wave: "triangle" },
				{ frequency: 659.25, duration: 0.18, wave: "triangle" },
			];
		case "surprise":
			return [
				{ frequency: 220, duration: 0.06, wave: "sine" },
				{ frequency: 440, duration: 0.06, wave: "square" },
				{ frequency: 880, duration: 0.12, wave: "triangle" },
			];
		case "streak":
			return [
				{ frequency: 587.33, duration: 0.06 },
				{ frequency: 739.99, duration: 0.06 },
				{ frequency: 880, duration: 0.08 },
			];
		default:
			return null;
	}
}
