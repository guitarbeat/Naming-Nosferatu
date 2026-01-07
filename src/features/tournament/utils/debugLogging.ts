/**
 * @module debugLogging
 * @description Utility for throttled debug logging in development mode.
 */

import { TOURNAMENT_TIMING } from "../../../core/constants";

let lastRenderLogTime = 0;

export function logTournamentRender(
	namesCount: number,
	randomizedCount: number,
	hasMatch: boolean,
): void {
	if (process.env.NODE_ENV !== "development") {
		return;
	}

	const now = Date.now();
	if (now - lastRenderLogTime > TOURNAMENT_TIMING.RENDER_LOG_THROTTLE) {
		console.debug("[DEV] 🎮 Tournament: render", {
			namesCount,
			randomizedCount,
			hasMatch,
		});
		lastRenderLogTime = now;
	}
}
