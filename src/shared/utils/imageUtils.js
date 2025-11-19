/**
 * @module imageUtils
 * @description Image handling and manipulation utilities.
 */

/**
 * * Load a File/Blob into an HTMLImageElement
 * @param {File} file - Image file to load
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export async function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
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
 * * Validate if an image URL is accessible
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} True if image is accessible
 */
export async function validateImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * * Preload an image with error handling
 * @param {string} src - Image source URL
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export async function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (_error) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * * Get fallback image URL when primary image fails
 * @param {string} originalSrc - Original image source
 * @returns {string} Fallback image URL
 */
export function getFallbackImageUrl(_originalSrc) {
  return '/assets/images/IMG_0778.jpg';
}

/**
 * * Compress an image file to WebP using a canvas
 * @param {File} file - Original image file
 * @param {Object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<File>} Compressed image as a File (webp) or original on failure
 */
export async function compressImageFile(
  file,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = {}
) {
  try {
    const img = await loadImageFromFile(file);
    const { width, height } = img;
    let targetW = width;
    let targetH = height;

    // Fit within max dimensions preserving aspect ratio
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    targetW = Math.round(width * scale);
    targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(
        resolve,
        'image/webp',
        Math.min(Math.max(quality, 0.1), 0.95)
      )
    );

    if (!blob) return file; // fallback

    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    const compressed = new File([blob], `${base}.webp`, { type: 'image/webp' });
    return compressed;
  } catch {
    return file; // fallback to original if anything fails
  }
}

