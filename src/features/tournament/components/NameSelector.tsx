/**
 * @module NameSelector
 * @description Name selection component with grid and swipe modes, showing cat images from Supabase
 */

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNamesCache } from "@/hooks/useNamesCache";
import Button from "@/layout/Button";
import { Card } from "@/layout/Card";
import { CollapsibleContent } from "@/layout/CollapsibleHeader";
import { Loading } from "@/layout/FeedbackComponents";
import { Lightbox } from "@/layout/Lightbox";
import { coreAPI, hiddenNamesAPI } from "@/services/supabase/api";
import { useCollapsible } from "@/shared/hooks";
import type { IdType, NameItem } from "@/shared/types";
import useAppStore from "@/store/appStore";
import { getRandomCatImage } from "@/utils/basic";
import { CAT_IMAGES } from "@/utils/constants";
import {
	Check,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Eye,
	EyeOff,
	Heart,
	X,
	ZoomIn,
} from "@/utils/icons";
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
	const [togglingLocked, setTogglingLocked] = useState<Set<IdType>>(new Set());
	const { getCachedData, setCachedData } = useNamesCache();
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const hiddenPanel = useCollapsible(true, "hidden-names-collapsed");
	const [hiddenQuery, setHiddenQuery] = useState("");
	const [hiddenShowSelectedOnly, setHiddenShowSelectedOnly] = useState(false);
	const [hiddenRenderCount, setHiddenRenderCount] = useState(24);
	const [hiddenExpandTimer, setHiddenExpandTimer] = useState<number | null>(null);
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
				const cachedData = getCachedData(true);
				if (cachedData && retryCount === 0) {
					setNames(cachedData);
					setIsLoading(false);
					return;
				}

				const fetchedNames = await coreAPI.getTrendingNames(true); // Include hidden names for everyone
				setNames(fetchedNames);
				setCachedData(fetchedNames, true);
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

	// Auto-select locked-in names when names are loaded
	useEffect(() => {
		if (names.length > 0) {
			const lockedInIds = new Set(
				names.filter((name) => name.lockedIn || name.locked_in).map((name) => name.id),
			);

			if (lockedInIds.size > 0) {
				setSelectedNames((prev) => {
					const newSelection = new Set(prev);
					lockedInIds.forEach((id) => {
						newSelection.add(id);
					});
					return newSelection;
				});
			}
		}
	}, [names]);

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

	// Admin handlers for toggling hidden/locked status
	const handleToggleHidden = useCallback(
		async (nameId: IdType, isCurrentlyHidden: boolean) => {
			if (!isAdmin) {
				console.warn("Only admins can toggle hidden status");
				return;
			}
			if (!userName?.trim()) {
				console.warn("User name not available for admin action");
				alert("Admin actions require a valid user name. Please refresh or log in.");
				return;
			}

			setTogglingHidden((prev) => new Set(prev).add(nameId));

			try {
				const action = isCurrentlyHidden ? "unhide" : "hide";
				if (!confirm(`Are you sure you want to ${action} this name?`)) {
					setTogglingHidden((prev) => {
						const next = new Set(prev);
						next.delete(nameId);
						return next;
					});
					return;
				}

				// Ensure user context is set
				const { withSupabase } = await import("@/services/supabase/client");
				await withSupabase(async (client) => {
					try {
						await client.rpc("set_user_context", { user_name_param: userName.trim() });
					} catch {
						/* ignore */
					}
				}, null);

				try {
					if (isCurrentlyHidden) {
						await hiddenNamesAPI.unhideName(userName, nameId);
					} else {
						await hiddenNamesAPI.hideName(userName, nameId);
					}

					// Refresh names after toggling hidden status
					const fetchedNames = await coreAPI.getTrendingNames(true);
					setNames(fetchedNames);
				} catch (apiError) {
					console.error("Failed to toggle hidden status:", apiError);
					alert(`Failed to ${action} name. Please try again.`);
				}
			} catch (error) {
				console.error("Unexpected error in toggle hidden:", error);
				alert("An unexpected error occurred. Please try again.");
			} finally {
				setTogglingHidden((prev) => {
					const next = new Set(prev);
					next.delete(nameId);
					return next;
				});
			}
		},
		[userName, isAdmin],
	);

	const handleToggleLocked = useCallback(
		async (nameId: IdType, isCurrentlyLocked: boolean) => {
			if (!isAdmin) {
				console.warn("Only admins can toggle locked status");
				return;
			}
			if (!userName?.trim()) {
				console.warn("User name not available for admin action");
				alert("Admin actions require a valid user name. Please refresh or log in.");
				return;
			}

			setTogglingLocked((prev) => new Set(prev).add(nameId));

			try {
				const action = isCurrentlyLocked ? "unlock" : "lock";
				if (!confirm(`Are you sure you want to ${action} this name?`)) {
					setTogglingLocked((prev) => {
						const next = new Set(prev);
						next.delete(nameId);
						return next;
					});
					return;
				}

				// Ensure user context is set
				const { withSupabase } = await import("@/services/supabase/client");
				const result = await withSupabase(async (client) => {
					try {
						// Ensure user context is set
						await client.rpc("set_user_context", { user_name_param: userName.trim() });
					} catch {
						/* ignore */
					}

					// Toggle lock
					const result = await client.rpc("toggle_name_locked_in" as any, {
						p_name_id: String(nameId),
						p_locked_in: !isCurrentlyLocked,
						p_user_name: userName.trim(),
					});

					if (result.error) {
						throw new Error(result.error.message || "Failed to toggle locked status");
					}
					if (result.data !== true) {
						throw new Error("Failed to toggle locked status");
					}
					return result.data;
				}, null);

				if (result) {
					// Refresh names to get updated state
					const fetchedNames = await coreAPI.getTrendingNames(true);
					setNames(fetchedNames);
				}
			} catch (error) {
				console.error("Failed to toggle locked status:", error);
				alert(`Failed to ${isCurrentlyLocked ? "unlock" : "lock"} name. Please try again.`);
			} finally {
				setTogglingLocked((prev) => {
					const newSet = new Set(prev);
					newSet.delete(nameId);
					return newSet;
				});
			}
		},
		[userName, isAdmin],
	);

	const visibleCards = names.filter(
		(name) => !swipedIds.has(name.id) && !(name.lockedIn || name.locked_in),
	);
	const cardsToRender = visibleCards.slice(0, 3);

	const availableNames = useMemo(
		() => names.filter((name) => !(name.lockedIn || name.locked_in) && !name.isHidden),
		[names],
	);
	const selectedAvailableCount = useMemo(() => {
		const availableIds = new Set(availableNames.map((n) => n.id));
		let count = 0;
		selectedNames.forEach((id) => {
			if (availableIds.has(id)) {
				count += 1;
			}
		});
		return count;
	}, [availableNames, selectedNames]);

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

	const handleOpenLightbox = useCallback((nameId: IdType) => {
		const index = names.findIndex((n) => n.id === nameId);
		if (index !== -1) {
			setLightboxIndex(index);
			setLightboxOpen(true);
		}
	}, []);

	const clearHiddenExpandTimer = useCallback(() => {
		if (hiddenExpandTimer) {
			window.clearTimeout(hiddenExpandTimer);
			setHiddenExpandTimer(null);
		}
	}, [hiddenExpandTimer]);

	const startHiddenExpandTimer = useCallback(() => {
		if (!hiddenPanel.isCollapsed) {
			return;
		}
		clearHiddenExpandTimer();
		const t = window.setTimeout(() => {
			hiddenPanel.expand();
			setHiddenRenderCount(24);
		}, 800);
		setHiddenExpandTimer(t);
	}, [clearHiddenExpandTimer, hiddenPanel]);

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
				{(() => {
					const lockedInNames = names.filter((name) => name.lockedIn || name.locked_in);
					if (lockedInNames.length === 0) {
						return null;
					}
					return (
						<div className="text-center space-y-4">
							<h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
								My cat's name is
							</h3>
							<div className="flex flex-wrap justify-center gap-3">
								{lockedInNames.map((nameItem) => (
									<div
										key={nameItem.id}
										className="px-6 py-3 border-2 border-amber-500/30 bg-amber-500/10 ring-2 ring-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
									>
										<div className="text-white font-bold text-lg">{nameItem.name}</div>
									</div>
								))}
							</div>
						</div>
					);
				})()}

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
							Selected: {selectedAvailableCount} / {availableNames.length}
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
					<>
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

						{visibleCards.length > 0 && (
							<div className="flex items-center justify-center gap-8 mt-8 pb-4">
								<Button
									variant="outline"
									iconOnly={true}
									className="h-16 w-16 rounded-full border-2 border-red-500/20 hover:bg-red-500/10 hover:border-red-500 text-red-500 transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-110 active:scale-95"
									onClick={() => {
										const currentCard = visibleCards[0];
										if (currentCard) {
											handleSwipe(currentCard.id, "left");
										}
									}}
									aria-label="Skip (Left Arrow)"
									title="Skip (Left Arrow)"
								>
									<X size={32} />
								</Button>

								<Button
									variant="outline"
									iconOnly={true}
									className="h-16 w-16 rounded-full border-2 border-green-500/20 hover:bg-green-500/10 hover:border-green-500 text-green-500 transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-110 active:scale-95"
									onClick={() => {
										const currentCard = visibleCards[0];
										if (currentCard) {
											handleSwipe(currentCard.id, "right");
										}
									}}
									aria-label="Select (Right Arrow)"
									title="Select (Right Arrow)"
								>
									<Heart size={32} />
								</Button>
							</div>
						)}
					</>
				) : (
					<div className="space-y-8">
						{/* Active Names Container */}
						{(() => {
							const activeNames = names.filter(
								(name) => !(name.lockedIn || name.locked_in) && !name.isHidden,
							);
							return (
								activeNames.length > 0 && (
									<div>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
											{activeNames.map((nameItem) => {
												const isSelected = selectedNames.has(nameItem.id);
												const catImage =
													catImageById.get(nameItem.id) ??
													getRandomCatImage(nameItem.id, CAT_IMAGES);
												return (
													<motion.div
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
														whileHover={{ scale: 1.02 }}
														whileTap={{ scale: 0.98 }}
														transition={{ type: "spring", stiffness: 400, damping: 25 }}
														className={`relative rounded-xl border-2 overflow-hidden cursor-pointer ${
															isSelected
																? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/50"
																: "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
														} ${nameItem.lockedIn || nameItem.locked_in ? "opacity-75" : ""}`}
													>
														<div className="aspect-[4/3] w-full relative">
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
																<span className="font-medium text-white text-sm">
																	{nameItem.name}
																</span>
																{isSelected && (
																	<motion.div
																		initial={{ scale: 0, opacity: 0 }}
																		animate={{ scale: 1, opacity: 1 }}
																		className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center gap-1"
																	>
																		<Check size={10} className="text-purple-500" />
																		<span className="text-purple-500 font-bold text-xs">
																			Selected
																		</span>
																	</motion.div>
																)}
															</div>
															{nameItem.description && (
																<p className="text-white/60 text-xs leading-relaxed">
																	{nameItem.description}
																</p>
															)}
														</div>
														{isAdmin && !isSwipeMode && (
															<motion.div
																initial={{ opacity: 0, y: 10 }}
																animate={{ opacity: 1, y: 0 }}
																transition={{ delay: 0.1 }}
																className="px-3 pb-3 flex gap-2"
															>
																{/* Hide/Unhide Button */}
																<motion.button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleToggleHidden(nameItem.id, nameItem.isHidden || false);
																	}}
																	disabled={togglingHidden.has(nameItem.id)}
																	whileHover={{ scale: 1.05 }}
																	whileTap={{ scale: 0.95 }}
																	transition={{ type: "spring", stiffness: 400, damping: 25 }}
																	className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
																		nameItem.isHidden
																			? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/25"
																			: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/25"
																	} ${togglingHidden.has(nameItem.id) ? "opacity-50 cursor-not-allowed" : ""} shadow-lg`}
																>
																	{togglingHidden.has(nameItem.id) ? (
																		<div className="flex items-center justify-center gap-1">
																			<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
																			<span>Processing...</span>
																		</div>
																	) : nameItem.isHidden ? (
																		<>
																			<Eye size={12} className="mr-1" />
																			Unhide
																		</>
																	) : (
																		<>
																			<EyeOff size={12} className="mr-1" />
																			Hide
																		</>
																	)}
																</motion.button>

																{/* Lock/Unlock Button */}
																<motion.button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleToggleLocked(
																			nameItem.id,
																			nameItem.lockedIn || nameItem.locked_in || false,
																		);
																	}}
																	disabled={togglingLocked.has(nameItem.id)}
																	whileHover={{ scale: 1.05 }}
																	whileTap={{ scale: 0.95 }}
																	transition={{ type: "spring", stiffness: 400, damping: 25 }}
																	className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
																		nameItem.lockedIn || nameItem.locked_in
																			? "bg-gray-600 hover:bg-gray-700 text-white shadow-gray-500/25"
																			: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25"
																	} ${togglingLocked.has(nameItem.id) ? "opacity-50 cursor-not-allowed" : ""} shadow-lg`}
																>
																	{togglingLocked.has(nameItem.id) ? (
																		<div className="flex items-center justify-center gap-1">
																			<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
																			<span>Processing...</span>
																		</div>
																	) : nameItem.lockedIn || nameItem.locked_in ? (
																		<>
																			<CheckCircle size={12} className="mr-1" />
																			Unlock
																		</>
																	) : (
																		<>
																			<CheckCircle size={12} className="mr-1" />
																			Lock
																		</>
																	)}
																</motion.button>
															</motion.div>
														)}
													</motion.div>
												);
											})}
										</div>
									</div>
								)
							);
						})()}

						{(() => {
							const hiddenNamesAll = names.filter((n) => n.isHidden);
							if (hiddenNamesAll.length === 0) {
								return null;
							}

							if (isSwipeMode) {
								return (
									<div className="mt-6 text-center text-white/60 text-sm">
										Hidden names available in Grid mode
									</div>
								);
							}

							const q = hiddenQuery.trim().toLowerCase();
							const hiddenFiltered = hiddenNamesAll.filter((n) => {
								if (hiddenShowSelectedOnly && !selectedNames.has(n.id)) {
									return false;
								}
								if (!q) {
									return true;
								}
								return (
									n.name.toLowerCase().includes(q) ||
									(n.description ?? "").toLowerCase().includes(q)
								);
							});

							const previewItems = hiddenNamesAll.slice(0, 6);
							const renderItems = hiddenFiltered.slice(0, hiddenRenderCount);

							return (
								<div className="mt-6">
									<div
										onMouseDown={startHiddenExpandTimer}
										onMouseUp={clearHiddenExpandTimer}
										onMouseLeave={clearHiddenExpandTimer}
										onTouchStart={startHiddenExpandTimer}
										onTouchEnd={clearHiddenExpandTimer}
										role="button"
										tabIndex={0}
										className="select-none"
									>
										<button
											type="button"
											onClick={() => {
												if (!hiddenPanel.isCollapsed) {
													hiddenPanel.collapse();
													return;
												}
												hiddenPanel.expand();
												setHiddenRenderCount(24);
											}}
											aria-expanded={hiddenPanel.isCollapsed ? "false" : "true"}
											aria-controls="hidden-names-panel"
											className="w-full flex items-center justify-between gap-3"
										>
											<div className="flex items-center gap-2">
												<span className="text-white/60">
													{hiddenPanel.isCollapsed ? (
														<ChevronRight size={20} />
													) : (
														<ChevronDown size={20} />
													)}
												</span>
												<span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
													Hidden Names ({hiddenNamesAll.length})
												</span>
											</div>
											<span className="text-xs text-white/60">Hold to expand</span>
										</button>

										{hiddenPanel.isCollapsed && (
											<div className="mt-3 grid grid-cols-6 gap-2">
												{previewItems.map((n) => {
													const img = catImageById.get(n.id) ?? getRandomCatImage(n.id, CAT_IMAGES);
													return (
														<div
															key={n.id}
															className="relative aspect-square overflow-hidden border border-white/10"
														>
															<CatImage
																src={img}
																alt="Hidden name"
																containerClassName="w-full h-full"
																imageClassName="w-full h-full object-cover opacity-20"
															/>
															<div className="absolute inset-0 flex items-center justify-center">
																<span className="text-white/50 text-sm font-bold">?</span>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>

									<CollapsibleContent id="hidden-names-panel" isCollapsed={hiddenPanel.isCollapsed}>
										<div className="mt-4">
											<div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-3">
												<input
													value={hiddenQuery}
													onChange={(e) => {
														setHiddenQuery(e.target.value);
														setHiddenRenderCount(24);
													}}
													placeholder="Search hidden names"
													className="w-full sm:max-w-sm px-3 py-2 bg-white/5 border border-white/10 text-white text-sm"
												/>
												<div className="flex items-center justify-between sm:justify-end gap-3">
													<button
														type="button"
														onClick={() => setHiddenShowSelectedOnly((v) => !v)}
														className={`px-3 py-2 border text-xs font-medium ${
															hiddenShowSelectedOnly
																? "bg-purple-500/20 border-purple-500/40 text-white"
																: "bg-white/5 border-white/10 text-white/80"
														}`}
													>
														Selected only
													</button>
													<span className="text-xs text-white/60">
														{hiddenFiltered.length} / {hiddenNamesAll.length}
													</span>
												</div>
											</div>

											<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
												{renderItems.map((nameItem) => {
													const isSelected = selectedNames.has(nameItem.id);
													const catImage =
														catImageById.get(nameItem.id) ??
														getRandomCatImage(nameItem.id, CAT_IMAGES);
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
															<div className="aspect-[4/3] w-full relative">
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
																	<span className="font-medium text-white text-sm">
																		{nameItem.name}
																	</span>
																	{isSelected && (
																		<motion.div
																			initial={{ scale: 0, opacity: 0 }}
																			animate={{ scale: 1, opacity: 1 }}
																			className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center gap-1"
																		>
																			<Check size={10} className="text-purple-500" />
																			<span className="text-purple-500 font-bold text-xs">
																				Selected
																			</span>
																		</motion.div>
																	)}
																</div>
																{nameItem.description && (
																	<p className="text-white/60 text-xs leading-relaxed">
																		{nameItem.description}
																	</p>
																)}
															</div>
															{isAdmin && (
																<div className="px-3 pb-3">
																	<button
																		type="button"
																		onClick={(e) => {
																			e.stopPropagation();
																			handleToggleHidden(nameItem.id, true);
																		}}
																		disabled={togglingHidden.has(nameItem.id)}
																		className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-green-600 hover:bg-green-700 text-white ${
																			togglingHidden.has(nameItem.id)
																				? "opacity-50 cursor-not-allowed"
																				: ""
																		}`}
																	>
																		{togglingHidden.has(nameItem.id) ? (
																			<div className="flex items-center justify-center gap-1">
																				<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
																				<span>Processing...</span>
																			</div>
																		) : (
																			<>
																				<Eye size={12} className="mr-1 inline" />
																				Unhide
																			</>
																		)}
																	</button>
																</div>
															)}
														</div>
													);
												})}
											</div>

											{hiddenFiltered.length > hiddenRenderCount && (
												<div className="mt-4 flex justify-center">
													<Button
														onClick={() => setHiddenRenderCount((c) => c + 24)}
														variant="outline"
														size="small"
													>
														Load more
													</Button>
												</div>
											)}
										</div>
									</CollapsibleContent>
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
