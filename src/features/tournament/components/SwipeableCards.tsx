import { Button, Chip, cn, Progress } from "@heroui/react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { memo, useCallback, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Heart, X } from "@/icons";
import { Card } from "@/layout/Card";
import type { NameItem } from "@/types/appTypes";
import { getRandomCatImage, playSound } from "@/utils/basic";

// Optimized spring physics for smoother interactions
const SMOOTH_SPRING_CONFIG = {
	type: "spring" as const,
	stiffness: 260,
	damping: 20,
	mass: 0.8,
	velocity: 2,
};

const EXIT_SPRING_CONFIG = {
	type: "spring" as const,
	stiffness: 400,
	damping: 25,
	velocity: 50,
};

export const SwipeableCards = memo(
	({
		names,
		selectedNames,
		onToggleName,
		showCatPictures,
		imageList = [],
		onStartTournament,
	}: {
		names: NameItem[];
		selectedNames: NameItem[];
		onToggleName: (name: NameItem) => void;
		showCatPictures: boolean;
		imageList?: string[];
		onStartTournament: (names: NameItem[]) => void;
	}) => {
		const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
		const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);
		const [dragOffset, setDragOffset] = useState(0);

		// Optimized drag state update with batching
		const updateDragState = useCallback(
			(offset: number, direction: "left" | "right" | null = null) => {
				requestAnimationFrame(() => {
					setDragOffset(offset);
					if (direction) {
						setDragDirection(direction);
					}
				});
			},
			[],
		);

		const visibleCards = useMemo(
			() => names.filter((n: NameItem) => !swipedIds.has(String(n.id))),
			[names, swipedIds],
		);
		const cardsToRender = visibleCards.slice(0, 3);
		const currentCard = cardsToRender[0];
		const isSelected = useCallback(
			(n: NameItem) => selectedNames.some((s: NameItem) => s.id === n.id),
			[selectedNames],
		);

		const handleDragEnd = useCallback(
			(card: NameItem, info: PanInfo) => {
				const offset = info.offset.x;
				const velocity = info.velocity.x;
				const threshold = 100;
				const velocityThreshold = 500;

				if (Math.abs(offset) < threshold && Math.abs(velocity) < velocityThreshold) {
					updateDragState(0);
					return;
				}

				const isRightSwipe = offset > threshold || velocity > velocityThreshold;
				const direction = isRightSwipe ? "right" : "left";

				updateDragState(0, direction);
				playSound(isRightSwipe ? "gameboy-pluck" : "wow");

				if (isRightSwipe && !isSelected(card)) {
					onToggleName(card);
				} else if (!isRightSwipe && isSelected(card)) {
					onToggleName(card);
				}

				setSwipedIds((prev) => new Set([...prev, String(card.id)]));

				// Dynamic reset delay based on velocity
				const baseDelay = 200;
				const velocityFactor = Math.min(Math.abs(velocity) * 0.05, 150);
				const resetDelay = Math.max(baseDelay, 350 - velocityFactor);

				setTimeout(() => {
					requestAnimationFrame(() => {
						setDragDirection(null);
						setDragOffset(0);
					});
				}, resetDelay);
			},
			[isSelected, onToggleName, updateDragState],
		);

		const progressValue = (swipedIds.size / names.length) * 100;

		return (
			<div className="flex flex-col gap-6 w-full">
				<Card padding="small" variant="default">
					<div className="gap-3 flex flex-col">
						<div className="flex justify-between items-center">
							<span className="text-sm font-bold text-default-500 uppercase tracking-wider">
								Progress
							</span>
							<Chip size="sm" variant="flat" color="primary" className="font-bold">
								{swipedIds.size} / {names.length}
							</Chip>
						</div>
						<Progress
							value={progressValue}
							color="primary"
							className="h-2"
							classNames={{
								indicator: "bg-gradient-to-r from-primary to-secondary",
							}}
						/>
					</div>
				</Card>

				{/* Swipe Stack */}
				<div className="relative w-full" style={{ minHeight: "500px" }}>
					<AnimatePresence mode="popLayout">
						{visibleCards.length > 0 ? (
							cardsToRender.map((card: NameItem, index: number) => (
								<motion.div
									key={card.id}
									layout={true}
									layoutId={String(card.id)}
									className="absolute inset-0 flex items-center justify-center"
									style={{ zIndex: 10 - index }}
									exit={{
										opacity: 0,
										x: dragDirection === "right" ? 400 : -400,
										rotate: dragDirection === "right" ? 20 : -20,
										transition: EXIT_SPRING_CONFIG,
									}}
								>
									<motion.div
										drag={index === 0 ? "x" : false}
										dragConstraints={{ left: -250, right: 250 }}
										onDrag={(_, info) => {
											if (index === 0) {
												updateDragState(info.offset.x);
											}
										}}
										onDragEnd={(_, info) => {
											if (index === 0) {
												handleDragEnd(card, info);
											}
										}}
										animate={{
											y: index * 10,
											scale: 1 - index * 0.03,
											opacity: 1 - index * 0.15,
											rotate: index === 0 ? dragOffset / 30 : 0,
											x: index === 0 ? dragOffset * 0.1 : 0,
										}}
										transition={SMOOTH_SPRING_CONFIG}
										whileDrag={{
											scale: 1.02,
											transition: { duration: 0.15 },
										}}
										className="w-full max-w-md"
									>
										<Card
											className={cn(
												"relative flex flex-col items-center justify-between overflow-hidden group transition-all duration-200 h-full",
												isSelected(card) ? "shadow-[0_0_30px_rgba(34,197,94,0.3)]" : "",
												index === 0 &&
													"cursor-grab active:cursor-grabbing shadow-2xl active:scale-95",
												index > 0 && "pointer-events-none",
											)}
											variant="default"
											padding="medium"
										>
											{/* Swipe Indicators */}
											{index === 0 && (
												<>
													<motion.div
														className="absolute left-8 top-1/2 -translate-y-1/2 z-10"
														initial={{ opacity: 0, scale: 0.8 }}
														animate={{
															opacity: dragOffset < -50 ? 1 : 0,
															scale: dragOffset < -50 ? 1 : 0.8,
														}}
													>
														<div className="flex items-center gap-2 px-6 py-3 bg-danger/90 backdrop-blur-md rounded-full border-2 border-danger shadow-lg rotate-[-20deg]">
															<X size={24} className="text-white" />
															<span className="text-white font-black text-lg uppercase">Nope</span>
														</div>
													</motion.div>

													<motion.div
														className="absolute right-8 top-1/2 -translate-y-1/2 z-10"
														initial={{ opacity: 0, scale: 0.8 }}
														animate={{
															opacity: dragOffset > 50 ? 1 : 0,
															scale: dragOffset > 50 ? 1 : 0.8,
														}}
													>
														<div className="flex items-center gap-2 px-6 py-3 bg-success/90 backdrop-blur-md rounded-full border-2 border-success shadow-lg rotate-[20deg]">
															<Heart size={24} className="text-white fill-white" />
															<span className="text-white font-black text-lg uppercase">Like</span>
														</div>
													</motion.div>
												</>
											)}

											{/* Image Container */}
											<div className="w-full aspect-square rounded-xl overflow-hidden border-0 mb-4 bg-white/10 backdrop-blur-md flex items-center justify-center">
												{showCatPictures && card.id && imageList.length > 0 ? (
													<div
														className="w-full h-full bg-cover bg-center opacity-80 group-hover:scale-110 transition-transform duration-700"
														style={{
															backgroundImage: `url('${getRandomCatImage(card.id, imageList)}')`,
														}}
													/>
												) : (
													<span className="text-white/20 text-6xl font-bold select-none">
														{card.name[0]?.toUpperCase() || "?"}
													</span>
												)}
											</div>

											{/* Text Content */}
											<div className="text-center pb-4 z-10 w-full">
												<h3 className="font-whimsical text-2xl lg:text-3xl text-white tracking-wide drop-shadow-lg break-words w-full">
													{card.name}
												</h3>
												{card.description && (
													<p className="text-white/60 text-sm leading-relaxed max-w-md mt-2 mx-auto">
														{card.description}
													</p>
												)}
												{isSelected(card) && (
													<div className="flex justify-center mt-3">
														<div className="px-3 py-1 bg-success/20 backdrop-blur-md border border-success/30 rounded-full flex items-center gap-2">
															<Check size={14} className="text-success" />
															<span className="text-success font-bold text-xs tracking-widest uppercase">
																Selected
															</span>
														</div>
													</div>
												)}
											</div>
										</Card>
									</motion.div>
								</motion.div>
							))
						) : (
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="flex flex-col items-center justify-center gap-6 p-12"
							>
								<Card variant="default" className="flex flex-col items-center text-center gap-6">
									<div className="text-6xl">🎉</div>
									<h2 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
										All Clear!
									</h2>
									<p className="text-white/60 max-w-md">
										You've reviewed all {names.length} names. Ready to start the tournament?
									</p>
									{selectedNames.length >= 2 && (
										<Button
											size="lg"
											color="primary"
											variant="shadow"
											onClick={() => onStartTournament(selectedNames)}
											className="font-bold text-lg px-8 shadow-primary/40"
										>
											Start Tournament ({selectedNames.length} names)
										</Button>
									)}
								</Card>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Action Buttons */}
				{visibleCards.length > 0 && (
					<div className="flex gap-4 justify-center items-center">
						<Button
							isIconOnly={true}
							size="lg"
							variant="flat"
							className="w-16 h-16 bg-danger/10 hover:bg-danger/20 border-2 border-danger/30 text-danger"
							aria-label={currentCard ? `Discard ${currentCard.name}` : "Discard"}
							onClick={() => {
								if (currentCard) {
									updateDragState(0, "left");
									playSound("wow");
									setSwipedIds((prev) => new Set([...prev, String(currentCard.id)]));
									setTimeout(() => {
										requestAnimationFrame(() => {
											setDragDirection(null);
											setDragOffset(0);
										});
									}, 250);
								}
							}}
						>
							<X size={28} />
						</Button>

						<Button
							size="lg"
							color="primary"
							variant="shadow"
							onClick={() => onStartTournament(selectedNames)}
							disabled={selectedNames.length < 2}
							className="font-bold px-8 shadow-primary/40"
						>
							Start Tournament ({selectedNames.length})
						</Button>

						<Button
							isIconOnly={true}
							size="lg"
							variant="flat"
							className="w-16 h-16 bg-success/10 hover:bg-success/20 border-2 border-success/30 text-success"
							aria-label={currentCard ? `Keep ${currentCard.name}` : "Keep"}
							onClick={() => {
								if (currentCard) {
									updateDragState(0, "right");
									playSound("gameboy-pluck");
									if (!isSelected(currentCard)) {
										onToggleName(currentCard);
									}
									setSwipedIds((prev) => new Set([...prev, String(currentCard.id)]));
									setTimeout(() => {
										requestAnimationFrame(() => {
											setDragDirection(null);
											setDragOffset(0);
										});
									}, 250);
								}
							}}
						>
							<Heart size={28} className="fill-success" />
						</Button>
					</div>
				)}

				{/* Swipe Hint */}
				{visibleCards.length > 0 && swipedIds.size === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className="flex items-center justify-center gap-3 text-default-400 text-sm"
					>
						<ChevronLeft size={16} className="animate-pulse" />
						<span className="font-medium">Swipe or tap buttons to review names</span>
						<ChevronRight size={16} className="animate-pulse" />
					</motion.div>
				)}
			</div>
		);
	},
);
SwipeableCards.displayName = "SwipeableCards";
