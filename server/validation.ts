import { z } from "zod";

export const NameSchema = z.object({
	name: z.string().min(1).max(50),
	description: z.string().max(500).optional(),
	status: z.enum(["candidate", "intake", "tournament", "eliminated", "archived"]).optional(),
});

export const UserSchema = z.object({
	userName: z.string().min(1).max(50),
});
