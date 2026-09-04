import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useMemo } from "react";
import { namesQueryOptions, SUPABASE_UNAVAILABLE_MSG } from "@/shared/api";
import { Button, DriftWall, type DriftWallItem, Loading } from "@/shared/components";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getLockedNames, getVisibleNames, isNameHidden, isNameLocked } from "@/shared/lib/names";
import { getRandomCatImage } from "@/shared/lib/uiUtils";
import { hapticNavTap } from "@/shared/lib/utils";
import type { IdType, NameItem } from "@/shared/types";
import useAppStore from "@/store";

/**
 * Accessible cat name selection powered by 3D Drift Wall.
 */
export const NameSelector = memo(function NameSelector() {
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const storeSelectedNames = useAppStore((state) => state.tournament.selectedNames);
	const tournamentActions = useAppStore((state) => state.tournamentActions);

	const namesQuery = useQuery({
		...namesQueryOptions(isAdmin),
		retry: 2,
	});

	const sampleNames = useMemo<NameItem[]>(
		() => [
			{ id: "1", name: "Nosferatu", description: "The immortal feline count with shadowy charm" },
			{ id: "2", name: "Luna", description: "Graceful and mysterious moonlit tabby" },
			{
				id: "3",
				name: "Miso",
				description: "Sweet and playful companion who purrs like an engine",
			},
			{ id: "4", name: "Pixel", description: "Tech-savvy, energetic, and clever troublemaker" },
			{ id: "5", name: "Saffron", description: "Warm and spicy personality with golden fur" },
			{ id: "6", name: "Noodle", description: "Long, stretchy acrobatic champion" },
			{ id: "7", name: "Ziggy", description: "Bold and energetic fearless explorer" },
			{ id: "8", name: "Whiskers", description: "Classic, timeless, and distinguished gentlegato" },
			{ id: "9", name: "Pepper", description: "Small but mighty whirlwind of energy" },
			{
				id: "10",
				name: "Shadow",
				description: "Silent stalker of dust motes and midnight zoomies",
			},
			{ id: "11", name: "Milo", description: "Friendly adventurer with curious streak" },
			{ id: "12", name: "Barnaby", description: "Dignified floof with a heart of gold" },
		],
		[],
	);

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
			: sampleNames;
	const isLoading = namesQuery.isPending && !namesQuery.data;

	const selectedIds = useMemo(
		() => new Set(storeSelectedNames.map((item) => item.id)),
		[storeSelectedNames],
	);

	const { catImageById, namesById } = useMemo(() => {
		const catImageById = new Map<IdType, string>();
		const namesById = new Map<IdType, NameItem>();

		for (let i = 0; i < names.length; i++) {
			const nameItem = names[i];
			const img = getRandomCatImage(nameItem.id, CAT_IMAGES, nameItem.name);
			if (img) {
				catImageById.set(nameItem.id, img);
			}
			namesById.set(nameItem.id, nameItem);
		}
		return { catImageById, namesById };
	}, [names]);

	useEffect(() => {
		if (names.length === 0) {
			return;
		}
		const lockedInNames = getLockedNames(names);
		if (lockedInNames.length === 0) {
			return;
		}
		const missingLocked = lockedInNames.filter((n) => !selectedIds.has(n.id));
		if (missingLocked.length > 0) {
			tournamentActions.setSelection([...storeSelectedNames, ...missingLocked]);
		}
	}, [names, storeSelectedNames, tournamentActions, selectedIds]);

	// Pre-select 8 candidates on initial load if none are selected yet
	useEffect(() => {
		if (storeSelectedNames.length === 0 && names.length >= 8) {
			const activeCandidates = names.filter((n) => !isNameHidden(n));
			if (activeCandidates.length >= 2) {
				tournamentActions.setSelection(
					activeCandidates.slice(0, Math.min(8, activeCandidates.length)),
				);
			}
		}
	}, [names, storeSelectedNames.length, tournamentActions]);

	const triggerHaptic = useCallback(() => {
		hapticNavTap();
	}, []);

	const handleToggleName = useCallback(
		(nameId: IdType) => {
			const nameItem = namesById.get(nameId);
			if (!nameItem || isNameLocked(nameItem)) {
				return;
			}
			triggerHaptic();

			const isCurrentlySelected = selectedIds.has(nameId);
			const nextSelection = isCurrentlySelected
				? storeSelectedNames.filter((n) => n.id !== nameId)
				: [...storeSelectedNames, nameItem];
			tournamentActions.setSelection(nextSelection);
		},
		[namesById, triggerHaptic, selectedIds, storeSelectedNames, tournamentActions],
	);

	const availableNames = useMemo(() => getVisibleNames(names), [names]);

	const driftWallItems = useMemo<DriftWallItem[]>(() => {
		return availableNames.map((nameItem) => {
			const isSelected = selectedIds.has(nameItem.id);
			const catImage =
				catImageById.get(nameItem.id) ?? getRandomCatImage(nameItem.id, CAT_IMAGES, nameItem.name);
			const locked = isNameLocked(nameItem);
			return {
				id: String(nameItem.id),
				image: catImage,
				title: nameItem.name,
				subtitle: nameItem.pronunciation
					? `/${nameItem.pronunciation}/`
					: (nameItem.description ?? undefined),
				selected: isSelected,
				locked,
				onClick: () => handleToggleName(nameItem.id),
			};
		});
	}, [availableNames, selectedIds, catImageById, handleToggleName]);

	if (isLoading) {
		return (
			<div className="mx-auto w-full py-16 flex items-center justify-center">
				<Loading variant="spinner" text="Loading cat pool..." />
			</div>
		);
	}

	if (error && !isSupabaseUnavailable && availableNames.length === 0) {
		return (
			<div className="mx-auto w-full py-12 flex flex-col items-center justify-center text-center">
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
		<div className="w-full flex flex-col flex-1 min-h-[520px]">
			{availableNames.length > 0 ? (
				<DriftWall
					className="w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] flex-1 min-h-[520px] h-[clamp(520px,72vh,820px)] bg-transparent"
					items={driftWallItems}
					tileWidth={200}
					tileHeight={135}
					gap={16}
					tilt={10}
					turn={-8}
					perspective={1200}
					depth={100}
					speed={35}
					direction="up"
					variance={0.3}
					parallax={0.4}
					lift={40}
					fade={0.5}
					dim={0.5}
					pauseOnHover={true}
					overlayColor="transparent"
				/>
			) : (
				<div className="w-full py-16 flex items-center justify-center text-muted-foreground">
					No names available to display
				</div>
			)}
		</div>
	);
});
