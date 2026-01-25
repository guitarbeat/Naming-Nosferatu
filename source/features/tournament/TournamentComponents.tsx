import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";

import { Button, CardBody, CardHeader, Chip, cn, Divider, Progress } from "@heroui/react";
import { playSound } from "@utils/soundManager";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
	Check,
	ChevronLeft,
	ChevronRight,
	GripVertical,
	Heart,
	Loader2,
	Save,
	X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { ErrorManager } from "@/services/errorManager";
import type { NameItem } from "@/types/components";
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
				const velocity = info.velocity.x;
				const threshold = 100;
				const velocityThreshold = 500;

				if (Math.abs(offset) < threshold && Math.abs(velocity) < velocityThreshold) {
					setDragOffset(0);
					return;
				}

				if (offset > threshold || velocity > velocityThreshold) {
					setDragDirection("right");
					playSound("gameboy-pluck");
					if (!isSelected(card)) {
						onToggleName(card);
					}
				} else {
					setDragDirection("left");
					playSound("wow");
					if (isSelected(card)) {
						onToggleName(card);
					}
				}
				setSwipedIds((prev) => new Set([...prev, String(card.id)]));
				setTimeout(() => {
					setDragDirection(null);
					setDragOffset(0);
				}, 300);
			},
			[isSelected, onToggleName],
		);

		const progressValue = (swipedIds.size / names.length) * 100;

		return (
			<div className="flex flex-col gap-6 w-full">
				{/* Progress Header */}
				{/* Progress Header */}
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
										transition: { duration: 0.3 },
									}}
								>
									<motion.div
										drag={index === 0 ? "x" : false}
										dragConstraints={{ left: -200, right: 200 }}
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
							isIconOnly={true}
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
	<div className="flex items-center gap-4 w-full">
		{/* Drag Handle */}
		<div className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors cursor-grab active:cursor-grabbing">
			<GripVertical size={20} />
		</div>

		{/* Rank Badge */}
		<Chip
			className="flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white font-bold min-w-[3rem]"
			size="lg"
			variant="flat"
		>
			#{index + 1}
		</Chip>

		{/* Name and Stats */}
		<div className="flex-1 min-w-0">
			<h3 className="text-lg font-semibold text-white truncate mb-1">{item.name}</h3>
			<div className="flex items-center gap-3 text-sm">
				<span className="text-white/60">
					Rating:{" "}
					<span className="text-white/90 font-medium">{Math.round(item.rating as number)}</span>
				</span>
			</div>
		</div>
	</div>
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
				className={cn("w-full max-w-4xl mx-auto", isDragging && "ring-2 ring-purple-500/50")}
				variant="primary"
			>
				<CardHeader className="flex flex-col gap-3 pb-4">
					<div className="flex items-center justify-between w-full">
						<h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
							Your Cat Name Rankings
						</h2>
						{saveStatus && (
							<Chip
								className={cn(
									"transition-all duration-300",
									saveStatus === "saving" &&
										"bg-blue-500/20 border-blue-500/30 text-blue-300 animate-pulse",
									saveStatus === "success" && "bg-green-500/20 border-green-500/30 text-green-300",
									saveStatus === "error" && "bg-red-500/20 border-red-500/30 text-red-300",
								)}
								variant="flat"
								startContent={
									saveStatus === "saving" ? (
										<Loader2 size={14} className="animate-spin" />
									) : saveStatus === "success" ? (
										<Save size={14} />
									) : null
								}
							>
								{saveStatus === "saving"
									? "Saving..."
									: saveStatus === "success"
										? "Saved!"
										: "Error saving"}
							</Chip>
						)}
					</div>
					<p className="text-white/60 text-sm">Drag and drop to reorder your favorite cat names</p>
				</CardHeader>

				<Divider className="bg-white/10" />

				<CardBody className="gap-3 p-6">
					<DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
						<Droppable droppableId="rankings">
							{(provided: any) => (
								<div
									{...provided.droppableProps}
									ref={provided.innerRef}
									className="flex flex-col gap-3"
								>
									{items.map((item: NameItem, index: number) => (
										<Draggable
											key={item.id || item.name}
											draggableId={String(item.id || item.name)}
											index={index}
										>
											{(provided: any, snapshot: any) => (
												<motion.div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: index * 0.05 }}
													className={cn(
														"p-4 rounded-xl transition-all duration-200",
														"bg-gradient-to-br from-white/5 to-white/[0.02]",
														"border border-white/10",
														"hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
														snapshot.isDragging &&
															"shadow-2xl shadow-purple-500/30 border-purple-500/50 scale-105 rotate-2",
													)}
												>
													<RankingItemContent item={item} index={index} />
												</motion.div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</CardBody>

				<Divider className="bg-white/10" />

				<div className="p-6 flex justify-end">
					<Button
						onClick={onCancel}
						variant="flat"
						className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
					>
						Back to Tournament
					</Button>
				</div>
			</Card>
		);
	},
);
RankingAdjustment.displayName = "RankingAdjustment";
