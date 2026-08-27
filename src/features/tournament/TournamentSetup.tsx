import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
	AlertCircle,
	Check,
	CheckCircle2,
	Dices,
	Eye,
	EyeOff,
	Lock,
	Plus,
	Sparkles,
	Trophy,
	Unlock,
	Zap,
	ZoomIn,
} from "lucide-react";
import type React from "react";
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import { useNameSuggestion } from "@/features/tournament/hooks";
import { SUPABASE_UNAVAILABLE_MSG } from "@/shared/api/mock/errorUtils";
import { ratingsAPI } from "@/shared/api/mock/ratingService";
import { namesQueryOptions, useNameAdminActions } from "@/shared/api/names/api";
import {
	Button,
	CatImage,
	Input,
	Lightbox,
	Loading,
	Modal,
	Textarea,
} from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getLockedNames, getVisibleNames, isNameHidden, isNameLocked } from "@/shared/lib/names";
import {
	fadeMotionPreset,
	getRandomCatImage,
	MOTION_SPRINGS,
	scaleFadeMotionPreset,
	statusMessageMotionPreset,
} from "@/shared/lib/uiUtils";
import { addToSet, hapticNavTap, removeFromSet } from "@/shared/lib/utils";
import type { IdType, NameItem } from "@/shared/types";
import useAppStore from "@/store/appStore";

export function TournamentSetup() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const _tournamentActions = useAppStore((s) => s.tournamentActions);

	const saveRatingsMutation = useMutation({
		mutationFn: ({
			userId,
			ratings,
		}: {
			userId: string;
			ratings: Record<string, { rating: number; wins: number; losses: number }>;
		}) => ratingsAPI.saveRatings(userId, ratings),
	});

	const mutateAsyncRef = useRef(saveRatingsMutation.mutateAsync);
	useEffect(() => {
		mutateAsyncRef.current = saveRatingsMutation.mutateAsync;
	}, [saveRatingsMutation.mutateAsync]);

	useEffect(() => {
		if (tournament.isComplete && Object.keys(tournament.ratings).length > 0) {
			const userId = user.id || user.name || "anonymous";

			const ratingsWithStats: Record<string, { rating: number; wins: number; losses: number }> = {};
			for (const nameId in tournament.ratings) {
				if (Object.hasOwn(tournament.ratings, nameId)) {
					const ratingData = tournament.ratings[nameId];
					const rating = typeof ratingData === "number" ? ratingData : ratingData.rating;
					const wins = typeof ratingData === "number" ? 0 : (ratingData.wins ?? 0);
					const losses = typeof ratingData === "number" ? 0 : (ratingData.losses ?? 0);
					ratingsWithStats[nameId] = {
						rating,
						wins,
						losses,
					};
				}
			}

			mutateAsyncRef.current({ userId, ratings: ratingsWithStats }).catch((_error) => {
				console.error("Tournament ratings save failed — ratings were not persisted", _error);
			});
		}
	}, [tournament.isComplete, tournament.ratings, user.id, user.name]);

	return (
		<div className="w-full flex flex-col gap-2">
			<AnimatePresence mode="wait">
				{!tournament.isComplete && (
					<motion.div key="setup" {...fadeMotionPreset} className="w-full py-0">
						<NameSelector />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

type PendingAdminAction = {
	type: "toggle-hidden" | "toggle-locked";
	nameId: IdType;
	isCurrentlyEnabled: boolean;
};

/**
 * Text and backstory overlay rendered inside each cat name tile.
 */
const NameContent = memo(function NameContent({ nameItem }: { nameItem: NameItem }) {
	return (
		<div className="flex flex-col items-center gap-1 max-w-full text-center">
			<span className="w-full break-words font-display text-xl sm:text-2xl font-bold leading-tight text-white drop-shadow-md">
				{nameItem.name}
			</span>
			{nameItem.pronunciation ? (
				<span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-white/80">
					/{nameItem.pronunciation}/
				</span>
			) : null}
			{nameItem.description ? (
				<p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/80">
					{nameItem.description}
				</p>
			) : null}
		</div>
	);
});

/**
 * Admin action trigger for locking or hiding names in the pool.
 */
const AdminActionButton = memo(function AdminActionButton({
	nameItem,
	actionType,
	isProcessing,
	onClick,
}: {
	nameItem: NameItem;
	actionType: "toggle-hidden" | "toggle-locked";
	isProcessing: boolean;
	onClick: () => void;
	prefersReducedMotion: boolean;
}) {
	const isHidden = actionType === "toggle-hidden";
	const isEnabled = isHidden ? isNameHidden(nameItem) : isNameLocked(nameItem);

	const Icon = isHidden ? (isEnabled ? EyeOff : Eye) : isEnabled ? Lock : Unlock;
	const label = isHidden ? (isEnabled ? "Unhide" : "Hide") : isEnabled ? "Unlock" : "Lock";

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={isProcessing}
			className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.96] ${
				isEnabled
					? "border-accent/40 bg-accent/15 text-accent hover:bg-accent/25"
					: "border-border/60 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
			} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
		>
			{isProcessing ? (
				<div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
			) : (
				<Icon className="size-3.5" />
			)}
			<span>{label}</span>
		</button>
	);
});

/**
 * Selection check badge.
 */
const SelectionBadge = ({ prefersReducedMotion }: { prefersReducedMotion: boolean }) => (
	<motion.div
		initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
		animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
		className="absolute top-2.5 right-2.5 z-20"
	>
		<div className="flex size-7 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-md">
			<Check size={14} strokeWidth={3} />
		</div>
	</motion.div>
);

/**
 * Zoom button for expanding cat avatar into lightbox.
 */
function ZoomButton({ nameId, onClick }: { nameId: IdType; onClick: (id: IdType) => void }) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick(nameId);
			}}
			className="absolute top-2.5 left-2.5 size-7 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all hover:bg-background hover:scale-110 z-10 flex items-center justify-center shadow-xs backdrop-blur-sm"
			aria-label="View full size photo"
			title="View full size photo"
		>
			<ZoomIn size={13} />
		</button>
	);
}

/**
 * Nature-inspired, accessible cat name selection and administration grid.
 */
export function NameSelector() {
	const toast = useToast();
	const prefersReducedMotion = useReducedMotion() ?? false;
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const userName = useAppStore((state) => state.user.name);
	const storeSelectedNames = useAppStore((state) => state.tournament.selectedNames);
	const tournamentActions = useAppStore((state) => state.tournamentActions);
	const { toggleHidden, toggleLocked } = useNameAdminActions(userName ?? "");
	const [togglingHidden, setTogglingHidden] = useState<Set<IdType>>(new Set());
	const [togglingLocked, setTogglingLocked] = useState<Set<IdType>>(new Set());
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	const namesQuery = useQuery({
		...namesQueryOptions(isAdmin),
		retry: 2,
	});

	const sampleNames = [
		{ id: "1", name: "Luna", description: "Graceful and mysterious" },
		{ id: "2", name: "Miso", description: "Sweet and playful" },
		{ id: "3", name: "Pixel", description: "Tech-savvy and clever" },
		{ id: "4", name: "Saffron", description: "Warm and spicy personality" },
		{ id: "5", name: "Noodle", description: "Long and stretchy" },
		{ id: "6", name: "Ziggy", description: "Bold and energetic" },
		{ id: "7", name: "Whiskers", description: "Classic and timeless" },
		{ id: "8", name: "Pepper", description: "Small but mighty" },
	] satisfies NameItem[];

	const error =
		namesQuery.error instanceof Error
			? namesQuery.error.message
			: namesQuery.error
				? "Failed to load names"
				: null;
	const isSupabaseUnavailable = error === SUPABASE_UNAVAILABLE_MSG;
	const names = isSupabaseUnavailable ? sampleNames : (namesQuery.data?.names ?? []);
	const isLoading = namesQuery.isPending && !isSupabaseUnavailable;

	const selectedIds = useMemo(
		() => new Set(storeSelectedNames.map((item) => item.id)),
		[storeSelectedNames],
	);

	const { catImages, catImageById, namesById, nameIndexById } = useMemo(() => {
		const catImages: string[] = [];
		const catImageById = new Map<IdType, string>();
		const namesById = new Map<IdType, NameItem>();
		const nameIndexById = new Map<IdType, number>();

		for (let i = 0; i < names.length; i++) {
			const nameItem = names[i];
			const img = getRandomCatImage(nameItem.id, CAT_IMAGES, nameItem.name);
			catImages.push(img);

			if (img) {
				catImageById.set(nameItem.id, img);
			}
			namesById.set(nameItem.id, nameItem);
			nameIndexById.set(nameItem.id, i);
		}
		return { catImages, catImageById, namesById, nameIndexById };
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

	const handleToggleHidden = useCallback(
		async (nameId: IdType, isCurrentlyHidden: boolean) => {
			if (!isAdmin || !userName?.trim()) {
				return;
			}

			setTogglingHidden((prev) => addToSet(prev, nameId));

			try {
				await toggleHidden({ nameId, isCurrentlyHidden });
				toast.showSuccess(isCurrentlyHidden ? "Name is visible again." : "Name is now hidden.");
			} catch (error) {
				const detail = error instanceof Error ? error.message : "Unknown error";
				toast.showError(`Could not update hidden status: ${detail}`);
			} finally {
				setTogglingHidden((prev) => removeFromSet(prev, nameId));
			}
		},
		[isAdmin, toast, toggleHidden, userName],
	);

	const handleToggleLocked = useCallback(
		async (nameId: IdType, isCurrentlyLocked: boolean) => {
			if (!isAdmin || !userName?.trim()) {
				return;
			}

			setTogglingLocked((prev) => addToSet(prev, nameId));

			try {
				await toggleLocked({ nameId, isCurrentlyLocked });
				toast.showSuccess(isCurrentlyLocked ? "Name unlocked." : "Name locked in.");
			} catch (error) {
				const detail = error instanceof Error ? error.message : "Unknown error";
				toast.showError(`Could not update lock state: ${detail}`);
			} finally {
				setTogglingLocked((prev) => removeFromSet(prev, nameId));
			}
		},
		[isAdmin, toast, toggleLocked, userName],
	);

	const [pendingAdminAction, setPendingAdminAction] = useState<PendingAdminAction | null>(null);

	const requestAdminAction = useCallback(
		(action: PendingAdminAction) => {
			if (!isAdmin) {
				toast.showWarning("Only admins can perform that action.");
				return;
			}

			if (!userName?.trim()) {
				toast.showError("Admin actions require a valid user session. Please log in again.");
				return;
			}

			setPendingAdminAction(action);
		},
		[isAdmin, toast, userName],
	);

	const cancelAdminAction = useCallback(() => {
		setPendingAdminAction(null);
	}, []);

	const confirmActionName = useMemo(() => {
		if (!pendingAdminAction) {
			return "";
		}
		const target = namesById.get(pendingAdminAction.nameId);
		return target?.name ?? "this name";
	}, [namesById, pendingAdminAction]);

	const isPendingActionBusy = useMemo(() => {
		if (!pendingAdminAction) {
			return false;
		}
		if (pendingAdminAction.type === "toggle-hidden") {
			return togglingHidden.has(pendingAdminAction.nameId);
		}
		return togglingLocked.has(pendingAdminAction.nameId);
	}, [pendingAdminAction, togglingHidden, togglingLocked]);

	const confirmAdminAction = useCallback(async () => {
		if (!pendingAdminAction) {
			return;
		}

		try {
			if (pendingAdminAction.type === "toggle-hidden") {
				await handleToggleHidden(pendingAdminAction.nameId, pendingAdminAction.isCurrentlyEnabled);
			} else {
				await handleToggleLocked(pendingAdminAction.nameId, pendingAdminAction.isCurrentlyEnabled);
			}
		} finally {
			setPendingAdminAction(null);
		}
	}, [pendingAdminAction, handleToggleHidden, handleToggleLocked]);

	const availableNames = useMemo(() => getVisibleNames(names), [names]);
	const isHiddenAction = pendingAdminAction?.type === "toggle-hidden";
	const isDisablingAction = Boolean(pendingAdminAction?.isCurrentlyEnabled);
	const confirmTitle = isHiddenAction
		? isDisablingAction
			? "Unhide this name?"
			: "Hide this name?"
		: isDisablingAction
			? "Unlock this name?"
			: "Lock this name?";
	const confirmDescription = isHiddenAction
		? `${confirmActionName} will ${
				isDisablingAction ? "be visible to everyone again." : "be removed from public view."
			}`
		: `${confirmActionName} will ${
				isDisablingAction ? "be removed from the locked list." : "stay selected for all users."
			}`;
	const confirmLabel = isHiddenAction
		? isDisablingAction
			? "Unhide"
			: "Hide"
		: isDisablingAction
			? "Unlock"
			: "Lock";

	const handleOpenLightbox = useCallback(
		(nameId: IdType) => {
			const index = nameIndexById.get(nameId);
			if (index !== undefined && index !== -1) {
				setLightboxIndex(index);
				setLightboxOpen(true);
			}
		},
		[nameIndexById],
	);

	if (isLoading) {
		return (
			<div className="mx-auto w-full py-16 flex items-center justify-center">
				<Loading variant="spinner" text="Loading cat pool..." />
			</div>
		);
	}

	if (error && !isSupabaseUnavailable) {
		return (
			<div className="mx-auto w-full py-16 flex flex-col items-center justify-center">
				<div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card/60 p-6 text-center shadow-lg backdrop-blur-md">
					<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
						Failed to load
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
		<div className="mx-auto w-full space-y-6">
			{availableNames.length > 0 && (
				<div className="grid grid-cols-2 min-[540px]:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
					{availableNames.map((nameItem) => {
						const isSelected = selectedIds.has(nameItem.id);
						const catImage = catImageById.get(nameItem.id) ?? "";
						const locked = isNameLocked(nameItem);

						return (
							<motion.div
								key={nameItem.id}
								role="button"
								tabIndex={0}
								onClick={() => handleToggleName(nameItem.id)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleToggleName(nameItem.id);
									}
								}}
								aria-pressed={isSelected}
								aria-label={`${isSelected ? "Deselect" : "Select"} name: ${nameItem.name}`}
								whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -2 }}
								whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
								transition={MOTION_SPRINGS.snappy}
								className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
									isSelected
										? "border-primary/60 bg-card shadow-[0_0_24px_hsl(var(--pw-sage-hsl)/0.25)] ring-2 ring-primary/40"
										: "border-border/40 bg-card/60 hover:border-border/80 hover:bg-card hover:shadow-md"
								} ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
							>
								<div className="w-full relative aspect-[4/3] overflow-hidden">
									<CatImage
										src={catImage}
										alt={nameItem.name}
										containerClassName="w-full h-full"
										imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />

									{isSelected && <SelectionBadge prefersReducedMotion={prefersReducedMotion} />}

									<div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none p-3 text-center">
										<NameContent nameItem={nameItem} />
									</div>

									<ZoomButton nameId={nameItem.id} onClick={handleOpenLightbox} />
								</div>

								{isAdmin && (
									<div className="p-2 flex gap-1.5 border-t border-border/30 bg-background/50">
										<AdminActionButton
											nameItem={nameItem}
											actionType="toggle-hidden"
											isProcessing={togglingHidden.has(nameItem.id)}
											prefersReducedMotion={prefersReducedMotion}
											onClick={() =>
												requestAdminAction({
													type: "toggle-hidden",
													nameId: nameItem.id,
													isCurrentlyEnabled: isNameHidden(nameItem),
												})
											}
										/>
										<AdminActionButton
											nameItem={nameItem}
											actionType="toggle-locked"
											isProcessing={togglingLocked.has(nameItem.id)}
											prefersReducedMotion={prefersReducedMotion}
											onClick={() =>
												requestAdminAction({
													type: "toggle-locked",
													nameId: nameItem.id,
													isCurrentlyEnabled: isNameLocked(nameItem),
												})
											}
										/>
									</div>
								)}
							</motion.div>
						);
					})}
				</div>
			)}

			{lightboxOpen && (
				<Lightbox
					images={catImages}
					currentIndex={lightboxIndex}
					onClose={() => setLightboxOpen(false)}
					onNavigate={setLightboxIndex}
				/>
			)}

			<Modal
				open={Boolean(pendingAdminAction)}
				title={confirmTitle}
				description={confirmDescription}
				onClose={cancelAdminAction}
				closeDisabled={isPendingActionBusy}
			>
				<div className="flex flex-col gap-4">
					<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
						{confirmDescription}
					</p>

					<div className="flex items-center justify-end gap-2.5 pt-2">
						<Button
							type="button"
							variant="ghost"
							size="medium"
							onClick={cancelAdminAction}
							disabled={isPendingActionBusy}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="danger"
							size="medium"
							onClick={() => void confirmAdminAction()}
							loading={isPendingActionBusy}
						>
							{confirmLabel}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

interface NameSuggestionProps {
	variant?: "inline" | "modal";
	onClose?: () => void;
}

interface InspirationArchetype {
	id: string;
	label: string;
	icon: string;
	names: Array<{ name: string; description: string }>;
}

const INSPIRATION_ARCHETYPES: InspirationArchetype[] = [
	{
		id: "vampiric",
		label: "Gothic / Vampire",
		icon: "🦇",
		names: [
			{
				name: "Nosferpaws",
				description: "Only comes out at 3 AM to zoom silently across the velvet sofa.",
			},
			{
				name: "Count Whiskula",
				description: "Drinks goat milk from a crystal goblet and casts no mirror reflection.",
			},
			{
				name: "Lord Vladiclaw",
				description: "Ancient vampire lord who demands fresh tuna sacrifices upon waking.",
			},
		],
	},
	{
		id: "regal",
		label: "Regal / Noble",
		icon: "👑",
		names: [
			{
				name: "Sir Paws-a-lot",
				description: "Knighted for defending the realm against the red laser dot.",
			},
			{
				name: "Duchess Fluffington",
				description: "Heiress to the cardboard castle with nine royal titles.",
			},
			{
				name: "Baron Von Claw",
				description: "Monocled aristocrat who refuses to sit on unbrushed cushions.",
			},
		],
	},
	{
		id: "mystical",
		label: "Mystic / Cosmic",
		icon: "🌙",
		names: [
			{
				name: "Shadowfax",
				description: "Swift as moonlight, capable of vanishing between dimension folds.",
			},
			{
				name: "Cosmic Whisker",
				description: "Travels across the astral plane to knock over celestial cups.",
			},
			{
				name: "Grimoire",
				description: "An enchanted familiar containing secrets of the ancient purrs.",
			},
		],
	},
	{
		id: "gremlin",
		label: "Chaos / Gremlin",
		icon: "⚡",
		names: [
			{
				name: "Bitey McBiteface",
				description: "Zero thoughts, maximum chaos, attacks ankles with precision.",
			},
			{
				name: "Captain Turbo Zoomies",
				description: "Breaks the sound barrier across hallways at 4:15 in the morning.",
			},
			{
				name: "Goblin Mode",
				description: "Hoards hair ties beneath the washing machine with demonic glee.",
			},
		],
	},
	{
		id: "whimsical",
		label: "Food / Cute",
		icon: "🥐",
		names: [
			{
				name: "Baguette",
				description: "Warm, golden, elongated, and delightfully crusty in the morning.",
			},
			{
				name: "Tiramisu",
				description: "Layers of sweetness topped with a dust of cocoa espresso attitude.",
			},
			{
				name: "Wasabi",
				description: "Small, seemingly sweet, but packs an unexpectedly fiery kick.",
			},
		],
	},
];

// ============================================================================
// LIVE CARD PREVIEW
// ============================================================================

interface CardPreviewProps {
	name: string;
	description: string;
	archetypeIcon?: string;
}

function getAvatarForName(nameStr: string): string {
	if (!nameStr.trim()) {
		return CAT_IMAGES[0] || "";
	}
	let hash = 0;
	for (let i = 0; i < nameStr.length; i++) {
		hash = (hash << 5) - hash + nameStr.charCodeAt(i);
		hash |= 0;
	}
	const index = Math.abs(hash) % CAT_IMAGES.length;
	return CAT_IMAGES[index] || CAT_IMAGES[0] || "";
}

function ContenderCardPreview({ name, description, archetypeIcon = "🐾" }: CardPreviewProps) {
	const displayName = name.trim() || "Feline Contender";
	const displayLore = description.trim() || "Backstory and tournament lore will appear here...";
	const hasContent = Boolean(name.trim() || description.trim());
	const previewAvatar = getAvatarForName(name);

	return (
		<div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/85 p-4 sm:p-5 shadow-lg backdrop-blur-md transition-all">
			<div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-border/50">
				<div className="flex items-center gap-3 min-w-0">
					<div className="relative size-11 shrink-0 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-sm bg-muted">
						<CatImage
							src={previewAvatar}
							alt={displayName}
							containerClassName="size-full"
							imageClassName="size-full object-cover"
						/>
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
							<span>{archetypeIcon}</span>
							<span>Live Contender Preview</span>
						</div>
						<div className="text-sm font-extrabold text-foreground truncate">
							{hasContent ? displayName : "Previewing Your Cat"}
						</div>
					</div>
				</div>
				<div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold shrink-0 shadow-xs">
					<Zap size={12} />
					<span>1500 ELO</span>
				</div>
			</div>

			<div className="space-y-2">
				<div className="text-base sm:text-lg font-black tracking-tight text-foreground line-clamp-1">
					{hasContent ? (
						displayName
					) : (
						<span className="text-muted-foreground italic">Name your feline warrior...</span>
					)}
				</div>
				<p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2 italic">
					"{displayLore}"
				</p>
			</div>

			<div className="mt-3.5 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
				<span className="flex items-center gap-1 font-medium">
					<Sparkles size={12} className="text-primary" /> Ready for Bracket
				</span>
				<span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
					Matchup Eligible
				</span>
			</div>
		</div>
	);
}

// ============================================================================
// STATUS MESSAGE
// ============================================================================

function StatusMessage({ error, success }: { error?: string; success?: string }) {
	return (
		<AnimatePresence mode="wait">
			{error && (
				<motion.div
					role="alert"
					{...statusMessageMotionPreset}
					className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs sm:text-sm text-destructive font-medium flex items-center justify-center gap-2"
				>
					<AlertCircle size={16} className="shrink-0 text-destructive" />
					<span>{error}</span>
				</motion.div>
			)}
			{success && (
				<motion.div
					role="status"
					{...statusMessageMotionPreset}
					className="p-3 rounded-xl border border-chart-2/30 bg-chart-2/10 text-xs sm:text-sm text-center flex items-center justify-center gap-2 text-chart-2 font-medium"
				>
					<CheckCircle2 size={16} className="shrink-0" />
					<span>{success}</span>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// ============================================================================
// SUCCESS CELEBRATION CARD
// ============================================================================

interface SuggestionSuccessViewProps {
	submittedName: string;
	submittedDescription: string;
	onSuggestAnother: () => void;
	onClose?: () => void;
}

function SuggestionSuccessView({
	submittedName,
	submittedDescription,
	onSuggestAnother,
	onClose,
}: SuggestionSuccessViewProps) {
	return (
		<motion.div
			{...scaleFadeMotionPreset}
			className="flex flex-col items-center text-center py-4 px-2 space-y-5"
		>
			<div className="relative">
				<div className="absolute -inset-2 rounded-full bg-primary/20 blur-md animate-pulse" />
				<div className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
					<Trophy size={28} className="animate-bounce" />
				</div>
			</div>

			<div className="space-y-1.5">
				<h4 className="text-xl font-bold text-foreground">Added to Tournament Pool!</h4>
				<p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
					Your cat has entered the arena. Contenders will face off in upcoming head-to-head matches!
				</p>
			</div>

			<div className="w-full">
				<ContenderCardPreview
					name={submittedName}
					description={submittedDescription}
					archetypeIcon="🏆"
				/>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
				<Button
					type="button"
					variant="ghost"
					size="medium"
					onClick={onSuggestAnother}
					className="gap-1.5"
				>
					<Plus size={16} />
					Suggest Another
				</Button>
				{onClose && (
					<Button type="button" variant="primary" size="medium" onClick={onClose} className="px-6">
						Done
					</Button>
				)}
			</div>
		</motion.div>
	);
}

// ============================================================================
// INSPIRATION CHIPS ROW
// ============================================================================

interface ArchetypeBarProps {
	onSelectIdea: (name: string, description: string) => void;
	onRandomize: () => void;
	disabled?: boolean;
}

function ArchetypeBar({ onSelectIdea, onRandomize, disabled }: ArchetypeBarProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
					<Sparkles size={12} className="text-primary" />
					Quick Inspiration
				</span>
				<button
					type="button"
					onClick={onRandomize}
					disabled={disabled}
					className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline hover:text-primary/80 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
				>
					<Dices size={13} />
					Surprise Me
				</button>
			</div>

			<div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
				{INSPIRATION_ARCHETYPES.map((cat) => {
					const sample = cat.names[Math.floor(Math.random() * cat.names.length)];
					return (
						<button
							key={cat.id}
							type="button"
							disabled={disabled}
							onClick={() => onSelectIdea(sample.name, sample.description)}
							className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-medium text-foreground transition-all active:scale-95 disabled:opacity-50"
							title={`Try "${sample.name}"`}
						>
							<span>{cat.icon}</span>
							<span>{cat.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ============================================================================
// INLINE INNER
// ============================================================================

export function NameSuggestionInner() {
	const toast = useToast();
	const [submittedPreview, setSubmittedPreview] = useState<{
		name: string;
		description: string;
	} | null>(null);

	const {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		globalError,
		successMessage,
	} = useNameSuggestion({
		onSuccess: () => {
			toast.showSuccess("Name suggestion submitted successfully!");
			setSubmittedPreview({
				name: values.name,
				description: values.description,
			});
		},
	});

	const handleLocalSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleSubmit();
	};

	const handleSelectIdea = (name: string, description: string) => {
		handleChange("name", name);
		handleChange("description", description);
	};

	const handleRandomize = () => {
		const randomArchetype =
			INSPIRATION_ARCHETYPES[Math.floor(Math.random() * INSPIRATION_ARCHETYPES.length)];
		const randomPick =
			randomArchetype.names[Math.floor(Math.random() * randomArchetype.names.length)];
		handleSelectIdea(randomPick.name, randomPick.description);
	};

	const isFormComplete = values.name.trim().length > 0 && values.description.trim().length > 0;

	if (submittedPreview) {
		return (
			<div className="w-full max-w-xl mx-auto rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl shadow-lg">
				<SuggestionSuccessView
					submittedName={submittedPreview.name}
					submittedDescription={submittedPreview.description}
					onSuggestAnother={() => {
						setSubmittedPreview(null);
						reset();
					}}
				/>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleLocalSubmit}
			className="w-full max-w-xl mx-auto rounded-2xl border border-border/50 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-lg space-y-6"
		>
			<div className="text-center space-y-2">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
					<Sparkles size={13} />
					<span>Community Suggestions</span>
				</div>
				<h3 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
					Have a suggestion?
				</h3>
				<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
					Propose an iconic feline name to battle in head-to-head tournament matchups!
				</p>
			</div>

			<ArchetypeBar
				onSelectIdea={handleSelectIdea}
				onRandomize={handleRandomize}
				disabled={isSubmitting}
			/>

			<div className="space-y-4">
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label
							htmlFor="suggest-name"
							className="text-xs font-bold uppercase tracking-wider text-foreground"
						>
							Cat Name
						</label>
						<span className="text-[10px] text-muted-foreground tabular-nums">
							{values.name.length}/50
						</span>
					</div>
					<Input
						id="suggest-name"
						type="text"
						value={values.name}
						onChange={(e) => handleChange("name", e.target.value)}
						onBlur={() => handleBlur("name")}
						placeholder="e.g. Sir Paws-a-lot, Count Whiskula"
						className="h-11 text-sm bg-background/50 focus:bg-background transition-colors"
						disabled={isSubmitting}
						maxLength={50}
						error={touched.name ? errors.name : null}
					/>
				</div>

				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label
							htmlFor="suggest-description"
							className="text-xs font-bold uppercase tracking-wider text-foreground"
						>
							Why this name? (Backstory)
						</label>
						<span className="text-[10px] text-muted-foreground tabular-nums">
							{values.description.length}/500
						</span>
					</div>
					<Textarea
						id="suggest-description"
						value={values.description}
						onChange={(e) => handleChange("description", e.target.value)}
						onBlur={() => handleBlur("description")}
						placeholder="What makes this feline legendary, funny, or iconic?"
						rows={3}
						className="text-sm resize-none bg-background/50 focus:bg-background transition-colors"
						disabled={isSubmitting}
						maxLength={500}
						showCount={false}
						error={touched.description ? errors.description : null}
					/>
				</div>
			</div>

			<ContenderCardPreview name={values.name} description={values.description} />

			<StatusMessage error={globalError} success={successMessage} />

			<Button
				type="submit"
				disabled={!isFormComplete || !isValid || isSubmitting}
				loading={isSubmitting}
				variant="primary"
				size="medium"
				className="w-full h-11 text-sm font-semibold shadow-md"
			>
				{isSubmitting ? "Submitting to Arena..." : "Add to Bracket"}
			</Button>
		</form>
	);
}

// ============================================================================
// MODAL CONTENT
// ============================================================================

function ModalNameSuggestionContent({ onClose }: { onClose: () => void }) {
	const toast = useToast();
	const isMountedRef = useRef(true);
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const nameInputId = useId();
	const descInputId = useId();

	const suggestionData = useNameSuggestion({
		onSuccess: () => {
			toast.showSuccess("Cat name suggestion added to the pool!");
			if (isMountedRef.current) {
				onClose();
			}
		},
	});

	const {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		globalError,
		setGlobalError,
	} = suggestionData;

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		// Small delay to allow the modal portal transition to settle focus cleanly
		const timer = setTimeout(() => {
			nameInputRef.current?.focus();
		}, 60);
		return () => clearTimeout(timer);
	}, []);

	const handleClose = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		reset();
		setGlobalError("");
		onClose();
	}, [isSubmitting, onClose, reset, setGlobalError]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
			e.preventDefault();
			if (isValid && !isSubmitting && values.name.trim() && values.description.trim()) {
				void handleSubmit();
			}
		}
	};

	const handleSelectIdea = (name: string, description: string) => {
		handleChange("name", name);
		handleChange("description", description);
	};

	const handleRandomize = () => {
		const randomArchetype =
			INSPIRATION_ARCHETYPES[Math.floor(Math.random() * INSPIRATION_ARCHETYPES.length)];
		const randomPick =
			randomArchetype.names[Math.floor(Math.random() * randomArchetype.names.length)];
		handleSelectIdea(randomPick.name, randomPick.description);
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void handleSubmit();
			}}
			onKeyDown={handleKeyDown}
			className="flex flex-col gap-4 text-foreground"
		>
			<ArchetypeBar
				onSelectIdea={handleSelectIdea}
				onRandomize={handleRandomize}
				disabled={isSubmitting}
			/>

			<div className="space-y-3.5">
				<div>
					<div className="flex items-center justify-between mb-1">
						<label
							htmlFor={nameInputId}
							className="block text-xs font-bold text-foreground uppercase tracking-wider"
						>
							Cat Name
						</label>
						<span className="text-[10px] text-muted-foreground tabular-nums">
							{values.name.length}/50
						</span>
					</div>
					<Input
						id={nameInputId}
						ref={nameInputRef}
						type="text"
						value={values.name}
						onChange={(e) => {
							handleChange("name", e.target.value);
							if (globalError) {
								setGlobalError("");
							}
						}}
						onBlur={() => handleBlur("name")}
						placeholder="e.g. Barnaby, Count Whiskula"
						maxLength={50}
						disabled={isSubmitting}
						error={touched.name ? errors.name : null}
						className="h-10 text-sm bg-background/50 focus:bg-background transition-colors"
					/>
				</div>

				<div>
					<div className="flex items-center justify-between mb-1">
						<label
							htmlFor={descInputId}
							className="block text-xs font-bold text-foreground uppercase tracking-wider"
						>
							Why this name?
						</label>
						<span className="text-[10px] text-muted-foreground tabular-nums">
							{values.description.length}/500
						</span>
					</div>
					<Textarea
						id={descInputId}
						value={values.description}
						onChange={(e) => {
							handleChange("description", e.target.value);
							if (globalError) {
								setGlobalError("");
							}
						}}
						onBlur={() => handleBlur("description")}
						placeholder="What makes it special, cute, or hilarious?"
						disabled={isSubmitting}
						maxLength={500}
						rows={3}
						error={touched.description ? errors.description : null}
						showCount={false}
						className="text-sm resize-none bg-background/50 focus:bg-background transition-colors"
					/>
				</div>
			</div>

			<ContenderCardPreview name={values.name} description={values.description} />

			<StatusMessage error={globalError} />

			<div className="flex items-center justify-between pt-2 border-t border-border/40">
				<span className="hidden sm:inline-block text-[11px] text-muted-foreground">
					Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">⌘</kbd> +{" "}
					<kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd>
				</span>
				<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
					<Button
						type="button"
						variant="ghost"
						size="medium"
						onClick={handleClose}
						disabled={isSubmitting}
						className="px-4 text-muted-foreground hover:text-foreground transition-all duration-300"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						size="medium"
						disabled={isSubmitting || !isValid || !values.name.trim() || !values.description.trim()}
						loading={isSubmitting}
						className="px-5 font-semibold"
					>
						Submit Suggestion
					</Button>
				</div>
			</div>
		</form>
	);
}

// ============================================================================
// UNIFIED EXPORT
// ============================================================================

export function NameSuggestion({ variant = "inline", onClose }: NameSuggestionProps) {
	const handleClose = onClose ?? (() => undefined);

	if (variant === "modal") {
		return <ModalNameSuggestionContent onClose={handleClose} />;
	}
	return <NameSuggestionInner />;
}
