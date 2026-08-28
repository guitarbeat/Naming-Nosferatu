export interface LeaderboardItem {
	name: string;
	score: number;
}
export interface EngagementMetrics {
	current: number;
	previous: number;
	trend: number;
	trendDirection: "up" | "down";
	dataPoints: any[];
	timeframe: string;
	metricType: string;
}
export interface SiteStats {
	totalUsers: number;
	totalNames: number;
	totalMatches: number;
}
export interface UserStats {
	wins: number;
	matches: number;
	rank: number;
}

export const leaderboardAPI = {
	getLeaderboard: async (_limit: number): Promise<LeaderboardItem[]> => [],
};

export const statsAPI = {
	getEngagementMetrics: async (_timeframe: string): Promise<EngagementMetrics | null> => null,
	getSiteStats: async (): Promise<SiteStats | null> => null,
	getUserStats: async (_userName: string): Promise<UserStats | null> => null,
};
