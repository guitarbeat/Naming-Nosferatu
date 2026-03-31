import type { NameItem } from "@/shared/types";
import { resolveSupabaseClient, withSupabase } from "./runtime";

interface ApiNameRow {
        id: string | number;
        name: string;
        description?: string | null;
        pronunciation?: string | null;
        avgRating?: number | null;
        avg_rating?: number | null;
        globalWins?: number | null;
        global_wins?: number | null;
        globalLosses?: number | null;
        global_losses?: number | null;
        createdAt?: string | null;
        created_at?: string | null;
        isHidden?: boolean;
        is_hidden?: boolean;
        isActive?: boolean | null;
        is_active?: boolean | null;
        lockedIn?: boolean;
        locked_in?: boolean;
        status?: string | null;
        provenance?: unknown;
        isDeleted?: boolean;
        is_deleted?: boolean;
}

interface SupabaseNamesQueryResult {
        data: unknown[] | null;
        error: { message?: string } | null;
}

interface SupabaseNamesQuery {
        select(columns: string): SupabaseNamesQuery;
        eq(column: string, value: boolean | string | number): SupabaseNamesQuery;
        order(column: string, options: { ascending: boolean }): SupabaseNamesQuery;
        limit(count: number): Promise<SupabaseNamesQueryResult>;
}

interface SupabaseNamesClient {
        from(table: string): SupabaseNamesQuery;
}

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

// Field mapping utilities — must be defined before mapNameRow to avoid TDZ errors
const snakeToCamelCase = (str: string): string =>
        str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

const camelToSnakeCaseUtil = (str: string): string => str.replace(/([A-Z])/g, "_$1").toLowerCase();

const mapFields = <T extends Record<string, unknown>>(
        obj: T,
        mapper: (key: string) => string,
): Record<string, unknown> => {
        const mapped: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
                mapped[mapper(key)] = value;
        }
        return mapped;
};

const mapSnakeToCamel = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> =>
        mapFields(obj, snakeToCamelCase);

const _mapCamelToSnake = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> =>
        mapFields(obj, camelToSnakeCaseUtil);

function mapNameRow(item: ApiNameRow): NameItem {
        // Use automated field mapping for snake_case to camelCase conversion
        const mappedItem = mapSnakeToCamel(item) as ApiNameRow;

        return {
                id: String(mappedItem.id),
                name: mappedItem.name,
                description: mappedItem.description ?? "",
                pronunciation: mappedItem.pronunciation ?? undefined,
                avgRating: mappedItem.avgRating ?? 1500,
                createdAt: mappedItem.createdAt ?? null,
                wins: mappedItem.globalWins ?? mappedItem.wins ?? 0,
                losses: mappedItem.globalLosses ?? mappedItem.losses ?? 0,
                isHidden: mappedItem.isHidden ?? false,
                isActive: mappedItem.isActive ?? true,
                lockedIn: mappedItem.lockedIn ?? false,
                status: (mappedItem.status as NameItem["status"]) ?? "candidate",
                provenance: mappedItem.provenance as NameItem["provenance"],
                has_user_rating: false,
        };
}

async function getNamesFromSupabase(includeHidden: boolean): Promise<NameItem[]> {
        const client = (await resolveSupabaseClient()) as unknown as SupabaseNamesClient | null;
        if (!client) {
                return [];
        }

        const selectColumns =
                "id, name, description, pronunciation, avg_rating, global_wins, global_losses, created_at, is_hidden, is_active, locked_in, is_deleted";

        const filters: Record<string, boolean> = { is_active: true, is_deleted: false };
        if (!includeHidden) {
                filters.is_hidden = false;
        }

        let query: SupabaseNamesQuery = client.from("cat_names").select(selectColumns);
        for (const [key, value] of Object.entries(filters)) {
                query = query.eq(key, value);
        }
        const result = await query.order("avg_rating", { ascending: false }).limit(1000);
        if (result.error) {
                console.warn("[coreAPI.getTrendingNames] Supabase fallback failed:", result.error.message);
                return [];
        }

        return (result.data ?? []).map((item) => mapNameRow(item as unknown as ApiNameRow));
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
                        return { success: true, data: mapNameRow(row as ApiNameRow) };
                }, { success: false, error: "Supabase client not available" });
        },

        getTrendingNames: async (includeHidden: boolean = false) => {
                const cacheKey = includeHidden ? "includeHidden" : "visibleOnly";
                const existingRequest = trendingNamesRequests.get(cacheKey);

                // If request exists and is not aborted, return it
                if (existingRequest && !existingRequest.controller.signal.aborted) {
                        return existingRequest.promise;
                }

                // Abort any existing request for this cache key
                if (existingRequest) {
                        existingRequest.controller.abort();
                        trendingNamesRequests.delete(cacheKey);
                }

                // Create new AbortController for this request
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
                        .filter((item) => item.isHidden ?? item.is_hidden)
                        .map((item) => ({
                                id: String(item.id),
                                name: String(item.name),
                                description: typeof item.description === "string" ? item.description : null,
                                created_at:
                                        typeof item.created_at === "string"
                                                ? item.created_at
                                                : typeof item.createdAt === "string"
                                                        ? item.createdAt
                                                        : "",
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
        // Validate userId
        if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
                return { isValid: false, error: "Invalid userId: must be a non-empty string" };
        }

        // Validate ratings object
        if (!ratings || typeof ratings !== "object") {
                return { isValid: false, error: "Invalid ratings: must be an object" };
        }

        const ratingsCount = Object.keys(ratings).length;
        if (ratingsCount === 0) {
                return { isValid: false, error: "Invalid ratings: cannot be empty" };
        }

        if (ratingsCount > 1000) {
                return { isValid: false, error: "Invalid ratings: exceeds maximum limit of 1000 entries" };
        }

        // Validate each rating entry
        for (const [nameId, data] of Object.entries(ratings)) {
                if (!nameId || typeof nameId !== "string") {
                        return { isValid: false, error: "Invalid nameId: must be a non-empty string" };
                }

                if (!data || typeof data !== "object") {
                        return { isValid: false, error: `Invalid rating data for ${nameId}: must be an object` };
                }

                const { rating, wins, losses } = data;

                // Validate rating value
                if (typeof rating !== "number" || Number.isNaN(rating) || rating < 800 || rating > 2400) {
                        return {
                                isValid: false,
                                error: `Invalid rating for ${nameId}: must be a number between 800 and 2400`,
                        };
                }

                // Validate wins
                if (typeof wins !== "number" || Number.isNaN(wins) || wins < 0 || wins > 1000) {
                        return {
                                isValid: false,
                                error: `Invalid wins for ${nameId}: must be a number between 0 and 1000`,
                        };
                }

                // Validate losses
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
