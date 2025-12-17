// Utility helpers for tournament features (image handling)

function getBaseName(value) {
  const path =
    typeof value === "string" ? value : value?.name || value?.url || "";
  const fileName = path.split("/").pop() || path;
  return fileName.replace(/\.[^/.]+$/, "").toLowerCase();
}

export function deduplicateImages(images = []) {
  const seen = new Set();
  const result = [];

  for (const image of images) {
    const key = getBaseName(image);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(image);
  }

  return result;
}

export function getRandomCatImage(id, images = []) {
  if (!id || !Array.isArray(images) || images.length === 0) return null;
  const hash = [...String(id)].reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const index = hash % images.length;
  return images[index] || null;
}
