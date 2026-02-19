import { z } from "zod";

export const provenanceEntrySchema = z.object({
	action: z.string().min(1).max(100),
	timestamp: z.string().datetime(),
	userId: z.string().optional(),
	details: z.record(z.any()).optional(),
});

export const userPreferencesSchema = z.object({
	theme: z.string().optional(),
	notifications: z.boolean().optional(),
	showCatPictures: z.boolean().optional(),
	matrixMode: z.boolean().optional(),
});

export const createNameSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	status: z.enum(["candidate", "intake", "tournament", "eliminated", "archived"]).optional(),
	provenance: z.array(provenanceEntrySchema).optional(),
});

export const createUserSchema = z.object({
	userName: z.string().min(1).max(100),
	preferences: userPreferencesSchema.optional(),
});

export const saveRatingsSchema = z.object({
	userName: z.string().min(1).max(100),
	ratings: z
		.array(
			z.object({
				name: z.string().min(1),
				rating: z.number(),
				wins: z.number().optional(),
				losses: z.number().optional(),
			}),
		)
		.min(1),
});
