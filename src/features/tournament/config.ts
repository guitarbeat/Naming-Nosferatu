/**
 * @module Tournament/config
 * @description Consolidated configuration and utilities for tournament features
 * Includes constants, image utilities, and tournament-specific helpers
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Absolute paths for better image loading compatibility
 */
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

export const GALLERY_IMAGE_SIZES = "100vw";
export const LIGHTBOX_IMAGE_SIZES = "100vw";

export const FALLBACK_NAMES = [
  {
    id: "aaron",
    name: "aaron",
    description: "temporary fallback — backend offline",
  },
  {
    id: "fix",
    name: "fix",
    description: "temporary fallback — backend offline",
  },
  {
    id: "the",
    name: "the",
    description: "temporary fallback — backend offline",
  },
  {
    id: "site",
    name: "site",
    description: "temporary fallback — backend offline",
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Pick a deterministic image for a given id.
 * Falls back to the first image when the list is empty.
 * @param {string|number} id
 * @param {string[]} imageList
 * @returns {string|undefined}
 */
export function getRandomCatImage(id: string | number, imageList: string[] = []): string | undefined {
  if (!Array.isArray(imageList) || imageList.length === 0) {
    return undefined;
  }

  const seed =
    typeof id === "string"
      ? Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : Number(id) || 0;

  const index = Math.abs(seed) % imageList.length;
  return imageList[index];
}

/**
 * Deduplicate images by base filename (ignores extension).
 * Earlier occurrences win.
 * @param {string[]} images
 * @returns {string[]}
 */
export function deduplicateImages(images: string[] = []): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const image of images) {
    if (typeof image !== "string" || image.length === 0) {
      continue;
    }

    const base = image.replace(/\.[^./]+$/, "");
    if (seen.has(base)) {
      continue;
    }

    seen.add(base);
    unique.push(image);
  }

  return unique;
}

