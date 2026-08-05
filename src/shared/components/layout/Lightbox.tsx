import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface LightboxProps {
	images: string[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
	const currentImage = images[currentIndex] || "";
	const hasMultipleImages = images.length > 1;
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	// Use a ref to hold onClose so the keyboard effect does not re-register
	// when the caller passes an unstable inline arrow (e.g. () => setState(false)).
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	// Focus the close button on mount for keyboard accessibility
	useEffect(() => {
		closeButtonRef.current?.focus();
	}, []);

	const handlePrevious = useCallback(() => {
		onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
	}, [onNavigate, currentIndex, images.length]);

	const handleNext = useCallback(() => {
		onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
	}, [onNavigate, currentIndex, images.length]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			switch (event.key) {
				case "Escape":
					onCloseRef.current();
					break;
				case "ArrowLeft":
					handlePrevious();
					break;
				case "ArrowRight":
					handleNext();
					break;
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handlePrevious, handleNext]);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
				onClick={onClose}
				role="dialog"
				tabIndex={-1}
				aria-modal="true"
				aria-label={`Image ${currentIndex + 1} of ${images.length}`}
			>
				<button
					ref={closeButtonRef}
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
					aria-label="Close lightbox and return to gallery"
					title="Close"
				>
					<X size={24} />
				</button>

				{hasMultipleImages && (
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							handlePrevious();
						}}
						className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
						aria-label="View previous image"
						title="Previous image"
					>
						<ChevronLeft size={24} />
					</button>
				)}

				<motion.img
					src={currentImage}
					alt={`Cat image ${currentIndex + 1} of ${images.length}`}
					className="max-h-[90vh] max-w-[90vw] select-none object-contain"
					initial={{ scale: 0.96, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.96, opacity: 0 }}
					transition={{ duration: 0.18 }}
					onClick={(event) => event.stopPropagation()}
					loading="eager"
					decoding="async"
				/>

				{hasMultipleImages && (
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							handleNext();
						}}
						className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
						aria-label="View next image"
						title="Next image"
					>
						<ChevronRight size={24} />
					</button>
				)}

				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white">
					Image {currentIndex + 1} of {images.length}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
