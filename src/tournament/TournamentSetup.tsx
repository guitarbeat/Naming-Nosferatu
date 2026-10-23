import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
	ChevronDown,
	ChevronUp,
	Moon,
	Play,
	RotateCcw,
	Shuffle,
	Sun,
	Trophy,
	X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DriftWall, type DriftWallItem } from "@/components/DriftWall";
import { Button, Loading } from "@/components/UiPrimitives";
import { useInertiaScroll } from "@/hooks/useCommonHooks";
import { namesQueryOptions, ratingsAPI, SUPABASE_UNAVAILABLE_MSG } from "@/lib/api";
import {
	DEFAULT_SAMPLE_NAMES,
	fadeMotionPreset,
	getLockedNames,
	getVisibleNames,
	hapticNavTap,
	isNameLocked,
	normalizeRatingsWithStats,
	shuffleArray,
} from "@/lib/utils";
import useAppStore, { useTournamentSetupState } from "@/store";
import type { IdType, RatingData } from "@/types";
import { TournamentArena } from "./TournamentArena";
import { createIdToNameMap } from "./tournamentEngine";

/* ==========================================================================
   1. TOURNAMENT STATUS WIDGET
   ========================================================================== */

export interface TournamentStatusWidgetProps {
	namesCount: number;
	onRestart: () => void;
}

export function TournamentStatusWidget({ namesCount, onRestart }: TournamentStatusWidgetProps) {
	return (
		<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/85 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
			<div className="flex items-center gap-3 text-left w-full sm:w-auto">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
					<Trophy size={18} />
				</div>
				<div>
					<h4 className="text-sm font-semibold text-foreground">Tournament in Progress</h4>
					<p className="text-xs text-muted-foreground font-mono tabular-nums">
						{namesCount} contenders seeded
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
				<Button
					variant="ghost"
					size="small"
					onClick={onRestart}
					aria-label="Restart Tournament"
					className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
				>
					<RotateCcw size={13} />
					Restart Tournament
				</Button>
			</div>
		</div>
	);
}

/* ==========================================================================
   2. NAME SELECTOR & FLOATING COMMAND DOCK
   ========================================================================== */

export const NameSelector = memo(function NameSelector() {
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const theme = useAppStore((state) => state.ui.theme);
	const setTheme = useAppStore((state) => state.uiActions.setTheme);
	const storeSelectedNames = useAppStore((state) => state.tournament.selectedNames);
	const tournamentActions = useAppStore((state) => state.tournamentActions);
	const [showSelectedTray, setShowSelectedTray] = useState(true);

	const namesQuery = useQuery({
		...namesQueryOptions(isAdmin),
		retry: 2,
	});

	const error =
		namesQuery.error instanceof Error
			? namesQuery.error.message
			: namesQuery.error
				? "Failed to load names"
				: null;
	const isSupabaseUnavailable = error === SUPABASE_UNAVAILABLE_MSG;
	const names =
		namesQuery.data?.names && namesQuery.data.names.length > 0
			? namesQuery.data.names
			: DEFAULT_SAMPLE_NAMES;
	const isLoading = namesQuery.isPending && !namesQuery.data;

	const selectedIds = useMemo(
		() => new Set(storeSelectedNames.map((item) => item.id)),
		[storeSelectedNames],
	);

	const namesById = useMemo(() => createIdToNameMap(names), [names]);
	const availableNames = useMemo(() => getVisibleNames(names), [names]);
	const lockedInNames = useMemo(() => getLockedNames(names), [names]);

	useEffect(() => {
		if (lockedInNames.length === 0) {
			return;
		}
		const missingLocked = lockedInNames.filter((n) => !selectedIds.has(n.id));
		if (missingLocked.length > 0) {
			tournamentActions.setSelection([...storeSelectedNames, ...missingLocked]);
		}
	}, [lockedInNames, storeSelectedNames, tournamentActions, selectedIds]);

	const handleToggleName = useCallback(
		(nameId: IdType) => {
			const nameItem = namesById.get(nameId);
			if (!nameItem || isNameLocked(nameItem)) {
				return;
			}
			hapticNavTap();
			const isCurrentlySelected = selectedIds.has(nameId);
			const nextSelection = isCurrentlySelected
				? storeSelectedNames.filter((n) => n.id !== nameId)
				: [...storeSelectedNames, nameItem];
			tournamentActions.setSelection(nextSelection);
		},
		[namesById, selectedIds, storeSelectedNames, tournamentActions],
	);

	const handleStartSelected = useCallback(() => {
		if (storeSelectedNames.length >= 2) {
			hapticNavTap();
			tournamentActions.setNames(storeSelectedNames);
		}
	}, [storeSelectedNames, tournamentActions]);

	const handleQuickStart = useCallback(
		(count: number) => {
			hapticNavTap();
			const picked = shuffleArray(availableNames).slice(0, Math.min(count, availableNames.length));
			tournamentActions.setSelection(picked);
			tournamentActions.setNames(picked);
		},
		[availableNames, tournamentActions],
	);

	const driftWallItems = useMemo<DriftWallItem[]>(() => {
		return availableNames.map((nameItem) => ({
			id: String(nameItem.id),
			title: nameItem.name,
			subtitle: nameItem.description
				? nameItem.description
				: nameItem.pronunciation
					? `/${nameItem.pronunciation}/`
					: undefined,
			selected: selectedIds.has(nameItem.id),
			locked: isNameLocked(nameItem),
		}));
	}, [availableNames, selectedIds]);

	if (isLoading) {
		return (
			<div className="w-full min-h-screen flex items-center justify-center">
				<Loading variant="spinner" text="Loading contenders..." />
			</div>
		);
	}

	if (error && !isSupabaseUnavailable && availableNames.length === 0) {
		return (
			<div className="w-full min-h-screen flex flex-col items-center justify-center text-center px-4">
				<div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 max-w-md space-y-4">
					<h3 className="font-display text-xl font-bold text-foreground">
						Could not load shortlist
					</h3>
					<p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
					<Button onClick={() => void namesQuery.refetch()} variant="outline" size="small">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	const selectedCount = storeSelectedNames.length;
	const canStartCustom = selectedCount >= 2;
	const modeLabel = selectedCount >= 4 && selectedCount % 4 === 0 ? "2v2 Teams" : "1v1 Bracket";

	return (
		<div className="relative w-full min-h-screen overflow-hidden select-none flex flex-col">
			{availableNames.length > 0 && (
				<div className="absolute inset-0 w-full h-full overflow-hidden">
					<DriftWall
						items={driftWallItems}
						onItemClick={(item) => handleToggleName(item.id as IdType)}
						columns={7}
						tileWidth={150}
						tileHeight={150}
						gap={22}
						radius={9999}
						perspective={1200}
						depth={120}
						speed={22}
						direction="up"
						variance={0.45}
						parallax={0.55}
						pauseOnHover={true}
						className="w-full h-full"
					/>
				</div>
			)}

			<div className="floating-navbar-frame">
				{selectedCount > 0 && showSelectedTray && (
					<div
						aria-label="Selected contender names"
						className="floating-navbar-shell w-full max-w-[min(95vw,46rem)] rounded-2xl px-3.5 py-2.5 transition-all duration-200"
					>
						<div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
							{storeSelectedNames.map((item, idx) => {
								const locked = isNameLocked(item);
								return (
									<button
										key={item.id}
										type="button"
										disabled={locked}
										onClick={() => handleToggleName(item.id)}
										title={locked ? `${item.name} is locked in` : `Remove ${item.name}`}
										aria-label={locked ? `${item.name} (locked)` : `Remove ${item.name}`}
										className="group inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-bold text-foreground shadow-xs transition-all duration-150 hover:border-destructive/50 hover:bg-destructive/15 active:scale-95 disabled:opacity-70"
									>
										<span className="font-mono text-[10px] font-extrabold text-primary tabular-nums">
											#{idx + 1}
										</span>
										<span className="tracking-tight">{item.name}</span>
										{!locked && (
											<X className="size-3 text-foreground/65 transition-colors group-hover:text-destructive" />
										)}
									</button>
								);
							})}
						</div>
					</div>
				)}

				<nav
					aria-label="Tournament launch controls"
					className="floating-navbar-shell flex items-center justify-between gap-3 sm:gap-5 rounded-full pl-5 pr-2 py-2 sm:pl-6 sm:pr-2.5 sm:py-2"
				>
					<div className="flex items-center gap-3 min-w-0">
						<span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-foreground whitespace-nowrap shrink-0">
							Name Nosferatu
						</span>
						<span className="h-4 w-px bg-foreground/20 shrink-0" aria-hidden="true" />
						<div className="flex items-center gap-2 whitespace-nowrap truncate">
							{selectedCount > 0 ? (
								<button
									type="button"
									onClick={() => setShowSelectedTray((prev) => !prev)}
									className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-3 py-1 text-xs sm:text-sm transition-colors hover:bg-primary/25"
									title={showSelectedTray ? "Hide selected names list" : "Show selected names list"}
									aria-expanded={showSelectedTray}
								>
									<span className="font-mono font-extrabold tabular-nums text-primary">
										{selectedCount}
									</span>
									<span className="font-semibold text-foreground">selected</span>
									{canStartCustom && (
										<>
											<span aria-hidden="true" className="hidden md:inline text-foreground/50">
												&middot;
											</span>
											<span className="hidden md:inline text-xs font-bold text-secondary">
												{modeLabel}
											</span>
										</>
									)}
									{showSelectedTray ? (
										<ChevronDown className="size-3.5 text-foreground/75" />
									) : (
										<ChevronUp className="size-3.5 text-foreground/75" />
									)}
								</button>
							) : (
								<span className="text-xs sm:text-sm font-medium text-foreground/75">
									Tap orbs or quick-start
								</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
						<button
							type="button"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							className="inline-flex size-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground/8 text-foreground/80 transition-colors hover:bg-foreground/15 hover:text-foreground shrink-0"
							title={
								theme === "dark"
									? "Switch to warm dusk light mode"
									: "Switch to nocturnal dark mode"
							}
							aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
						>
							{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
						</button>

						{selectedCount > 0 && (
							<button
								type="button"
								onClick={() => tournamentActions.setSelection([])}
								className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground whitespace-nowrap shrink-0"
								aria-label="Clear selected names"
							>
								<X className="size-3.5" />
								<span>Clear</span>
							</button>
						)}

						{canStartCustom ? (
							<button
								type="button"
								onClick={handleStartSelected}
								className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.98] whitespace-nowrap shrink-0"
							>
								<Play className="size-3.5 fill-current" />
								<span>Start Bracket</span>
								<span className="font-mono tabular-nums opacity-90">&middot; {selectedCount}</span>
							</button>
						) : (
							<>
								<button
									type="button"
									onClick={() => handleQuickStart(8)}
									className="inline-flex h-10 items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/8 px-4 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/15 whitespace-nowrap shrink-0"
								>
									<Shuffle className="size-3.5 text-primary" />
									<span>Quick 8</span>
								</button>
								<button
									type="button"
									onClick={() => handleQuickStart(16)}
									className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm transition-all duration-150 hover:brightness-105 active:scale-[0.98] whitespace-nowrap shrink-0"
								>
									<Play className="size-3.5 fill-current" />
									<span>Start Top 16</span>
								</button>
							</>
						)}
					</div>
				</nav>
			</div>
		</div>
	);
});

/* ==========================================================================
   3. TOURNAMENT SETUP CONTAINER
   ========================================================================== */

export function TournamentSetup() {
	const { names, isComplete, ratings, userId, userName } = useTournamentSetupState();
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const hasSavedRef = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const prefersReducedMotion = useReducedMotion();

	useInertiaScroll(containerRef, prefersReducedMotion);

	const saveRatingsMutation = useMutation({
		mutationFn: ({ userId, ratings }: { userId: string; ratings: Record<string, RatingData> }) =>
			ratingsAPI.saveRatings(userId, ratings),
		onError: (error) => {
			console.error("Tournament ratings save failed:", error);
		},
	});

	useEffect(() => {
		if (!isComplete) {
			hasSavedRef.current = false;
			return;
		}
		if (hasSavedRef.current) {
			return;
		}
		if (Object.keys(ratings).length > 0) {
			hasSavedRef.current = true;
			const effectiveUserId = userId || userName || "anonymous";
			saveRatingsMutation.mutate({
				userId: effectiveUserId,
				ratings: normalizeRatingsWithStats(ratings),
			});
		}
	}, [isComplete, ratings, userId, userName, saveRatingsMutation.mutate]);

	const handleArenaComplete = useCallback(
		(completedRatings: Record<string, RatingData>) => {
			tournamentActions.completeTournament(completedRatings);
		},
		[tournamentActions],
	);

	return (
		<div ref={containerRef} className="w-full flex flex-col flex-1 min-h-[520px] gap-2">
			<AnimatePresence mode="wait">
				{names && names.length >= 2 ? (
					<motion.div
						key="arena"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<TournamentArena
							names={names}
							onComplete={handleArenaComplete}
							userName={userName ?? undefined}
						/>
					</motion.div>
				) : (
					<motion.div
						key="setup"
						{...fadeMotionPreset}
						className="w-full flex flex-col flex-1 min-h-[520px] py-0"
					>
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
