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
import { memo, useEffect, useRef, useState } from "react";
import { GripVertical, Loader2, Save } from "@/icons";
import { Card } from "@/layout/Card";
import { ErrorManager } from "@/services/errorManager";
import type { NameItem } from "@/types/appTypes";

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
