/**
 * Triggers a light haptic feedback for navigation taps.
 */
export function hapticNavTap(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.(10);
	}
}

/**
 * Triggers a sequence of haptic feedback for tournament starts.
 */
export function hapticTournamentStart(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.([50, 50, 50]);
	}
}

/**
 * Triggers a subtle select haptic feedback.
 */
export function hapticSelect(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.(25);
	}
}
