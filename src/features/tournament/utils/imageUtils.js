/**
 * @module TournamentSetup/utils/imageUtils
 * @description Utility functions for image handling and manipulation
 */

/**
 * Handle mouse move for draggable images
 * @param {MouseEvent} e - Mouse event
 * @param {Array} openImages - Array of open image states
 * @returns {Array} Updated open images array
 */
export const handleImageMouseMove = (e, openImages) => {
  return openImages.map((img) => {
    if (img.isDragging) {
      return {
        ...img,
        position: {
          x: e.clientX - img.dragStart.x,
          y: e.clientY - img.dragStart.y,
        },
      };
    }
    return img;
  });
};

/**
 * Handle mouse up for draggable images
 * @param {Array} openImages - Array of open image states
 * @returns {Array} Updated open images array
 */
export const handleImageMouseUp = (openImages) => {
  return openImages.map((img) => ({
    ...img,
    isDragging: false,
  }));
};

/**
 * Handle resize move for resizable images
 * @param {MouseEvent} e - Mouse event
 * @param {Array} openImages - Array of open image states
 * @returns {Array} Updated open images array
 */
export const handleImageResizeMove = (e, openImages) => {
  return openImages.map((img) => {
    if (img.isResizing) {
      const deltaX = e.clientX - img.resizeStart.x;
      const aspectRatio = img.size.width / img.size.height;

      let newWidth = img.size.width;
      let newHeight = img.size.height;

      switch (img.resizeHandle) {
        case "nw":
          newWidth = Math.max(200, img.size.width - deltaX);
          newHeight = newWidth / aspectRatio;
          break;
        case "ne":
          newWidth = Math.max(200, img.size.width + deltaX);
          newHeight = newWidth / aspectRatio;
          break;
        case "sw":
          newWidth = Math.max(200, img.size.width - deltaX);
          newHeight = newWidth / aspectRatio;
          break;
        case "se":
          newWidth = Math.max(200, img.size.width + deltaX);
          newHeight = newWidth / aspectRatio;
          break;
      }

      return {
        ...img,
        size: {
          width: newWidth,
          height: newHeight,
        },
        resizeStart: {
          x: e.clientX,
          y: e.clientY,
        },
      };
    }
    return img;
  });
};

/**
 * Handle resize end for resizable images
 * @param {Array} openImages - Array of open image states
 * @returns {Array} Updated open images array
 */
export const handleImageResizeEnd = (openImages) => {
  return openImages.map((img) => ({
    ...img,
    isResizing: false,
    resizeHandle: null,
  }));
};

