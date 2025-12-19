/**
 * @module uiUtils
 * @description Unified utility functions for UI formatting, class names, navigation, and media handling.
 */

/**
 * Combines class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

/**
 * Get rank emoji and text for a given position
 */
export function getRankDisplay(rank: number): string {
    if (rank === 1) return "🥇 1st";
    if (rank === 2) return "🥈 2nd";
    if (rank === 3) return "🥉 3rd";
    if (rank <= 10) return `🏅 ${rank}th`;
    return `${rank}th`;
}

/**
 * Normalize a route path by ensuring it starts with /
 */
export function normalizeRoutePath(routeValue: string): string {
    if (!routeValue) return "/";
    return routeValue.startsWith("/") ? routeValue : `/${routeValue}`;
}

// ============================================================================
// Media Query Utilities (from mediaQueries.ts)
// ============================================================================

const isBrowser = () => typeof window !== "undefined";
const canUseMatchMedia = () => isBrowser() && typeof window.matchMedia === "function";

export const getMediaQueryList = (query: string): MediaQueryList | null => {
    if (!canUseMatchMedia()) return null;
    try {
        return window.matchMedia(query);
    } catch (error) {
        if (process.env.NODE_ENV === "development") console.warn("Invalid media query:", query, error);
        return null;
    }
};

export const attachMediaQueryListener = (mediaQueryList: MediaQueryList | null, listener: (event: MediaQueryListEvent) => void): () => void => {
    if (!mediaQueryList || typeof listener !== "function") return () => { };
    if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", listener);
        return () => mediaQueryList.removeEventListener("change", listener);
    }
    if (typeof mediaQueryList.addListener === "function") {
        mediaQueryList.addListener(listener);
        return () => mediaQueryList.removeListener(listener);
    }
    return () => { };
};

// ============================================================================
// Image Utilities (from imageUtils.ts)
// ============================================================================

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
    });
}

/**
 * * Compress an image file to WebP using a canvas
 */
export async function compressImageFile(
    file: File,
    { maxWidth = 1600, maxHeight = 1600, quality = 0.8 }: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
    try {
        const img = await loadImageFromFile(file);
        const { width, height } = img;
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        const targetW = Math.round(width * scale);
        const targetH = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return file;
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/webp", Math.min(Math.max(quality, 0.1), 0.95))
        );
        if (!blob) return file;

        const base = file.name.replace(/\.[^.]+$/, "") || "image";
        return new File([blob], `${base}.webp`, { type: "image/webp" });
    } catch {
        return file;
    }
}
