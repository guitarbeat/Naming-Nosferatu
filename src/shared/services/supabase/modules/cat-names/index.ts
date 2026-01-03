import { analyticsAPI } from "./analytics";
import { coreAPI } from "./core";
import { leaderboardAPI } from "./leaderboard";
import { statsAPI } from "./stats";

export * from "./types";

export const catNamesAPI = {
	...coreAPI,
	...analyticsAPI,
	...statsAPI,
	...leaderboardAPI,
};
