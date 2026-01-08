import {
	analyticsAPI,
	leaderboardAPI,
	statsAPI,
} from "../../../../features/analytics/services/analyticsService";
import { adminAPI } from "../../../../features/auth/services/adminService";
import { imagesAPI } from "../../../../features/gallery/services/imageService";
import { coreAPI, hiddenNamesAPI } from "../../../../features/names/services/nameService";
import { siteSettingsAPI } from "./siteSettingsService";

// Re-export everything for backward compatibility
export {
	adminAPI,
	analyticsAPI,
	leaderboardAPI,
	statsAPI,
	imagesAPI,
	coreAPI,
	hiddenNamesAPI,
	siteSettingsAPI,
};
export { coreAPI as nameAPI }; // Alias if needed
export { deleteName } from "../../../../features/names/services/nameService";

// Barrel export for backward compatibility
export const catNamesAPI = {
	...coreAPI,
	...analyticsAPI,
	...leaderboardAPI,
	...statsAPI,
};

export * from "../../../../features/analytics/services/analyticsService";
export * from "../../../../features/auth/services/adminService";
export * from "../../../../features/gallery/services/imageService";
export * from "../../../../features/names/services/nameService";
// Re-export common helpers/types if needed by other modules
export * from "../client";
export * from "./siteSettingsService";
