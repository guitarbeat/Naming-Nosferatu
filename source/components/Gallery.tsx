/**
 * @module Gallery
 * @description Gallery components: PhotoGallery, ImageGrid, Lightbox, and hooks.
 * Uses masonry layout for responsive 2+ column grids on mobile.
 */

import { imagesAPI } from "@supabase/client";
import type React from "react";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { compressImageFile, devError } from "@/utils";
import { ImageGrid } from "./ImageGrid";

/* =========================================================================
   HOOKS
   ========================================================================= */

export const CAT_IMAGES = [
	"/assets/images/bby-cat.GIF",
	"/assets/images/cat.gif",
	"/assets/images/IMG_4844.jpg",
	"/assets/images/IMG_4845.jpg",
	"/assets/images/IMG_4846.jpg",
	"/assets/images/IMG_4847.jpg",
	"/assets/images/IMG_5044.JPEG",
	"/assets/images/IMG_5071.JPG",
	"/assets/images/IMG_0778.jpg",
	"/assets/images/IMG_0779.jpg",
	"/assets/images/IMG_0865.jpg",
	"/assets/images/IMG_0884.jpg",
	"/assets/images/IMG_0923.jpg",
	"/assets/images/IMG_1116.jpg",
	"/assets/images/IMG_7205.jpg",
	"/assets/images/75209580524__60DCC26F-55A1-4EF8-A0B2-14E80A026A8D.jpg",
];

function deduplicateImages(images: string[]): string[] {
	return Array.from(new Set(images));
}

export function useImageGallery() {
	const [galleryImages, setGalleryImages] = useState<string[]>(CAT_IMAGES);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<unknown>(null);
	const [hasFetched, setHasFetched] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const fetchAll = async () => {
			if (hasFetched) {
				return;
			}
			setIsLoading(true);
			try {
				let supa: string[] = [];
				const list = await imagesAPI.list("");
				if (Array.isArray(list)) {
					supa = list.map((f) => (typeof f === "string" ? f : f.name));
				}

				let manifest: string[] = [];
				try {
					const manifestResponse = await fetch("/assets/images/gallery.json");
					if (manifestResponse.ok) {
						manifest = await manifestResponse.json();
					}
				} catch {
					/* silent */
				}

				if (cancelled) {
					return;
				}
				const merged = [...supa, ...manifest, ...CAT_IMAGES];
				setGalleryImages(deduplicateImages(merged));
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
		setGalleryImages((prev) => deduplicateImages([...newImages, ...prev]));
	}, []);

	return { galleryImages, setGalleryImages, addImages, isLoading, error };
}

/* =========================================================================
   COMPONENTS
   ========================================================================= */

/* GalleryThumbnail removed - now using ImageGrid component */

export function PhotoGallery({
	galleryImages = [],
	showAllPhotos,
	onShowAllPhotosToggle,
	onImageOpen,
	isAdmin,
	userName,
	onImagesUploaded,
}: {
	galleryImages?: string[];
	showAllPhotos: boolean;
	onShowAllPhotosToggle: () => void;
	onImageOpen: (image: string) => void;
	isAdmin: boolean;
	userName?: string;
	onImagesUploaded: (images: string[]) => void;
}) {
	/* Filter if not showing all (though we recommend showing all in fullscreen) */
	const displayImages = showAllPhotos ? galleryImages : galleryImages.slice(0, 8);

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) {
			return;
		}
		try {
			const uploaded: string[] = [];
			await Promise.all(
				files.map(async (f) => {
					const compressed = await compressImageFile(f, {
						maxWidth: 1600,
						maxHeight: 1600,
						quality: 0.8,
					});
					const uploadResult = await imagesAPI.upload(compressed, userName || "anonymous");
					if (uploadResult?.path) {
						uploaded.push(uploadResult.path);
					}
				}),
			);
			if (uploaded.length > 0) {
				onImagesUploaded(uploaded);
			}
		} catch (err) {
			devError("Upload error", err);
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="flex justify-between items-center mb-2">
				<h3 className="text-xl font-bold text-white">
					{/* Header hidden in fullscreen usually, or we can keep it */}
					{/* Cat Photos */}
				</h3>
				{isAdmin && (
					<label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all font-medium text-sm border border-purple-500/20 active:scale-95 shadow-lg shadow-purple-900/20">
						<input
							type="file"
							accept="image/*"
							multiple={true}
							onChange={handleFileUpload}
							style={{ display: "none" }}
						/>
						<Upload size={16} />
						<span>Upload</span>
					</label>
				)}
			</div>
			<ImageGrid images={displayImages} onImageOpen={onImageOpen} />
			{/* Only show button if NOT in showAll mode (e.g. widget mode) */}
			{!showAllPhotos && galleryImages.length > 8 && (
				<button
					type="button"
					className="w-full py-3 mt-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 hover:border-white/10 rounded-xl transition-all font-medium text-sm"
					onClick={onShowAllPhotosToggle}
				>
					Show All {galleryImages.length} Photos
				</button>
			)}
		</div>
	);
}

export function Lightbox({
	images,
	currentIndex,
	onClose,
	onNavigate,
}: {
	images: string[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			} else if (e.key === "ArrowLeft") {
				onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
			} else if (e.key === "ArrowRight") {
				onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [currentIndex, images.length, onClose, onNavigate]);

	const current = images[currentIndex];
	if (!current) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
			<div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
				<button
					type="button"
					className="absolute top-4 right-4 z-[110] p-3 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-lg rounded-full transition-all"
					onClick={onClose}
				>
					<X size={24} />
				</button>
				<button
					type="button"
					className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-4 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-lg rounded-full transition-all hidden md:block"
					onClick={() => onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
				>
					<ChevronLeft size={32} />
				</button>

				<div className="relative max-w-[95vw] max-h-[95vh] w-full h-full p-4 md:p-12 flex items-center justify-center">
					<img
						src={current}
						alt={`Photo ${currentIndex + 1}`}
						className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
					/>
				</div>

				<button
					type="button"
					className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-4 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-lg rounded-full transition-all hidden md:block"
					onClick={() => onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
				>
					<ChevronRight size={32} />
				</button>

				<div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 font-mono text-sm bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5">
					{currentIndex + 1} / {images.length}
				</div>
			</div>
		</div>
	);
}
