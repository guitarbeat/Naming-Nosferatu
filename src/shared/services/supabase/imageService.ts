import { withSupabase } from "./runtime";

export const imagesAPI = {
	list: async (_path = ""): Promise<string[]> => {
		return withSupabase(async (client) => {
			const { data, error } = await client.storage.from("cat-images").list();
			if (error) {
				console.error("Failed to list images:", error);
				return [];
			}
			return (data ?? []).map((item) => item.name);
		}, []);
	},

	upload: async (
		file: File | Blob,
		userName: string,
	): Promise<{ path: string | null; error: string | null; success: boolean }> => {
		const maxSize = 5 * 1024 * 1024;
		const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

		if (file.size > maxSize) {
			return { path: null, error: "File size exceeds 5MB limit", success: false };
		}
		if (!allowedTypes.includes(file.type)) {
			return {
				path: null,
				error: "Only JPEG, PNG, GIF, and WebP images are allowed",
				success: false,
			};
		}

		return withSupabase(
			async (client) => {
				const fileExt =
					"name" in file && typeof (file as File).name === "string"
						? (file as File).name.split(".").pop()
						: "jpg";
				const fileName = `${userName}_${Date.now()}_${crypto.randomUUID()}.${fileExt}`;

				const { error } = await client.storage.from("cat-images").upload(fileName, file, {
					cacheControl: "3600",
					upsert: false,
					contentType: file.type || "image/jpeg",
				});

				if (error) {
					console.error("Upload failed:", error);
					return { path: null, error: error.message, success: false };
				}

				const {
					data: { publicUrl },
				} = client.storage.from("cat-images").getPublicUrl(fileName);
				return { path: publicUrl, error: null, success: true };
			},
			{ path: null, error: "Storage client not available", success: false },
		);
	},

	delete: async (fileName: string): Promise<{ success: boolean; error: string | null }> => {
		return withSupabase(
			async (client) => {
				const { error } = await client.storage.from("cat-images").remove([fileName]);
				if (error) {
					console.error("Delete failed:", error);
					return { success: false, error: error.message };
				}
				return { success: true, error: null };
			},
			{ success: false, error: "Storage client not available" },
		);
	},
};
