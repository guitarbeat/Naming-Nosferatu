/**
 * @module ratingUtils
 * @description Utility functions for converting and transforming rating data formats
 */

interface RatingData {
  rating: number;
  wins: number;
  losses: number;
}

interface RatingItem extends RatingData {
  name: string;
}

interface RatingDataInput {
  rating: number;
  wins?: number;
  losses?: number;
}

/**
 * Converts ratings from object format to array format for API/database operations
 * @param {Record<string, RatingDataInput | number> | RatingItem[]} ratings - Ratings in object format {name: {rating, wins, losses}} or array format
 * @returns {RatingItem[]} Ratings array [{name, rating, wins, losses}, ...]
 */
export function ratingsToArray(
  ratings: Record<string, RatingDataInput | number> | RatingItem[],
): RatingItem[] {
  if (Array.isArray(ratings)) {
    return ratings;
  }

  // Convert object {name: {rating, wins, losses}, ...} to array
  return Object.entries(ratings).map(([name, data]) => ({
    name,
    rating:
      typeof data === "number"
        ? data
        : (data as RatingDataInput)?.rating || 1500,
    wins: typeof data === "object" ? (data as RatingDataInput)?.wins || 0 : 0,
    losses:
      typeof data === "object" ? (data as RatingDataInput)?.losses || 0 : 0,
  }));
}

/**
 * Converts ratings from array format to object format for store/state
 * @param {RatingItem[]} ratingsArray - Ratings array [{name, rating, wins, losses}, ...]
 * @returns {Record<string, RatingData>} Ratings object {name: {rating, wins, losses}, ...}
 */
export function ratingsToObject(
  ratingsArray: RatingItem[],
): Record<string, RatingData> {
  if (!Array.isArray(ratingsArray)) {
    return {};
  }

  return ratingsArray.reduce(
    (acc, item) => {
      acc[item.name] = {
        rating: item.rating || 1500,
        wins: item.wins || 0,
        losses: item.losses || 0,
      };
      return acc;
    },
    {} as Record<string, RatingData>,
  );
}
