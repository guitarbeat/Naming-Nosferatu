import React, { memo, useEffect, useState } from "react";
import CatImage from "@/shared/components/layout/CatImage";
import { cn } from "@/shared/lib/basic";
import { TIMING } from "@/shared/lib/constants";
import { ZoomIn } from "@/shared/lib/icons";
import type { CardNameProps } from "./Card.types";
import { Card } from "./CardBase";

const CardNameBase = memo(function CardName({
	name,
	description,
	pronunciation,
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
			let x = rect.width / 2;
			let y = rect.height / 2;

			if ("clientX" in event) {
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
		if (pronunciation) {
			label += ` - pronunciation ${pronunciation}`;
		}
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

	return (
		<div className="relative w-full h-full">
			<Card
				as={Component}
				ref={cardRef as React.Ref<HTMLDivElement>}
				className={cn(
					"w-full h-full relative flex flex-col items-center gap-1 text-center font-inherit cursor-pointer overflow-visible transition-all duration-300",
					"backdrop-blur-md rounded-xl border",
					size === "small" ? "p-2 min-h-24" : "p-4 min-h-32",
					isSelected
						? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
						: "border-border/10 bg-gradient-to-br from-foreground/10 to-foreground/5 shadow-lg hover:border-border/20 hover:bg-foreground/10",
					disabled && "opacity-50 cursor-not-allowed filter grayscale",
					isHidden && "opacity-75 bg-chart-4/10 border-chart-4/50 grayscale-[0.4]",
					image && "min-h-[220px]",
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
				aria-describedby={
					pronunciation && description
						? `${getSafeId(name)}-pronunciation ${getSafeId(name)}-description`
						: pronunciation
							? `${getSafeId(name)}-pronunciation`
							: description
								? `${getSafeId(name)}-description`
								: undefined
				}
				aria-labelledby={`${getSafeId(name)}-title`}
				type={isInteractive ? "button" : undefined}
				role={isInteractive ? undefined : "article"}
				variant={isSelected ? "primary" : "default"}
				padding={size === "small" ? "small" : "medium"}
				interactive={isInteractive}
			>
				{isHidden && (
					<div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[10px] font-bold text-background bg-chart-4 rounded-full shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
						🔒 HIDDEN
					</div>
				)}

				{image && (
					<div
						className={cn(
							"relative w-full aspect-square mb-2 rounded-lg overflow-hidden border border-border/10 shadow-inner group/image outline-none focus-visible:ring-2 focus-visible:ring-primary",
							onImageClick && "cursor-pointer",
						)}
						onClick={(e) => {
							if (onImageClick) {
								e.stopPropagation();
								onImageClick(e);
							}
						}}
						role={onImageClick ? "button" : undefined}
						tabIndex={onImageClick ? 0 : undefined}
						onKeyDown={(e) => {
							if (onImageClick && (e.key === "Enter" || e.key === " ")) {
								e.preventDefault();
								e.stopPropagation();
								onImageClick(e as unknown as React.MouseEvent);
							}
						}}
						aria-label={onImageClick ? "Zoom image" : undefined}
					>
						<CatImage
							src={image}
							containerClassName="w-full h-full"
							imageClassName="w-full h-full object-cover scale-125 transition-transform duration-500 hover:scale-110 group-focus-visible/image:scale-110"
						/>
						{onImageClick && (
							<div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 group-focus-visible/image:opacity-100 transition-opacity flex items-center justify-center">
								<ZoomIn className="text-white w-8 h-8 drop-shadow-md" />
							</div>
						)}
					</div>
				)}

				<h3
					className={cn(
						"font-bold leading-tight text-foreground m-0 z-10 tracking-tight",
						size === "small" ? "text-sm" : "text-lg md:text-xl",
						isHidden && "text-chart-4/80",
					)}
					id={`${getSafeId(name)}-title`}
				>
					{name}
				</h3>

				{pronunciation && (
					<p
						id={`${getSafeId(name)}-pronunciation`}
						className={cn(
							"m-0 text-foreground/80 font-medium z-10",
							size === "small" ? "text-[10px]" : "text-xs",
							isHidden && "text-chart-4/70",
						)}
					>
						[{pronunciation}]
					</p>
				)}

				{description && (
					<p
						id={`${getSafeId(name)}-description`}
						className={cn(
							"flex-1 m-0 text-foreground/70 font-normal leading-tight z-10",
							size === "small" ? "text-[10px] min-h-[2.5em]" : "text-xs",
							isHidden && "text-chart-4/60",
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
									className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 bg-foreground/5 border border-foreground/5 rounded-full"
									title="Average Rating"
								>
									⭐ {metadata.rating}
								</span>
							)}
							{metadata.popularity && (
								<span
									className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 bg-foreground/5 border border-foreground/5 rounded-full"
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
										className="px-1.5 py-0.5 text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full"
									>
										{category}
									</span>
								))}
								{metadata.categories.length > 2 && (
									<span className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/40 bg-foreground/5 border border-foreground/5 rounded-full">
										+{metadata.categories.length - 2}
									</span>
								)}
							</div>
						)}
					</div>
				)}

				{shortcutHint && (
					<span
						className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground/30 border border-border/10 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
						aria-hidden="true"
					>
						{shortcutHint}
					</span>
				)}

				{isSelected && (
					<span
						className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-lg animate-in zoom-in spin-in-12 duration-300 z-20"
						aria-hidden="true"
					>
						✓
					</span>
				)}

				{isRippling && isInteractive && (
					<span
						className="absolute rounded-full bg-foreground/20 pointer-events-none animate-ping"
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
});

CardNameBase.displayName = "CardName";

export const CardName = CardNameBase;
