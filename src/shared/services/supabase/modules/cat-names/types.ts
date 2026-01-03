export interface NameItem {
	id: string;
	name: string;
	description?: string;
	avg_rating?: number;
	is_active: boolean;
	is_hidden?: boolean;
	created_at?: string;
}

export interface NameStats {
	totalRating: number;
	count: number;
	totalWins: number;
	totalLosses: number;
}

export interface SelectionStats {
	name_id: string | number;
	name: string;
	count: number;
}

export interface AnalyticsSelectionStats {
	count: number;
	users: Set<string>;
}

export interface RatingStats {
	totalRating: number;
	count: number;
	wins: number;
	losses: number;
	users: Set<string>;
}

export interface RatingInfo {
	rating: number;
	wins: number;
}

export interface NameDataWithRatings {
	id: string;
	name: string;
	description?: string;
	avg_rating?: number;
	is_active: boolean;
	is_hidden?: boolean;
	created_at?: string;
	cat_name_ratings?: Array<{
		user_name: string;
		rating?: number;
		wins?: number;
		losses?: number;
		updated_at?: string;
	}>;
	user_name: string;
	rating?: number;
	wins?: number;
	losses?: number;
	updated_at?: string;
}
