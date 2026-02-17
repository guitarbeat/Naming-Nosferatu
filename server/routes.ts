import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import { ZodError } from "zod";
import {
	auditLog,
	catAppUsers,
	catChosenName,
	catNameOptions,
	catNameRatings,
	catTournamentSelections,
	userRoles,
} from "../shared/schema";
import { db } from "./db";
import { createNameSchema, createUserSchema, saveRatingsSchema } from "./validation";

export const router = Router();

// Basic endpoint to get all active names
router.get("/api/names", async (req, res) => {
	try {
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
router.delete("/api/names/:id", async (req, res) => {
	try {
		await db.delete(catNameOptions).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
	}
});

// Delete a name by name string
router.delete("/api/names-by-name/:name", async (req, res) => {
	try {
		await db.delete(catNameOptions).where(eq(catNameOptions.name, req.params.name));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
	}
});

// Update hidden status
router.patch("/api/names/:id/hide", async (req, res) => {
	try {
		const { isHidden } = req.body;
		await db.update(catNameOptions).set({ isHidden }).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error updating name:", error);
		res.status(500).json({ success: false, error: "Failed to update name" });
	}
});

// Batch update hidden status
router.post("/api/names/batch-hide", async (req, res) => {
	try {
		const { nameIds, isHidden } = req.body;
		const results: { nameId: any; success: boolean; error?: string }[] = [];

		for (const nameId of nameIds) {
			try {
				await db
					.update(catNameOptions)
					.set({ isHidden })
					.where(eq(catNameOptions.id, nameId));
				results.push({ nameId, success: true });
			} catch (error) {
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
router.get("/api/hidden-names", async (req, res) => {
	try {
		const hidden = await db
			.select()
			.from(catNameOptions)
			.where(eq(catNameOptions.isHidden, true));
		res.json(hidden);
	} catch (error) {
		console.error("Error fetching hidden names:", error);
		res.status(500).json({ error: "Failed to fetch hidden names" });
	}
});

// Update locked in status
router.patch("/api/names/:id/lock", async (req, res) => {
	try {
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
		const limit = parseInt(req.query.limit as string) || 20;
		const results = await db
			.select({
				nameId: catTournamentSelections.nameId,
				name: catTournamentSelections.name,
				count: sql<number>`count(*)`,
			})
			.from(catTournamentSelections)
			.groupBy(catTournamentSelections.nameId, catTournamentSelections.name)
			.orderBy((t) => desc(sql<number>`count(*)`))
			.limit(limit);
		res.json(results);
	} catch (error) {
		console.error("Error fetching popularity:", error);
		res.status(500).json({ error: "Failed to fetch popularity" });
	}
});

// Get analytics - ranking history
router.get("/api/analytics/ranking-history", async (req, res) => {
	try {
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
		const limit = parseInt(req.query.limit as string) || 50;
		const ratings = await db
			.select({
				nameId: catNameRatings.nameId,
				avgRating: sql<number>`avg(rating)`,
				totalWins: sql<number>`sum(wins)`,
				totalLosses: sql<number>`sum(losses)`,
			})
			.from(catNameRatings)
			.groupBy(catNameRatings.nameId)
			.orderBy((r) => desc(sql<number>`avg(rating)`))
			.limit(limit);

		res.json(ratings);
	} catch (error) {
		console.error("Error fetching leaderboard:", error);
		res.status(500).json({ error: "Failed to fetch leaderboard" });
	}
});

// Site stats
router.get("/api/analytics/site-stats", async (req, res) => {
	try {
		const totalNames = await db.select({ count: sql<number>`count(*)` }).from(catNameOptions);
		const totalRatings = await db.select({ count: sql<number>`count(*)` }).from(catNameRatings);
		const totalUsers = await db.select({ count: sql<number>`count(distinct user_name)` }).from(catNameRatings);

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
router.use((err: any, req: any, res: any, next: any) => {
	console.error("Route error:", err);
	res.status(500).json({ error: "Internal server error" });
});
