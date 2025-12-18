/**
 * @module TournamentSetup/hooks/useImageGallery
 * @description Custom hook for loading and managing the cat image gallery
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { resolveSupabaseClient } from "../../../shared/services/supabase/client";
import { imagesAPI } from "../../../shared/services/supabase/api";
import { deduplicateImages } from "../utils";
import { CAT_IMAGES } from "../constants";

/**
 * Custom hook for loading gallery images from multiple sources
 * @returns {Object} Gallery images and management functions
 */
export function useImageGallery({ isLightboxOpen }) {
  const [galleryImages, setGalleryImages] = useState(CAT_IMAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const trySupabase = async () => {
      try {
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) return [];
        const list = await imagesAPI.list("");
        if (Array.isArray(list) && list.length) return list;
      } catch (err) {
        if (!cancelled) {
          console.warn("Failed to load images from Supabase:", err);
        }
      }
      return [];
    };

    const tryStaticManifest = async () => {
      try {
        const res = await fetch("/assets/images/gallery.json");
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
      } catch (err) {
        if (!cancelled) {
          console.warn("Failed to load gallery manifest:", err);
        }
      }
      return [];
    };

    (async () => {
      if (isLightboxOpen) return;
      setIsLoading(true);
      setError(null);

      try {
        const [supa, manifest] = await Promise.all([
          trySupabase(),
          tryStaticManifest(),
        ]);

        // * Merge: supa first, then manifest, then built-ins
        const merged = [...(supa || []), ...(manifest || []), ...CAT_IMAGES];

        // * Deduplicate by base name (ignore extension), prefer earlier entries
        const deduped = deduplicateImages(merged);

        if (!cancelled) {
          setGalleryImages(deduped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          // Keep fallback images even on error
          setGalleryImages(CAT_IMAGES);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLightboxOpen]);

  const addImages = useCallback((newImages) => {
    setGalleryImages((prev) => {
      const merged = [...newImages, ...prev];
      return deduplicateImages(merged);
    });
  }, []);

  const imageMap = useMemo(() => {
    return new Map(galleryImages.map((img, idx) => [img, idx]));
  }, [galleryImages]);

  return {
    galleryImages,
    setGalleryImages,
    addImages,
    isLoading,
    error,
    imageMap,
  };
}
