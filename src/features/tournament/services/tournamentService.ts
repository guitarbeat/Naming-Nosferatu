import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { catNamesAPI } from "../../../shared/services/supabase/client";

// --- Zod Schemas ---
export const CatNameSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	avg_rating: z.number().nullable().optional(),
	is_active: z.boolean().nullable().optional(),
	created_at: z.string(),
});

export type CatName = z.infer<typeof CatNameSchema>;

export const TournamentServiceErrorSchema = z.object({
	message: z.string(),
	code: z.string().optional(),
});

export type TournamentServiceError = z.infer<
	typeof TournamentServiceErrorSchema
>;

// --- Service ---
export const TournamentService = {
	/**
	 * Fetch active cat names for the tournament.
	 * Uses neverthrow for functional error handling.
	 */
	fetchActiveNames: async (): Promise<
		Result<CatName[], TournamentServiceError>
	> => {
		try {
			// Using the existing supabase client wrapper
			const rawData = await catNamesAPI.getNamesWithDescriptions(true);

			if (!rawData) {
				return err({ message: "No data returned from supabase" });
			}

			// Validate with Zod
			const parseResult = z.array(CatNameSchema).safeParse(rawData);

			if (!parseResult.success) {
				console.error("Zod Validation Error:", parseResult.error);
				return err({
					message: "Data validation failed",
					code: "VALIDATION_ERROR",
				});
			}

			return ok(parseResult.data);
		} catch (e) {
			return err({
				message: e instanceof Error ? e.message : "Unknown error",
				code: "FETCH_ERROR",
			});
		}
	},
};
