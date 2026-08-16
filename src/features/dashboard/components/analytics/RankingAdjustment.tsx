import {
	DragDropContext,
	Draggable,
	type DraggableProvided,
	type DraggableStateSnapshot,
	Droppable,
	type DroppableProvided,
	type DropResult,
} from "@hello-pangea/dnd";
import { Button, CardBody, CardHeader, Chip, cn, Divider } from "@heroui/react";
import { motion } from "framer-motion";
import { GripVertical, Loader2, Save } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { ErrorManager } from "@/shared/services/errorManager";
import type { NameItem } from "@/shared/types";

function haveRankingsChanged(newItems: NameItem[], oldRankings: NameItem[]): boolean {
	if (newItems === oldRankings) {
		return false;
	}
	const len = newItems.length;
	if (len !== oldRankings.length) {
		return true;
	}
	// ⚡ Bolt Optimization: Replace `.some()` with standard `for` loop + reference equality check.
	// Avoids callback execution overhead and short-circuits instantly if objects are the same reference.
	for (let i = 0; i < len; i++) {
		const newItem = newItems[i] as NameItem;
		const oldItem = oldRankings[i] as NameItem;
		if (newItem === oldItem) {
			continue;
		}
		if (!oldItem || newItem.name !== oldItem.name || newItem.rating !== oldItem.rating) {
			return true;
		}
	}
	return false;
}

const RankingItemContent = memo(({ item, index }: { item: NameItem; index: number }) => {
	const medalColors = {
		0: "from-yellow-500 to-amber-600",
		1: "from-slate-300 to-slate-500",
		2: "from-amber-700 to-orange-800",
	};
	const medalBg =
		index < 3 ? medalColors[index as keyof typeof medalColors] : "from-primary/20 to-accent/20";
	const medalBorder = index < 3 ? "border-yellow-600/50" : "border-primary/30";
	const medalText = index < 3 ? "text-white" : "text-foreground";

	return (
		<div className="flex items-center gap-4 w-full">
			{/* Drag Handle */}
			<div className="flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors cursor-grab active:cursor-grabbing">
				<GripVertical size={20} />
			</div>

			{/* Rank Badge */}
			<Chip
				className={`flex-shrink-0 bg-gradient-to-br ${medalBg} border ${medalBorder} ${medalText} font-bold min-w-[3rem] shadow-sm`}
				size="lg"
				variant="flat"
			>
				{index < 3 ? ["🥇", "🥈", "🥉"][index] : `#${index + 1}`}
			</Chip>

			{/* Name and Stats */}
			<div className="flex-1 min-w-0">
				<h3 className="text-lg font-semibold text-foreground truncate mb-1">{item.name}</h3>
				<div className="flex items-center gap-4 text-sm">
					<div className="flex items-center gap-1.5">
						<span className="text-muted-foreground">Rating:</span>
						<span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
							{Math.round(item.rating as number)}
						</span>
					</div>
					{item.wins ? (
						<div className="flex items-center gap-1.5">
							<span className="text-muted-foreground">W/L:</span>
							<span className="text-accent font-medium">{item.wins}W</span>
							<span className="text-destructive/70 font-medium">{item.losses}L</span>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
});
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
		const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const onSaveRef = useRef(onSave);
		onSaveRef.current = onSave;

		useEffect(() => {
			isMountedRef.current = true;

			return () => {
				isMountedRef.current = false;
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
					saveTimerRef.current = null;
				}
				if (saveStatusTimerRef.current) {
					clearTimeout(saveStatusTimerRef.current);
					saveStatusTimerRef.current = null;
				}
			};
		}, []);

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
			if (!hasUnsavedChanges) {
				return;
			}
			if (items && rankings && haveRankingsChanged(items, rankings)) {
				setSaveStatus("saving");
				if (saveTimerRef.current) {
					clearTimeout(saveTimerRef.current);
					saveTimerRef.current = null;
				}
				if (saveStatusTimerRef.current) {
					clearTimeout(saveStatusTimerRef.current);
					saveStatusTimerRef.current = null;
				}
				saveTimerRef.current = setTimeout(() => {
					onSaveRef
						.current(items)
						.then(() => {
							if (!isMountedRef.current) {
								return;
							}
							setHasUnsavedChanges(false);
							setSaveStatus("success");
							saveStatusTimerRef.current = setTimeout(() => {
								if (isMountedRef.current) {
									setSaveStatus("");
								}
								saveStatusTimerRef.current = null;
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
					saveTimerRef.current = null;
				}
				if (saveStatusTimerRef.current) {
					clearTimeout(saveStatusTimerRef.current);
					saveStatusTimerRef.current = null;
				}
			};
		}, [items, rankings, hasUnsavedChanges]);

		const handleDragEnd = (result: DropResult) => {
			setIsDragging(false);
			if (!result.destination) {
				return;
			}
			const length = items.length;
			const src = result.source.index;
			const dst = result.destination.index;
			const adjusted = new Array(length);
			for (let index = 0; index < length; index++) {
				let item: NameItem;
				if (index === dst) {
					item = items[src] as NameItem;
				} else if (src < dst && index >= src && index < dst) {
					item = items[index + 1] as NameItem;
				} else if (src > dst && index > dst && index <= src) {
					item = items[index - 1] as NameItem;
				} else {
					item = items[index] as NameItem;
				}
				adjusted[index] = {
					...item,
					rating: Math.round(1000 + (1000 * (length - index)) / length),
				};
			}
			setHasUnsavedChanges(true);
			setItems(adjusted);
		};

		return (
			<div className={cn("w-full max-w-4xl mx-auto", isDragging && "ring-2 ring-primary/50")}>
				<CardHeader className="flex flex-col gap-3 pb-4">
					<div className="flex items-center justify-between w-full">
						<h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
							Your Cat Name Rankings
						</h2>
						{saveStatus && (
							<Chip
								className={cn(
									"transition-all duration-300",
									saveStatus === "saving" &&
										"bg-chart-5/20 border-chart-5/30 text-chart-5 animate-pulse",
									saveStatus === "success" && "bg-chart-2/20 border-chart-2/30 text-chart-2",
									saveStatus === "error" &&
										"bg-destructive/20 border-destructive/30 text-destructive",
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
					<p className="text-muted-foreground text-sm">
						Drag and drop to reorder your favorite cat names
					</p>
				</CardHeader>

				<Divider className="bg-border/10" />

				<CardBody className="gap-3 p-6">
					<DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
						<Droppable droppableId="rankings">
							{(provided: DroppableProvided) => (
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
											{(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
												>
													<motion.div
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, scale: 0.95 }}
														className={cn(
															"py-3 transition-all duration-200 border-b border-border/10",
															snapshot.isDragging && "bg-foreground/5 scale-105 rotate-2",
														)}
													>
														<RankingItemContent item={item} index={index} />
													</motion.div>
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</DragDropContext>
				</CardBody>

				<Divider className="bg-border/10" />

				<div className="p-6 flex justify-end">
					<Button
						onClick={onCancel}
						variant="flat"
						className="bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border/10"
					>
						Back to Tournament
					</Button>
				</div>
			</div>
		);
	},
);
RankingAdjustment.displayName = "RankingAdjustment";
