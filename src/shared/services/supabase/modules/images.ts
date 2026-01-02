import { isDev, isSupabaseAvailable, resolveSupabaseClient } from "../client";

interface FileObject {
	name: string;
	metadata?: { size?: number };
	size?: number;
}

export const imagesAPI = {
	/**
	 * List images from the `cat-images` bucket.
	 */
	async list(prefix: string = "", limit: number = 1000) {
		try {
			if (!(await isSupabaseAvailable())) return [];

			const client = await resolveSupabaseClient();
			if (!client) return [];

			const { data, error } = await client.storage
				.from("cat-images")
				.list(prefix, {
					limit,
					sortBy: { column: "updated_at", order: "desc" },
				});

			if (error) {
				if (isDev) console.warn("imagesAPI.list error:", error);
				return [];
			}

			const files = (data || []).filter((f) => f?.name);
			if (!files.length) return [];

			const rankByExt = (name: string) => {
				const n = name.toLowerCase();
				if (n.endsWith(".avif")) return 1;
				if (n.endsWith(".webp")) return 2;
				if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return 3;
				if (n.endsWith(".png")) return 4;
				if (n.endsWith(".gif")) return 5;
				return 9;
			};

			const pickSmaller = (a: FileObject, b: FileObject) => {
				const sizeA = a?.metadata?.size ?? a?.size;
				const sizeB = b?.metadata?.size ?? b?.size;
				if (typeof sizeA === "number" && typeof sizeB === "number")
					return sizeA <= sizeB ? a : b;
				return rankByExt(a.name) <= rankByExt(b.name) ? a : b;
			};

			const byBase = new Map<string, FileObject>();
			for (const f of files) {
				const base = f.name.replace(/\.[^.]+$/, "").toLowerCase();
				const current = byBase.get(base);
				byBase.set(base, current ? pickSmaller(current, f) : f);
			}

			return Array.from(byBase.values())
				.map((f) => {
					const fullPath = prefix ? `${prefix}/${f.name}` : f.name;
					return client.storage.from("cat-images").getPublicUrl(fullPath).data
						?.publicUrl;
				})
				.filter(Boolean);
		} catch (e) {
			if (isDev) console.error("imagesAPI.list fatal:", e);
			return [];
		}
	},

	/**
	 * Upload an image file.
	 */
	async upload(file: File, _userName: string = "anon", prefix: string = "") {
		const client = await resolveSupabaseClient();
		if (!client) throw new Error("Supabase not configured");

		const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
		const objectPath = `${prefix ? `${prefix}/` : ""}${Date.now()}-${safe}`;
		const { error } = await client.storage
			.from("cat-images")
			.upload(objectPath, file, { upsert: false });
		if (error) throw error;
		return client.storage.from("cat-images").getPublicUrl(objectPath).data
			?.publicUrl;
	},
};
