/**
 * @module CardName
 * @description Specialized card for cat name tiles
 */

import React, { memo, useEffect, useState } from "react";
import CatImage from "@/features/tournament/components/CatImage";
import { cn } from "@/utils/basic";
import { TIMING } from "@/utils/constants";
import { Card } from "./Card";

interface NameMetadata {
	rating?: number;
	popularity?: number;
	tournaments?: number;
	categories?: string[];
	wins?: number;
	losses?: number;
	totalMatches?: number;
	winRate?: number;
	rank?: number;
	description?: string;
	[key: string]: unknown;
}

interface CardNameProps {
	name: string;
	description?: string;
	isSelected?: boolean;
	onClick?: () => void;
	disabled?: boolean;
	shortcutHint?: string;
	className?: string;
	size?: "small" | "medium";
	metadata?: NameMetadata;
	isAdmin?: boolean;
	isHidden?: boolean;
	_onToggleVisibility?: (id: string) => void;
	_onDelete?: (name: unknown) => void;
	onSelectionChange?: (selected: boolean) => void;
	image?: string;
	onImageClick?: (e: React.MouseEvent) => void;
}

const CardNameBase = memo(function CardName({
	name,
	description,
	isSelected,
	onClick,
	disabled = false,
	shortcutHint,
	className = "",
	size = "medium",
	metadata,
	isAdmin = false,
	isHidden = false,
	onSelectionChange,
	image,
	onImageClick,
}: CardNameProps) {
	const [rippleStyle, setRippleStyle] = useState<React.CSSProperties>({});
	const [isRippling, setIsRippling] = useState(false);
	const cardRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isRippling) {
			const timer = setTimeout(() => setIsRippling(false), TIMING.RIPPLE_ANIMATION_DURATION_MS);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isRippling]);

	const handleInteraction = (event: React.MouseEvent | React.KeyboardEvent) => {
		if (disabled) {
			return;
		}

		if (
			event.type === "click" ||
			(event.type === "keydown" &&
				((event as React.KeyboardEvent).key === "Enter" ||
					(event as React.KeyboardEvent).key === " "))
		) {
			event.preventDefault();

			const rect = event.currentTarget.getBoundingClientRect();
			// Fix: Correctly handle type narrowing for MouseEvent vs KeyboardEvent to access clientX/clientY
			let x = rect.width / 2;
			let y = rect.height / 2;

			if ("clientX" in event) {
				// It's a mouse event
				x = event.clientX - rect.left;
				y = event.clientY - rect.top;
			}

			setRippleStyle({
				left: `${x}px`,
				top: `${y}px`,
			});

			setIsRippling(true);

			if (isAdmin && onSelectionChange) {
				onSelectionChange(!isSelected);
			}

			onClick?.();
		}
	};

	const getAriaLabel = () => {
		let label = name;
		if (description) {
			label += ` - ${description}`;
		}
		if (isSelected) {
			label += " - selected";
		}
		if (disabled) {
			label += " - disabled";
		}
		if (isHidden) {
			label += " - hidden";
		}
		return label;
	};

	const getSafeId = (text: string) => {
		return text.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
	};

	const isInteractive = !disabled && (!!onClick || (isAdmin && !!onSelectionChange));
	const Component = isInteractive ? "button" : "div";

	const cardContent = (
		<div className="relative w-full h-full">
			<Card
				as={Component}
				ref={cardRef as React.Ref<HTMLDivElement>}
				className={cn(
					"w-full h-full relative flex flex-col items-center gap-1 text-center font-inherit cursor-pointer overflow-visible transition-all duration-300",
					// Base style additions
					"backdrop-blur-md rounded-xl border",
					size === "small" ? "p-2 min-h-24" : "p-4 min-h-32",
					// State styles
					isSelected
						? "border-purple-500 bg-gradient-to-br from-purple-900/40 to-purple-800/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
						: "border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-lg hover:border-white/20 hover:bg-white/10",
					disabled && "opacity-50 cursor-not-allowed filter grayscale",
					isHidden && "opacity-75 bg-amber-900/20 border-amber-500/50 grayscale-[0.4]",
					image && "min-h-[220px]", // Taller if image
					className,
				)}
				onClick={
					isInteractive ? (handleInteraction as unknown as React.MouseEventHandler) : undefined
				}
				onKeyDown={
					isInteractive ? (handleInteraction as unknown as React.KeyboardEventHandler) : undefined
				}
				// @ts-expect-error - Card props might not fully match HTML attributes
				disabled={isInteractive ? disabled : undefined}
				aria-pressed={isInteractive ? isSelected : undefined}
				aria-label={getAriaLabel()}
				aria-describedby={description ? `${getSafeId(name)}-description` : undefined}
				aria-labelledby={`${getSafeId(name)}-title`}
				type={isInteractive ? "button" : undefined}
				role={isInteractive ? undefined : "article"}
				variant={isSelected ? "primary" : "default"}
				padding={size === "small" ? "small" : "medium"}
				interactive={isInteractive}
			>
				{/* Hidden Badge */}
				{isHidden && (
					<div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[10px] font-bold text-black bg-amber-500 rounded-full shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
						🔒 HIDDEN
					</div>
				)}

				{image && (
					<div
						className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden border border-white/10 shadow-inner group/image"
						onClick={(e) => {
							if (onImageClick) {
								e.stopPropagation();
								onImageClick(e);
							}
						}}
					>
						<CatImage
							src={image}
							containerClassName="w-full h-full"
							imageClassName="w-full h-full object-cover scale-125 transition-transform duration-500 hover:scale-110"
						/>
						{onImageClick && (
							<div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
								<span className="material-symbols-outlined text-white text-3xl drop-shadow-md">
									zoom_in
								</span>
							</div>
						)}
					</div>
				)}

				<h3
					className={cn(
						"font-bold leading-tight text-white m-0 z-10 tracking-tight",
						size === "small" ? "text-sm" : "text-lg md:text-xl",
						isHidden && "text-amber-500/80",
					)}
					id={`${getSafeId(name)}-title`}
				>
					{name}
				</h3>

				{description && (
					<p
						id={`${getSafeId(name)}-description`}
						className={cn(
							"flex-1 m-0 text-white/70 font-normal leading-tight z-10",
							size === "small" ? "text-[10px] min-h-[2.5em]" : "text-xs",
							isHidden && "text-amber-500/60",
						)}
					>
						{description}
					</p>
				)}

				{metadata && (
					<div className="flex flex-col gap-1 mt-auto w-full z-10">
						<div className="flex flex-wrap gap-1 justify-center mt-1">
							{metadata.rating && (
								<span
									className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-white/60 bg-white/5 border border-white/5 rounded-full"
									title="Average Rating"
								>
									⭐ {metadata.rating}
								</span>
							)}
							{metadata.popularity && (
								<span
									className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-white/60 bg-white/5 border border-white/5 rounded-full"
									title="Popularity Score"
								>
									🔥 {metadata.popularity}
								</span>
							)}
						</div>

						{metadata.categories && metadata.categories.length > 0 && (
							<div className="flex flex-wrap gap-1 justify-center mt-1">
								{metadata.categories.slice(0, 2).map((category, index) => (
									<span
										key={index}
										className="px-1.5 py-0.5 text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full"
									>
										{category}
									</span>
								))}
								{metadata.categories.length > 2 && (
									<span className="px-1.5 py-0.5 text-[10px] font-medium text-white/40 bg-white/5 border border-white/5 rounded-full">
										+{metadata.categories.length - 2}
									</span>
								)}
							</div>
						)}
					</div>
				)}

				{shortcutHint && (
					<span
						className="absolute top-2 right-2 text-[10px] font-mono text-white/30 border border-white/10 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
						aria-hidden="true"
					>
						{shortcutHint}
					</span>
				)}

				{isSelected && (
					<span
						className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs font-bold shadow-lg animate-in zoom-in spin-in-12 duration-300 z-20"
						aria-hidden="true"
					>
						✓
					</span>
				)}

				{isRippling && isInteractive && (
					<span
						className="absolute rounded-full bg-white/20 pointer-events-none animate-ping"
						style={{
							...rippleStyle,
							width: "100px",
							height: "100px",
							transform: "translate(-50%, -50%)",
						}}
						aria-hidden="true"
					/>
				)}
			</Card>
		</div>
	);

	return cardContent;
});

CardNameBase.displayName = "CardName";

export const CardName = CardNameBase;
