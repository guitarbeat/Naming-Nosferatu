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
import { Lightbox } from "@/layout/Lightbox";
import { coreAPI, hiddenNamesAPI } from "@/services/supabase/api";
import useAppStore from "@/store/appStore";
import type { IdType, NameItem } from "@/types/appTypes";
import { getRandomCatImage } from "@/utils/basic";
import { CAT_IMAGES } from "@/utils/constants";
import { Check, CheckCircle, Eye, EyeOff, Heart, X, ZoomIn } from "@/utils/icons";
import CatImage from "./CatImage";

const SWIPE_OFFSET_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

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
	const [revealedHiddenNames, setRevealedHiddenNames] = useState<Set<IdType>>(new Set());
	const [holdingTimers, setHoldingTimers] = useState<Map<IdType, NodeJS.Timeout>>(new Map());
	const [swipeHistory, setSwipeHistory] = useState<
		Array<{ id: IdType; direction: "left" | "right"; timestamp: number }>
	>([]);

	// Memoize cat images and build an id->image lookup map
	const { catImages, catImageById } = useMemo(() => {
		const images = names.map((nameItem) => getRandomCatImage(nameItem.id, CAT_IMAGES));
		const byId = new Map<IdType, string>();
		names.forEach((nameItem, index) => {
			const img = images[index];
			if (img) {
				byId.set(nameItem.id, img);
			}
		});
		return { catImages: images, catImageById: byId };
	}, [names]);

	// Fetch names from Supabase on mount with retry mechanism and caching
	useEffect(() => {
		let retryTimeout: number | undefined;

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

				const fetchedNames = await coreAPI.getTrendingNames(true); // Include hidden names for everyone
				setNames(fetchedNames);
				setCachedData(fetchedNames, false);
				setRetryCount(0); // Reset retry count on success
			} catch (error) {
				console.error("Failed to fetch names:", error);
				const errorMessage = error instanceof Error ? error.message : "Failed to load names";
				setError(errorMessage);

				// Auto-retry for network errors (max 3 retries)
				if (retryCount < 2 && errorMessage.toLowerCase().includes("network")) {
					retryTimeout = window.setTimeout(
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

		return () => {
			if (retryTimeout != null) {
				window.clearTimeout(retryTimeout);
			}
		};
	}, [retryCount, getCachedData, setCachedData]);

	const syncSelectionToStore = useCallback(
		(nextSelectedIds: Set<IdType>) => {
			const selectedNameItems = names.filter((n) => nextSelectedIds.has(n.id));
			tournamentActions.setSelection(selectedNameItems);
		},
		[names, tournamentActions],
	);

	const toggleName = useCallback(
		(nameId: IdType) => {
			setSelectedNames((prev) => {
				const next = new Set(prev);
				if (next.has(nameId)) {
					next.delete(nameId);
				} else {
					next.add(nameId);
				}

				syncSelectionToStore(next);

				return next;
			});
		},
		[syncSelectionToStore],
	);

	// Trigger haptic feedback if available
	const triggerHaptic = useCallback(() => {
		if ("vibrate" in navigator) {
			navigator.vibrate(50);
		}
	}, []);

	// Add haptic feedback for better UX
	const handleToggleName = useCallback(
		(nameId: IdType) => {
			// Add subtle haptic feedback if supported
			triggerHaptic();
			toggleName(nameId);
		},
		[triggerHaptic, toggleName],
	);

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

	const markSwiped = useCallback((nameId: IdType, direction: "left" | "right") => {
		setSwipedIds((prev) => {
			const next = new Set(prev);
			next.add(nameId);
			return next;
		});
		setSwipeHistory((prev) => [...prev, { id: nameId, direction, timestamp: Date.now() }]);
	}, []);

	const handleSwipe = useCallback(
		(nameId: IdType, direction: "left" | "right", velocity: number = 0) => {
			if (direction === "right") {
				setSelectedNames((prev) => {
					const next = new Set(prev);
					next.add(nameId);
					syncSelectionToStore(next);
					return next;
				});
			}
			markSwiped(nameId, direction);
			triggerHaptic();

			// Dynamic reset delay based on velocity for smoother feel
			const baseDelay = 200;
			const velocityFactor = Math.min(Math.abs(velocity) * 0.05, 150);
			const resetDelay = Math.max(baseDelay, 350 - velocityFactor);

			// Batch state updates for better performance
			requestAnimationFrame(() => {
				setTimeout(() => {
					requestAnimationFrame(() => {
						setDragDirection(null);
						setDragOffset(0);
					});
				}, resetDelay);
			});
		},
		[markSwiped, syncSelectionToStore, triggerHaptic],
	);

	const handleDragEnd = useCallback(
		(nameId: IdType, info: PanInfo) => {
			const offset = info.offset.x;
			const velocity = info.velocity.x;

			if (
				Math.abs(offset) < SWIPE_OFFSET_THRESHOLD &&
				Math.abs(velocity) < SWIPE_VELOCITY_THRESHOLD
			) {
				// Smooth snap back animation
				updateDragState(0);
				return;
			}

			// Determine direction based on offset and velocity
			const isRightSwipe = offset > SWIPE_OFFSET_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
			const direction = isRightSwipe ? "right" : "left";

			updateDragState(0, direction);
			handleSwipe(nameId, direction, Math.abs(velocity));
		},
		[handleSwipe, updateDragState],
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

		// If it was a right swipe, remove from selected names and sync with store
		if (lastSwipe.direction === "right") {
			setSelectedNames((prev) => {
				const next = new Set(prev);
				next.delete(lastSwipe.id);
				syncSelectionToStore(next);
				return next;
			});
		}

		triggerHaptic();
	}, [swipeHistory, syncSelectionToStore, triggerHaptic]);

	const visibleCards = names.filter((name) => !swipedIds.has(name.id));
	const cardsToRender = visibleCards.slice(0, 3);

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

	const setHiddenToggleLoading = useCallback((nameId: IdType, isLoading: boolean) => {
		setTogglingHidden((prev) => {
			const next = new Set(prev);
			if (isLoading) {
				next.add(nameId);
			} else {
				next.delete(nameId);
			}
			return next;
		});
	}, []);

	const updateNameHiddenState = useCallback((nameId: IdType, isHidden: boolean) => {
		setNames((prev) => prev.map((name) => (name.id === nameId ? { ...name, isHidden } : name)));
	}, []);

	const handleToggleHidden = useCallback(
		async (nameId: IdType, isCurrentlyHidden: boolean) => {
			if (!userName) {
				return;
			}

			const action = isCurrentlyHidden ? "unhide" : "hide";
			if (!confirm(`Are you sure you want to ${action} this name?`)) {
				return;
			}

			setHiddenToggleLoading(nameId, true);
			updateNameHiddenState(nameId, !isCurrentlyHidden);

			try {
				if (isCurrentlyHidden) {
					await hiddenNamesAPI.unhideName(userName, nameId);
				} else {
					await hiddenNamesAPI.hideName(userName, nameId);
				}

				invalidateCache();
				const fetchedNames = await coreAPI.getTrendingNames(true);
				setNames(fetchedNames);
			} catch (error) {
				updateNameHiddenState(nameId, isCurrentlyHidden);
				console.error("Failed to toggle hidden status:", error);
				alert(`Failed to ${action} name. Please try again.`);
			} finally {
				setHiddenToggleLoading(nameId, false);
			}
		},
		[invalidateCache, setHiddenToggleLoading, updateNameHiddenState, userName],
	);

	// Hidden names interaction handlers
	const handleHiddenNameMouseDown = useCallback((nameId: IdType) => {
		const timer = setTimeout(() => {
			setRevealedHiddenNames(prev => new Set(prev).add(nameId));
		}, 1000); // Hold for 1 second to reveal
		setHoldingTimers(prev => new Map(prev).set(nameId, timer));
	}, []);

	const handleHiddenNameMouseUp = useCallback((nameId: IdType) => {
		const timer = holdingTimers.get(nameId);
		if (timer) {
			clearTimeout(timer);
			setHoldingTimers(prev => {
				const newMap = new Map(prev);
				newMap.delete(nameId);
				return newMap;
			});
		}
		if (revealedHiddenNames.has(nameId)) {
			handleToggleName(nameId);
			setRevealedHiddenNames(prev => {
				const newSet = new Set(prev);
				newSet.delete(nameId);
				return newSet;
			});
		}
	}, [holdingTimers, revealedHiddenNames, handleToggleName]);

	const handleHiddenNameMouseLeave = useCallback((nameId: IdType) => {
		const timer = holdingTimers.get(nameId);
		if (timer) {
			clearTimeout(timer);
			setHoldingTimers(prev => {
				const newMap = new Map(prev);
				newMap.delete(nameId);
				return newMap;
			});
		}
		setRevealedHiddenNames(prev => {
			const newSet = new Set(prev);
			newSet.delete(nameId);
			return newSet;
		});
	}, [holdingTimers]);

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
					<div
						className="relative w-full flex items-center justify-center"
						style={{ minHeight: "600px" }}
					>
						<AnimatePresence mode="popLayout">
							{visibleCards.length > 0 ? (
								cardsToRender.map((nameItem, index) => {
									const catImage =
										catImageById.get(nameItem.id) ?? getRandomCatImage(nameItem.id, CAT_IMAGES);
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
														handleDragEnd(nameItem.id, info);
													}
												}}
												animate={{
													scale: index === 0 ? 1 : 0.95,
													opacity: 1,
													rotate: index === 0 ? dragOffset / 30 : 0,
													x: index === 0 ? dragOffset * 0.15 : 0,
													y: index * 8,
												}}
												transition={SMOOTH_SPRING_CONFIG}
												whileDrag={{
													scale: 1.02,
													transition: { duration: 0.15 },
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
					<div className="space-y-8">
						{/* Locked In Names Container */}
						{(() => {
							const lockedInNames = names.filter(name => name.lockedIn || name.locked_in);
							return lockedInNames.length > 0 && (
								<div>
									<h3 className="text-2xl font-bold text-white mb-6 text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
										🔒 Locked In Names
									</h3>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
										{lockedInNames.map((nameItem) => {
											const catImage = catImageById.get(nameItem.id) ?? getRandomCatImage(nameItem.id, CAT_IMAGES);
											return (
												<div
													key={nameItem.id}
													className="relative rounded-xl border-2 transition-all overflow-hidden group transform ring-2 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] border-amber-500/30 bg-amber-500/10 cursor-not-allowed"
												>
													<div className="aspect-square w-full relative">
														<CatImage
															src={catImage}
															alt={nameItem.name}
															containerClassName="w-full h-full"
															imageClassName="w-full h-full object-cover"
														/>
														<div className="absolute top-2 left-2 px-2 py-1 bg-amber-500/90 backdrop-blur-sm border border-amber-500 rounded-full text-xs font-bold text-white">
															🔒 Locked In
														</div>
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
															<div className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center gap-1">
																<CheckCircle size={10} className="text-amber-500" />
																<span className="text-amber-500 font-bold text-xs">Locked</span>
															</div>
														</div>
														{nameItem.description && (
															<p className="text-white/60 text-xs line-clamp-2">{nameItem.description}</p>
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						})()}

						{/* Active Names Container */}
						{(() => {
							const activeNames = names.filter(name => !(name.lockedIn || name.locked_in) && !name.isHidden);
							return activeNames.length > 0 && (
								<div>
									<h3 className="text-2xl font-bold text-white mb-6 text-center">
										Available Names
									</h3>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
										{activeNames.map((nameItem) => {
											const isSelected = selectedNames.has(nameItem.id);
											const catImage = catImageById.get(nameItem.id) ?? getRandomCatImage(nameItem.id, CAT_IMAGES);
											return (
												<div
													key={nameItem.id}
													onClick={() => handleToggleName(nameItem.id)}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															handleToggleName(nameItem.id);
														}
													}}
													role="button"
													tabIndex={0}
													className={`relative rounded-xl border-2 transition-all overflow-hidden group transform hover:scale-105 active:scale-95 cursor-pointer ${
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
																	className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center gap-1"
																>
																	<Check size={10} className="text-purple-500" />
																	<span className="text-purple-500 font-bold text-xs">Selected</span>
																</motion.div>
															)}
														</div>
														{nameItem.description && (
															<p className="text-white/60 text-xs line-clamp-2">{nameItem.description}</p>
														)}
													</div>
													{isAdmin && !isSwipeMode && (
														<div className="px-3 pb-3">
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
																) : (
																	<>
																		<EyeOff size={12} />
																		<span>Hide</span>
																	</>
																)}
															</button>
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							);
						})()}

						{/* Hidden Names Container - Everyone can access with special interaction */}
						{(() => {
							const hiddenNames = names.filter(name => name.isHidden);
							return hiddenNames.length > 0 && (
								<div>
									<h3 className="text-2xl font-bold text-white mb-4 text-center bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
										� Hidden Names
									</h3>
									<p className="text-center text-white/70 mb-6 text-sm">
										Click and hold to reveal and select hidden names
									</p>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
										{hiddenNames.map((nameItem) => {
											const isSelected = selectedNames.has(nameItem.id);
											const catImage = catImageById.get(nameItem.id) ?? getRandomCatImage(nameItem.id, CAT_IMAGES);
											const isRevealed = revealedHiddenNames.has(nameItem.id);
											
											return (
												<div
													key={nameItem.id}
													onMouseDown={() => handleHiddenNameMouseDown(nameItem.id)}
													onMouseUp={() => handleHiddenNameMouseUp(nameItem.id)}
													onMouseLeave={() => handleHiddenNameMouseLeave(nameItem.id)}
													onTouchStart={() => handleHiddenNameMouseDown(nameItem.id)}
													onTouchEnd={() => handleHiddenNameMouseUp(nameItem.id)}
													role="button"
													tabIndex={0}
													className={`relative rounded-xl border-2 transition-all overflow-hidden group transform ${
														isRevealed
															? "hover:scale-105 active:scale-95 cursor-pointer border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/50"
															: "border-purple-500/30 bg-purple-900/10 hover:border-purple-500/50 hover:bg-purple-900/20 cursor-pointer"
													}`}
												>
													<div className="aspect-square w-full relative">
														<CatImage
															src={catImage}
															alt={nameItem.name}
															containerClassName="w-full h-full"
															imageClassName={`w-full h-full object-cover transition-opacity duration-300 ${
																isRevealed ? "opacity-100" : "opacity-30"
															}`}
														/>
														{!isRevealed && (
															<div className="absolute inset-0 flex items-center justify-center bg-black/50">
																<div className="text-center">
																	<div className="w-12 h-12 mx-auto mb-2 rounded-full border-2 border-purple-400 flex items-center justify-center">
																		<span className="text-purple-400 text-lg">?</span>
																	</div>
																	<p className="text-purple-300 text-xs font-medium">Hold to reveal</p>
																</div>
															</div>
														)}
														{isRevealed && (
															<div className="absolute top-2 left-2 px-2 py-1 bg-purple-500/90 backdrop-blur-sm border border-purple-500 rounded-full text-xs font-bold text-white">
																🔍 Revealed
															</div>
														)}
														{isRevealed && (
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
														)}
													</div>
													<div className="p-3 flex flex-col gap-1">
														<div className="flex items-center justify-between gap-2">
															<span className={`font-medium text-sm transition-colors ${
																isRevealed ? "text-white" : "text-white/50"
															}`}>
																{isRevealed ? nameItem.name : "????"}
															</span>
															{isSelected && (
																<motion.div
																	initial={{ scale: 0, opacity: 0 }}
																	animate={{ scale: 1, opacity: 1 }}
																	className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center gap-1"
																>
																	<Check size={10} className="text-purple-500" />
																	<span className="text-purple-500 font-bold text-xs">Selected</span>
																</motion.div>
															)}
														</div>
														{nameItem.description && isRevealed && (
															<p className="text-white/60 text-xs line-clamp-2">{nameItem.description}</p>
														)}
													</div>
													{isAdmin && !isSwipeMode && isRevealed && (
														<div className="px-3 pb-3">
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
																		: "text-purple-400 hover:text-purple-300"
																}`}
															>
																{togglingHidden.has(nameItem.id) ? (
																	<>
																		<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
																		<span>Processing...</span>
																	</>
																) : (
																	<>
																		<Eye size={12} />
																		<span>Unhide</span>
																	</>
																)}
															</button>
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							);
						})()}
					</div>
				)}
			</div>

			{lightboxOpen && (
				<Lightbox
					images={catImages}
					currentIndex={lightboxIndex}
					onClose={() => setLightboxOpen(false)}
					onNavigate={setLightboxIndex}
				/>
			)}
		</Card>
	);
}
