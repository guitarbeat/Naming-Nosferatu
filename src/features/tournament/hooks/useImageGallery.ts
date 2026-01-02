/**
 * @module TournamentSetup/hooks/useImageGallery
 * @description Custom hook for loading and managing the cat image gallery
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	imagesAPI,
	resolveSupabaseClient,
} from "../../../shared/services/supabase/supabaseClient";
import { CAT_IMAGES, deduplicateImages } from "../config";

const trySupabase = async () => {
	try {
		const supabaseClient = await resolveSupabaseClient();
		if (!supabaseClient) return [];
		const list = await imagesAPI.list("");
		if (Array.isArray(list) && list.length) return list;
	} catch (err) {
		console.warn("Failed to load images from Supabase:", err);
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
		console.warn("Failed to load gallery manifest:", err);
	}
	return [];
};

/**
 * Custom hook for loading gallery images from multiple sources
 * @returns {Object} Gallery images and management functions
 */
// ts-prune-ignore-next (used in TournamentSetup)
export function useImageGallery({
	isLightboxOpen: _isLightboxOpen,
}: {
	isLightboxOpen: boolean;
}) {
	const [galleryImages, setGalleryImages] = useState<string[]>(CAT_IMAGES);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<unknown>(null);
	const [hasFetched, setHasFetched] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const fetchAll = async () => {
			if (hasFetched) return;
			setIsLoading(true);
			setError(null);

			try {
				const [supa, manifest] = await Promise.all([
					trySupabase(),
					tryStaticManifest(),
				]);

				if (cancelled) return;

				// * Merge: supa first, then manifest, then built-ins
				const merged: string[] = [
					...(supa || []),
					...(manifest || []),
					...CAT_IMAGES,
				];

				// * Deduplicate by base name (ignore extension), prefer earlier entries
				const deduped: string[] = deduplicateImages(merged) as string[];

				setGalleryImages(deduped);
				setError(null);
				setHasFetched(true);
			} catch (err) {
				if (!cancelled) {
					setError(err);
					setGalleryImages(CAT_IMAGES);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		fetchAll();

		return () => {
			cancelled = true;
		};
	}, [hasFetched]);

	const addImages = useCallback((newImages: string[]) => {
		setGalleryImages((prev: string[]) => {
			const merged = [...newImages, ...prev];
			return deduplicateImages(merged) as string[];
		});
	}, []);

	const imageMap = useMemo(() => {
		return new Map<string, number>(galleryImages.map((img, idx) => [img, idx]));
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
