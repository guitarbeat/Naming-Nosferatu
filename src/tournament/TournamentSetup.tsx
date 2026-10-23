import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
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
   2. NAME SELECTOR & ROSTER LAUNCH BAR
   ========================================================================== */

export const NameSelector = memo(function NameSelector() {
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const storeSelectedNames = useAppStore((state) => state.tournament.selectedNames);
	const tournamentActions = useAppStore((state) => state.tournamentActions);

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
				<div className="floating-navbar-shell flex flex-wrap items-center justify-between gap-3 rounded-full px-4 py-2.5 sm:px-6">
					<div className="flex items-center gap-2.5">
						<span className="font-display text-sm sm:text-base font-bold text-foreground whitespace-nowrap">
							Name Nosferatu
						</span>
						<span className="text-xs text-muted-foreground font-mono tabular-nums">
							&middot; {storeSelectedNames.length} selected
						</span>
					</div>

					<div className="flex items-center gap-2">
						{storeSelectedNames.length >= 2 ? (
							<>
								<Button
									variant="ghost"
									size="small"
									onClick={() => tournamentActions.setSelection([])}
									className="h-8 min-h-0 px-3 text-xs"
								>
									Clear
								</Button>
								<Button
									variant="primary"
									size="small"
									onClick={handleStartSelected}
									className="h-9 min-h-0 px-4 text-xs font-bold"
								>
									<Play className="size-3.5" />
									<span>Start Bracket ({storeSelectedNames.length})</span>
								</Button>
							</>
						) : (
							<>
								<Button
									variant="glass"
									size="small"
									onClick={() => handleQuickStart(8)}
									className="h-9 min-h-0 px-3.5 text-xs font-semibold"
								>
									<Sparkles className="size-3.5 text-primary" />
									<span>Quick 8</span>
								</Button>
								<Button
									variant="primary"
									size="small"
									onClick={() => handleQuickStart(16)}
									className="h-9 min-h-0 px-4 text-xs font-bold"
								>
									<Play className="size-3.5" />
									<span>Start Top 16</span>
								</Button>
							</>
						)}
					</div>
				</div>
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
							onComplete={(completedRatings) => {
								tournamentActions.completeTournament(completedRatings);
							}}
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
