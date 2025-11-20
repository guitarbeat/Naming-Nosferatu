/**
 * @module TournamentSetup/constants
 * @description Constants and configuration for tournament setup
 */

// * Absolute paths for better image loading compatibility
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

export const DEFAULT_DESCRIPTION = "A name as unique as your future companion";

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

export const SORT_OPTIONS = [
  { value: "alphabetical", label: "Alphabetical" },
  { value: "rating", label: "Rating (High to Low)" },
  { value: "popularity", label: "Popularity" },
];
