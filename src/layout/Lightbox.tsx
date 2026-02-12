/**
 * @module Lightbox
 * @description Image lightbox component for viewing images in fullscreen
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "@/utils/icons";

interface LightboxProps {
	images: string[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
	const handlePrevious = useCallback(() => {
		onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
	}, [currentIndex, images.length, onNavigate]);

	const handleNext = useCallback(() => {
		onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
	}, [currentIndex, images.length, onNavigate]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
			if (e.key === "ArrowLeft") {
				handlePrevious();
			}
			if (e.key === "ArrowRight") {
				handleNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose, handlePrevious, handleNext]);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
				onClick={onClose}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
					aria-label="Close lightbox"
				>
					<X size={24} />
				</button>

				<button
					onClick={(e) => {
						e.stopPropagation();
						handlePrevious();
					}}
					className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
					aria-label="Previous image"
				>
					<ChevronLeft size={24} />
				</button>

				<motion.img
					key={currentIndex}
					src={images[currentIndex]}
					alt={`Image ${currentIndex + 1}`}
					className="max-w-[90vw] max-h-[90vh] object-contain"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					onClick={(e) => e.stopPropagation()}
				/>

				<button
					onClick={(e) => {
						e.stopPropagation();
						handleNext();
					}}
					className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
					aria-label="Next image"
				>
					<ChevronRight size={24} />
				</button>

				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
					{currentIndex + 1} / {images.length}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
