import { useCallback, useState } from "react";
import { Lightbox, PhotoGallery, useImageGallery } from "@/components/Gallery";
import useAppStore from "@/store/useAppStore";
import { useAdminStatus } from "../auth/authHooks";

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
		<div className="w-full max-w-7xl mx-auto px-4 py-8 md:p-8">
			<div className="text-center mb-12 space-y-2">
				<h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-2 tracking-tight">
					Photo Gallery
				</h2>
				<p className="text-lg text-white/60">Click any photo to view full size</p>
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
