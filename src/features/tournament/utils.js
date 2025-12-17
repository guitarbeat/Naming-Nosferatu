/**
 * Utility helpers for tournament features.
 */

/**
 * Pick a deterministic image for a given id.
 * Falls back to the first image when the list is empty.
 * @param {string|number} id
 * @param {string[]} imageList
 * @returns {string|undefined}
 */
export function getRandomCatImage(id, imageList = []) {
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
export function deduplicateImages(images = []) {
  const seen = new Set();
  const unique = [];

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
