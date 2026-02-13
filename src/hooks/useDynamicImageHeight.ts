/**
 * @module useDynamicImageHeight
 * @description Hook to dynamically calculate image height based on description length
 */

import { useMemo } from "react";

interface UseDynamicImageHeightProps {
	description?: string;
	hasImage: boolean;
	baseHeight?: number;
	minHeight?: number;
	maxHeight?: number;
}

export const useDynamicImageHeight = ({
	description,
	hasImage,
	baseHeight = 120,
	minHeight = 80,
	maxHeight = 160,
}: UseDynamicImageHeightProps) => {
	return useMemo(() => {
		if (!hasImage) {
			return 0;
		}

		if (!description) {
			return baseHeight;
		}

		// Calculate description complexity
		const charCount = description.length;
		const lineCount = Math.ceil(charCount / 30); // Approximate lines based on character width

		// Calculate how much space the description needs
		const descriptionHeight = lineCount * 16; // 16px per line approximate

		// More aggressive reduction for longer descriptions
		const heightReduction = Math.min(descriptionHeight * 1.2, baseHeight - minHeight);
		const dynamicHeight = Math.max(baseHeight - heightReduction, minHeight);

		// Extra reduction for very long descriptions
		if (charCount > 100) {
			return Math.max(dynamicHeight * 0.7, minHeight);
		}

		return Math.min(dynamicHeight, maxHeight);
	}, [description, hasImage, baseHeight, minHeight, maxHeight]);
};
