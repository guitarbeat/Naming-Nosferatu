import { api } from "@/services/apiClient";

export const leaderboardAPI = {
	getLeaderboard: async (limit: number | null = 50) => {
		try {
			return await api.get<any[]>(`/analytics/leaderboard?limit=${limit || 50}`);
		} catch {
			return [];
		}
	},
};

export const statsAPI = {
	getSiteStats: async () => {
		try {
			return await api.get<any>("/analytics/site-stats");
		} catch {
			return null;
		}
	},

	getUserRatedNames: async (userName: string) => {
		try {
			const [names, ratings] = await Promise.all([
				api.get<any[]>("/names?includeHidden=false"),
				api.get<any[]>(`/analytics/ratings-raw?userName=${encodeURIComponent(userName)}`),
			]);

			const ratingMap = new Map<string, any>();
			for (const r of ratings) {
				ratingMap.set(String(r.nameId), r);
			}

			return (names || []).map((item: any) => {
				const userRating = ratingMap.get(String(item.id));
				return {
					...item,
					user_rating: userRating ? Number(userRating.rating) : null,
					user_wins: userRating?.wins || 0,
					user_losses: userRating?.losses || 0,
					has_user_rating: !!userRating,
					isHidden: item.is_hidden || false,
				};
			});
		} catch {
			return [];
		}
	},

	getUserStats: async (userName: string) => {
		try {
			return await api.get<any>(`/analytics/user-stats?userName=${encodeURIComponent(userName)}`);
		} catch {
			return null;
		}
	},
};
