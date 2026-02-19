import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import { ZodError } from "zod";
import {
	catAppUsers,
	catNameOptions,
	catNameRatings,
	catTournamentSelections,
	userRoles,
} from "../shared/schema";
import { requireAdmin } from "./auth";
import { db } from "./db";
import { createNameSchema, createUserSchema, saveRatingsSchema } from "./validation";

export const router = Router();

// Mock data for when database is unavailable
const mockNames = [
	{
		id: "1",
		name: "Whiskers",
		description: "Classic tabby cat",
		avgRating: 1650,
		isActive: true,
		isHidden: false,
		status: "approved",
	},
	{
		id: "2",
		name: "Shadow",
		description: "Mysterious black cat",
		avgRating: 1600,
		isActive: true,
		isHidden: false,
		status: "approved",
	},
	{
		id: "3",
		name: "Luna",
		description: "Elegant white cat",
		avgRating: 1580,
		isActive: true,
		isHidden: false,
		status: "approved",
	},
	{
		id: "4",
		name: "Muffin",
		description: "Sweet orange cat",
		avgRating: 1550,
		isActive: true,
		isHidden: false,
		status: "approved",
	},
	{
		id: "5",
		name: "Mittens",
		description: "Playful kitten",
		avgRating: 1500,
		isActive: true,
		isHidden: false,
		status: "candidate",
	},
];

// Basic endpoint to get all active names
router.get("/api/names", async (req, res) => {
	try {
		if (!db) {
			// Return mock data when database is unavailable
			return res.json(mockNames);
		}

		const includeHidden = req.query.includeHidden === "true";
		const conditions = [eq(catNameOptions.isActive, true)];
		if (!includeHidden) {
			conditions.push(eq(catNameOptions.isHidden, false));
		}
		const names = await db
			.select()
			.from(catNameOptions)
			.where(and(...conditions))
			.orderBy(desc(catNameOptions.avgRating))
			.limit(1000);
		res.json(names);
	} catch (error) {
		console.error("Error fetching names:", error);
		res.status(500).json({ error: "Failed to fetch names" });
	}
});

// Create a new name
router.post("/api/names", async (req, res) => {
	try {
		const { name, description, status, provenance } = createNameSchema.parse(req.body);

		if (!db) {
			// Return mock response when database is unavailable
			return res.json({
				success: true,
				data: {
					id: String(Date.now()),
					name: name.trim(),
					description: (description || "").trim(),
					status: status || "candidate",
					provenance: provenance || null,
					avgRating: 1500,
					isActive: true,
					isHidden: false,
				},
			});
		}

		const [inserted] = await db
			.insert(catNameOptions)
			.values({
				name: name.trim(),
				description: (description || "").trim(),
				status: status || "candidate",
				provenance: provenance || null,
			})
			.returning();
		res.json({ success: true, data: inserted });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ success: false, error: error.errors });
		}
		console.error("Error creating name:", error);
		res.status(500).json({ success: false, error: "Failed to create name" });
	}
});

// Delete a name by ID
router.delete("/api/names/:id", requireAdmin, async (req, res) => {
	try {
		if (!db) {
			return res.json({ success: true });
		}
		await db.delete(catNameOptions).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
	}
});

// Delete a name by name string
router.delete("/api/names-by-name/:name", requireAdmin, async (req, res) => {
	try {
		if (!db) {
			return res.json({ success: true });
		}
		await db.delete(catNameOptions).where(eq(catNameOptions.name, req.params.name));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
	}
});

// Update hidden status
router.patch("/api/names/:id/hide", requireAdmin, async (req, res) => {
	try {
		if (!db) {
			return res.json({ success: true });
		}
		const { isHidden } = req.body;
		await db.update(catNameOptions).set({ isHidden }).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error updating name:", error);
		res.status(500).json({ success: false, error: "Failed to update name" });
	}
});

// Batch update hidden status
router.post("/api/names/batch-hide", requireAdmin, async (req, res) => {
	try {
		const { nameIds, isHidden } = req.body;
		if (!Array.isArray(nameIds) || nameIds.length === 0) {
			return res.json({ results: [] });
		}
		// biome-ignore lint/suspicious/noExplicitAny: simple object type
		const results: { nameId: any; success: boolean; error?: string }[] = [];

		if (!db) {
			// Return mock results when database is unavailable
			// biome-ignore lint/suspicious/noExplicitAny: mocking simple object
			return res.json({ results: nameIds.map((id: any) => ({ nameId: id, success: true })) });
		}

		try {
			await db.update(catNameOptions).set({ isHidden }).where(inArray(catNameOptions.id, nameIds));
			for (const nameId of nameIds) {
				results.push({ nameId, success: true });
			}
		} catch (error) {
			for (const nameId of nameIds) {
				results.push({ nameId, success: false, error: String(error) });
			}
		}

		res.json({ results });
	} catch (error) {
		console.error("Error batch updating names:", error);
		res.status(500).json({ error: "Failed to batch update names" });
	}
});

// Get hidden names
router.get("/api/hidden-names", requireAdmin, async (_req, res) => {
	try {
		if (!db) {
			return res.json([]);
		}
		const hidden = await db.select().from(catNameOptions).where(eq(catNameOptions.isHidden, true));
		res.json(hidden);
	} catch (error) {
		console.error("Error fetching hidden names:", error);
		res.status(500).json({ error: "Failed to fetch hidden names" });
	}
});

// Update locked in status
router.patch("/api/names/:id/lock", requireAdmin, async (req, res) => {
	try {
		if (!db) {
			return res.json({ success: true });
		}
		const { lockedIn } = req.body;
		await db.update(catNameOptions).set({ lockedIn }).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error locking name:", error);
		res.status(500).json({ error: "Failed to lock name" });
	}
});

// User management endpoints
router.post("/api/users", async (req, res) => {
	try {
		const { userName, preferences } = createUserSchema.parse(req.body);

		if (!db) {
			return res.json({
				success: true,
				data: {
					id: String(Date.now()),
					userName,
					preferences: preferences || {},
				},
			});
		}

		const [inserted] = await db
			.insert(catAppUsers)
			.values({
				userName,
				preferences: preferences || {},
			})
			.returning();
		res.json({ success: true, data: inserted });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ success: false, error: error.errors });
		}
		console.error("Error creating user:", error);
		res.status(500).json({ error: "Failed to create user" });
	}
});

// Get user roles
router.get("/api/users/:userName/roles", async (req, res) => {
	try {
		if (!db) {
			return res.json([]);
		}
		const roles = await db
			.select()
			.from(userRoles)
			.where(eq(userRoles.userName, req.params.userName));
		res.json(roles);
	} catch (error) {
		console.error("Error fetching user roles:", error);
		res.status(500).json({ error: "Failed to fetch user roles" });
	}
});

// Save ratings
router.post("/api/ratings", async (req, res) => {
	try {
		const { userName, ratings } = saveRatingsSchema.parse(req.body);

		if (!db) {
			return res.json({ success: true, count: ratings.length });
		}

		// biome-ignore lint/suspicious/noExplicitAny: simple object type
		const records = ratings.map((r: any) => ({
			userName,
			nameId: r.nameId,
			rating: r.rating || 1500,
			wins: r.wins || 0,
			losses: r.losses || 0,
		}));

		// Upsert logic - simple insert for now
		for (const record of records) {
			await db.insert(catNameRatings).values(record);
		}

		res.json({ success: true, count: records.length });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ success: false, error: error.errors });
		}
		console.error("Error saving ratings:", error);
		res.status(500).json({ error: "Failed to save ratings" });
	}
});

// Get analytics - popularity
router.get("/api/analytics/popularity", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string, 10) || 20;

		if (!db) {
			return res.json(
				mockNames.slice(0, limit).map((n) => ({
					nameId: n.id,
					name: n.name,
					count: Math.floor(Math.random() * 100),
				})),
			);
		}

		const results = await db
			.select({
				nameId: catTournamentSelections.nameId,
				name: catTournamentSelections.name,
				count: sql<number>`count(*)`,
			})
			.from(catTournamentSelections)
			.groupBy(catTournamentSelections.nameId, catTournamentSelections.name)
			.orderBy((_t) => desc(sql<number>`count(*)`))
			.limit(limit);
		res.json(results);
	} catch (error) {
		console.error("Error fetching popularity:", error);
		res.status(500).json({ error: "Failed to fetch popularity" });
	}
});

// Get analytics - ranking history
router.get("/api/analytics/ranking-history", async (_req, res) => {
	try {
		if (!db) {
			return res.json(
				mockNames.map((n) => ({
					nameId: n.id,
					name: n.name,
					avgRating: n.avgRating,
				})),
			);
		}

		const ratings = await db
			.select({
				nameId: catNameRatings.nameId,
				name: sql<string>`''`,
				avgRating: sql<number>`avg(rating)`,
			})
			.from(catNameRatings)
			.groupBy(catNameRatings.nameId)
			.limit(100);

		res.json(ratings);
	} catch (error) {
		console.error("Error fetching ranking history:", error);
		res.status(500).json({ error: "Failed to fetch ranking history" });
	}
});

// Get analytics - leaderboard
router.get("/api/analytics/leaderboard", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string, 10) || 50;

		if (!db) {
			return res.json(
				mockNames.slice(0, limit).map((n) => ({
					nameId: n.id,
					avgRating: n.avgRating,
					totalWins: Math.floor(Math.random() * 50),
					totalLosses: Math.floor(Math.random() * 50),
				})),
			);
		}

		const ratings = await db
			.select({
				nameId: catNameRatings.nameId,
				avgRating: sql<number>`avg(rating)`,
				totalWins: sql<number>`sum(wins)`,
				totalLosses: sql<number>`sum(losses)`,
			})
			.from(catNameRatings)
			.groupBy(catNameRatings.nameId)
			.orderBy((_r) => desc(sql<number>`avg(rating)`))
			.limit(limit);

		res.json(ratings);
	} catch (error) {
		console.error("Error fetching leaderboard:", error);
		res.status(500).json({ error: "Failed to fetch leaderboard" });
	}
});

// Site stats
router.get("/api/analytics/site-stats", async (_req, res) => {
	try {
		if (!db) {
			return res.json({
				totalNames: mockNames.length,
				totalRatings: Math.floor(Math.random() * 500),
				totalUsers: Math.floor(Math.random() * 50),
			});
		}

		const totalNames = await db.select({ count: sql<number>`count(*)` }).from(catNameOptions);
		const totalRatings = await db.select({ count: sql<number>`count(*)` }).from(catNameRatings);
		const totalUsers = await db
			.select({ count: sql<number>`count(distinct user_name)` })
			.from(catNameRatings);

		res.json({
			totalNames: totalNames[0]?.count || 0,
			totalRatings: totalRatings[0]?.count || 0,
			totalUsers: totalUsers[0]?.count || 0,
		});
	} catch (error) {
		console.error("Error fetching site stats:", error);
		res.status(500).json({ error: "Failed to fetch site stats" });
	}
});

// Default error handler
// biome-ignore lint/suspicious/noExplicitAny: error handler middleware has specific signature
router.use((err: any, _req: any, res: any, _next: any) => {
	console.error("Route error:", err);
	res.status(500).json({ error: "Internal server error" });
});
