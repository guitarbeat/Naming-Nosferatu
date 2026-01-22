import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardHeader, Progress, Button, Chip, cn, Divider } from "@heroui/react";
import {
	Heart,
	X,
	Check,
	ChevronLeft,
	ChevronRight,
	GripVertical,
	Save,
	Loader2,
} from "lucide-react";
import CatImage from "@/components/CatImage";
import { ErrorManager } from "@/services/errorManager";
import type { NameItem } from "@/types/components";
import { playSound } from "@/utils/soundManager";
import { getRandomCatImage } from "./TournamentLogic";

/* =========================================================================
   COMPONENTS
   ========================================================================= */

export const SwipeableCards = memo(
	({
		names,
		selectedNames,
		onToggleName,
		showCatPictures,
		imageList,
		onStartTournament,
	}: {
		names: NameItem[];
		selectedNames: NameItem[];
		onToggleName: (name: NameItem) => void;
		showCatPictures: boolean;
		imageList: string[];
		onStartTournament: (names: NameItem[]) => void;
	}) => {
		const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
		const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);
		const [dragOffset, setDragOffset] = useState(0);

		const visibleCards = useMemo(
			() => names.filter((n: NameItem) => !swipedIds.has(String(n.id))),
			[names, swipedIds],
		);
		const cardsToRender = visibleCards.slice(0, 3);
		const isSelected = useCallback(
			(n: NameItem) => selectedNames.some((s: NameItem) => s.id === n.id),
			[selectedNames],
		);

		const handleDragEnd = useCallback(
			(card: NameItem, info: PanInfo) => {
				const offset = info.offset.x;
				const threshold = 100;
				setDragOffset(0);

				if (Math.abs(offset) < threshold) {
					return;
				}

				if (offset > threshold) {
					setDragDirection("right");
					playSound("gameboy-pluck");
					if (!isSelected(card)) {
						onToggleName(card);
					}
				} else {
					setDragDirection("left");
					playSound("wow");
				}
				setSwipedIds((prev) => new Set([...prev, String(card.id)]));
				setTimeout(() => setDragDirection(null), 300);
			},
			[isSelected, onToggleName],
		);

		const progressValue = (swipedIds.size / names.length) * 100;

		return (
			<div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-4">
				{/* Progress Header */}
				<Card className="bg-white/5 border-1 border-white/10 backdrop-blur-xl">
					<CardBody className="p-4 gap-3">
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
					</CardBody>
				</Card>

				{/* Swipe Stack */}
				<div className="relative w-full" style={{ minHeight: "500px" }}>
					<AnimatePresence mode="popLayout">
						{visibleCards.length > 0 ? (
							cardsToRender.map((card: NameItem, index: number) => (
								<motion.div
									key={card.id}
									layout
									layoutId={String(card.id)}
									className="absolute inset-0 flex items-center justify-center"
									style={{ zIndex: 10 - index }}
									exit={{
										opacity: 0,
										x: dragDirection === "right" ? 400 : -400,
										rotate: dragDirection === "right" ? 20 : -20,
										transition: { duration: 0.3 },
									}}
								>
									<motion.div
										drag={index === 0 ? "x" : false}
										dragConstraints={{ left: 0, right: 0 }}
										onDrag={(_, info) => {
											if (index === 0) {
												setDragOffset(info.offset.x);
											}
										}}
										onDragEnd={(_, info) => {
											if (index === 0) {
												handleDragEnd(card, info);
											}
										}}
										animate={{
											y: index * 12,
											scale: 1 - index * 0.04,
											opacity: 1 - index * 0.2,
											rotate: index === 0 ? dragOffset / 20 : 0,
										}}
										transition={{ type: "spring", stiffness: 300, damping: 30 }}
										className="w-full max-w-md"
									>
										<Card
											className={cn(
												"relative overflow-visible border-2 transition-all duration-200",
												isSelected(card)
													? "border-success/50 bg-success/5 shadow-[0_0_30px_rgba(var(--heroui-success-rgb),0.3)]"
													: "border-white/10 bg-white/5",
												index === 0 && "cursor-grab active:cursor-grabbing shadow-2xl",
												index > 0 && "pointer-events-none",
											)}
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

											<CardBody className="p-8 gap-6 items-center text-center">
												{showCatPictures && card.id && (
													<div className="relative w-full aspect-square max-w-xs rounded-3xl overflow-hidden shadow-xl border-4 border-white/10">
														<CatImage src={getRandomCatImage(card.id, imageList)} />
													</div>
												)}

												<div className="flex flex-col gap-3">
													<h2 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
														{card.name}
													</h2>
													{card.description && (
														<p className="text-default-400 text-lg leading-relaxed max-w-md">
															{card.description}
														</p>
													)}
												</div>

												{isSelected(card) && (
													<Chip
														size="lg"
														color="success"
														variant="shadow"
														startContent={<Check size={18} />}
														className="font-bold shadow-success/40"
													>
														Selected for Tournament
													</Chip>
												)}
											</CardBody>
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
								<Card className="bg-white/5 border-1 border-white/10 backdrop-blur-xl">
									<CardBody className="p-12 gap-6 items-center text-center">
										<div className="text-6xl">🎉</div>
										<h2 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
											All Clear!
										</h2>
										<p className="text-default-400 max-w-md">
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
									</CardBody>
								</Card>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Action Buttons */}
				{visibleCards.length > 0 && (
					<div className="flex gap-4 justify-center items-center">
						<Button
							isIconOnly
							size="lg"
							variant="flat"
							className="w-16 h-16 bg-danger/10 hover:bg-danger/20 border-2 border-danger/30 text-danger"
							onClick={() => {
								const card = cardsToRender[0];
								if (card) {
									setDragDirection("left");
									playSound("wow");
									setSwipedIds((prev) => new Set([...prev, String(card.id)]));
									setTimeout(() => setDragDirection(null), 300);
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
							isIconOnly
							size="lg"
							variant="flat"
							className="w-16 h-16 bg-success/10 hover:bg-success/20 border-2 border-success/30 text-success"
							onClick={() => {
								const card = cardsToRender[0];
								if (card) {
									setDragDirection("right");
									playSound("gameboy-pluck");
									if (!isSelected(card)) {
										onToggleName(card);
									}
									setSwipedIds((prev) => new Set([...prev, String(card.id)]));
									setTimeout(() => setDragDirection(null), 300);
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

/* =========================================================================
   ANALYSIS WRAPPERS
   ========================================================================= */

/* =========================================================================
   RANKING ADJUSTMENT
   ========================================================================= */

function haveRankingsChanged(newItems: NameItem[], oldRankings: NameItem[]): boolean {
	if (newItems.length !== oldRankings.length) {
		return true;
	}
	return newItems.some(
		(item, index) =>
			item.name !== oldRankings[index]?.name || item.rating !== oldRankings[index]?.rating,
	);
}

const RankingItemContent = memo(({ item, index }: { item: NameItem; index: number }) => (
	<>
		<div className="rank-badge">{index + 1}</div>
		<div className="card-content">
			<h3 className="name">{item.name}</h3>
			<div className="stats">
				<span className="rating">Rating: {Math.round(item.rating as number)}</span>
			</div>
		</div>
	</>
));
RankingItemContent.displayName = "RankingItemContent";

export const RankingAdjustment = memo(
	({
		rankings,
		onSave,
		onCancel,
	}: {
		rankings: NameItem[];
		onSave: (items: NameItem[]) => Promise<void>;
		onCancel: () => void;
	}) => {
		const [items, setItems] = useState(rankings || []);
		const [saveStatus, setSaveStatus] = useState("");
		const [isDragging, setIsDragging] = useState(false);
		const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
		const isMountedRef = useRef(true);
		const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

		useEffect(() => {
			if (hasUnsavedChanges) {
				return;
			}
			const sorted = [...rankings].sort((a, b) => (b.rating as number) - (a.rating as number));
			if (haveRankingsChanged(sorted, items)) {
				setItems(sorted);
			}
		}, [rankings, hasUnsavedChanges, items]);

		useEffect(() => {
			isMountedRef.current = true;
			if (items && rankings && haveRankingsChanged(items, rankings)) {
				setSaveStatus("saving");
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
				}
				saveTimerRef.current = setTimeout(() => {
					onSave(items)
						.then(() => {
							if (!isMountedRef.current) {
								return;
							}
							setHasUnsavedChanges(false);
							setSaveStatus("success");
							setTimeout(() => {
								if (isMountedRef.current) {
									setSaveStatus("");
								}
							}, 2000);
						})
						.catch((e: unknown) => {
							if (!isMountedRef.current) {
								return;
							}
							setSaveStatus("error");
							ErrorManager.handleError(e, "Save Rankings");
						});
				}, 1000);
			}
			return () => {
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
				}
			};
		}, [items, rankings, onSave]);

		const handleDragEnd = (result: DropResult) => {
			setIsDragging(false);
			if (!result.destination) {
				return;
			}
			const newItems = Array.from(items);
			const [reordered] = newItems.splice(result.source.index, 1);
			if (reordered) {
				newItems.splice(result.destination.index, 0, reordered);
			}
			const adjusted = newItems.map((item: NameItem, index: number) => ({
				...item,
				rating: Math.round(1000 + (1000 * (newItems.length - index)) / newItems.length),
			}));
			setHasUnsavedChanges(true);
			setItems(adjusted);
		};

		return (
			<Card
				className={`ranking-adjustment ${isDragging ? "is-dragging" : ""}`}
				padding="xl"
				shadow="xl"
			>
				<header className="ranking-header">
					<h2>Your Cat Name Rankings</h2>
					{saveStatus && (
						<div className={`save-status ${saveStatus}`}>
							{saveStatus === "saving"
								? "Saving..."
								: saveStatus === "success"
									? "Saved!"
									: "Error saving"}
						</div>
					)}
				</header>
				<div className="rankings-grid">
					<DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
						<Droppable droppableId="rankings">
							{(provided) => (
								<div {...provided.droppableProps} ref={provided.innerRef} className="rankings-list">
									{items.map((item: NameItem, index: number) => (
										<Draggable
											key={item.id || item.name}
											draggableId={String(item.id || item.name)}
											index={index}
										>
											{(provided, snapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													className={`ranking-card ${snapshot.isDragging ? "dragging" : ""}`}
												>
													<RankingItemContent item={item} index={index} />
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</div>
				<div className="adjustment-controls">
					<Button onClick={onCancel} variant="secondary">
						Back to Tournament
					</Button>
				</div>
			</Card>
		);
	},
);
RankingAdjustment.displayName = "RankingAdjustment";
