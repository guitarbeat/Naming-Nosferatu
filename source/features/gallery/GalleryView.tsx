import { useCallback, useState } from "react";
import useAppStore from "../../core/store/useAppStore";
import { Lightbox, PhotoGallery, useImageGallery } from "../../shared/components/Gallery";
import { useAdminStatus } from "../../shared/hooks/useAppHooks";
import "../../shared/styles/gallery.css";

export default function GalleryView() {
	const userName = useAppStore((state) => state.user.name);
	const { isAdmin } = useAdminStatus(userName);

	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const [showAllPhotos, setShowAllPhotos] = useState(true);

	const { galleryImages, addImages } = useImageGallery();

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

	const handleImagesUploaded = useCallback(
		(uploaded: string[]) => {
			addImages(uploaded);
		},
		[addImages],
	);

	return (
		<div
			className="gallery-page-container"
			style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}
		>
			<div className="gallery-header-section" style={{ textAlign: "center", marginBottom: "3rem" }}>
				<h2
					style={{
						fontSize: "2.5rem",
						fontWeight: 800,
						marginBottom: "0.5rem",
					}}
				>
					Photo Gallery
				</h2>
				<p style={{ opacity: 0.7 }}>Click any photo to view full size</p>
			</div>

			<PhotoGallery
				galleryImages={galleryImages}
				showAllPhotos={showAllPhotos}
				onShowAllPhotosToggle={() => setShowAllPhotos((v) => !v)}
				onImageOpen={handleImageOpen}
				isAdmin={isAdmin}
				userName={userName}
				onImagesUploaded={handleImagesUploaded}
			/>

			{lightboxOpen && (
				<Lightbox
					images={galleryImages}
					currentIndex={lightboxIndex}
					onClose={() => setLightboxOpen(false)}
					onNavigate={setLightboxIndex}
				/>
			)}
		</div>
	);
}
