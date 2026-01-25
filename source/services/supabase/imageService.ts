import { withSupabase } from "./clientBase";

/**
 * @module imageService
 * @description Supabase Storage API for cat images.
 */

export const imagesAPI = {
	/**
	 * List all images in the cat-photos bucket
	 */
	list: async (path = "") => {
		return withSupabase(async (client) => {
			const { data, error } = await client.storage.from("cat-photos").list(path);
			if (error) {
				console.error("Error listing images:", error);
				return [];
			}
			// Map to public URLs
			return data.map((file) => {
				const { data: urlData } = client.storage
					.from("cat-photos")
					.getPublicUrl(`${path}${file.name}`);
				return urlData.publicUrl;
			});
		}, [] as string[]);
	},

	/**
	 * Upload an image to the cat-photos bucket
	 */
	upload: async (file: File | Blob, userName: string) => {
		return withSupabase(
			async (client) => {
				const fileName = `${Date.now()}-${userName}-${(file as File).name || "blob"}`;
				const { data, error } = await client.storage.from("cat-photos").upload(fileName, file);

				if (error) {
					console.error("Upload error:", error);
					return { path: null, error: error.message };
				}

				const { data: urlData } = client.storage.from("cat-photos").getPublicUrl(data.path);
				return { path: urlData.publicUrl, success: true };
			},
			{ path: null, error: "Supabase not configured" },
		);
	},
};
