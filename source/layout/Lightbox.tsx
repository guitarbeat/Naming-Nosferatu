import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

interface LightboxProps {
	images: string[];
	currentIndex: number;
	onClose: () => void;
	onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			} else if (e.key === "ArrowLeft") {
				onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
			} else if (e.key === "ArrowRight") {
				onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [currentIndex, images.length, onClose, onNavigate]);

	const current = images[currentIndex];
	if (!current) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
			onClick={onClose}
		>
			<div
				className="relative w-full h-full flex items-center justify-center"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					className="absolute top-4 right-4 z-[110] p-3 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-lg rounded-full transition-all"
					onClick={onClose}
				>
					<X size={24} />
				</button>
				<button
					type="button"
					className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-4 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-lg rounded-full transition-all hidden md:block"
					onClick={() => onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
				>
					<ChevronLeft size={32} />
				</button>

				<div className="relative max-w-[95vw] max-h-[95vh] w-full h-full p-4 md:p-12 flex items-center justify-center">
					<img
						src={current}
						alt={`Photo ${currentIndex + 1}`}
						className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
					/>
				</div>

				<button
					type="button"
					className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-4 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-lg rounded-full transition-all hidden md:block"
					onClick={() => onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
				>
					<ChevronRight size={32} />
				</button>

				<div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 font-mono text-sm bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5">
					{currentIndex + 1} / {images.length}
				</div>
			</div>
		</div>
	);
}
