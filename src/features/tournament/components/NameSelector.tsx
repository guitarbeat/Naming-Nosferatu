/**
 * @module NameSelector
 * @description Name selection component with grid and swipe modes, showing cat images from Supabase
 */

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/layout/Button";
import { Card } from "@/layout/Card";
import { Loading } from "@/layout/FeedbackComponents";
import { coreAPI, hiddenNamesAPI } from "@/services/supabase-client/client";
import { CAT_IMAGES, getRandomCatImage } from "@/services/tournament";
import useAppStore from "@/store/appStore";
import type { IdType, NameItem } from "@/types/appTypes";
import { Check, Eye, EyeOff, Heart, X } from "@/utils/icons";
import CatImage from "./CatImage";

interface NameSelectorProps {
	onStart: (selectedNames: NameItem[]) => void;
}

export function NameSelector({ onStart }: NameSelectorProps) {
	const [selectedNames, setSelectedNames] = useState<Set<IdType>>(new Set());
	const isSwipeMode = useAppStore((state) => state.ui.isSwipeMode);
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const userName = useAppStore((state) => state.user.name);
	const [swipedIds, setSwipedIds] = useState<Set<IdType>>(new Set());
	const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(
		null,
	);
	const [dragOffset, setDragOffset] = useState(0);
	const [names, setNames] = useState<NameItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch names from Supabase on mount
	useEffect(() => {
		const fetchNames = async () => {
			try {
				setIsLoading(true);
				const fetchedNames = await coreAPI.getTrendingNames(false);
				setNames(fetchedNames);
			} catch (error) {
				console.error("Failed to fetch names:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchNames();
	}, []);

	const toggleName = (nameId: IdType) => {
		setSelectedNames((prev) => {
			const next = new Set(prev);
			if (next.has(nameId)) {
				next.delete(nameId);
			} else {
				next.add(nameId);
			}
			return next;
		});
	};

	const handleStart = () => {
		if (selectedNames.size < 2) {
			return;
		}
		const selectedNameItems = names.filter((n) => selectedNames.has(n.id));
		onStart(selectedNameItems);
	};

	const handleSwipe = (nameId: IdType, direction: "left" | "right") => {
		if (direction === "right") {
			setSelectedNames((prev) => new Set([...prev, nameId]));
		}
		setSwipedIds((prev) => new Set([...prev, nameId]));
		setTimeout(() => {
			setDragDirection(null);
			setDragOffset(0);
		}, 300);
	};

	const handleDragEnd = (nameId: IdType, info: PanInfo) => {
		const offset = info.offset.x;
		const velocity = info.velocity.x;
		const threshold = 100;
		const velocityThreshold = 500;

		if (
			Math.abs(offset) < threshold &&
			Math.abs(velocity) < velocityThreshold
		) {
			setDragOffset(0);
			return;
		}

		if (offset > threshold || velocity > velocityThreshold) {
			setDragDirection("right");
			handleSwipe(nameId, "right");
		} else {
			setDragDirection("left");
			handleSwipe(nameId, "left");
		}
	};

	const visibleCards = names.filter((name) => !swipedIds.has(name.id));
	const cardsToRender = visibleCards.slice(0, 3);

	const handleToggleHidden = async (
		nameId: IdType,
		isCurrentlyHidden: boolean,
	) => {
		if (!userName) {
			return;
		}
		try {
			if (isCurrentlyHidden) {
				await hiddenNamesAPI.unhideName(userName, nameId);
			} else {
				await hiddenNamesAPI.hideName(userName, nameId);
			}
			// Refresh names list
			const fetchedNames = await coreAPI.getTrendingNames(true); // Include hidden for admins
			setNames(fetchedNames);
		} catch (error) {
			console.error("Failed to toggle hidden status:", error);
		}
	};

	if (isLoading) {
		return (
			<Card padding="xl" shadow="xl" className="max-w-4xl mx-auto">
				<div className="flex items-center justify-center py-20">
					<Loading variant="spinner" text="Loading cat names..." />
				</div>
			</Card>
		);
	}

	return (
		<Card padding="xl" shadow="xl" className="max-w-4xl mx-auto">
			<div className="space-y-6">
				<div className="text-center space-y-2">
					<h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
						Choose Your Contenders
					</h2>
					<p className="text-slate-300">
						{isSwipeMode
							? "Swipe right to select, left to skip • Select at least 2 names"
							: "Click to select names • Select at least 2 names"}
					</p>
					<p className="text-sm text-slate-400">
						Selected: {selectedNames.size} / {names.length}
					</p>
				</div>

				{isSwipeMode ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
						{names.map((nameItem) => {
							const isSelected = selectedNames.has(nameItem.id);
							const catImage = getRandomCatImage(nameItem.id, CAT_IMAGES);
							return (
								<button
									key={nameItem.id}
									type="button"
									onClick={() => toggleName(nameItem.id)}
									className={`relative rounded-xl border-2 transition-all overflow-hidden group ${
										isSelected
											? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20"
											: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
									}`}
								>
									<div
										className="aspect-square w-full relative"
										onClick={(e) => e.stopPropagation()}
									>
										<lightbox-image dialog-id="shared-lightbox-dialog">
											<CatImage
												src={catImage}
												alt={nameItem.name}
												containerClassName="w-full h-full"
												imageClassName="w-full h-full object-cover"
											/>
										</lightbox-image>
									</div>
									<div className="p-3 flex flex-col gap-1">
										<div className="flex items-center justify-between gap-2">
											<span className="font-medium text-white text-sm">
												{nameItem.name}
											</span>
											{isSelected && (
												<div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
													<Check size={14} className="text-white" />
												</div>
											)}
										</div>
										{nameItem.description && (
											<p className="text-xs text-white/60 text-left">
												{nameItem.description}
											</p>
										)}
										{isAdmin && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleToggleHidden(
														nameItem.id,
														nameItem.isHidden || false,
													);
												}}
												className="mt-1 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
											>
												{nameItem.isHidden ? (
													<>
														<Eye size={12} />
														<span>Unhide</span>
													</>
												) : (
													<>
														<EyeOff size={12} />
														<span>Hide</span>
													</>
												)}
											</button>
										)}
									</div>
								</button>
							);
						})}
					</div>
				) : (
					<div
						className="relative w-full flex items-center justify-center"
						style={{ minHeight: "600px" }}
					>
						<AnimatePresence mode="popLayout">
							{visibleCards.length > 0 ? (
								cardsToRender.map((nameItem, index) => {
									const catImage = getRandomCatImage(nameItem.id, CAT_IMAGES);
									return (
										<motion.div
											key={nameItem.id}
											layout={true}
											layoutId={String(nameItem.id)}
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
														handleDragEnd(nameItem.id, info);
													}
												}}
												animate={{
													scale: index === 0 ? 1 : 0.95,
													opacity: index === 0 ? 1 : 0,
													rotate: index === 0 ? dragOffset / 20 : 0,
												}}
												transition={{
													type: "spring",
													stiffness: 300,
													damping: 30,
												}}
												className="w-full max-w-md h-[550px]"
											>
												<Card
													className={`relative flex flex-col items-center justify-between overflow-hidden group transition-all duration-200 h-full ${
														selectedNames.has(nameItem.id)
															? "shadow-[0_0_30px_rgba(34,197,94,0.3)]"
															: ""
													} ${
														index === 0
															? "cursor-grab active:cursor-grabbing shadow-2xl active:scale-95"
															: "pointer-events-none"
													}`}
													variant="default"
													padding="medium"
												>
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
																<div className="flex items-center gap-2 px-6 py-3 bg-red-500/90 backdrop-blur-md rounded-full border-2 border-red-500 shadow-lg rotate-[-20deg]">
																	<X size={24} className="text-white" />
																	<span className="text-white font-black text-lg uppercase">
																		Nope
																	</span>
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
																<div className="flex items-center gap-2 px-6 py-3 bg-green-500/90 backdrop-blur-md rounded-full border-2 border-green-500 shadow-lg rotate-[20deg]">
																	<Heart
																		size={24}
																		className="text-white fill-white"
																	/>
																	<span className="text-white font-black text-lg uppercase">
																		Like
																	</span>
																</div>
															</motion.div>
														</>
													)}

													<div
														className="w-full aspect-square rounded-xl overflow-hidden border-0 mb-4 bg-white/10 backdrop-blur-md flex items-center justify-center relative"
														onClick={(e) => e.stopPropagation()}
													>
														<lightbox-image dialog-id="shared-lightbox-dialog">
															<CatImage
																src={catImage}
																alt={nameItem.name}
																containerClassName="w-full h-full"
																imageClassName="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
															/>
														</lightbox-image>
													</div>

													<div className="text-center pb-4 z-10 w-full">
														<h3 className="font-whimsical text-2xl lg:text-3xl text-white tracking-wide drop-shadow-lg break-words w-full">
															{nameItem.name}
														</h3>
														{nameItem.description && (
															<p
																className="text-white/60 text-sm leading-relaxed max-w-md mt-2 mx-auto overflow-y-auto max-h-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
																tabIndex={0}
																role="region"
																aria-label={`${nameItem.name} description`}
															>
																{nameItem.description}
															</p>
														)}
														{selectedNames.has(nameItem.id) && (
															<div className="flex justify-center mt-3">
																<div className="px-3 py-1 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-full flex items-center gap-2">
																	<Check size={14} className="text-green-500" />
																	<span className="text-green-500 font-bold text-xs tracking-widest uppercase">
																		Selected
																	</span>
																</div>
															</div>
														)}
													</div>
												</Card>
											</motion.div>
										</motion.div>
									);
								})
							) : (
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-center space-y-4">
										<p className="text-2xl font-bold text-white">All done!</p>
										<p className="text-slate-400">
											You've reviewed all names. Ready to start?
										</p>
									</div>
								</div>
							)}
						</AnimatePresence>
					</div>
				)}

				<div className="flex justify-center pt-4">
					<Button
						variant="gradient"
						size="xl"
						onClick={handleStart}
						disabled={selectedNames.size < 2}
						className="px-12"
					>
						Start Tournament ({selectedNames.size} names)
					</Button>
				</div>
			</div>
		</Card>
	);
}
