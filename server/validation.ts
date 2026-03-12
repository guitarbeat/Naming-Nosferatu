import { z } from "zod";

const numericIdSchema = z.coerce.number().int().positive();

export const createNameSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
});

export const createUserSchema = z.object({
	userName: z.string().min(1).max(100),
	preferences: z.record(z.string(), z.unknown()).optional(),
});

export const updateHideSchema = z.object({
	isHidden: z.boolean(),
});

export const updateLockSchema = z.object({
	lockedIn: z.boolean(),
});

export const batchHideSchema = z.object({
	nameIds: z.array(numericIdSchema).max(100),
	isHidden: z.boolean(),
});

export const saveRatingsSchema = z.object({
	userId: z.string(),
	ratings: z
		.array(
			z.object({
				nameId: numericIdSchema,
				rating: z.number(),
				wins: z.number().optional(),
				losses: z.number().optional(),
			}),
		)
		.min(1)
		.max(100),
});

export type CreateNameInput = z.infer<typeof createNameSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateHideInput = z.infer<typeof updateHideSchema>;
export type UpdateLockInput = z.infer<typeof updateLockSchema>;
export type BatchHideInput = z.infer<typeof batchHideSchema>;
export type SaveRatingsInput = z.infer<typeof saveRatingsSchema>;
