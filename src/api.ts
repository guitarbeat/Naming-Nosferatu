import { QueryClient, queryOptions } from "@tanstack/react-query";
import { DEFAULT_SAMPLE_NAMES } from "@/lib/names";
import type { NameItem } from "@/types";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 1000 * 60 * 5,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

/* ==========================================================================
   Constants & Error Utilities
   ========================================================================== */
export const SUPABASE_UNAVAILABLE_MSG = "Database is unavailable. Running in local mode.";

/* ==========================================================================
   Names API Types & Queries
   ========================================================================== */
type NamesDataSource = "local";

interface NamesQueryResult {
	names: NameItem[];
	source: NamesDataSource;
}

const DEFAULT_CANDIDATE_NAMES: NameItem[] = DEFAULT_SAMPLE_NAMES.map((sample, idx) => {
	const initialWins = Math.max(0, 14 - Math.floor(idx * 0.25));
	const initialLosses = Math.max(1, 2 + Math.floor(idx * 0.2));
	const rating = Math.max(1300, 1650 - idx * 6);
	return {
		id: sample.id,
		name: sample.name,
		description: sample.description,
		avgRating: rating,
		avg_rating: rating,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: initialWins,
		losses: initialLosses,
		status: "candidate" as const,
	};
});

const CANDIDATE_STORAGE_KEY = "nosferatu-candidates";

function getStoredNames(): NameItem[] {
	if (typeof window === "undefined") {
		return DEFAULT_CANDIDATE_NAMES;
	}
	try {
		const raw = window.localStorage.getItem(CANDIDATE_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed) && parsed.length > 0) {
				// Seamlessly merge new default candidate names if the stored list is from the legacy 12-item set
				const existingNames = new Set(
					parsed.map((item: NameItem) => item.name?.trim().toLowerCase()),
				);
				const missing = DEFAULT_CANDIDATE_NAMES.filter(
					(def) => !existingNames.has(def.name?.trim().toLowerCase()),
				);
				if (missing.length > 0) {
					const merged = [...parsed, ...missing];
					saveStoredNames(merged);
					return merged;
				}
				return parsed;
			}
		}
	} catch {
		// fallback
	}
	return DEFAULT_CANDIDATE_NAMES;
}

function saveStoredNames(names: NameItem[]): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(names));
	} catch (e) {
		console.warn("Failed to persist candidates:", e);
	}
}

const namesQueryKeys = {
	all: ["names"] as const,
	lists: () => [...namesQueryKeys.all, "list"] as const,
	list: (includeHidden: boolean) => [...namesQueryKeys.lists(), { includeHidden }] as const,
} as const;

async function fetchNames(includeHidden: boolean): Promise<NamesQueryResult> {
	const all = getStoredNames();
	const names = includeHidden ? all : all.filter((n) => !n.isHidden && !n.is_hidden);
	return { names, source: "local" };
}

export const namesQueryOptions = (includeHidden: boolean) =>
	queryOptions({
		queryKey: namesQueryKeys.list(includeHidden),
		queryFn: () => fetchNames(includeHidden),
		staleTime: 30_000,
	});

/* ==========================================================================
   Ratings & Tournament API
   ========================================================================== */
interface TournamentMatchRatingParams {
	matchId?: string;
	winnerId?: string;
	loserId?: string;
	newWinnerRating?: number;
	newLoserRating?: number;
	userName?: string;
	leftNameIds?: string[];
	rightNameIds?: string[];
	winnerSide?: string;
	[key: string]: unknown;
}

export const ratingsAPI = {
	applyTournamentMatch: async (_params: TournamentMatchRatingParams) => Promise.resolve(),
	saveRatings: async (
		userId: string,
		ratings: Record<string, { rating: number; wins: number; losses: number }>,
	) => {
		if (typeof window === "undefined") {
			return;
		}
		try {
			window.localStorage.setItem(`nosferatu-ratings-${userId}`, JSON.stringify(ratings));
			const all = getStoredNames();
			const updated = all.map((item) => {
				const r = ratings[item.id] || ratings[item.name];
				if (r) {
					return {
						...item,
						avgRating: Math.round(r.rating),
						avg_rating: Math.round(r.rating),
						wins: (item.wins ?? 0) + (r.wins ?? 0),
						losses: (item.losses ?? 0) + (r.losses ?? 0),
					};
				}
				return item;
			});
			saveStoredNames(updated);
		} catch (e) {
			console.warn("Failed to persist ratings:", e);
		}
	},
};
