import { withSupabase } from "../../shared/services/supabase/client";

export interface FileObject {
  name: string;
  metadata?: { size?: number };
  size?: number;
}

export const imagesAPI = {
  /**
   * List images from the `cat-images` bucket.
   */
  list: async (prefix = "", limit = 1000) => {
    return withSupabase(async (client) => {
      const { data, error } = await client.storage
        .from("cat-images")
        .list(prefix, {
          limit,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        console.error("Error listing images:", error);
        return [];
      }

      // Filter and deduplicate: if multiple extensions exist, pick the smaller file
      const nameMap = new Map<string, FileObject>();

      const rankByExt = (name: string) => {
        const ext = name.split(".").pop()?.toLowerCase();
        if (ext === "webp") {
          return 1;
        }
        if (ext === "jpg" || ext === "jpeg") {
          return 2;
        }
        if (ext === "png") {
          return 3;
        }
        return 4;
      };

      const pickSmaller = (a: FileObject, b: FileObject) => {
        const sizeA = a.metadata?.size || a.size || 0;
        const sizeB = b.metadata?.size || b.size || 0;
        if (sizeA !== sizeB && sizeA > 0 && sizeB > 0) {
          return sizeA < sizeB ? a : b;
        }
        return rankByExt(a.name) < rankByExt(b.name) ? a : b;
      };

      for (const file of data || []) {
        const baseName = file.name.split(".")[0];
        if (!baseName) {
          continue;
        }

        if (nameMap.has(baseName)) {
          nameMap.set(baseName, pickSmaller(nameMap.get(baseName)!, file));
        } else {
          nameMap.set(baseName, file);
        }
      }

      return Array.from(nameMap.values());
    }, []);
  },

  /**
   * Upload an image file.
   */
  upload: async (file: File, _userName = "anon", prefix = "") => {
    return withSupabase(async (client) => {
      const fileName = `${prefix}${Date.now()}-${file.name}`;
      const { data, error } = await client.storage
        .from("cat-images")
        .upload(fileName, file);

      if (error) {
        throw error;
      }
      return data;
    }, null);
  },
};
