import { z } from "zod";

const provenanceSchema = z.object({
	action: z.string(),
	timestamp: z.string(),
	userId: z.string().optional(),
	details: z.record(z.string(), z.unknown()).optional(),
});

export const createNameSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	status: z.string().optional(),
	provenance: z.array(provenanceSchema).optional(),
});

export const createUserSchema = z.object({
	userName: z.string().min(1).max(100),
	preferences: z.record(z.string(), z.any()).optional(),
});

export const saveRatingsSchema = z.object({
	userId: z.string().uuid(),
	ratings: z
		.array(
			z.object({
				nameId: z.union([z.string(), z.number()]),
				rating: z.number(),
				wins: z.number().optional(),
				losses: z.number().optional(),
			}),
		)
		.min(1),
});
