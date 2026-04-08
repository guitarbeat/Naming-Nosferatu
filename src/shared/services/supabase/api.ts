import type { NameItem } from "@/shared/types";
import { resolveSupabaseClient, withSupabase } from "./runtime";
import { mapNameRow, type RawNameRow } from "@/features/names/mapNameRow";

interface PendingRequest<T> {
	controller: AbortController;
	promise: Promise<T>;
}

interface ApplyTournamentMatchParams {
	userName: string;
	leftNameIds: string[];
	rightNameIds: string[];
	winnerSide: "left" | "right" | "tie";
}

const trendingNamesRequests = new Map<string, PendingRequest<NameItem[]>>();

async function getNamesFromSupabase(includeHidden: boolean): Promise<NameItem[]> {
	const client = await resolveSupabaseClient();
	if (!client) {
		return [];
	}

	let query = client
		.from("cat_names")
		.select(
			"id, name, description, pronunciation, avg_rating, global_wins, global_losses, created_at, is_hidden, is_active, locked_in, is_deleted, status, provenance",
		)
		.eq("is_active", true)
		.eq("is_deleted", false);

	if (!includeHidden) {
		query = query.eq("is_hidden", false);
	}

	const orderedQuery = query.order("avg_rating", { ascending: false });
	const { data, error } = await (includeHidden ? orderedQuery : orderedQuery.limit(1000));
	if (error) {
		console.warn("[coreAPI.getTrendingNames] Supabase fallback failed:", error.message);
		return [];
	}

	return (data ?? []).map((item) => mapNameRow(item as RawNameRow));
}

export const imagesAPI = {
	list: async (_path = ""): Promise<string[]> => {
		return withSupabase(async (client) => {
			const { data, error } = await client.storage.from("cat-images").list();
			if (error) {
				console.error("Failed to list images:", error);
				return [];
			}
			return (data ?? []).map((item) => item.name);
		}, []);
	},

	upload: async (
		file: File | Blob,
		userName: string,
	): Promise<{ path: string | null; error: string | null; success: boolean }> => {
		const maxSize = 5 * 1024 * 1024;
		const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

		if (file.size > maxSize) {
			return { path: null, error: "File size exceeds 5MB limit", success: false };
		}
		if (!allowedTypes.includes(file.type)) {
			return { path: null, error: "Only JPEG, PNG, GIF, and WebP images are allowed", success: false };
		}

		return withSupabase(async (client) => {
			const fileExt =
				"name" in file && typeof (file as File).name === "string"
					? (file as File).name.split(".").pop()
					: "jpg";
			const fileName = `${userName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

			const { error } = await client.storage.from("cat-images").upload(fileName, file, {
				cacheControl: "3600",
				upsert: false,
				contentType: file.type || "image/jpeg",
			});

			if (error) {
				console.error("Upload failed:", error);
				return { path: null, error: error.message, success: false };
			}

			const { data: { publicUrl } } = client.storage.from("cat-images").getPublicUrl(fileName);
			return { path: publicUrl, error: null, success: true };
		}, { path: null, error: "Storage client not available", success: false });
	},

	delete: async (fileName: string): Promise<{ success: boolean; error: string | null }> => {
		return withSupabase(async (client) => {
			const { error } = await client.storage.from("cat-images").remove([fileName]);
			if (error) {
				console.error("Delete failed:", error);
				return { success: false, error: error.message };
			}
			return { success: true, error: null };
		}, { success: false, error: "Storage client not available" });
	},
};

export const coreAPI = {
	addName: async (name: string, description: string) => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("add_cat_name", {
				p_name: name,
				p_description: description || "",
			});
			if (error) {
				return { success: false, error: error.message || "Failed to add name" };
			}
			const row = Array.isArray(data) ? data[0] : data;
			if (!row) {
				return { success: false, error: "No data returned from add_cat_name" };
			}
			return { success: true, data: mapNameRow(row as RawNameRow) };
		}, { success: false, error: "Supabase client not available" });
	},

	getTrendingNames: async (includeHidden: boolean = false) => {
		const cacheKey = includeHidden ? "includeHidden" : "visibleOnly";
		const existingRequest = trendingNamesRequests.get(cacheKey);

		if (existingRequest && !existingRequest.controller.signal.aborted) {
			return existingRequest.promise;
		}

		if (existingRequest) {
			existingRequest.controller.abort();
			trendingNamesRequests.delete(cacheKey);
		}

		const controller = new AbortController();

		const request = (async () => {
			if (controller.signal.aborted) {
				throw new Error("Request aborted");
			}
			return getNamesFromSupabase(includeHidden);
		})();

		const pendingRequest: PendingRequest<NameItem[]> = {
			controller,
			promise: request,
		};

		trendingNamesRequests.set(cacheKey, pendingRequest);

		try {
			return await request;
		} finally {
			trendingNamesRequests.delete(cacheKey);
		}
	},

	getHiddenNames: async () => {
		const names = await coreAPI.getTrendingNames(true);
		return names
			.filter((item) => item.isHidden)
			.map((item) => ({
				id: String(item.id),
				name: String(item.name),
				description: typeof item.description === "string" ? item.description : null,
				created_at: item.created_at ?? item.createdAt ?? "",
			}));
	},

	hideName: async (_userName: string, nameId: string | number, isHidden: boolean) => {
		const userName = _userName?.trim();

		const client = await resolveSupabaseClient();
		if (!client) {
			return { success: false, error: "Supabase client not available" };
		}

		const rpcResult = await client.rpc("toggle_name_visibility", {
			p_name_id: String(nameId),
			p_hide: isHidden,
			p_user_name: userName || undefined,
		});

		if (rpcResult.error) {
			return {
				success: false,
				error: rpcResult.error.message || `Failed to ${isHidden ? "hide" : "unhide"} name`,
			};
		}

		return { success: true };
	},
};

export const hiddenNamesAPI = {
	getHiddenNames: async () => {
		return coreAPI.getHiddenNames();
	},

	hideName: async (_userName: string, nameId: string | number) => {
		return coreAPI.hideName(_userName, nameId, true);
	},

	unhideName: async (_userName: string, nameId: string | number) => {
		return coreAPI.hideName(_userName, nameId, false);
	},
};

export const statsAPI = {
	getSiteStats: async (): Promise<Record<string, unknown>> => {
		return withSupabase(async (client) => {
			const { data, error } = await client.rpc("get_site_stats");
			if (error) {
				console.warn("[statsAPI] get_site_stats failed:", error.message);
				return {};
			}
			return (data ?? {}) as Record<string, unknown>;
		}, {});
	},
};


// Validation utilities
const validateRatingsData = (
	userId: string,
	ratings: Record<string, { rating: number; wins: number; losses: number }>,
): { isValid: boolean; error?: string } => {
	if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
		return { isValid: false, error: "Invalid userId: must be a non-empty string" };
	}

	if (!ratings || typeof ratings !== "object") {
		return { isValid: false, error: "Invalid ratings: must be an object" };
	}

	const ratingsCount = Object.keys(ratings).length;
	if (ratingsCount === 0) {
		return { isValid: false, error: "Invalid ratings: cannot be empty" };
	}

	if (ratingsCount > 200) {
		return { isValid: false, error: "Invalid ratings: exceeds maximum limit of 200 entries" };
	}

	for (const [nameId, data] of Object.entries(ratings)) {
		if (!nameId || typeof nameId !== "string") {
			return { isValid: false, error: "Invalid nameId: must be a non-empty string" };
		}

		if (!data || typeof data !== "object") {
			return { isValid: false, error: `Invalid rating data for ${nameId}: must be an object` };
		}

		const { rating, wins, losses } = data;

		if (typeof rating !== "number" || Number.isNaN(rating) || rating < 800 || rating > 2400) {
			return {
				isValid: false,
				error: `Invalid rating for ${nameId}: must be a number between 800 and 2400`,
			};
		}

		if (typeof wins !== "number" || Number.isNaN(wins) || wins < 0 || wins > 1000) {
			return {
				isValid: false,
				error: `Invalid wins for ${nameId}: must be a number between 0 and 1000`,
			};
		}

		if (typeof losses !== "number" || Number.isNaN(losses) || losses < 0 || losses > 1000) {
			return {
				isValid: false,
				error: `Invalid losses for ${nameId}: must be a number between 0 and 1000`,
			};
		}
	}

	return { isValid: true };
};

export const ratingsAPI = {
	applyTournamentMatch: async ({
		userName,
		leftNameIds,
		rightNameIds,
		winnerSide,
	}: ApplyTournamentMatchParams) => {
		const client = await resolveSupabaseClient();
		if (!client) {
			throw new Error("Supabase client not available");
		}

		// @ts-expect-error - apply_tournament_match_elo is a custom RPC not yet reflected in generated types
		const { data, error } = await client.rpc("apply_tournament_match_elo", {
			p_user_name: userName.trim(),
			p_left_name_ids: leftNameIds,
			p_right_name_ids: rightNameIds,
			p_winner_side: winnerSide,
		});

		if (error) {
			throw new Error(error.message || "Failed to apply tournament Elo update");
		}

		return (data ?? []).reduce(
			(
				acc: Record<string, { rating: number; wins: number; losses: number }>,
				row: {
					name_id: string;
					rating: number | null;
					wins: number | null;
					losses: number | null;
				},
			) => {
				acc[String(row.name_id)] = {
					rating: Number(row.rating ?? 1500),
					wins: Number(row.wins ?? 0),
					losses: Number(row.losses ?? 0),
				};
				return acc;
			},
			{},
		);
	},
	saveRatings: async (
		userId: string,
		ratings: Record<string, { rating: number; wins: number; losses: number }>,
	): Promise<{ success: boolean; count: number }> => {
		const validation = validateRatingsData(userId, ratings);
		if (!validation.isValid) {
			throw new Error(validation.error || 'Invalid ratings data');
		}

		const ratingsList = Object.entries(ratings).map(([nameId, data]) => ({
			nameId,
			rating: data.rating,
			wins: data.wins,
			losses: data.losses,
		}));

		const client = await resolveSupabaseClient();
		if (!client) {
			throw new Error('Supabase client not available');
		}

		// @ts-expect-error - save_user_ratings is a custom RPC not yet reflected in generated types
		const { data, error } = await client.rpc('save_user_ratings', {
			p_user_name: userId,
			p_ratings: ratingsList,
		});

		if (error) {
			throw new Error(error.message || 'Failed to save ratings');
		}

		const response = data as { success: boolean; count: number } | null;
		if (!response?.success) {
			throw new Error('Failed to save ratings: RPC returned failure');
		}

		return response;
	},
};
