import { createClient } from "@supabase/supabase-js";

// Types
interface SelectionRow {
	name_id: string | number;
	name: string;
	user_name: string;
	selected_at: string;
}

interface RatingRow {
	name_id: string | number;
	rating: number;
	wins: number;
	losses: number;
	user_name: string;
}

interface NameRow {
	id: string | number;
	name: string;
	description: string;
	avg_rating: number;
	categories: string[] | null;
	created_at: string;
}

// Credentials (passed via env vars)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error("Missing SUPABASE_URL or SUPABASE_KEY env vars");
	process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

// Old Implementation
const getPopularityScoresOld = async (
	limit: number | null = 20,
	userFilter: string | null = "all",
	currentUserName: string | null = null,
) => {
	let selectionsQuery = client
		.from("cat_tournament_selections")
		.select("name_id, name, user_name");
	let ratingsQuery = client
		.from("cat_name_ratings")
		.select("name_id, rating, wins, losses, user_name");

	if (userFilter && userFilter !== "all") {
		const target = userFilter === "current" ? currentUserName : userFilter;
		if (target) {
			selectionsQuery = selectionsQuery.eq("user_name", target);
			ratingsQuery = ratingsQuery.eq("user_name", target);
		}
	}

	const [selectionsResult, ratingsResult, namesResult] = await Promise.all([
		selectionsQuery as unknown as Promise<{ data: SelectionRow[] | null; error: unknown }>,
		ratingsQuery as unknown as Promise<{ data: RatingRow[] | null; error: unknown }>,
		client
			.from("cat_name_options")
			.select("id, name, description, avg_rating, categories, created_at")
			.eq("is_active", true)
			.eq("is_hidden", false) as unknown as Promise<{ data: NameRow[] | null; error: unknown }>,
	]);

	const selections = selectionsResult.data ?? [];
	const ratings = ratingsResult.data ?? [];
	const names = namesResult.data ?? [];

    console.log(`Debug: Selections count: ${selections.length}, Ratings count: ${ratings.length}, Names count: ${names.length}`);

	// Aggregate selections
	const selStats = new Map<string, { count: number; users: Set<string> }>();
	for (const s of selections) {
		const id = String(s.name_id);
		const existing = selStats.get(id);
		if (existing) {
			existing.count += 1;
			existing.users.add(s.user_name);
		} else {
			selStats.set(id, { count: 1, users: new Set([s.user_name]) });
		}
	}

	// Aggregate ratings
	const ratStats = new Map<
		string,
		{ totalRating: number; count: number; wins: number; losses: number }
	>();
	for (const r of ratings) {
		const id = String(r.name_id);
		const existing = ratStats.get(id);
		if (existing) {
			existing.totalRating += Number(r.rating) || 1500;
			existing.count += 1;
			existing.wins += r.wins || 0;
			existing.losses += r.losses || 0;
		} else {
			ratStats.set(id, {
				totalRating: Number(r.rating) || 1500,
				count: 1,
				wins: r.wins || 0,
				losses: r.losses || 0,
			});
		}
	}

    // Debug keys
    if (selStats.size > 0) {
        console.log("Debug: Sample selStat key:", selStats.keys().next().value);
    }
    if (names.length > 0) {
        console.log("Debug: Sample name id:", names[0].id, "Stringified:", String(names[0].id));
    }

	const analytics = names.map((name) => {
		const id = String(name.id);
		const sel = selStats.get(id) ?? { count: 0 };
		const rat = ratStats.get(id) ?? { totalRating: 0, count: 0, wins: 0, losses: 0 };

		const avgRating = rat.count > 0 ? Math.round(rat.totalRating / rat.count) : 1500;
		const popularityScore = Math.round(
			sel.count * 2 + rat.wins * 1.5 + (avgRating - 1500) * 0.5,
		);

		return {
			name_id: name.id,
			name: name.name,
			description: name.description,
			category: name.categories?.[0] ?? null,
			times_selected: sel.count,
			avg_rating: avgRating,
			popularity_score: popularityScore,
			created_at: name.created_at || null,
		};
	});

	const sorted = analytics.sort((a, b) => b.popularity_score - a.popularity_score);
	return limit ? sorted.slice(0, limit) : sorted;
};

// New Implementation (RPC wrapper)
const getPopularityScoresNew = async (
	limit: number | null = 20,
	userFilter: string | null = "all",
	currentUserName: string | null = null,
) => {
	const { data, error } = await client.rpc("get_popularity_scores", {
		p_limit: limit,
		p_user_filter: userFilter,
		p_current_user_name: currentUserName,
	});

	if (error) {
		console.error("RPC Error:", error);
		throw error;
	}

	return data;
};

async function main() {
	console.log("Starting benchmark...");

    const LIMIT = 50;
    const USER_FILTER = "all";

	const startOld = performance.now();
	const resOld = await getPopularityScoresOld(LIMIT, USER_FILTER);
	const endOld = performance.now();
    const durationOld = endOld - startOld;
	console.log(`Old Implementation: ${durationOld.toFixed(2)}ms`);
    console.log(`Rows returned (Old): ${resOld.length}`);

	try {
		const startNew = performance.now();
		const resNew = await getPopularityScoresNew(LIMIT, USER_FILTER);
		const endNew = performance.now();
        const durationNew = endNew - startNew;
		console.log(`New Implementation: ${durationNew.toFixed(2)}ms`);
        console.log(`Rows returned (New): ${resNew?.length}`);

        if (resOld.length > 0 && resNew && resNew.length > 0) {
            console.log("Checking data consistency...");
            const oldFirst = resOld[0];
            const newFirst = resNew[0];

            let mismatch = false;
            if (oldFirst.name !== newFirst.name) {
                console.log("Name mismatch:", oldFirst.name, newFirst.name);
                mismatch = true;
            }
             if (oldFirst.popularity_score !== newFirst.popularity_score) {
                console.log("Score mismatch:", oldFirst.popularity_score, newFirst.popularity_score);
                mismatch = true;
            }
             if (oldFirst.times_selected !== newFirst.times_selected) {
                console.log("Selections mismatch:", oldFirst.times_selected, newFirst.times_selected);
                mismatch = true;
            }
            if (!mismatch) {
                console.log("Top result matches!");
            }

             console.log(`Speedup: ${(durationOld / durationNew).toFixed(2)}x`);
        }


	} catch (e: any) {
		console.log("New Implementation failed:", e.message);
	}
}

main().catch(console.error);
