import { z } from "zod";

export const createNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  description: z.string().trim().max(500, "Description must be 500 characters or less").optional(),
  status: z.enum(["candidate", "intake", "tournament", "eliminated", "archived"]).optional(),
  provenance: z.any().optional(),
});

export const createUserSchema = z.object({
  userName: z.string().trim().min(1, "Username is required").max(50, "Username must be 50 characters or less"),
  preferences: z.any().optional(),
});
