import type { NameItem } from "@/shared/types";

/** Raw row shape — accepts both snake_case and camelCase fields. */
export interface RawNameRow {
	id?: string | number;
	name?: string;
	description?: string | null;
	pronunciation?: string | null;
	avg_rating?: number | null;
	avgRating?: number | null;
	global_wins?: number | null;
	globalWins?: number | null;
	global_losses?: number | null;
	globalLosses?: number | null;
	created_at?: string | null;
	createdAt?: string | null;
	is_hidden?: boolean;
	isHidden?: boolean;
	is_active?: boolean | null;
	isActive?: boolean | null;
	locked_in?: boolean;
	lockedIn?: boolean;
	is_deleted?: boolean;
	isDeleted?: boolean;
	status?: string | null;
	provenance?: unknown;
	wins?: number;
	losses?: number;
	popularity_score?: number;
	has_user_rating?: boolean;
	[key: string]: unknown;
}

/**
 * Maps a raw database row (snake_case or camelCase) to a canonical NameItem.
 * Single source of truth — all name-fetching code should use this.
 */
export function mapNameRow(row: RawNameRow): NameItem {
	const rating =
		typeof row.avg_rating === "number"
			? row.avg_rating
			: typeof row.avgRating === "number"
				? row.avgRating
				: 1500;

	const createdAt =
		typeof row.created_at === "string"
			? row.created_at
			: typeof row.createdAt === "string"
				? row.createdAt
				: null;

	const hidden = Boolean(row.is_hidden ?? row.isHidden ?? false);
	const active =
		row.is_active == null && row.isActive == null ? true : Boolean(row.is_active ?? row.isActive);
	const locked = Boolean(row.locked_in ?? row.lockedIn ?? false);

	const wins =
		typeof row.global_wins === "number"
			? row.global_wins
			: typeof row.globalWins === "number"
				? row.globalWins
				: typeof row.wins === "number"
					? row.wins
					: 0;

	const losses =
		typeof row.global_losses === "number"
			? row.global_losses
			: typeof row.globalLosses === "number"
				? row.globalLosses
				: typeof row.losses === "number"
					? row.losses
					: 0;

	return {
		id: String(row.id ?? ""),
		name: String(row.name ?? ""),
		description: typeof row.description === "string" ? row.description : "",
		pronunciation: typeof row.pronunciation === "string" ? row.pronunciation : undefined,
		avgRating: rating,
		avg_rating: rating,
		createdAt,
		created_at: createdAt,
		isHidden: hidden,
		is_hidden: hidden,
		isActive: active,
		is_active: active,
		lockedIn: locked,
		locked_in: locked,
		wins,
		losses,
		status: (typeof row.status === "string" ? row.status : "candidate") as NameItem["status"],
		provenance: Array.isArray(row.provenance) ? row.provenance : [],
		has_user_rating: Boolean(row.has_user_rating),
		popularity_score: typeof row.popularity_score === "number" ? row.popularity_score : undefined,
	};
}
