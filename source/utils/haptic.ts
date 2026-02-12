/**
 * @module haptic
 * @description Haptic feedback/vibration utilities
 */

/**
 * Perform a light tap vibration
 */
export const hapticNavTap = () => {
	if (typeof navigator !== "undefined" && navigator.vibrate) {
		navigator.vibrate(10);
	}
};

/**
 * Perform a tournament start vibration pattern
 */
export const hapticTournamentStart = () => {
	if (typeof navigator !== "undefined" && navigator.vibrate) {
		navigator.vibrate([50, 50, 50]);
	}
};
