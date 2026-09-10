import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useMemo } from "react";
import { namesQueryOptions, SUPABASE_UNAVAILABLE_MSG } from "@/api";
import { DriftWall, type DriftWallItem } from "@/components/DriftWall";
import { Button, Loading } from "@/components/LayoutBlocks";
import { DEFAULT_SAMPLE_NAMES, getLockedNames, getVisibleNames, isNameLocked } from "@/lib/names";
import { hapticNavTap } from "@/lib/utils";
import useAppStore from "@/store";
import type { IdType, NameItem } from "@/types";

/**
 * Accessible cat name contender selection via full-screen 3D Drift Wall.
 */
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

	const namesById = useMemo(() => {
		const map = new Map<IdType, NameItem>();
		for (let i = 0; i < names.length; i++) {
			const nameItem = names[i];
			map.set(nameItem.id, nameItem);
		}
		return map;
	}, [names]);

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

	const driftWallItems = useMemo<DriftWallItem[]>(() => {
		return availableNames.map((nameItem) => {
			const isSelected = selectedIds.has(nameItem.id);
			const locked = isNameLocked(nameItem);
			return {
				id: String(nameItem.id),
				title: nameItem.name,
				subtitle: nameItem.description
					? nameItem.description
					: nameItem.pronunciation
						? `/${nameItem.pronunciation}/`
						: undefined,
				selected: isSelected,
				locked,
				onClick: () => handleToggleName(nameItem.id),
			};
		});
	}, [availableNames, selectedIds, handleToggleName]);

	if (isLoading) {
		return (
			<div className="w-full h-screen min-h-[100dvh] flex items-center justify-center">
				<Loading variant="spinner" text="Loading contenders..." />
			</div>
		);
	}

	if (error && !isSupabaseUnavailable && availableNames.length === 0) {
		return (
			<div className="w-full h-screen min-h-[100dvh] flex flex-col items-center justify-center text-center px-4">
				<div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 max-w-md space-y-4">
					<p className="size-10 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center mx-auto text-lg font-bold">
						!
					</p>
					<div className="space-y-1.5">
						<h3 className="font-display text-xl font-bold text-foreground">
							Could not load shortlist
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
					</div>
					<Button onClick={() => void namesQuery.refetch()} variant="outline" size="small">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden select-none">
			{/* Full-Screen Drift Wall */}
			{availableNames.length > 0 && (
				<div className="absolute inset-0 w-full h-full overflow-hidden">
					<DriftWall
						items={driftWallItems}
						columns={7}
						tileWidth={150}
						tileHeight={150}
						gap={22}
						radius={9999}
						tilt={0}
						turn={0}
						roll={0}
						perspective={1200}
						depth={120}
						speed={22}
						direction="up"
						variance={0.45}
						parallax={0.55}
						lift={0}
						fade={0}
						dim={1}
						pauseOnHover={true}
						grayscale={false}
						className="w-full h-full"
					/>
				</div>
			)}
		</div>
	);
});
