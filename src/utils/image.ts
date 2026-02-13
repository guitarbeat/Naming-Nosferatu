/**
 * @module image
 * @description Image handling and compression utilities
 */

import { CAT_IMAGES } from "./constants";

interface CatImage {
	id: string;
	url: string;
	width: number;
	height: number;
}

/**
 * Fallback cat avatar URLs when API fails
 */
const FALLBACK_CAT_AVATARS = [
	"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1574158622682-e40e69881006?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=150&h=150&fit=crop&crop=face",
	"https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=150&h=150&fit=crop&crop=face",
];

/**
 * Fetch multiple random cat images from The Cat API
 */
export const fetchCatAvatars = async (count: number = 6): Promise<string[]> => {
	try {
		const response = await fetch(
			`https://api.thecatapi.com/v1/images/search?limit=${count}&size=thumb`,
		);
		if (!response.ok) {
			throw new Error("Failed to fetch cat images");
		}
		const cats = await response.json();
		return cats.map((cat: CatImage) => cat.url);
	} catch {
		return FALLBACK_CAT_AVATARS;
	}
};

/**
 * Get a deterministic random cat image based on ID
 */
export function getRandomCatImage(
	id: string | number | null | undefined,
	images = CAT_IMAGES,
): string {
	if (!id) {
		return images[0];
	}
	const seed =
		typeof id === "string"
			? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
			: Number(id);
	return images[Math.abs(seed) % images.length] ?? images[0];
}

/**
 * Load an image from a file and return as HTMLImageElement
 */
async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined") {
			reject(new Error("Browser environment required"));
			return;
		}
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			reject(e);
		};
		img.src = url;
	});
}

/**
 * Compress an image file to WebP format with size constraints
 */
export async function compressImageFile(
	file: File,
	{
		maxWidth = 1600,
		maxHeight = 1600,
		quality = 0.8,
	}: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
	try {
		if (typeof document === "undefined") {
			return file;
		}
		const img = await loadImageFromFile(file);
		const { width, height } = img;
		const scale = Math.min(maxWidth / width, maxHeight / height, 1);
		const targetW = Math.round(width * scale);
		const targetH = Math.round(height * scale);

		const canvas = document.createElement("canvas");
		canvas.width = targetW;
		canvas.height = targetH;
		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) {
			return file;
		}
		ctx.drawImage(img, 0, 0, targetW, targetH);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/webp", Math.min(Math.max(quality, 0.1), 0.95)),
		);
		if (!blob) {
			return file;
		}

		const base = file.name.replace(/\.[^.]+$/, "") || "image";
		return new File([blob], `${base}.webp`, { type: "image/webp" });
	} catch {
		return file;
	}
}
