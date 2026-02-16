import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Router } from "express";
import {
	catAppUsers,
	catChosenName,
	catNameOptions,
	catNameRatings,
	catTournamentSelections,
	userRoles,
} from "../shared/schema";
import { db } from "./db";

export const router = Router();

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

router.post("/api/names", async (req, res) => {
	try {
		const { name, description, status, provenance } = req.body;
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
		console.error("Error adding name:", error);
		res.status(500).json({ success: false, error: "Failed to add name" });
	}
});

router.delete("/api/names/:id", async (req, res) => {
	try {
		await db.delete(catNameOptions).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
	}
});

router.delete("/api/names/by-name/:name", async (req, res) => {
	try {
		await db.delete(catNameOptions).where(eq(catNameOptions.name, req.params.name));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
	}
});

router.post("/api/names/:id/toggle-hidden", async (req, res) => {
	try {
		const { isHidden } = req.body;
		await db.update(catNameOptions).set({ isHidden }).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error toggling hidden:", error);
		res.status(500).json({ success: false, error: "Failed to toggle hidden" });
	}
});

router.post("/api/names/bulk-toggle-hidden", async (req, res) => {
	try {
		const { nameIds, isHidden } = req.body;
		const results: { nameId: any; success: boolean; error?: string }[] = [];
		for (const id of nameIds) {
			try {
				await db
					.update(catNameOptions)
					.set({ isHidden })
					.where(eq(catNameOptions.id, String(id)));
				results.push({ nameId: id, success: true });
			} catch (err: any) {
				results.push({ nameId: id, success: false, error: err.message });
			}
		}
		res.json(results);
	} catch (error) {
		console.error("Error bulk toggling hidden:", error);
		res.status(500).json({ error: "Failed to bulk toggle hidden" });
	}
});

router.get("/api/names/hidden", async (_req, res) => {
	try {
		const hidden = await db
			.select({
				id: catNameOptions.id,
				name: catNameOptions.name,
				description: catNameOptions.description,
				created_at: catNameOptions.createdAt,
			})
			.from(catNameOptions)
			.where(eq(catNameOptions.isHidden, true));
		res.json(hidden);
	} catch (error) {
		console.error("Error fetching hidden names:", error);
		res.status(500).json({ error: "Failed to fetch hidden names" });
	}
});

router.post("/api/names/:id/toggle-locked-in", async (req, res) => {
	try {
		const { lockedIn } = req.body;
		await db.update(catNameOptions).set({ lockedIn }).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error toggling locked in:", error);
		res.status(500).json({ success: false, error: "Failed to toggle locked in" });
	}
});

router.post("/api/users/create", async (req, res) => {
	try {
		const { userName, preferences } = req.body;
		await db
			.insert(catAppUsers)
			.values({
				userName,
				preferences: preferences || undefined,
			})
			.onConflictDoUpdate({
				target: catAppUsers.userName,
				set: {
					preferences: sql`COALESCE(EXCLUDED.preferences, ${catAppUsers.preferences})`,
				},
			});

		await db.insert(userRoles).values({ userName, role: "user" }).onConflictDoNothing();

		res.json({ success: true });
	} catch (error) {
		console.error("Error creating user:", error);
		res.status(500).json({ success: false, error: "Failed to create user" });
	}
});

router.get("/api/users/:userName/role", async (req, res) => {
	try {
		const roles = await db
			.select()
			.from(userRoles)
			.where(eq(userRoles.userName, req.params.userName));
		const isAdmin = roles.some((r) => r.role === "admin");
		res.json({ isAdmin, roles: roles.map((r) => r.role) });
	} catch (error) {
		console.error("Error checking role:", error);
		res.status(500).json({ error: "Failed to check role" });
	}
});

router.post("/api/ratings/save", async (req, res) => {
	try {
		const { userName, ratings } = req.body;
		if (!userName || !ratings?.length) {
			return res.status(400).json({ success: false, error: "Missing data" });
		}

		const nameStrings = ratings.map((r: any) => r.name);
		const nameRows = await db
			.select({ id: catNameOptions.id, name: catNameOptions.name })
			.from(catNameOptions)
			.where(inArray(catNameOptions.name, nameStrings));

		const nameToId = new Map<string, string>();
		for (const n of nameRows) {
			nameToId.set(n.name, n.id);
		}

		const records = ratings
			.filter((r: any) => nameToId.has(r.name))
			.map((r: any) => ({
				userName,
				nameId: nameToId.get(r.name)!,
				rating: String(Math.min(2400, Math.max(800, Math.round(r.rating)))),
				wins: r.wins ?? 0,
				losses: r.losses ?? 0,
				updatedAt: new Date(),
			}));

		if (records.length === 0) {
			return res.json({ success: false, error: "No valid ratings to save" });
		}

		for (const record of records) {
			await db
				.insert(catNameRatings)
				.values(record)
				.onConflictDoUpdate({
					target: [catNameRatings.userName, catNameRatings.nameId],
					set: {
						rating: record.rating,
						wins: record.wins,
						losses: record.losses,
						updatedAt: record.updatedAt,
					},
				});
		}

		res.json({ success: true, savedCount: records.length });
	} catch (error) {
		console.error("Error saving ratings:", error);
		res.status(500).json({ success: false, error: "Failed to save ratings" });
	}
});

router.get("/api/analytics/top-selections", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string, 10) || 20;
		const results = await db.execute(sql`
      SELECT name_id, name, count as times_selected
      FROM get_top_selections(${limit})
    `);
		res.json(results.rows);
	} catch (error) {
		console.error("Error fetching top selections:", error);
		res.status(500).json({ error: "Failed to fetch top selections" });
	}
});

router.get("/api/analytics/popularity", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string, 10) || 20;
		const userFilter = (req.query.userFilter as string) || "all";
		const currentUserName = req.query.currentUserName as string | null;

		const result = await db.execute(sql`
      SELECT * FROM get_popularity_scores(${limit}, ${userFilter}, ${currentUserName})
    `);
		res.json(result.rows);
	} catch (error) {
		console.error("Error fetching popularity:", error);
		res.status(500).json({ error: "Failed to fetch popularity" });
	}
});

router.get("/api/analytics/ranking-history", async (req, res) => {
	try {
		const topN = parseInt(req.query.topN as string, 10) || 10;
		const periods = parseInt(req.query.periods as string, 10) || 7;
		const dateFilter = req.query.dateFilter as string | undefined;

		const dateFilterPeriods: Record<string, number> = {
			today: 2,
			week: 7,
			month: 30,
			year: 365,
			all: periods,
		};
		const periodCount = Math.max(
			dateFilter ? dateFilterPeriods[dateFilter] || periods : periods,
			2,
		);

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - (periodCount - 1));

		const selections = await db
			.select({
				nameId: catTournamentSelections.nameId,
				name: catTournamentSelections.name,
				selectedAt: catTournamentSelections.selectedAt,
				userName: catTournamentSelections.userName,
			})
			.from(catTournamentSelections)
			.where(sql`${catTournamentSelections.selectedAt} >= ${startDate.toISOString()}`)
			.orderBy(asc(catTournamentSelections.selectedAt));

		const ratings = await db
			.select({
				nameId: catNameRatings.nameId,
				rating: catNameRatings.rating,
				wins: catNameRatings.wins,
			})
			.from(catNameRatings);

		const ratingMap = new Map<string, { rating: number; wins: number }>();
		for (const r of ratings) {
			const nameId = String(r.nameId);
			const existing = ratingMap.get(nameId);
			if (!existing || (Number(r.rating) || 0) > existing.rating) {
				ratingMap.set(nameId, {
					rating: Number(r.rating) || 1500,
					wins: r.wins || 0,
				});
			}
		}

		const dateGroups = new Map<string, Map<string, { name: string; count: number }>>();
		const nameData = new Map<
			string,
			{ id: string; name: string; avgRating: number; totalSelections: number }
		>();

		for (const s of selections) {
			const nameId = String(s.nameId);
			const dateStr = new Date(s.selectedAt).toISOString();
			const date = dateStr.split("T")[0] || "unknown";

			if (!dateGroups.has(date)) {
				dateGroups.set(date, new Map());
			}
			const dayMap = dateGroups.get(date)!;
			if (!dayMap.has(nameId)) {
				dayMap.set(nameId, { name: s.name, count: 0 });
			}
			dayMap.get(nameId)!.count += 1;

			if (!nameData.has(nameId)) {
				const ratingInfo = ratingMap.get(nameId) || { rating: 1500, wins: 0 };
				nameData.set(nameId, {
					id: nameId,
					name: s.name,
					avgRating: ratingInfo.rating,
					totalSelections: 0,
				});
			}
			nameData.get(nameId)!.totalSelections += 1;
		}

		const timeLabels: string[] = [];
		const dateKeys: string[] = [];
		const today = new Date();
		for (let i = periodCount - 1; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			timeLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
			dateKeys.push(d.toISOString().split("T")[0] || "");
		}

		const sortedNames = Array.from(nameData.values())
			.sort((a, b) => b.totalSelections - a.totalSelections)
			.slice(0, topN);

		const rankingData = sortedNames.map((nameInfo) => {
			const rankings = dateKeys.map((dateKey) => {
				const dayData = dateGroups.get(dateKey);
				if (!dayData) {
					return null;
				}
				const dayEntries = Array.from(dayData.entries()).sort((a, b) => b[1].count - a[1].count);
				const rankIndex = dayEntries.findIndex(([id]) => id === nameInfo.id);
				return rankIndex >= 0 ? rankIndex + 1 : null;
			});
			return {
				id: nameInfo.id,
				name: nameInfo.name,
				rankings,
				avgRating: nameInfo.avgRating,
				totalSelections: nameInfo.totalSelections,
			};
		});

		res.json({ data: rankingData, timeLabels });
	} catch (error) {
		console.error("Error fetching ranking history:", error);
		res.status(500).json({ error: "Failed to fetch ranking history" });
	}
});

router.get("/api/analytics/leaderboard", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string, 10) || 50;
		const result = await db.execute(sql`
      SELECT * FROM get_leaderboard_stats(${limit})
    `);
		res.json(result.rows);
	} catch (error) {
		console.error("Error fetching leaderboard:", error);
		res.status(500).json({ error: "Failed to fetch leaderboard" });
	}
});

router.get("/api/analytics/site-stats", async (_req, res) => {
	try {
		const result = await db.execute(sql`SELECT * FROM get_site_stats()`);
		res.json(result.rows[0]);
	} catch (error) {
		console.error("Error fetching site stats:", error);
		res.status(500).json({ error: "Failed to fetch site stats" });
	}
});

router.get("/api/analytics/user-stats", async (req, res) => {
	try {
		const userName = req.query.userName as string;
		if (!userName) {
			return res.status(400).json({ error: "userName required" });
		}

		const result = await db
			.select({
				totalRatings: sql<number>`count(*)::int`,
				avgRating: sql<number>`ROUND(AVG(rating::numeric), 0)`,
				totalWins: sql<number>`SUM(wins)::int`,
				totalLosses: sql<number>`SUM(losses)::int`,
				hiddenCount: sql<number>`COUNT(*) FILTER (WHERE is_hidden = true)::int`,
			})
			.from(catNameRatings)
			.where(eq(catNameRatings.userName, userName));

		const stats = result[0];
		const totalWins = stats?.totalWins ?? 0;
		const totalLosses = stats?.totalLosses ?? 0;
		const winRate =
			totalWins + totalLosses > 0
				? Math.round((totalWins / (totalWins + totalLosses)) * 1000) / 10
				: 0;

		res.json({
			totalRatings: stats?.totalRatings ?? 0,
			avgRating: stats?.avgRating ?? 1500,
			totalWins,
			totalLosses,
			winRate,
			hiddenCount: stats?.hiddenCount ?? 0,
		});
	} catch (error) {
		console.error("Error fetching user stats:", error);
		res.status(500).json({ error: "Failed to fetch user stats" });
	}
});

router.get("/api/settings/cat-chosen-name", async (_req, res) => {
	try {
		const result = await db
			.select()
			.from(catChosenName)
			.orderBy(desc(catChosenName.createdAt))
			.limit(1);
		res.json(result[0] || null);
	} catch (error) {
		console.error("Error fetching chosen name:", error);
		res.status(500).json({ error: "Failed to fetch chosen name" });
	}
});

router.post("/api/settings/cat-chosen-name", async (req, res) => {
	try {
		const { first_name, middle_names, last_name, greeting_text, show_banner } = req.body;
		const [inserted] = await db
			.insert(catChosenName)
			.values({
				firstName: first_name,
				middleNames: middle_names,
				lastName: last_name,
				greetingText: greeting_text,
				showBanner: show_banner,
			})
			.returning();
		res.json({ success: true, data: inserted });
	} catch (error) {
		console.error("Error updating chosen name:", error);
		res.status(500).json({ success: false, error: "Failed to update chosen name" });
	}
});

router.get("/api/analytics/selections-raw", async (req, res) => {
	try {
		const userName = req.query.userName as string | undefined;
		let query = db
			.select({
				nameId: catTournamentSelections.nameId,
				name: catTournamentSelections.name,
				userName: catTournamentSelections.userName,
				selectedAt: catTournamentSelections.selectedAt,
			})
			.from(catTournamentSelections);

		if (userName) {
			query = query.where(eq(catTournamentSelections.userName, userName)) as any;
		}

		const data = await query;
		res.json(data);
	} catch (error) {
		console.error("Error fetching selections:", error);
		res.status(500).json({ error: "Failed to fetch selections" });
	}
});

router.get("/api/analytics/ratings-raw", async (req, res) => {
	try {
		const userName = req.query.userName as string | undefined;
		let query = db
			.select({
				nameId: catNameRatings.nameId,
				rating: catNameRatings.rating,
				wins: catNameRatings.wins,
				losses: catNameRatings.losses,
				userName: catNameRatings.userName,
			})
			.from(catNameRatings);

		if (userName) {
			query = query.where(eq(catNameRatings.userName, userName)) as any;
		}

		const data = await query;
		res.json(data);
	} catch (error) {
		console.error("Error fetching ratings:", error);
		res.status(500).json({ error: "Failed to fetch ratings" });
	}
});
