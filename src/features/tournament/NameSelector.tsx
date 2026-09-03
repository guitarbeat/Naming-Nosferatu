import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Eye, EyeOff, Lock, Unlock, ZoomIn } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/Providers";
import { namesQueryOptions, SUPABASE_UNAVAILABLE_MSG, useNameAdminActions } from "@/shared/api";
import { Button, CatImage, Lightbox, Loading, Modal } from "@/shared/components";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getLockedNames, getVisibleNames, isNameHidden, isNameLocked } from "@/shared/lib/names";
import { getRandomCatImage, MOTION_SPRINGS } from "@/shared/lib/uiUtils";
import { addToSet, hapticNavTap, removeFromSet } from "@/shared/lib/utils";
import type { IdType, NameItem } from "@/shared/types";
import useAppStore from "@/store";

export type PendingAdminAction = {
	type: "toggle-hidden" | "toggle-locked";
	nameId: IdType;
	isCurrentlyEnabled: boolean;
};

/**
 * Text and backstory overlay rendered inside each cat name tile.
 */
export const NameContent = memo(function NameContent({ nameItem }: { nameItem: NameItem }) {
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
export const AdminActionButton = memo(function AdminActionButton({
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
// ⚡ Bolt Performance Optimization: Wrapped with React.memo() to prevent unnecessary re-renders
export const SelectionBadge = memo(function SelectionBadge({
	prefersReducedMotion,
}: {
	prefersReducedMotion: boolean;
}) {
	return (
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
});

/**
 * Zoom button for expanding cat avatar into lightbox.
 */
// ⚡ Bolt Performance Optimization: Wrapped with React.memo() to prevent unnecessary re-renders
export const ZoomButton = memo(function ZoomButton({
	nameId,
	onClick,
}: {
	nameId: IdType;
	onClick: (id: IdType) => void;
}) {
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
});

/**
 * Accessible cat name selection and administration grid.
 */
// ⚡ Bolt Performance Optimization: Wrapped with React.memo() to prevent unnecessary re-renders
export const NameSelector = memo(function NameSelector() {
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
										? "border-primary/60 bg-card shadow-md ring-2 ring-primary/40"
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
});
