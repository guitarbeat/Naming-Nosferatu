import { useCallback, useMemo, useState } from "react";
import useAppStore from "../../core/store/useAppStore";
import { useAdminStatus } from "../../shared/hooks/useAppHooks";
import Lightbox from "../tournament/components/Lightbox";
import { PhotoGallery } from "../tournament/components/TournamentSidebar/PhotoComponents";
import { useImageGallery } from "../tournament/hooks/useImageGallery";
import setupStyles from "../tournament/styles/Setup.module.css";

export default function GalleryView() {
	const userName = useAppStore((state) => state.user.name);
	const { isAdmin } = useAdminStatus(userName);

	// Lightbox state
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const [showAllPhotos, setShowAllPhotos] = useState(true);

	const { galleryImages, addImages } = useImageGallery({
		isLightboxOpen: lightboxOpen,
	});

	const handleImageOpen = useCallback(
		(image: string) => {
			if (!galleryImages) {
				return;
			}
			const idx = galleryImages.indexOf(image);
			if (idx !== -1) {
				setLightboxIndex(idx);
				setLightboxOpen(true);
			}
		},
		[galleryImages],
	);

	const handleLightboxClose = useCallback(() => {
		setLightboxOpen(false);
	}, []);

	const handleLightboxNavigate = useCallback((newIndex: number) => {
		setLightboxIndex(newIndex);
	}, []);

	const handleImagesUploaded = useCallback(
		(uploaded: string[]) => {
			addImages(uploaded);
		},
		[addImages],
	);

	const preloadImages = useMemo(() => {
		if (!lightboxOpen || !galleryImages || galleryImages.length === 0) {
			return [];
		}
		const prevIndex = lightboxIndex === 0 ? galleryImages.length - 1 : lightboxIndex - 1;
		const nextIndex = lightboxIndex === galleryImages.length - 1 ? 0 : lightboxIndex + 1;
		return [galleryImages[prevIndex], galleryImages[nextIndex]].filter(Boolean) as string[];
	}, [lightboxOpen, lightboxIndex, galleryImages]);

	const lightboxElement = lightboxOpen && galleryImages && galleryImages.length > 0 && (
		<Lightbox
			images={galleryImages}
			currentIndex={lightboxIndex}
			onClose={handleLightboxClose}
			onNavigate={handleLightboxNavigate}
			preloadImages={preloadImages}
		/>
	);

	return (
		<div
			className={`${setupStyles.container} ${setupStyles.photosViewContainer}`}
			style={{ paddingTop: "100px", minHeight: "100vh" }}
		>
			<div className={setupStyles.photosViewContent}>
				<h2 className={setupStyles.photosViewTitle}>Photo Gallery</h2>
				<p className={setupStyles.photosViewSubtitle}>Click any photo to view full size</p>
				<PhotoGallery
					galleryImages={galleryImages}
					showAllPhotos={showAllPhotos}
					onShowAllPhotosToggle={() => setShowAllPhotos((v) => !v)}
					onImageOpen={handleImageOpen}
					isAdmin={isAdmin}
					userName={userName}
					onImagesUploaded={handleImagesUploaded}
				/>
			</div>
			{lightboxElement}
		</div>
	);
}
