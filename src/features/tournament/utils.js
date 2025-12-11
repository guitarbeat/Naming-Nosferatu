/**
 * @module TournamentSetup/utils
 * @description Utility functions for tournament setup
 */

import { CAT_IMAGES } from "./constants";

/**
 * Get a consistent random cat image for a given name ID
 * @param {string|number} nameId - The name ID to hash
 * @param {Array<string>} imageList - Optional image list to use
 * @returns {string} Image URL
 */
export const getRandomCatImage = (nameId, imageList = CAT_IMAGES) => {
  // * Convert UUID string to a number for consistent image selection
  let numericId;
  if (typeof nameId === "string") {
    // * Use a simple hash of the UUID string to get a consistent number
    numericId = nameId.split("").reduce((hash, char) => {
      return char.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);
  } else {
    numericId = nameId;
  }

  // * Use the numeric ID to consistently get the same image for the same name
  const list =
    Array.isArray(imageList) && imageList.length ? imageList : CAT_IMAGES;
  const index = Math.abs(numericId) % list.length;
  return list[index];
};

/**
 * Deduplicate images by base name
 * @param {Array<string>} images - Array of image URLs
 * @returns {Array<string>} Deduplicated image URLs
 */
export const deduplicateImages = (images) => {
  const seen = new Set();
  const deduped = [];

  for (const url of images) {
    if (!url) continue;
    // * Strip query/hash and extension
    const [clean] = String(url).split(/[?#]/);
    const name = clean.substring(clean.lastIndexOf("/") + 1);
    const base = name.replace(/\.[^.]+$/, "").toLowerCase();
    if (seen.has(base)) continue;
    seen.add(base);
    deduped.push(url);
  }

  return deduped;
};

// Unused function removed
// export const extractCategories = (names) => { ... };
