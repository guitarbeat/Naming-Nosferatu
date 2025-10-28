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
 * Validate that name objects have required properties
 * @param {Array} names - Array of name objects to validate
 * @returns {boolean} True if all names are valid
 */
export const validateNameObjects = (names) => {
  if (!Array.isArray(names)) {
    console.error("[validateNames] Not an array:", names);
    return false;
  }

  if (names.length < 2) {
    console.error("[validateNames] Need at least 2 names:", names.length);
    return false;
  }

  return names.every((n) => {
    if (!n || typeof n !== "object") {
      console.error("[validateNames] Invalid name object (not object):", n);
      return false;
    }

    if (!n.name || typeof n.name !== "string") {
      console.error("[validateNames] Missing or invalid name property:", n);
      return false;
    }

    if (!n.id) {
      console.error("[validateNames] Missing id property:", n);
      return false;
    }

    return true;
  });
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

/**
 * Filter and sort names based on criteria
 * @param {Array} names - Available names
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered and sorted names
 */
export const filterAndSortNames = (names, filters = {}) => {
  const {
    category,
    searchTerm,
    sortBy = "alphabetical",
  } = filters;

  let filtered = [...names];

  // * Filter by category
  if (category) {
    filtered = filtered.filter(
      (name) => name.categories && name.categories.includes(category)
    );
  }

  // * Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (name) =>
        name.name.toLowerCase().includes(term) ||
        (name.description && name.description.toLowerCase().includes(term))
    );
  }

  // * Sort names
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.avg_rating || 1500) - (a.avg_rating || 1500);
      case "popularity":
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      case "alphabetical":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return filtered;
};

/**
 * Generate category options with counts
 * @param {Array} categories - Available categories
 * @param {Array} names - Available names
 * @returns {Array} Category options
 */
export const generateCategoryOptions = (categories, names) => {
  if (!categories?.length) {
    return [];
  }

  const categoryCounts = categories.map((category) => {
    const count = names.filter(
      (name) => name.categories && name.categories.includes(category.name)
    ).length;

    return {
      value: category.name,
      label: `${category.name} (${count})`,
    };
  });

  return [{ value: "", label: "All Categories" }, ...categoryCounts];
};

/**
 * Extract unique categories from names
 * @param {Array} names - Available names
 * @returns {Array} Category objects
 */
export const extractCategories = (names) => {
  const unique = new Set();
  (names || []).forEach((n) => {
    (n.categories || []).forEach((c) => unique.add(c));
  });
  return Array.from(unique)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ id: name, name }));
};

