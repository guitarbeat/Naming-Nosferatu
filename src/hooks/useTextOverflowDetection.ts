/**
 * @module useTextOverflowDetection
 * @description Hook to detect text overflow and automatically adjust card layout
 */

import { useEffect, useRef, useState } from "react";

interface UseTextOverflowDetectionProps {
	text?: string;
	enabled?: boolean;
}

export const useTextOverflowDetection = ({
	text,
	enabled = true,
}: UseTextOverflowDetectionProps) => {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const [measuredHeight, setMeasuredHeight] = useState(0);

	useEffect(() => {
		if (!enabled || !textRef.current || !text) {
			return;
		}

		const element = textRef.current;

		// Check if text is overflowing
		const checkOverflow = () => {
			if (element) {
				const isOverflow =
					element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
				setIsOverflowing(isOverflow);
				setMeasuredHeight(element.scrollHeight);
			}
		};

		// Initial check
		checkOverflow();

		// Check again after a short delay to account for font loading
		const timeoutId = setTimeout(checkOverflow, 100);

		// Set up ResizeObserver to detect changes
		let resizeObserver: ResizeObserver | null = null;
		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(checkOverflow);
			resizeObserver.observe(element);
		}

		return () => {
			clearTimeout(timeoutId);
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		};
	}, [text, enabled]);

	return {
		textRef,
		isOverflowing,
		measuredHeight,
		needsMoreSpace: isOverflowing && measuredHeight > 0,
	};
};
