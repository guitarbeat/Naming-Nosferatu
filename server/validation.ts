import { z } from "zod";

export const createNameSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
});

export const createUserSchema = z.object({
	userName: z.string().min(1).max(100),
	preferences: z.record(z.any()).optional(),
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
