import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface LightboxProps {
	images: string[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}

function useLightboxNavigation(
	currentIndex: number,
	imagesLength: number,
	onClose: () => void,
	onNavigate: (index: number) => void,
) {
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	const handlePrevious = useCallback(() => {
		onNavigate(currentIndex > 0 ? currentIndex - 1 : imagesLength - 1);
	}, [onNavigate, currentIndex, imagesLength]);

	const handleNext = useCallback(() => {
		onNavigate(currentIndex < imagesLength - 1 ? currentIndex + 1 : 0);
	}, [onNavigate, currentIndex, imagesLength]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				return onCloseRef.current();
			}
			if (event.key === "ArrowLeft") {
				return handlePrevious();
			}
			if (event.key === "ArrowRight") {
				return handleNext();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handlePrevious, handleNext]);

	return { handlePrevious, handleNext };
}

interface NavigationButtonProps {
	direction: "previous" | "next";
	onClick: () => void;
}

function NavigationButton({ direction, onClick }: NavigationButtonProps) {
	const isPrevious = direction === "previous";
	const Icon = isPrevious ? ChevronLeft : ChevronRight;
	const ariaLabel = `View ${direction} image`;
	const title = `${isPrevious ? "Previous" : "Next"} image`;
	const positionClass = isPrevious ? "left-4" : "right-4";

	return (
		<button
			type="button"
			onClick={(event) => {
				event.stopPropagation();
				onClick();
			}}
			className={`absolute ${positionClass} rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20`}
			aria-label={ariaLabel}
			title={title}
		>
			<Icon size={24} />
		</button>
	);
}

export function Lightbox({
	images,
	currentIndex,
	onClose,
	onNavigate,
}: LightboxProps) {
	const currentImage = images[currentIndex] || "";
	const hasMultipleImages = images.length > 1;
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const { handlePrevious, handleNext } = useLightboxNavigation(
		currentIndex,
		images.length,
		onClose,
		onNavigate,
	);

	// Focus the close button on mount for keyboard accessibility
	useEffect(() => {
		closeButtonRef.current?.focus();
	}, []);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
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
					<NavigationButton direction="previous" onClick={handlePrevious} />
				)}

				<motion.img
					src={currentImage}
					alt={`Cat ${currentIndex + 1} of ${images.length}`}
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
					<NavigationButton direction="next" onClick={handleNext} />
				)}

				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white">
					Image {currentIndex + 1} of {images.length}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
