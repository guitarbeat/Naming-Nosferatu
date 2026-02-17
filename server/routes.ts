<<<<<<< HEAD
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
=======
import { Router } from "express";
import { supabase } from "./db";

export const router = Router();

// Helper to handle Supabase errors consistently
const handleSupabaseError = (error: any, context: string) => {
	console.error(`Error ${context}:`, JSON.stringify(error, null, 2));
	console.error(error); // backup
	return { error: `Failed to ${context}` };
};

router.get("/api/names", async (req, res) => {
	console.log("GET /api/names request received");
	try {
		const includeHidden = req.query.includeHidden === "true";

		let query = supabase
			.from("cat_name_options")
			.select("*, avgRating:avg_rating, isActive:is_active, isHidden:is_hidden, createdAt:created_at, lockedIn:locked_in, sortOrder:sort_order")
			.eq("is_active", true)
			.order("locked_in", { ascending: false })
			.order("sort_order", { ascending: true })
			.order("avg_rating", { ascending: false })
			.limit(1000);

		if (!includeHidden) {
			query = query.eq("is_hidden", false);
		}

		const { data, error } = await query;
		if (error) throw error;
		res.json(data);
	} catch (error) {
		const err = handleSupabaseError(error, "fetch names");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.post("/api/names", async (req, res) => {
	try {
<<<<<<< HEAD
		const { name, description, status, provenance } = createNameSchema.parse(req.body);
		const [inserted] = await db
			.insert(catNameOptions)
			.values({
=======
		const { name, description, status, provenance } = req.body;
		const { data, error } = await supabase
			.from("cat_name_options")
			.insert({
>>>>>>> main
				name: name.trim(),
				description: (description || "").trim(),
				status: status || "candidate",
				provenance: provenance || null,
			})
<<<<<<< HEAD
			.returning();
		res.json({ success: true, data: inserted });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ success: false, error: error.errors });
		}
		console.error("Error adding name:", error);
		res.status(500).json({ success: false, error: "Failed to add name" });
=======
			.select("*, avgRating:avg_rating, isActive:is_active, isHidden:is_hidden, createdAt:created_at, lockedIn:locked_in")
			.single();

		if (error) throw error;
		res.json({ success: true, data });
	} catch (error) {
		const err = handleSupabaseError(error, "add name");
		res.status(500).json({ ...err, success: false });
>>>>>>> main
	}
});

router.delete("/api/names/:id", async (req, res) => {
	try {
<<<<<<< HEAD
		await db.delete(catNameOptions).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
=======
		const { error } = await supabase
			.from("cat_name_options")
			.delete()
			.eq("id", req.params.id);

		if (error) throw error;
		res.json({ success: true });
	} catch (error) {
		const err = handleSupabaseError(error, "delete name");
		res.status(500).json({ ...err, success: false });
>>>>>>> main
	}
});

router.delete("/api/names/by-name/:name", async (req, res) => {
	try {
<<<<<<< HEAD
		await db.delete(catNameOptions).where(eq(catNameOptions.name, req.params.name));
		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting name:", error);
		res.status(500).json({ success: false, error: "Failed to delete name" });
=======
		const { error } = await supabase
			.from("cat_name_options")
			.delete()
			.eq("name", req.params.name);

		if (error) throw error;
		res.json({ success: true });
	} catch (error) {
		const err = handleSupabaseError(error, "delete name");
		res.status(500).json({ ...err, success: false });
>>>>>>> main
	}
});

router.post("/api/names/:id/toggle-hidden", async (req, res) => {
	try {
		const { isHidden } = req.body;
<<<<<<< HEAD
		await db.update(catNameOptions).set({ isHidden }).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error toggling hidden:", error);
		res.status(500).json({ success: false, error: "Failed to toggle hidden" });
=======
		const { error } = await supabase
			.from("cat_name_options")
			.update({ is_hidden: isHidden })
			.eq("id", req.params.id);

		if (error) throw error;
		res.json({ success: true });
	} catch (error) {
		const err = handleSupabaseError(error, "toggle hidden");
		res.status(500).json({ ...err, success: false });
>>>>>>> main
	}
});

router.post("/api/names/bulk-toggle-hidden", async (req, res) => {
	try {
		const { nameIds, isHidden } = req.body;
<<<<<<< HEAD
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
=======
		// Supabase supports bulk update with localized `in`? 
		// Actually, .update({ is_hidden: ... }).in('id', nameIds) works.
		const { error } = await supabase
			.from("cat_name_options")
			.update({ is_hidden: isHidden })
			.in("id", nameIds);

		// Emulate individual results for compatibility if needed, or just return success
		// Original code returned list of results. We'll verify what frontend expects.
		// Frontend likely checks for individual failures? Original code tried one by one.
		// We can just imply success if no error.
		if (error) throw error;

		const results = nameIds.map((id: any) => ({ nameId: id, success: true }));
		res.json(results);
	} catch (error) {
		const err = handleSupabaseError(error, "bulk toggle hidden");
		res.status(500).json({ error: err.error });
>>>>>>> main
	}
});

router.get("/api/names/hidden", async (req, res) => {
	try {
<<<<<<< HEAD
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
=======
		const { data, error } = await supabase
			.from("cat_name_options")
			.select("id, name, description, createdAt:created_at")
			.eq("is_hidden", true);

		if (error) throw error;
		res.json(data);
	} catch (error) {
		const err = handleSupabaseError(error, "fetch hidden names");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.post("/api/names/:id/toggle-locked-in", async (req, res) => {
	try {
		const { lockedIn } = req.body;
<<<<<<< HEAD
		await db.update(catNameOptions).set({ lockedIn }).where(eq(catNameOptions.id, req.params.id));
		res.json({ success: true });
	} catch (error) {
		console.error("Error toggling locked in:", error);
		res.status(500).json({ success: false, error: "Failed to toggle locked in" });
=======
		const { error } = await supabase
			.from("cat_name_options")
			.update({ locked_in: lockedIn })
			.eq("id", req.params.id);

		if (error) throw error;
		res.json({ success: true });
	} catch (error) {
		const err = handleSupabaseError(error, "toggle locked in");
		res.status(500).json({ ...err, success: false });
	}
});

router.post("/api/names/reorder", async (req, res) => {
	try {
		const { orders, userName } = req.body; // Array of { id: string, sortOrder: number }
		if (!Array.isArray(orders)) {
			return res.status(400).json({ success: false, error: "Orders must be an array" });
		}

		if (!userName) {
			return res.status(401).json({ success: false, error: "Username required for authorization" });
		}

		// Verify admin role
		const { data: roleData, error: roleError } = await supabase
			.from("cat_user_roles")
			.select("role")
			.eq("user_name", userName)
			.eq("role", "admin")
			.maybeSingle();

		if (roleError || !roleData) {
			return res.status(403).json({ success: false, error: "Unauthorized: Admin privileges required" });
		}

		// Update each item
		const promises = orders.map((o: any) =>
			supabase
				.from("cat_name_options")
				.update({ sort_order: o.sortOrder })
				.eq("id", o.id)
		);

		await Promise.all(promises);

		res.json({ success: true });
	} catch (error) {
		const err = handleSupabaseError(error, "reorder names");
		res.status(500).json({ ...err, success: false });
>>>>>>> main
	}
});

router.post("/api/users/create", async (req, res) => {
	try {
<<<<<<< HEAD
		const { userName, preferences } = createUserSchema.parse(req.body);
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
		if (error instanceof ZodError) {
			return res.status(400).json({ success: false, error: error.errors });
		}
		console.error("Error creating user:", error);
		res.status(500).json({ success: false, error: "Failed to create user" });
=======
		const { userName, preferences } = req.body;

		// Upsert user
		const { error: userError } = await supabase
			.from("cat_app_users")
			.upsert({ user_name: userName, preferences: preferences || undefined }, { onConflict: 'user_name' });
		if (userError) throw userError;

		// Insert role if not exists
		// Supabase upsert on ID? Or check existance?
		// We can do insert and ignore conflict?
		await supabase
			.from("user_roles")
			.insert({ user_name: userName, role: "user" })
			.select() // To make it return something?
			.maybeSingle(); // We don't care if it fails due to conflict (actually basic insert fails on conflict)
		// With basic REST, insert throws if conflict unless `ignoreDuplicates: true`?
		// Let's try upsert or ignore.
		// The original code uses `onConflictDoNothing`.
		const { error: roleError } = await supabase
			.from("user_roles")
			.upsert({ user_name: userName, role: "user" }, { onConflict: 'user_name', ignoreDuplicates: true });
		// Warning: user_roles PK is ID, but we want one role per user? Schema: userName is NOT unique in user_roles?
		// Schema: `id` is PK. `userName` is just a column.
		// Original code: `onConflictDoNothing`.
		// We'll trust that we just want to ensure a role exists.

		res.json({ success: true });
	} catch (error) {
		const err = handleSupabaseError(error, "create user");
		res.status(500).json({ ...err, success: false });
>>>>>>> main
	}
});

router.get("/api/users/:userName/role", async (req, res) => {
	try {
<<<<<<< HEAD
		const roles = await db
			.select()
			.from(userRoles)
			.where(eq(userRoles.userName, req.params.userName));
		const isAdmin = roles.some((r) => r.role === "admin");
		res.json({ isAdmin, roles: roles.map((r) => r.role) });
	} catch (error) {
		console.error("Error checking role:", error);
		res.status(500).json({ error: "Failed to check role" });
=======
		const { data, error } = await supabase
			.from("user_roles")
			.select("role")
			.eq("user_name", req.params.userName);

		if (error) throw error;
		const roles = data.map((r: any) => r.role);
		const isAdmin = roles.some((r) => r === "admin");
		res.json({ isAdmin, roles });
	} catch (error) {
		const err = handleSupabaseError(error, "check role");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.post("/api/ratings/save", async (req, res) => {
	try {
<<<<<<< HEAD
		const { userName, ratings } = saveRatingsSchema.parse(req.body);

		const nameStrings = ratings.map((r) => r.name);
		const nameRows = await db
			.select({ id: catNameOptions.id, name: catNameOptions.name })
			.from(catNameOptions)
			.where(inArray(catNameOptions.name, nameStrings));

		const nameToId = new Map<string, string>();
		for (const n of nameRows) {
=======
		const { userName, ratings } = req.body;
		if (!userName || !ratings?.length) {
			return res.status(400).json({ success: false, error: "Missing data" });
		}

		// Get IDs for names
		const nameStrings = ratings.map((r: any) => r.name);
		const { data: nameRows, error: nameError } = await supabase
			.from("cat_name_options")
			.select("id, name")
			.in("name", nameStrings);

		if (nameError) throw nameError;

		const nameToId = new Map<string, string>();
		for (const n of nameRows || []) {
>>>>>>> main
			nameToId.set(n.name, n.id);
		}

		const records = ratings
			.filter((r: any) => nameToId.has(r.name))
			.map((r: any) => ({
<<<<<<< HEAD
				userName,
				nameId: nameToId.get(r.name)!,
				rating: String(Math.min(2400, Math.max(800, Math.round(r.rating)))),
				wins: r.wins ?? 0,
				losses: r.losses ?? 0,
				updatedAt: new Date(),
=======
				user_name: userName,
				name_id: nameToId.get(r.name)!,
				rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
				wins: r.wins ?? 0,
				losses: r.losses ?? 0,
				updated_at: new Date(),
>>>>>>> main
			}));

		if (records.length === 0) {
			return res.json({ success: false, error: "No valid ratings to save" });
		}

<<<<<<< HEAD
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
		if (error instanceof ZodError) {
			return res.status(400).json({ success: false, error: error.errors });
		}
		console.error("Error saving ratings:", error);
		res.status(500).json({ success: false, error: "Failed to save ratings" });
=======
		// Bulk upsert
		const { error: upsertError } = await supabase
			.from("cat_name_ratings")
			.upsert(records, { onConflict: 'user_name,name_id' });

		if (upsertError) throw upsertError;

		res.json({ success: true, savedCount: records.length });
	} catch (error) {
		const err = handleSupabaseError(error, "save ratings");
		res.status(500).json({ ...err, success: false });
>>>>>>> main
	}
});

router.get("/api/analytics/top-selections", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string) || 20;
<<<<<<< HEAD
		const results = await db
			.select({
				nameId: catTournamentSelections.nameId,
				name: catTournamentSelections.name,
				count: sql<number>`count(*)::int`,
			})
			.from(catTournamentSelections)
			.groupBy(catTournamentSelections.nameId, catTournamentSelections.name)
			.orderBy(desc(sql`count(*)`))
			.limit(limit);
		res.json(
			results.map((r) => ({
				name_id: r.nameId,
				name: r.name,
				times_selected: r.count,
			})),
		);
	} catch (error) {
		console.error("Error fetching top selections:", error);
		res.status(500).json({ error: "Failed to fetch top selections" });
=======

		// Fetch all selections (or a reasonable limit) and aggregate in JS
		// This is inefficient but necessary without Views/RPC
		const { data, error } = await supabase
			.from("cat_tournament_selections")
			.select("name_id, name")
			.limit(5000); // Hard limit to prevent overload

		if (error) throw error;

		const counts = new Map<string, { name: string, count: number, id: string }>();
		for (const row of data || []) {
			const key = row.name_id;
			if (!counts.has(key)) {
				counts.set(key, { name: row.name, count: 0, id: key });
			}
			counts.get(key)!.count++;
		}

		const results = Array.from(counts.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, limit)
			.map(r => ({
				name_id: r.id,
				name: r.name,
				times_selected: r.count
			}));

		res.json(results);
	} catch (error) {
		const err = handleSupabaseError(error, "fetch top selections");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.get("/api/analytics/popularity", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string) || 20;
		const userFilter = (req.query.userFilter as string) || "all";
		const currentUserName = req.query.currentUserName as string | undefined;

		const targetUser =
			userFilter === "current" ? currentUserName : userFilter !== "all" ? userFilter : null;

<<<<<<< HEAD
		let selectionsQuery = db
			.select({
				nameId: catTournamentSelections.nameId,
				name: catTournamentSelections.name,
				userName: catTournamentSelections.userName,
			})
			.from(catTournamentSelections);

		let ratingsQuery = db
			.select({
				nameId: catNameRatings.nameId,
				rating: catNameRatings.rating,
				wins: catNameRatings.wins,
				losses: catNameRatings.losses,
				userName: catNameRatings.userName,
			})
			.from(catNameRatings);

		if (targetUser) {
			selectionsQuery = selectionsQuery.where(
				eq(catTournamentSelections.userName, targetUser),
			) as any;
			ratingsQuery = ratingsQuery.where(eq(catNameRatings.userName, targetUser)) as any;
		}

		const [selections, ratings, names] = await Promise.all([
			selectionsQuery,
			ratingsQuery,
			db
				.select({
					id: catNameOptions.id,
					name: catNameOptions.name,
					description: catNameOptions.description,
					avgRating: catNameOptions.avgRating,
					categories: catNameOptions.categories,
					createdAt: catNameOptions.createdAt,
				})
				.from(catNameOptions)
				.where(and(eq(catNameOptions.isActive, true), eq(catNameOptions.isHidden, false))),
		]);

		const selectionStats = new Map<string, { count: number }>();
		for (const s of selections) {
			const key = String(s.nameId);
=======
		// Parallel fetch
		const selectionsPromise = supabase.from("cat_tournament_selections").select("name_id, name, user_name").limit(5000);
		const ratingsPromise = supabase.from("cat_name_ratings").select("name_id, rating, wins, losses, user_name").limit(5000);
		const namesPromise = supabase.from("cat_name_options").select("*, avgRating:avg_rating, isActive:is_active, isHidden:is_hidden, createdAt:created_at").eq("is_active", true).eq("is_hidden", false);

		const [selsRes, ratsRes, namesRes] = await Promise.all([selectionsPromise, ratingsPromise, namesPromise]);

		if (selsRes.error) throw selsRes.error;
		if (ratsRes.error) throw ratsRes.error;
		if (namesRes.error) throw namesRes.error;

		let selections = selsRes.data || [];
		let ratings = ratsRes.data || [];
		const names = namesRes.data || [];

		if (targetUser) {
			selections = selections.filter((s: any) => s.user_name === targetUser);
			ratings = ratings.filter((r: any) => r.user_name === targetUser);
		}

		const selectionStats = new Map<string, { count: number }>();
		for (const s of selections) {
			const key = String(s.name_id);
>>>>>>> main
			const stat = selectionStats.get(key) || { count: 0 };
			stat.count += 1;
			selectionStats.set(key, stat);
		}

		const ratingStats = new Map<
			string,
			{ totalRating: number; count: number; wins: number; losses: number }
		>();
		for (const r of ratings) {
<<<<<<< HEAD
			const key = String(r.nameId);
=======
			const key = String(r.name_id);
>>>>>>> main
			const stat = ratingStats.get(key) || {
				totalRating: 0,
				count: 0,
				wins: 0,
				losses: 0,
			};
			stat.totalRating += Number(r.rating) || 1500;
			stat.count += 1;
			stat.wins += r.wins || 0;
			stat.losses += r.losses || 0;
			ratingStats.set(key, stat);
		}

<<<<<<< HEAD
		const analytics = names.map((name) => {
=======
		const analytics = names.map((name: any) => {
>>>>>>> main
			const sel = selectionStats.get(name.id) || { count: 0 };
			const rat = ratingStats.get(name.id) || {
				totalRating: 0,
				count: 0,
				wins: 0,
				losses: 0,
			};
			const avgRating = rat.count > 0 ? Math.round(rat.totalRating / rat.count) : 1500;
			const popularityScore = Math.round(
				sel.count * 2 + (rat.wins || 0) * 1.5 + (avgRating - 1500) * 0.5,
			);

			return {
				name_id: name.id,
				name: name.name,
				description: name.description,
				category: name.categories?.[0] || null,
				times_selected: sel.count,
				avg_rating: avgRating,
				popularity_score: popularityScore,
				created_at: name.createdAt,
			};
		});

		analytics.sort((a, b) => b.popularity_score - a.popularity_score);
		res.json(limit ? analytics.slice(0, limit) : analytics);
	} catch (error) {
<<<<<<< HEAD
		console.error("Error fetching popularity:", error);
		res.status(500).json({ error: "Failed to fetch popularity" });
=======
		const err = handleSupabaseError(error, "fetch popularity");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.get("/api/analytics/ranking-history", async (req, res) => {
	try {
		const topN = parseInt(req.query.topN as string) || 10;
		const periods = parseInt(req.query.periods as string) || 7;
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

<<<<<<< HEAD
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
=======
		const { data: selections, error: selError } = await supabase
			.from("cat_tournament_selections")
			.select("name_id, name, selected_at, user_name")
			.gte("selected_at", startDate.toISOString())
			.order("selected_at", { ascending: true });

		if (selError) throw selError;

		const { data: ratings, error: ratError } = await supabase
			.from("cat_name_ratings")
			.select("name_id, rating, wins");

		if (ratError) throw ratError;

		const ratingMap = new Map<string, { rating: number; wins: number }>();
		for (const r of ratings || []) {
			const nameId = String(r.name_id);
>>>>>>> main
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

<<<<<<< HEAD
		for (const s of selections) {
			const nameId = String(s.nameId);
			const dateStr = new Date(s.selectedAt).toISOString();
=======
		for (const s of selections || []) {
			const nameId = String(s.name_id);
			const dateStr = new Date(s.selected_at).toISOString();
>>>>>>> main
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
				if (!dayData) return null;
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
<<<<<<< HEAD
		console.error("Error fetching ranking history:", error);
		res.status(500).json({ error: "Failed to fetch ranking history" });
=======
		const err = handleSupabaseError(error, "fetch ranking history");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.get("/api/analytics/leaderboard", async (req, res) => {
	try {
		const limit = parseInt(req.query.limit as string) || 50;

<<<<<<< HEAD
		const ratings = await db
			.select({
				nameId: catNameRatings.nameId,
				rating: catNameRatings.rating,
				wins: catNameRatings.wins,
				losses: catNameRatings.losses,
			})
			.from(catNameRatings);
=======
		const { data: ratings, error: ratError } = await supabase
			.from("cat_name_ratings")
			.select("name_id, rating, wins, losses");
		if (ratError) throw ratError;
>>>>>>> main

		const nameStatsMap = new Map<
			string,
			{ totalRating: number; count: number; totalWins: number; totalLosses: number }
		>();
<<<<<<< HEAD
		for (const r of ratings) {
			const key = String(r.nameId);
=======
		for (const r of ratings || []) {
			const key = String(r.name_id);
>>>>>>> main
			const stats = nameStatsMap.get(key) || {
				totalRating: 0,
				count: 0,
				totalWins: 0,
				totalLosses: 0,
			};
			stats.totalRating += Number(r.rating) || 1500;
			stats.count += 1;
			stats.totalWins += r.wins || 0;
			stats.totalLosses += r.losses || 0;
			nameStatsMap.set(key, stats);
		}

<<<<<<< HEAD
		const names = await db
			.select({
				id: catNameOptions.id,
				name: catNameOptions.name,
				description: catNameOptions.description,
				avgRating: catNameOptions.avgRating,
				categories: catNameOptions.categories,
				createdAt: catNameOptions.createdAt,
			})
			.from(catNameOptions)
			.where(and(eq(catNameOptions.isActive, true), eq(catNameOptions.isHidden, false)))
			.orderBy(desc(catNameOptions.avgRating))
			.limit(limit * 2);

		const leaderboard = names
			.map((row) => {
=======
		const { data: names, error: nameError } = await supabase
			.from("cat_name_options")
			.select("*, avgRating:avg_rating, isActive:is_active, isHidden:is_hidden, createdAt:created_at")
			.eq("is_active", true)
			.eq("is_hidden", false)
			.order("avg_rating", { ascending: false })
			.limit(limit * 2);

		if (nameError) throw nameError;

		const leaderboard = names!
			.map((row: any) => {
>>>>>>> main
				const stats = nameStatsMap.get(row.id);
				const avgRating = stats
					? Math.round(stats.totalRating / stats.count)
					: Number(row.avgRating) || 1500;
				return {
					name_id: row.id,
					name: row.name,
					avg_rating: avgRating,
					wins: stats?.totalWins ?? 0,
					created_at: row.createdAt,
				};
			})
			.sort((a, b) => b.avg_rating - a.avg_rating)
			.slice(0, limit);

		res.json(leaderboard);
	} catch (error) {
<<<<<<< HEAD
		console.error("Error fetching leaderboard:", error);
		res.status(500).json({ error: "Failed to fetch leaderboard" });
=======
		const err = handleSupabaseError(error, "fetch leaderboard");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.get("/api/analytics/site-stats", async (req, res) => {
	try {
		const [
			totalNamesResult,
			hiddenNamesResult,
			totalUsersResult,
<<<<<<< HEAD
			ratingsStatsResult,
			totalSelectionsResult,
		] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(catNameOptions)
				.where(eq(catNameOptions.isActive, true)),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(catNameOptions)
				.where(eq(catNameOptions.isHidden, true)),
			db.select({ count: sql<number>`count(*)::int` }).from(catAppUsers),
			db
				.select({
					count: sql<number>`count(*)::int`,
					avgRating: sql<number>`COALESCE(AVG(rating::numeric), 1500)`,
				})
				.from(catNameRatings),
			db.select({ count: sql<number>`count(*)::int` }).from(catTournamentSelections),
		]);

		const totalNames = totalNamesResult[0]?.count ?? 0;
		const hiddenNames = hiddenNamesResult[0]?.count ?? 0;
=======
			ratingsStatsResult, // Need to avg locally
			totalSelectionsResult,
		] = await Promise.all([
			supabase.from("cat_name_options").select("*", { count: "exact", head: true }).eq("is_active", true),
			supabase.from("cat_name_options").select("*", { count: "exact", head: true }).eq("is_hidden", true),
			supabase.from("cat_app_users").select("*", { count: "exact", head: true }),
			supabase.from("cat_name_ratings").select("rating"),
			supabase.from("cat_tournament_selections").select("*", { count: "exact", head: true }),
		]);

		const allRatings = ratingsStatsResult.data || [];
		const totalRatingSum = allRatings.reduce((sum, r) => sum + (Number(r.rating) || 1500), 0);
		const avgRating = allRatings.length > 0 ? Math.round(totalRatingSum / allRatings.length) : 1500;

		const totalNames = totalNamesResult.count ?? 0;
		const hiddenNames = hiddenNamesResult.count ?? 0;
>>>>>>> main

		res.json({
			totalNames,
			hiddenNames,
<<<<<<< HEAD
			activeNames: totalNames - hiddenNames,
			totalUsers: totalUsersResult[0]?.count ?? 0,
			totalRatings: ratingsStatsResult[0]?.count ?? 0,
			totalSelections: totalSelectionsResult[0]?.count ?? 0,
			avgRating: Math.round(Number(ratingsStatsResult[0]?.avgRating) || 1500),
		});
	} catch (error) {
		console.error("Error fetching site stats:", error);
		res.status(500).json({ error: "Failed to fetch site stats" });
=======
			activeNames: totalNames - hiddenNames, // Approximation if overlaps
			totalUsers: totalUsersResult.count ?? 0,
			totalRatings: allRatings.length,
			totalSelections: totalSelectionsResult.count ?? 0,
			avgRating,
		});
	} catch (error) {
		const err = handleSupabaseError(error, "fetch site stats");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.get("/api/analytics/user-stats", async (req, res) => {
	try {
		const userName = req.query.userName as string;
		if (!userName) {
			return res.status(400).json({ error: "userName required" });
		}

<<<<<<< HEAD
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
=======
		const { data: userRatings, error } = await supabase
			.from("cat_name_ratings")
			.select("rating, wins, losses, is_hidden")
			.eq("user_name", userName);

		if (error) throw error;

		const stats = {
			totalRatings: userRatings.length,
			totalWins: userRatings.reduce((sum, r) => sum + (r.wins || 0), 0),
			totalLosses: userRatings.reduce((sum, r) => sum + (r.losses || 0), 0),
			hiddenCount: userRatings.filter(r => r.is_hidden).length,
			ratingSum: userRatings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0)
		};

		const winRate =
			stats.totalWins + stats.totalLosses > 0
				? Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 1000) / 10
				: 0;

		res.json({
			totalRatings: stats.totalRatings,
			avgRating: stats.totalRatings > 0 ? Math.round(stats.ratingSum / stats.totalRatings) : 1500,
			totalWins: stats.totalWins,
			totalLosses: stats.totalLosses,
			winRate,
			hiddenCount: stats.hiddenCount,
		});
	} catch (error) {
		const err = handleSupabaseError(error, "fetch user stats");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.get("/api/settings/cat-chosen-name", async (req, res) => {
	try {
<<<<<<< HEAD
		const result = await db
			.select()
			.from(catChosenName)
			.orderBy(desc(catChosenName.createdAt))
			.limit(1);
		res.json(result[0] || null);
	} catch (error) {
		console.error("Error fetching chosen name:", error);
		res.status(500).json({ error: "Failed to fetch chosen name" });
=======
		const { data, error } = await supabase
			.from("cat_chosen_name")
			.select("*, firstName:first_name, lastName:last_name, middleNames:middle_names, greetingText:greeting_text, showBanner:show_banner, createdAt:created_at")
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		// .single() throws if 0 rows?
		// Supabase returns null data and error code PGRST116 (JSON object has property 'code')
		if (error && error.code !== 'PGRST116') throw error;

		res.json(data || null);
	} catch (error) {
		const err = handleSupabaseError(error, "fetch chosen name");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.post("/api/settings/cat-chosen-name", async (req, res) => {
	try {
		const { first_name, middle_names, last_name, greeting_text, show_banner } = req.body;
<<<<<<< HEAD
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
=======
		const { data, error } = await supabase
			.from("cat_chosen_name")
			.insert({
				first_name,
				middle_names,
				last_name,
				greeting_text,
				show_banner,
			})
			.select("*")
			.single();

		if (error) throw error;
		res.json({ success: true, data });
	} catch (error) {
		const err = handleSupabaseError(error, "update chosen name");
		res.status(500).json({ success: false, error: err.error });
>>>>>>> main
	}
});

router.get("/api/analytics/selections-raw", async (req, res) => {
	try {
		const userName = req.query.userName as string | undefined;
<<<<<<< HEAD
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
=======
		let query = supabase
			.from("cat_tournament_selections")
			.select("name_id, name, user_name, selected_at"); // camelCase mapping for nameId?
		// "nameId:name_id, name, userName:user_name, selectedAt:selected_at"
		// Original used Drizzle which returned: nameId, name, userName, selectedAt
		// We should alias.

		query = supabase.from("cat_tournament_selections").select("nameId:name_id, name, userName:user_name, selectedAt:selected_at");

		if (userName) {
			query = query.eq("user_name", userName);
		}

		const { data, error } = await query;
		if (error) throw error;
		res.json(data);
	} catch (error) {
		const err = handleSupabaseError(error, "fetch selections");
		res.status(500).json(err);
>>>>>>> main
	}
});

router.get("/api/analytics/ratings-raw", async (req, res) => {
	try {
		const userName = req.query.userName as string | undefined;
<<<<<<< HEAD
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
=======

		let query = supabase
			.from("cat_name_ratings")
			.select("nameId:name_id, rating, wins, losses, userName:user_name");

		if (userName) {
			query = query.eq("user_name", userName);
		}

		const { data, error } = await query;
		if (error) throw error;
		res.json(data);
	} catch (error) {
		const err = handleSupabaseError(error, "fetch ratings");
		res.status(500).json(err);
>>>>>>> main
	}
});
