/**
 * @module ratingUtils
 * @description Utility functions for converting and transforming rating data formats
 */

/**
 * Converts ratings from object format to array format for API/database operations
 * @param {Object|Array} ratings - Ratings in object format {name: {rating, wins, losses}} or array format
 * @returns {Array} Ratings array [{name, rating, wins, losses}, ...]
 */
export function ratingsToArray(ratings) {
  if (Array.isArray(ratings)) {
    return ratings;
  }

  // Convert object {name: {rating, wins, losses}, ...} to array
  return Object.entries(ratings).map(([name, data]) => ({
    name,
    rating: typeof data === "number" ? data : data?.rating || 1500,
    wins: typeof data === "object" ? data?.wins || 0 : 0,
    losses: typeof data === "object" ? data?.losses || 0 : 0,
  }));
}

/**
 * Converts ratings from array format to object format for store/state
 * @param {Array} ratingsArray - Ratings array [{name, rating, wins, losses}, ...]
 * @returns {Object} Ratings object {name: {rating, wins, losses}, ...}
 */
export function ratingsToObject(ratingsArray) {
  if (!Array.isArray(ratingsArray)) {
    return {};
  }

  return ratingsArray.reduce((acc, item) => {
    acc[item.name] = {
      rating: item.rating || 1500,
      wins: item.wins || 0,
      losses: item.losses || 0,
    };
    return acc;
  }, {});
}

/**
 * Normalizes ratings to ensure consistent format (object with rating, wins, losses)
 * @param {Object|Array} ratings - Ratings in any format
 * @returns {Object} Normalized ratings object
 */
export function normalizeRatings(ratings) {
  if (Array.isArray(ratings)) {
    return ratingsToObject(ratings);
  }
  return ratings || {};
}
