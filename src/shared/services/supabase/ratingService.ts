import { throwOnRpcError } from "./errorUtils";
import { withSupabaseOrThrow } from "./runtime";

export interface ApplyTournamentMatchParams {
	userName: string;
	leftNameIds: string[];
	rightNameIds: string[];
	winnerSide: "left" | "right" | "tie";
}

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

	let ratingsCount = 0;

	for (const nameId in ratings) {
		ratingsCount++;
		if (ratingsCount > 200) {
			return { isValid: false, error: "Invalid ratings: exceeds maximum limit of 200 entries" };
		}

		const data = ratings[nameId];
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

	if (ratingsCount === 0) {
		return { isValid: false, error: "Invalid ratings: cannot be empty" };
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
		return withSupabaseOrThrow(async (client) => {
			// @ts-expect-error - apply_tournament_match_elo is a custom RPC not yet reflected in generated types
			const { data, error } = await client.rpc("apply_tournament_match_elo", {
				p_user_name: userName.trim(),
				p_left_name_ids: leftNameIds,
				p_right_name_ids: rightNameIds,
				p_winner_side: winnerSide,
			});

			throwOnRpcError(error, "Failed to apply tournament Elo update");

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
		});
	},

	saveRatings: async (
		userId: string,
		ratings: Record<string, { rating: number; wins: number; losses: number }>,
	): Promise<{ success: boolean; count: number }> => {
		const validation = validateRatingsData(userId, ratings);
		if (!validation.isValid) {
			throw new Error(validation.error || "Invalid ratings data");
		}

		const ratingsList = Object.entries(ratings).map(([nameId, data]) => ({
			nameId,
			rating: data.rating,
			wins: data.wins,
			losses: data.losses,
		}));

		return withSupabaseOrThrow(async (client) => {
			// @ts-expect-error - save_user_ratings is a custom RPC not yet reflected in generated types
			const { data, error } = await client.rpc("save_user_ratings", {
				p_user_name: userId,
				p_ratings: ratingsList,
			});

			throwOnRpcError(error, "Failed to save ratings");

			const response = data as { success: boolean; count: number } | null;
			if (!response?.success) {
				throw new Error("Failed to save ratings: RPC returned failure");
			}

			return response;
		});
	},
};
