import { useCallback, useMemo, useState } from "react";

interface UseLightboxStateProps {
	galleryImages: string[];
}

/**
 * Custom hook to manage the state and logic for a lightbox gallery.
 */
export function useLightboxState({ galleryImages }: UseLightboxStateProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const handleOpen = useCallback(
		(image: string) => {
			if (!galleryImages) {
				return;
			}
			const idx = galleryImages.indexOf(image);
			if (idx !== -1) {
				setCurrentIndex(idx);
				setIsOpen(true);
			}
		},
		[galleryImages],
	);

	const handleNavigate = useCallback((newIndex: number) => {
		setCurrentIndex(newIndex);
	}, []);

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	const preloadImages = useMemo(() => {
		if (!isOpen || !galleryImages || galleryImages.length === 0) {
			return [];
		}
		const prevIndex = currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
		const nextIndex = currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1;
		return [galleryImages[prevIndex], galleryImages[nextIndex]].filter(
			(img): img is string => img != null,
		);
	}, [isOpen, currentIndex, galleryImages]);

	return {
		isOpen,
		currentIndex,
		handleOpen,
		handleNavigate,
		handleClose,
		preloadImages,
	};
}
