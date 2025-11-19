/**
 * @module TournamentSetup/hooks/useImageGallery
 * @description Custom hook for loading and managing the cat image gallery
 */
import { useState, useEffect } from "react";
import { resolveSupabaseClient } from "../../../integrations/supabase/client";
import { imagesAPI } from "../../../integrations/supabase/api";
import { deduplicateImages } from "../utils";
import { CAT_IMAGES } from "../constants";

/**
 * Custom hook for loading gallery images from multiple sources
 * @returns {Array<string>} Gallery images
 */
export function useImageGallery() {
  const [galleryImages, setGalleryImages] = useState(CAT_IMAGES);

  useEffect(() => {
    let cancelled = false;

    const trySupabase = async () => {
      try {
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) return false;
        const list = await imagesAPI.list("");
        if (Array.isArray(list) && list.length) return list;
      } catch {
        // Ignore errors when trying to load images
      }
      return [];
    };

    const tryStaticManifest = async () => {
      try {
        const res = await fetch("/assets/images/gallery.json");
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
      } catch {
        // Ignore errors when trying to load images
      }
      return [];
    };

    (async () => {
      const supa = await trySupabase();
      const manifest = await tryStaticManifest();

      // * Merge: supa first, then manifest, then built-ins
      const merged = [...(supa || []), ...(manifest || []), ...CAT_IMAGES];

      // * Deduplicate by base name (ignore extension), prefer earlier entries
      const deduped = deduplicateImages(merged);

      if (!cancelled) setGalleryImages(deduped);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { galleryImages, setGalleryImages };
}
