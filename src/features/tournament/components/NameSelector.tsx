/**
 * @module NameSelector
 * @description Name selection component with grid and swipe modes, showing cat images from Supabase
 */

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNamesCache } from "@/hooks/useNamesCache";
import Button from "@/layout/Button";
import { Card } from "@/layout/Card";
import { Loading } from "@/layout/FeedbackComponents";
<<<<<<< HEAD
import { Lightbox } from "@/layout/Lightbox";
import { coreAPI, hiddenNamesAPI } from "@/services/supabase-client/client";
=======
import { coreAPI, hiddenNamesAPI } from "@/services/supabase/client";
import { CAT_IMAGES, getRandomCatImage } from "@/services/tournament";
>>>>>>> 7ce97e82 (refactor: consolidate duplicate analytics and supabase services)
import useAppStore from "@/store/appStore";
import type { IdType, NameItem } from "@/types/appTypes";
import { getRandomCatImage } from "@/utils/basic";
import { CAT_IMAGES } from "@/utils/constants";
import { Check, Eye, EyeOff, Heart, X, ZoomIn } from "@/utils/icons";
import CatImage from "./CatImage";

export function NameSelector() {
	const [selectedNames, setSelectedNames] = useState<Set<IdType>>(new Set());
	const isSwipeMode = useAppStore((state) => state.ui.isSwipeMode);
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const userName = useAppStore((state) => state.user.name);
	const tournamentActions = useAppStore((state) => state.tournamentActions);
	const [swipedIds, setSwipedIds] = useState<Set<IdType>>(new Set());
	const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);
	const [dragOffset, setDragOffset] = useState(0);
	const [names, setNames] = useState<NameItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const [togglingHidden, setTogglingHidden] = useState<Set<IdType>>(new Set());
	const { getCachedData, setCachedData, invalidateCache } = useNamesCache();
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const [swipeHistory, setSwipeHistory] = useState<
		Array<{ id: IdType; direction: "left" | "right"; timestamp: number }>
	>([]);

	// Memoize cat images to avoid unnecessary recalculations
	const allCatImages = useMemo(
		() => names.map((nameItem) => getRandomCatImage(nameItem.id, CAT_IMAGES)),
		[names],
	);

	// Fetch names from Supabase on mount with retry mechanism and caching
	useEffect(() => {
		const fetchNames = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Try to get cached data first
				const cachedData = getCachedData(false);
				if (cachedData && retryCount === 0) {
					setNames(cachedData);
					setIsLoading(false);
					return;
				}

				const fetchedNames = await coreAPI.getTrendingNames(false);
				setNames(fetchedNames);
				setCachedData(fetchedNames, false);
				setRetryCount(0); // Reset retry count on success
			} catch (error) {
				console.error("Failed to fetch names:", error);
				const errorMessage = error instanceof Error ? error.message : "Failed to load names";
				setError(errorMessage);

				// Auto-retry for network errors (max 3 retries)
				if (retryCount < 2 && errorMessage.includes("network")) {
					setTimeout(
						() => {
							setRetryCount((prev) => prev + 1);
						},
						1000 * (retryCount + 1),
					); // Exponential backoff
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchNames();
	}, [retryCount, getCachedData, setCachedData]);

<<<<<<< HEAD
	const toggleName = useCallback(
		(nameId: IdType) => {
			setSelectedNames((prev) => {
				const next = new Set(prev);
				if (next.has(nameId)) {
					next.delete(nameId);
				} else {
					next.add(nameId);
				}

				// Sync with global store
				const selectedNameItems = names.filter((n) => next.has(n.id));
				tournamentActions.setSelection(selectedNameItems);

				return next;
			});
		},
		[names, tournamentActions],
	);
=======
	const toggleName = (nameId: IdType) => {
		setSelectedNames((prev) => {
			const next = new Set(prev);
			if (next.has(nameId)) {
				next.delete(nameId);
			} else {
				next.add(nameId);
			}

			// Sync with global store
			const selectedNameItems = names.filter((n) => next.has(n.id));
			tournamentActions.setSelection(selectedNameItems);

			return next;
		});
	};
>>>>>>> 9881bea (style: fix biome linting issues)

	// Add haptic feedback for better UX
	const handleToggleName = useCallback(
		(nameId: IdType) => {
			// Add subtle haptic feedback if supported
			if ("vibrate" in navigator) {
				navigator.vibrate(50);
			}
			toggleName(nameId);
		},
		[toggleName],
	);

	// Trigger haptic feedback if available
	const triggerHaptic = useCallback(() => {
		if ("vibrate" in navigator) {
			navigator.vibrate(50);
		}
	}, []);

	const handleSwipe = useCallback(
		(nameId: IdType, direction: "left" | "right", velocity: number = 0) => {
			if (direction === "right") {
				setSelectedNames((prev) => {
					const next = new Set(prev);
					next.add(nameId);
					// Sync with global store
					const selectedNameItems = names.filter((n) => next.has(n.id));
					tournamentActions.setSelection(selectedNameItems);
					return next;
				});
			}
			setSwipedIds((prev) => {
				const next = new Set(prev);
				next.add(nameId);
				return next;
			});
			setSwipeHistory((prev) => [...prev, { id: nameId, direction, timestamp: Date.now() }]);
			triggerHaptic();

			// Reset drag state with velocity-based timing
			const resetDelay = Math.max(200, Math.min(400, 400 - Math.abs(velocity) * 0.1));
			setTimeout(() => {
				setDragDirection(null);
				setDragOffset(0);
			}, resetDelay);
		},
		[triggerHaptic, names, tournamentActions],
	);

	const handleDragEnd = useCallback(
		(nameId: IdType, info: PanInfo) => {
			const offset = info.offset.x;
			const velocity = info.velocity.x;
			const threshold = 100;
			const velocityThreshold = 500;

			if (Math.abs(offset) < threshold && Math.abs(velocity) < velocityThreshold) {
				// Snap back to center with spring animation
				setDragOffset(0);
				return;
			}

			// Determine direction based on offset and velocity
			const isRightSwipe = offset > threshold || velocity > velocityThreshold;
			const direction = isRightSwipe ? "right" : "left";

			setDragDirection(direction);
			handleSwipe(nameId, direction, Math.abs(velocity));
		},
		[handleSwipe],
	);

	// Undo last swipe functionality
	const handleUndo = useCallback(() => {
		if (swipeHistory.length === 0) {
			return;
		}

		const lastSwipe = swipeHistory[swipeHistory.length - 1];
		if (!lastSwipe) {
			return;
		}

		setSwipeHistory((prev) => prev.slice(0, -1));
		setSwipedIds((prev) => {
			const next = new Set(prev);
			next.delete(lastSwipe.id);
			return next;
		});

<<<<<<< HEAD
		// If it was a right swipe, remove from selected names and sync with store
		if (lastSwipe.direction === "right") {
			setSelectedNames((prev) => {
				const next = new Set(prev);
				next.delete(lastSwipe.id);
				// Sync with global store
				const selectedNameItems = names.filter((n) => next.has(n.id));
				tournamentActions.setSelection(selectedNameItems);
				return next;
			});
=======
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

		if (Math.abs(offset) < threshold && Math.abs(velocity) < velocityThreshold) {
			setDragOffset(0);
			return;
>>>>>>> 7ce97e82 (refactor: consolidate duplicate analytics and supabase services)
		}

		triggerHaptic();
	}, [swipeHistory, triggerHaptic, names, tournamentActions]);

	const visibleCards = names.filter((name) => !swipedIds.has(name.id));
	const cardsToRender = visibleCards.slice(0, 3);

<<<<<<< HEAD
	// Create a mapping from name id to image index for efficient lookup
	const nameIndexMap = useMemo(() => {
		const map = new Map<IdType, number>();
		names.forEach((name, index) => {
			map.set(name.id, index);
		});
		return map;
	}, [names]);

	// Keyboard navigation for swipe mode
	useEffect(() => {
		if (!isSwipeMode) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't handle keyboard events if lightbox is open
			if (lightboxOpen) {
				return;
			}

			const currentCard = visibleCards[0];
			if (!currentCard) {
				return;
			}

			switch (e.key) {
				case "ArrowLeft":
				case "a":
				case "A":
					e.preventDefault();
					setDragDirection("left");
					handleSwipe(currentCard.id, "left");
					break;
				case "ArrowRight":
				case "d":
				case "D":
					e.preventDefault();
					setDragDirection("right");
					handleSwipe(currentCard.id, "right");
					break;
				case "z":
				case "Z":
					if (e.ctrlKey || e.metaKey) {
						e.preventDefault();
						handleUndo();
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSwipeMode, visibleCards, handleSwipe, handleUndo, lightboxOpen]);

	const handleOpenLightbox = useCallback(
		(nameId: IdType) => {
			const index = names.findIndex((n) => n.id === nameId);
			if (index !== -1) {
				setLightboxIndex(index);
				setLightboxOpen(true);
			}
		},
		[names],
	);

=======
>>>>>>> 7ce97e82 (refactor: consolidate duplicate analytics and supabase services)
	const handleToggleHidden = async (nameId: IdType, isCurrentlyHidden: boolean) => {
		if (!userName) {
			return;
		}

		// Add confirmation for destructive actions
		const action = isCurrentlyHidden ? "unhide" : "hide";
		if (!confirm(`Are you sure you want to ${action} this name?`)) {
			return;
		}

		// Set loading state for this specific name
		setTogglingHidden((prev: Set<IdType>) => new Set([...prev, nameId]));

		try {
			// Optimistic update
			setNames((prev) =>
				prev.map((name) => (name.id === nameId ? { ...name, isHidden: !isCurrentlyHidden } : name)),
			);

			if (isCurrentlyHidden) {
				await hiddenNamesAPI.unhideName(userName, nameId);
			} else {
				await hiddenNamesAPI.hideName(userName, nameId);
			}

			// Invalidate cache to ensure fresh data
			invalidateCache();

			// Optimistic refresh - only if needed
			const fetchedNames = await coreAPI.getTrendingNames(true);
			setNames(fetchedNames);
		} catch (error) {
			// Revert optimistic update on error
			setNames((prev) =>
				prev.map((name) => (name.id === nameId ? { ...name, isHidden: isCurrentlyHidden } : name)),
			);

			console.error("Failed to toggle hidden status:", error);
			// Show user-friendly error message
			alert(`Failed to ${action} name. Please try again.`);
		} finally {
			// Clear loading state
			setTogglingHidden((prev: Set<IdType>) => {
				const newSet = new Set(prev);
				newSet.delete(nameId);
				return newSet;
			});
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

	if (error) {
		return (
			<Card padding="xl" shadow="xl" className="max-w-4xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 space-y-4">
					<div className="text-red-400 text-center">
						<p className="text-lg font-medium">Failed to load names</p>
						<p className="text-sm opacity-75 mt-1">{error}</p>
					</div>
					<Button onClick={() => setRetryCount((prev) => prev + 1)} variant="outline" size="small">
						Try Again
					</Button>
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
							? "Swipe right to select, left to skip • Use arrow keys or A/D • Ctrl+Z to undo • Select at least 2 names"
							: "Click to select names • Select at least 2 names"}
					</p>
					<div className="flex items-center justify-center gap-4 text-sm text-slate-400">
						<span>
							Selected: {selectedNames.size} / {names.length}
						</span>
						{isSwipeMode && swipeHistory.length > 0 && (
							<Button
								onClick={handleUndo}
								variant="outline"
								size="small"
								className="px-3 py-1 text-xs"
							>
								Undo Last ({swipeHistory.length})
							</Button>
						)}
					</div>
				</div>

				{isSwipeMode ? (
<<<<<<< HEAD
=======
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
											<span className="font-medium text-white text-sm">{nameItem.name}</span>
											{isSelected && (
												<div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
													<Check size={14} className="text-white" />
												</div>
											)}
										</div>
										{nameItem.description && (
											<p className="text-xs text-white/60 text-left">{nameItem.description}</p>
										)}
										{isAdmin && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleToggleHidden(nameItem.id, nameItem.isHidden || false);
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
>>>>>>> 7ce97e82 (refactor: consolidate duplicate analytics and supabase services)
					<div
						className="relative w-full flex items-center justify-center"
						style={{ minHeight: "600px" }}
					>
						<AnimatePresence mode="popLayout">
							{visibleCards.length > 0 ? (
								cardsToRender.map((nameItem, index) => {
									const imageIndex = nameIndexMap.get(nameItem.id);
									const catImage =
										imageIndex !== undefined
											? allCatImages[imageIndex]
											: getRandomCatImage(nameItem.id, CAT_IMAGES);
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
												rotate: dragDirection === "right" ? 25 : -25,
												scale: 0.8,
												transition: {
													type: "spring",
													stiffness: 400,
													damping: 25,
													velocity: 50,
												},
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
													opacity: 1,
													rotate: index === 0 ? dragOffset / 25 : 0,
													x: index === 0 ? dragOffset * 0.1 : 0,
												}}
												transition={{
													type: "spring",
													stiffness: 200,
													damping: 20,
													mass: 0.8,
												}}
												whileDrag={{
													scale: 1.05,
													transition: { duration: 0.2 },
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
													variant="filled"
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
																	<Heart size={24} className="text-white fill-white" />
																	<span className="text-white font-black text-lg uppercase">
																		Like
																	</span>
																</div>
															</motion.div>
														</>
													)}

													<div className="w-full aspect-square rounded-xl overflow-hidden border-0 mb-4 bg-white/10 backdrop-blur-md flex items-center justify-center relative">
														<CatImage
															src={catImage}
															alt={nameItem.name}
															containerClassName="w-full h-full"
															imageClassName="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
														/>
														{index === 0 && (
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	handleOpenLightbox(nameItem.id);
																}}
																className="absolute top-3 right-3 p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-20"
																aria-label="View full size"
															>
																<ZoomIn size={18} />
															</button>
														)}
													</div>

													<div className="text-center pb-4 z-10 w-full">
														<h3 className="font-whimsical text-2xl lg:text-3xl text-white tracking-wide drop-shadow-lg break-words w-full">
															{nameItem.name}
														</h3>
														{nameItem.description && (
															<p className="text-white/60 text-sm leading-relaxed max-w-md mt-2 mx-auto line-clamp-3">
																{nameItem.description}
															</p>
														)}
														{isAdmin && (
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	handleToggleHidden(nameItem.id, nameItem.isHidden || false);
																}}
																disabled={togglingHidden.has(nameItem.id)}
																className={`mt-2 flex items-center gap-1 text-xs transition-colors mx-auto ${
																	togglingHidden.has(nameItem.id)
																		? "text-slate-500 cursor-not-allowed"
																		: "text-amber-400 hover:text-amber-300"
																}`}
															>
																{togglingHidden.has(nameItem.id) ? (
																	<>
																		<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
																		<span>Processing...</span>
																	</>
																) : nameItem.isHidden ? (
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
										<p className="text-slate-400">You've reviewed all names. Ready to start?</p>
									</div>
								</div>
							)}
						</AnimatePresence>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
						{names.map((nameItem) => {
							const isSelected = selectedNames.has(nameItem.id);
							const imageIndex = nameIndexMap.get(nameItem.id);
							const catImage =
								imageIndex !== undefined
									? allCatImages[imageIndex]
									: getRandomCatImage(nameItem.id, CAT_IMAGES);
							return (
								<button
									key={nameItem.id}
									type="button"
									onClick={() => handleToggleName(nameItem.id)}
									className={`relative rounded-xl border-2 transition-all overflow-hidden group transform hover:scale-105 active:scale-95 ${
										isSelected
											? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/50"
											: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
									}`}
								>
									<div className="aspect-square w-full relative">
										<CatImage
											src={catImage}
											alt={nameItem.name}
											containerClassName="w-full h-full"
											imageClassName="w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleOpenLightbox(nameItem.id);
											}}
											className="absolute top-2 right-2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
											aria-label="View full size"
										>
											<ZoomIn size={16} />
										</button>
									</div>
									<div className="p-3 flex flex-col gap-1">
										<div className="flex items-center justify-between gap-2">
											<span className="font-medium text-white text-sm">{nameItem.name}</span>
											{isSelected && (
												<motion.div
													initial={{ scale: 0, opacity: 0 }}
													animate={{ scale: 1, opacity: 1 }}
													transition={{ type: "spring", stiffness: 500, damping: 30 }}
													className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
												>
													<Check size={14} className="text-white" />
												</motion.div>
											)}
										</div>
										{nameItem.description && (
											<p className="text-xs text-white/60 text-left line-clamp-2">
												{nameItem.description}
											</p>
										)}
										{isAdmin && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleToggleHidden(nameItem.id, nameItem.isHidden || false);
												}}
												disabled={togglingHidden.has(nameItem.id)}
												className={`mt-1 flex items-center gap-1 text-xs transition-colors ${
													togglingHidden.has(nameItem.id)
														? "text-slate-500 cursor-not-allowed"
														: "text-amber-400 hover:text-amber-300"
												}`}
											>
												{togglingHidden.has(nameItem.id) ? (
													<>
														<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
														<span>Processing...</span>
													</>
												) : nameItem.isHidden ? (
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
				)}
			</div>

			{lightboxOpen && (
				<Lightbox
					images={allCatImages}
					currentIndex={lightboxIndex}
					onClose={() => setLightboxOpen(false)}
					onNavigate={setLightboxIndex}
				/>
			)}
		</Card>
	);
}
