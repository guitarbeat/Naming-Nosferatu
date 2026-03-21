import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ErrorManager } from "@/shared/services/errorManager";
import type { IdType, NameItem, SyncMutationResult } from "@/shared/types";
import { getFallbackNames } from "../../../../shared/fallbackNames";
import {
	enqueueRatingsMutation,
	flushRatingsMutations,
	getRatingsOutboxSnapshot,
	type PersistedRatingRecord,
} from "./outbox";
import { resolveSupabaseClient } from "./runtime";

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof resolveSupabaseClient>>>;
type NameRow = Database["public"]["Tables"]["cat_name_options"]["Row"];
type SiteStatsPayload = {
	totalNames?: unknown;
	activeNames?: unknown;
	hiddenNames?: unknown;
	totalUsers?: unknown;
	totalRatings?: unknown;
	totalSelections?: unknown;
	avgRating?: unknown;
};
type TopSelectionItem = {
	nameId: string;
	name: string;
	count: number;
};
type MutationResult<T = unknown> = SyncMutationResult<T> & {
	count?: number;
};

const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

interface RpcErrorLike {
	code?: string;
	details?: string | null;
	hint?: string | null;
	message?: string;
	name?: string;
}

let usingFallbackData = false;

function toNumber(value: unknown, fallback = 0): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeError(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
}

function isNetworkishError(error: unknown): boolean {
	if (typeof navigator !== "undefined" && navigator.onLine === false) {
		return true;
	}

	if (!(error instanceof Error)) {
		return false;
	}

	return (
		error.name === "AbortError" ||
		error.name === "NetworkError" ||
		error.message.toLowerCase().includes("network") ||
		error.message.toLowerCase().includes("fetch")
	);
}

function isMissingRpcError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return (
		error.message.includes("Could not find the function") ||
		error.message.includes("schema cache") ||
		error.message.includes("does not exist")
	);
}

function shouldUseDevFallback(): boolean {
	return Boolean(import.meta.env.DEV);
}

function mapNameRow(item: Partial<NameRow>): NameItem {
	return {
		id: String(item.id ?? ""),
		name: item.name ?? "",
		description: item.description ?? "",
		pronunciation: item.pronunciation ?? undefined,
		avgRating: item.avg_rating ?? 1500,
		avg_rating: item.avg_rating ?? 1500,
		createdAt: item.created_at ?? null,
		created_at: item.created_at ?? null,
		isHidden: item.is_hidden ?? false,
		is_hidden: item.is_hidden ?? false,
		isActive: item.is_active ?? true,
		is_active: item.is_active ?? true,
		lockedIn: item.locked_in ?? false,
		locked_in: item.locked_in ?? false,
		status: (item.status as NameItem["status"]) ?? "candidate",
		provenance: item.provenance as NameItem["provenance"],
		has_user_rating: false,
	};
}

function getResolvedUserName(user: User): string {
	return user.user_metadata?.user_name || user.email || user.id;
}

function getBlobValidationMetadata(file: File | Blob): {
	size: number | null;
	type: string | null;
} {
	const maybeBlob = file as Blob & { type?: string };
	return {
		size: typeof maybeBlob.size === "number" ? maybeBlob.size : null,
		type: typeof maybeBlob.type === "string" && maybeBlob.type.length > 0 ? maybeBlob.type : null,
	};
}

async function getClient(): Promise<SupabaseClient> {
	const client = await resolveSupabaseClient();
	if (!client) {
		throw new Error("Supabase is not configured for this environment.");
	}
	return client;
}

async function getAuthContext(): Promise<{
	client: SupabaseClient;
	user: User | null;
}> {
	const client = await getClient();
	const {
		data: { user },
		error,
	} = await client.auth.getUser();

	if (error) {
		throw new Error(error.message || "Failed to resolve Supabase session");
	}

	return { client, user };
}

async function requireAuthenticatedContext(): Promise<{
	client: SupabaseClient;
	user: User;
}> {
	const { client, user } = await getAuthContext();

	if (!user) {
		throw new Error("A signed-in Supabase session is required for this action.");
	}

	return { client, user };
}

async function callRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
	const client = await getClient();
	const rpc = client.rpc as unknown as (
		rpcName: string,
		rpcArgs?: Record<string, unknown>,
	) => Promise<{ data: T; error: RpcErrorLike | null }>;
	const { data, error } = await rpc(name, args);

	if (error) {
		throw new Error(error.message || `Supabase RPC "${name}" failed.`);
	}

	return data;
}

async function countExact(
	query: PromiseLike<{
		count: number | null;
		error: { message?: string } | null;
	}>,
): Promise<number> {
	const { count, error } = await query;
	if (error) {
		throw new Error(error.message || "Count query failed");
	}
	return count ?? 0;
}

async function getDirectSiteStats(client: SupabaseClient): Promise<SiteStatsPayload> {
	const [totalNames, hiddenNames, totalUsers, totalRatings, totalSelections, ratingsRows] =
		await Promise.all([
			countExact(
				client
					.from("cat_name_options")
					.select("id", { count: "exact", head: true })
					.eq("is_active", true)
					.eq("is_deleted", false),
			),
			countExact(
				client
					.from("cat_name_options")
					.select("id", { count: "exact", head: true })
					.eq("is_hidden", true)
					.eq("is_deleted", false),
			),
			countExact(
				client
					.from("cat_app_users")
					.select("user_id", { count: "exact", head: true })
					.eq("is_deleted", false),
			),
			countExact(client.from("cat_name_ratings").select("name_id", { count: "exact", head: true })),
			countExact(
				client.from("cat_tournament_selections").select("id", { count: "exact", head: true }),
			),
			client.from("cat_name_ratings").select("rating").limit(5000),
		]);

	const avgRating = (() => {
		if (ratingsRows.error) {
			return 1500;
		}
		const ratings = (ratingsRows.data ?? []).map((row) => toNumber(row.rating, 1500));
		if (ratings.length === 0) {
			return 1500;
		}
		return Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length);
	})();

	return {
		totalNames,
		activeNames: Math.max(totalNames - hiddenNames, 0),
		hiddenNames,
		totalUsers,
		totalRatings,
		totalSelections,
		avgRating,
	};
}

async function getDirectTopSelections(
	client: SupabaseClient,
	limit: number,
): Promise<TopSelectionItem[]> {
	const [selectionRows, nameRows] = await Promise.all([
		client
			.from("cat_tournament_selections")
			.select("name_id")
			.order("selected_at", { ascending: false })
			.limit(5000),
		client.from("cat_name_options").select("id, name").limit(5000),
	]);

	if (selectionRows.error) {
		throw new Error(selectionRows.error.message || "Failed to load tournament selections");
	}

	if (nameRows.error) {
		throw new Error(nameRows.error.message || "Failed to load name options");
	}

	const nameLookup = new Map(
		(nameRows.data ?? []).map((row) => [String(row.id), row.name ?? String(row.id)]),
	);
	const counts = new Map<string, number>();

	for (const row of selectionRows.data ?? []) {
		const nameId = String(row.name_id);
		counts.set(nameId, (counts.get(nameId) ?? 0) + 1);
	}

	return [...counts.entries()]
		.map(([nameId, count]) => ({
			nameId,
			name: nameLookup.get(nameId) ?? nameId,
			count,
		}))
		.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
		.slice(0, Math.max(1, limit));
}

async function saveRatingsDirect(
	client: SupabaseClient,
	user: User,
	ratings: PersistedRatingRecord[],
): Promise<number> {
	const { error } = await client.from("cat_name_ratings").upsert(
		ratings.map((rating) => ({
			user_id: user.id,
			user_name: getResolvedUserName(user),
			name_id: rating.name_id,
			rating: rating.rating,
			wins: rating.wins,
			losses: rating.losses,
		})),
		{ onConflict: "user_id,name_id" },
	);

	if (error) {
		throw new Error(error.message || "Failed to save ratings");
	}

	return ratings.length;
}

async function saveRatingsWithFallback(ratings: PersistedRatingRecord[]): Promise<number> {
	const { client, user } = await requireAuthenticatedContext();

	try {
		return await callRpc<number>("save_user_ratings", {
			p_ratings: ratings,
		});
	} catch (error) {
		if (!isMissingRpcError(error)) {
			throw error;
		}

		return saveRatingsDirect(client, user, ratings);
	}
}

async function replayQueuedRatings(): Promise<void> {
	const { user } = await requireAuthenticatedContext();

	if (typeof navigator !== "undefined" && navigator.onLine === false) {
		throw new Error("Browser is offline");
	}

	await flushRatingsMutations(async (entry) => {
		await saveRatingsWithFallback(entry.payload.ratings);
		ErrorManager.addBreadcrumb("outbox.replay", "Replayed queued ratings mutation", {
			entryId: entry.id,
			userId: user.id,
			ratingsCount: entry.payload.ratings.length,
		});
	});
}

async function toggleNameFlagDirect(
	field: "is_hidden" | "locked_in",
	nameId: string,
	value: boolean,
): Promise<boolean> {
	const { client } = await requireAuthenticatedContext();
	const { error } = await client
		.from("cat_name_options")
		.update({ [field]: value })
		.eq("id", nameId);

	if (error) {
		throw new Error(error.message || "Failed to update name");
	}

	return true;
}

async function toggleAdminRpc(
	rpcName: "toggle_name_visibility" | "toggle_name_locked_in",
	args: Record<string, unknown>,
): Promise<MutationResult<boolean>> {
	try {
		const { user } = await requireAuthenticatedContext();
		const result = await callRpc<boolean>(rpcName, args);
		ErrorManager.addBreadcrumb("supabase.rpc.success", rpcName, {
			userId: user.id,
			...args,
		});
		return { success: true, status: "committed", data: result };
	} catch (error) {
		try {
			if (isMissingRpcError(error)) {
				const directResult =
					rpcName === "toggle_name_visibility"
						? await toggleNameFlagDirect("is_hidden", String(args.p_name_id), Boolean(args.p_hide))
						: await toggleNameFlagDirect(
								"locked_in",
								String(args.p_name_id),
								Boolean(args.p_locked_in),
							);
				return { success: true, status: "committed", data: directResult };
			}
		} catch (fallbackError) {
			ErrorManager.handleError(fallbackError, `${rpcName}.fallback`, args);
		}

		const message = normalizeError(error, `Failed to execute ${rpcName}`);
		ErrorManager.handleError(error, rpcName, { rpcName, ...args });
		ErrorManager.addBreadcrumb("supabase.rpc.failure", rpcName, {
			message,
			...args,
		});
		return {
			success: false,
			status: "failed",
			error: message,
		};
	}
}

function validateRatingsData(
	ratings: Record<string, { rating: number; wins: number; losses: number }>,
): { isValid: boolean; error?: string } {
	if (!ratings || typeof ratings !== "object") {
		return { isValid: false, error: "Invalid ratings payload" };
	}

	const entries = Object.entries(ratings);
	if (entries.length === 0) {
		return { isValid: false, error: "Ratings payload is empty" };
	}

	if (entries.length > 1000) {
		return { isValid: false, error: "Ratings payload is too large" };
	}

	for (const [nameId, data] of entries) {
		if (!nameId) {
			return {
				isValid: false,
				error: "Ratings payload contains an empty name id",
			};
		}

		if (
			typeof data?.rating !== "number" ||
			typeof data?.wins !== "number" ||
			typeof data?.losses !== "number"
		) {
			return { isValid: false, error: `Invalid rating entry for ${nameId}` };
		}

		if (!Number.isFinite(data.rating) || data.rating < 800 || data.rating > 3000) {
			return { isValid: false, error: `Invalid rating value for ${nameId}` };
		}

		if (
			!Number.isFinite(data.wins) ||
			data.wins < 0 ||
			!Number.isFinite(data.losses) ||
			data.losses < 0
		) {
			return { isValid: false, error: `Invalid win/loss counts for ${nameId}` };
		}
	}

	return { isValid: true };
}

function toPersistedRatings(
	ratings: Record<string, { rating: number; wins: number; losses: number }>,
): PersistedRatingRecord[] {
	return Object.entries(ratings).map(([nameId, data]) => ({
		name_id: String(nameId),
		rating: data.rating,
		wins: data.wins,
		losses: data.losses,
	}));
}

export function isUsingFallbackData(): boolean {
	return usingFallbackData;
}

export const imagesAPI = {
	list: async (_path = "") => {
		try {
			const client = await getClient();
			const { data, error } = await client.storage.from("cat-images").list();

			if (error) {
				throw new Error(error.message || "Failed to list images");
			}

			return (data ?? []).map((item) => item.name);
		} catch (error) {
			ErrorManager.handleError(error, "Images List", { isRetryable: true });
			return [] as string[];
		}
	},

	upload: async (file: File | Blob, userName: string) => {
		try {
			await requireAuthenticatedContext();
			const client = await getClient();
			const { size, type } = getBlobValidationMetadata(file);

			if (size !== null && size > IMAGE_UPLOAD_MAX_BYTES) {
				return {
					path: null,
					error: "File size exceeds 5MB limit",
					success: false,
				};
			}

			if (type !== null && !ALLOWED_IMAGE_TYPES.has(type)) {
				return {
					path: null,
					error: "Only JPEG, PNG, GIF, and WebP images are allowed",
					success: false,
				};
			}

			const sourceFileName =
				file instanceof File && typeof file.name === "string" && file.name.length > 0
					? file.name
					: "upload.jpg";
			const fileExt = sourceFileName.split(".").pop() || "jpg";
			const contentType = type || (file instanceof File ? file.type : "") || "image/jpeg";
			const timestamp = Date.now();
			const randomId = Math.random().toString(36).slice(2, 8);
			const uploadFileName = `${userName}_${timestamp}_${randomId}.${fileExt}`;

			const { error } = await client.storage.from("cat-images").upload(uploadFileName, file, {
				cacheControl: "3600",
				contentType,
				upsert: false,
			});

			if (error) {
				throw new Error(error.message || "Upload failed");
			}

			const {
				data: { publicUrl },
			} = client.storage.from("cat-images").getPublicUrl(uploadFileName);

			return {
				path: publicUrl,
				error: null,
				success: true,
			};
		} catch (error) {
			ErrorManager.handleError(error, "Images Upload", {
				fileType: file instanceof File ? file.type : "blob",
			});
			return {
				path: null,
				error: normalizeError(error, "Upload failed"),
				success: false,
			};
		}
	},

	delete: async (fileName: string) => {
		try {
			await requireAuthenticatedContext();
			const client = await getClient();
			const { error } = await client.storage.from("cat-images").remove([fileName]);

			if (error) {
				throw new Error(error.message || "Delete failed");
			}

			return { success: true, error: null };
		} catch (error) {
			ErrorManager.handleError(error, "Images Delete", { fileName });
			return {
				success: false,
				error: normalizeError(error, "Delete failed"),
			};
		}
	},
};

export const coreAPI = {
	addName: async (name: string, description: string): Promise<MutationResult<NameItem>> => {
		try {
			const client = await getClient();
			const { data, error } = await client
				.from("cat_name_options")
				.insert({
					name: name.trim(),
					description: description.trim(),
					status: "candidate",
				})
				.select(
					"id, name, description, pronunciation, avg_rating, created_at, is_hidden, is_active, locked_in, status, provenance, is_deleted",
				)
				.single();

			if (error || !data) {
				throw new Error(error?.message || "Failed to add name");
			}

			return {
				success: true,
				status: "committed",
				data: mapNameRow(data),
			};
		} catch (error) {
			ErrorManager.handleError(error, "Add Name", {
				descriptionLength: description.trim().length,
				nameLength: name.trim().length,
			});
			return {
				success: false,
				status: "failed",
				error: normalizeError(error, "Failed to add name"),
			};
		}
	},

	getTrendingNames: async (includeHidden = false): Promise<NameItem[]> => {
		try {
			const client = await getClient();
			let query = client
				.from("cat_name_options")
				.select(
					"id, name, description, pronunciation, avg_rating, created_at, is_hidden, is_active, locked_in, status, provenance, is_deleted",
				)
				.eq("is_active", true)
				.eq("is_deleted", false);

			if (!includeHidden) {
				query = query.eq("is_hidden", false);
			}

			const { data, error } = await query.order("avg_rating", { ascending: false }).limit(1000);

			if (error) {
				throw new Error(error.message || "Failed to load names");
			}

			usingFallbackData = false;
			return (data ?? []).map((item) => mapNameRow(item));
		} catch (error) {
			if (shouldUseDevFallback()) {
				usingFallbackData = true;
				ErrorManager.addBreadcrumb("supabase.dev_fallback", "Using bundled fallback names", {
					includeHidden,
					message: normalizeError(error, "Unknown error"),
				});
				return getFallbackNames(includeHidden).map((item) => mapNameRow(item));
			}

			usingFallbackData = false;
			throw error;
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
		return toggleAdminRpc("toggle_name_visibility", {
			p_name_id: String(nameId),
			p_hide: isHidden,
		});
	},
};

export const hiddenNamesAPI = {
	getHiddenNames: async () => coreAPI.getHiddenNames(),
	hideName: async (_userName: string, nameId: string | number) =>
		coreAPI.hideName(_userName, nameId, true),
	unhideName: async (_userName: string, nameId: string | number) =>
		coreAPI.hideName(_userName, nameId, false),
};

export const adminNamesAPI = {
	toggleLockedIn: async (nameId: string | number, lockedIn: boolean) =>
		toggleAdminRpc("toggle_name_locked_in", {
			p_name_id: String(nameId),
			p_locked_in: lockedIn,
		}),
};

export const statsAPI = {
	getSiteStats: async (): Promise<SiteStatsPayload | null> => {
		try {
			return (await callRpc<SiteStatsPayload>("get_site_stats")) ?? null;
		} catch (error) {
			try {
				const client = await getClient();
				return await getDirectSiteStats(client);
			} catch (fallbackError) {
				ErrorManager.handleError(fallbackError, "Get Site Stats", {
					isRetryable: true,
				});
				ErrorManager.handleError(error, "Get Site Stats RPC", {
					isRetryable: true,
				});
				return null;
			}
		}
	},

	getTopSelections: async (limit = 10): Promise<TopSelectionItem[]> => {
		const normalizedLimit = Math.max(1, limit);
		try {
			const rows = await callRpc<Array<{ count: number; name: string; name_id: string }>>(
				"get_top_selections",
				{ limit_count: normalizedLimit },
			);
			return (rows ?? []).map((row) => ({
				nameId: String(row.name_id),
				name: row.name,
				count: toNumber(row.count),
			}));
		} catch (error) {
			try {
				const client = await getClient();
				return await getDirectTopSelections(client, normalizedLimit);
			} catch (fallbackError) {
				ErrorManager.handleError(fallbackError, "Get Top Selections", {
					limit: normalizedLimit,
				});
				ErrorManager.handleError(error, "Get Top Selections RPC", {
					limit: normalizedLimit,
				});
				return [];
			}
		}
	},
};

export const selectionsAPI = {
	recordTournamentSelections: async (
		tournamentId: string,
		nameIds: IdType[],
		selectionType = "tournament_setup",
	): Promise<MutationResult<{ savedCount: number }>> => {
		try {
			const { client, user } = await requireAuthenticatedContext();
			if (nameIds.length === 0) {
				return {
					success: true,
					status: "committed",
					data: { savedCount: 0 },
					count: 0,
				};
			}

			const userName = getResolvedUserName(user);
			const { error } = await client.from("cat_tournament_selections").insert(
				nameIds.map((nameId) => ({
					user_id: user.id,
					user_name: userName,
					name_id: String(nameId),
					tournament_id: tournamentId,
					selection_type: selectionType,
				})),
			);

			if (error) {
				throw new Error(error.message || "Failed to record tournament selections");
			}

			return {
				success: true,
				status: "committed",
				data: { savedCount: nameIds.length },
				count: nameIds.length,
			};
		} catch (error) {
			ErrorManager.handleError(error, "Tournament Selection Save", {
				nameCount: nameIds.length,
				selectionType,
				tournamentId,
			});
			return {
				success: false,
				status: "failed",
				error: normalizeError(error, "Failed to record tournament selections"),
			};
		}
	},
};

export const ratingsAPI = {
	saveRatings: ErrorManager.createResilientFunction(
		async (
			_userId: string,
			ratings: Record<string, { rating: number; wins: number; losses: number }>,
		): Promise<MutationResult<{ savedCount: number }>> => {
			const validation = validateRatingsData(ratings);
			if (!validation.isValid) {
				return {
					success: false,
					status: "failed",
					error: validation.error,
				};
			}

			const persistedRatings = toPersistedRatings(ratings);

			try {
				const { user } = await requireAuthenticatedContext();

				if (typeof navigator !== "undefined" && navigator.onLine === false) {
					await enqueueRatingsMutation(persistedRatings);
					const snapshot = await getRatingsOutboxSnapshot();
					ErrorManager.addBreadcrumb("outbox.enqueue", "Queued ratings while offline", {
						pendingCount: snapshot.count,
						ratingsCount: persistedRatings.length,
						userId: user.id,
					});
					return {
						success: true,
						status: "queued",
						data: { savedCount: persistedRatings.length },
						count: persistedRatings.length,
					};
				}

				const savedCount = await saveRatingsWithFallback(persistedRatings);
				ErrorManager.addBreadcrumb("ratings.save", "Saved user ratings", {
					savedCount,
					userId: user.id,
				});
				return {
					success: true,
					status: "committed",
					data: { savedCount },
					count: savedCount,
				};
			} catch (error) {
				const message = normalizeError(error, "Failed to save ratings");

				if (isNetworkishError(error)) {
					try {
						await requireAuthenticatedContext();
						await enqueueRatingsMutation(persistedRatings);
						const snapshot = await getRatingsOutboxSnapshot();
						ErrorManager.addBreadcrumb("outbox.enqueue", "Queued ratings after network failure", {
							pendingCount: snapshot.count,
							ratingsCount: persistedRatings.length,
						});
						return {
							success: true,
							status: "queued",
							data: { savedCount: persistedRatings.length },
							count: persistedRatings.length,
						};
					} catch (queueError) {
						ErrorManager.handleError(queueError, "Ratings Queue", {
							ratingsCount: persistedRatings.length,
						});
					}
				}

				ErrorManager.handleError(error, "Ratings Save", {
					isRetryable: true,
					ratingsCount: persistedRatings.length,
				});

				return {
					success: false,
					status: "failed",
					error: message,
				};
			}
		},
		{
			threshold: 3,
			timeout: 30000,
			maxAttempts: 3,
			baseDelay: 1000,
		},
	),

	replayQueuedRatings: async (): Promise<MutationResult<{ remaining: number }>> => {
		try {
			const beforeReplay = await getRatingsOutboxSnapshot();
			if (beforeReplay.count === 0) {
				return {
					success: true,
					status: "committed",
					data: { remaining: 0 },
					count: 0,
				};
			}

			await replayQueuedRatings();
			const snapshot = await getRatingsOutboxSnapshot();
			return {
				success: true,
				status: "committed",
				data: { remaining: snapshot.count },
				count: snapshot.count,
			};
		} catch (error) {
			ErrorManager.handleError(error, "Ratings Replay", { isRetryable: true });
			const snapshot = await getRatingsOutboxSnapshot();
			return {
				success: false,
				status: "failed",
				error: normalizeError(error, "Failed to replay queued ratings"),
				data: { remaining: toNumber(snapshot.count) },
			};
		}
	},

	getOutboxStatus: getRatingsOutboxSnapshot,
};
