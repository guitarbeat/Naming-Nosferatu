import {
	Camera,
	Check,
	Eye,
	EyeOff,
	Image as ImageIcon,
	Pencil,
	RotateCcw,
	Sparkles,
	Upload,
	X,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useToast } from "@/app/Providers";
import { CAT_IMAGES, FALLBACK_CAT_IMAGE } from "@/shared/lib/constants";

const STORAGE_KEY_PHOTO = "user_custom_cat_photo";
const STORAGE_KEY_VISIBLE = "cat_hero_visible";
const STORAGE_KEY_NAME = "user_custom_cat_name";

export function CatHeroCard() {
	const [photoUrl, setPhotoUrl] = useState<string>(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY_PHOTO);
			return saved && saved.length > 0 ? saved : FALLBACK_CAT_IMAGE;
		} catch {
			return FALLBACK_CAT_IMAGE;
		}
	});

	const [isVisible, setIsVisible] = useState<boolean>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY_VISIBLE) !== "false";
		} catch {
			return true;
		}
	});

	const [catName, setCatName] = useState<string>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY_NAME) || "Nosferatu";
		} catch {
			return "Nosferatu";
		}
	});

	const [isEditingName, setIsEditingName] = useState(false);
	const [tempName, setTempName] = useState(catName);
	const [isDragging, setIsDragging] = useState(false);
	const [isGalleryOpen, setIsGalleryOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const toast = useToast();

	const isCustomPhoto = photoUrl !== FALLBACK_CAT_IMAGE;

	// Keep custom cat photo in sync
	const savePhoto = useCallback((url: string) => {
		setPhotoUrl(url);
		try {
			localStorage.setItem(STORAGE_KEY_PHOTO, url);
			window.dispatchEvent(new CustomEvent("cat-photo-updated", { detail: url }));
		} catch {
			// quota fallback
		}
	}, []);

	const handleVisibilityToggle = () => {
		const next = !isVisible;
		setIsVisible(next);
		try {
			localStorage.setItem(STORAGE_KEY_VISIBLE, String(next));
		} catch {
			// ignore
		}
		if (!next) {
			toast.showInfo("Cat photo hidden. Click 'Show Cat Photo' anytime to restore it.");
		}
	};

	const handleFileSelect = (file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.showError("Please upload an image file (JPEG, PNG, WEBP, GIF).");
			return;
		}

		// Cap max size to 8MB
		if (file.size > 8 * 1024 * 1024) {
			toast.showError("Image size must be under 8MB.");
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result;
			if (typeof result === "string") {
				savePhoto(result);
				toast.showSuccess(`Updated with a photo of ${catName}! 🐾`);
			}
		};
		reader.onerror = () => {
			toast.showError("Failed to read image file.");
		};
		reader.readAsDataURL(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!isDragging) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleResetDefault = () => {
		savePhoto(FALLBACK_CAT_IMAGE);
		toast.showInfo("Restored default cat photograph.");
	};

	const handleSaveName = (e?: React.FormEvent) => {
		if (e) {
			e.preventDefault();
		}
		const trimmed = tempName.trim();
		if (trimmed) {
			setCatName(trimmed);
			try {
				localStorage.setItem(STORAGE_KEY_NAME, trimmed);
			} catch {
				// ignore
			}
			setIsEditingName(false);
			toast.showSuccess(`Cat name updated to "${trimmed}"!`);
		} else {
			setIsEditingName(false);
			setTempName(catName);
		}
	};

	if (!isVisible) {
		return (
			<div className="w-full flex justify-center lg:justify-end items-center py-4">
				<button
					type="button"
					onClick={handleVisibilityToggle}
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-card/80 hover:bg-card border border-border/60 text-foreground shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
					id="btn-show-cat-photo"
				>
					<Eye className="w-4 h-4 text-primary" />
					<span className="whitespace-nowrap">Show {catName}'s Photo</span>
				</button>
			</div>
		);
	}

	return (
		<div className="relative w-full max-w-[480px] flex flex-col items-center">
			{/* Hidden file input for file upload */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				id="cat-photo-file-input"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) {
						handleFileSelect(file);
						e.target.value = "";
					}
				}}
			/>

			{/* Main Card Frame */}
			<div
				className={`group relative w-full aspect-square rounded-[2rem] p-3 transition-all duration-300 ${
					isDragging
						? "border-2 border-dashed border-primary bg-primary/10 scale-[1.02]"
						: "border border-border/50 bg-card/40 backdrop-blur-md shadow-2xl shadow-primary/5 hover:border-border"
				}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				id="cat-hero-card"
			>
				{/* Inner Image Container */}
				<div className="relative w-full h-full rounded-[1.5rem] overflow-hidden bg-muted/30 select-none">
					<img
						src={photoUrl}
						alt={catName}
						referrerPolicy="no-referrer"
						className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
						onError={() => {
							if (photoUrl !== FALLBACK_CAT_IMAGE) {
								setPhotoUrl(FALLBACK_CAT_IMAGE);
							}
						}}
					/>

					{/* Subtle Vignette Gradient Overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />

					{/* Drag-over indicator overlay */}
					{isDragging && (
						<div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-primary-foreground font-semibold">
							<Upload className="w-10 h-10 animate-bounce" />
							<p className="text-base px-4 py-1.5 rounded-full bg-background/90 text-foreground shadow-md whitespace-nowrap">
								Drop {catName}'s photo here!
							</p>
						</div>
					)}

					{/* Top Action Bar */}
					<div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
						{/* Gallery selector button */}
						<button
							type="button"
							onClick={() => setIsGalleryOpen((prev) => !prev)}
							className="p-2.5 rounded-full bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground backdrop-blur-md shadow-sm border border-border/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
							title="Browse cat photos gallery"
							aria-label="Browse cat photos gallery"
						>
							<ImageIcon className="w-4 h-4" />
						</button>

						{/* Quick Upload Button */}
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="p-2.5 rounded-full bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground backdrop-blur-md shadow-sm border border-border/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
							title="Upload a photo of your cat"
							aria-label="Upload a photo of your cat"
							id="btn-upload-my-cat"
						>
							<Camera className="w-4 h-4" />
						</button>

						{/* Hide/Remove Card Button */}
						<button
							type="button"
							onClick={handleVisibilityToggle}
							className="p-2.5 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-destructive backdrop-blur-md shadow-sm border border-border/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
							title="Remove / Hide this card"
							aria-label="Remove or hide cat picture"
						>
							<EyeOff className="w-4 h-4" />
						</button>
					</div>

					{/* Bottom Details & Controls Overlay */}
					<div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-col gap-2.5 z-20">
						{/* Cat Name & Status Tag */}
						<div className="flex items-center justify-between gap-2">
							{isEditingName ? (
								<form
									onSubmit={handleSaveName}
									className="flex items-center gap-1.5 w-full bg-background/95 rounded-xl p-1 border border-primary/40 shadow-lg"
								>
									<input
										type="text"
										value={tempName}
										onChange={(e) => setTempName(e.target.value)}
										autoFocus={true}
										placeholder="Cat's name"
										className="flex-1 bg-transparent px-2.5 py-1 text-sm font-bold text-foreground outline-none"
									/>
									<button
										type="submit"
										className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
										title="Save name"
									>
										<Check className="w-3.5 h-3.5" />
									</button>
									<button
										type="button"
										onClick={() => {
											setTempName(catName);
											setIsEditingName(false);
										}}
										className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
										title="Cancel"
									>
										<X className="w-3.5 h-3.5" />
									</button>
								</form>
							) : (
								<div className="flex items-center gap-2">
									<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground drop-shadow-xs flex items-center gap-2">
										<span>{catName}</span>
										<button
											type="button"
											onClick={() => {
												setTempName(catName);
												setIsEditingName(true);
											}}
											className="p-1 rounded-md text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
											title="Edit cat's name"
											aria-label="Edit cat's name"
										>
											<Pencil className="w-3.5 h-3.5" />
										</button>
									</h2>
								</div>
							)}

							<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20 backdrop-blur-md whitespace-nowrap">
								<Sparkles className="w-3 h-3" />
								<span>Star Contender</span>
							</span>
						</div>

						{/* Action Buttons Row */}
						<div className="flex items-center gap-2 pt-1">
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:opacity-95 shadow-md active:scale-98 transition-all cursor-pointer whitespace-nowrap"
							>
								<Upload className="w-4 h-4" />
								<span>Upload My Cat</span>
							</button>

							{isCustomPhoto && (
								<button
									type="button"
									onClick={handleResetDefault}
									className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground border border-border/50 backdrop-blur-md active:scale-98 transition-all cursor-pointer whitespace-nowrap"
									title="Reset to default photo"
								>
									<RotateCcw className="w-4 h-4" />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Gallery Drawer / Popover */}
			{isGalleryOpen && (
				<div className="w-full mt-3 p-3 rounded-2xl bg-card/90 backdrop-blur-md border border-border/60 shadow-xl animate-in fade-in slide-in-from-top-2 z-30">
					<div className="flex items-center justify-between mb-2.5 px-1">
						<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Choose from Cat Gallery
						</span>
						<button
							type="button"
							onClick={() => setIsGalleryOpen(false)}
							className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
							title="Close gallery"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					</div>

					<div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-40 overflow-y-auto p-0.5">
						{CAT_IMAGES.map((imgUrl, index) => {
							const isSelected = photoUrl === imgUrl;
							return (
								<button
									key={imgUrl}
									type="button"
									onClick={() => {
										savePhoto(imgUrl);
										setIsGalleryOpen(false);
										toast.showSuccess(`Switched to Cat #${index + 1}!`);
									}}
									className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
										isSelected
											? "border-primary shadow-sm scale-105"
											: "border-transparent hover:border-primary/50 opacity-80 hover:opacity-100"
									}`}
								>
									<img
										src={imgUrl}
										alt={`Cat #${index + 1}`}
										referrerPolicy="no-referrer"
										className="w-full h-full object-cover transition-transform group-hover:scale-110"
									/>
									{isSelected && (
										<div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
											<div className="p-0.5 rounded-full bg-primary text-primary-foreground">
												<Check className="w-3 h-3" />
											</div>
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
