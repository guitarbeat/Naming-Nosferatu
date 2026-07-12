export interface SynthNote {
	frequency: number;
	duration: number;
	gain?: number;
	wave?: OscillatorType;
}

// Sound effect identifiers
export const SOUND_EFFECTS = ["vote", "undo", "level-up", "wow", "surprise", "streak", "meow"];

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
		case "meow":
			return [
				{ frequency: 659.25, duration: 0.06, wave: "triangle" },
				{ frequency: 783.99, duration: 0.06, wave: "triangle" },
				{ frequency: 987.77, duration: 0.08, wave: "sine", gain: 0.8 },
				{ frequency: 1046.5, duration: 0.15, wave: "sine", gain: 0.6 },
			];
		default:
			return null;
	}
}
