import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import { namesQueryOptions } from "@/shared/api/names/api";
import { useNameAdminActions } from "@/shared/api/names/hooks/useNameAdminActions";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Lightbox } from "@/shared/components/layout/Lightbox";
import { Modal } from "@/shared/components/layout/Modal";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getRandomCatImage } from "@/shared/lib/media";
import { getLockedNames, getVisibleNames, isNameLocked } from "@/shared/lib/names/nameFilters";
import { addToSet, removeFromSet } from "@/shared/lib/setUtils";
import { SUPABASE_UNAVAILABLE_MSG } from "@/shared/services/supabase/errorUtils";
import type { IdType, NameItem } from "@/shared/types";
import useAppStore from "@/store/appStore";
import { NameCard, type PendingAdminAction } from "./NameCard";

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

	// ⚡ Bolt Optimization: Replace O(N) array mapping and separate loop with a single pass
	// Constructs Maps to enable O(1) lookups during interactions instead of O(N) find/findIndex
	const { catImages, catImageById, namesById, nameIndexById } = useMemo(() => {
		const catImages: string[] = [];
		const catImageById = new Map<IdType, string>();
		const namesById = new Map<IdType, NameItem>();
		const nameIndexById = new Map<IdType, number>();

		for (let i = 0; i < names.length; i++) {
			const nameItem = names[i];
			const img = getRandomCatImage(nameItem.id, CAT_IMAGES);
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
		const currentSelectedIds = new Set(storeSelectedNames.map((n) => n.id));
		const missingLocked = lockedInNames.filter((n) => !currentSelectedIds.has(n.id));
		if (missingLocked.length > 0) {
			tournamentActions.setSelection([...storeSelectedNames, ...missingLocked]);
		}
	}, [names, storeSelectedNames, tournamentActions]);

	const triggerHaptic = useCallback(() => {
		if ("vibrate" in navigator) {
			navigator.vibrate(50);
		}
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
		? `${confirmActionName} will ${isDisablingAction ? "be visible to everyone again." : "be removed from public view."}`
		: `${confirmActionName} will ${isDisablingAction ? "be removed from the locked list." : "stay selected for all users."}`;
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
			<div className="mx-auto w-full">
				<div className="flex items-center justify-center py-20">
					<Loading variant="spinner" text="Loading cat names..." />
				</div>
			</div>
		);
	}

	if (error && !isSupabaseUnavailable) {
		return (
			<div className="mx-auto w-full">
				<div className="flex flex-col items-center justify-center py-20">
					<div className="flex max-w-xl flex-col items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-8 text-center shadow-[0_18px_40px_rgba(2,8,18,0.16)] backdrop-blur-md">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
							Failed to load
						</p>
						<div className="space-y-2">
							<p className="font-display text-2xl leading-[0.96] tracking-[-0.04em] text-white">
								We couldn&apos;t load the current shortlist.
							</p>
							<p className="text-sm leading-relaxed text-white/68">{error}</p>
						</div>
						<div className="flex flex-wrap items-center justify-center gap-3">
							<Button onClick={() => void namesQuery.refetch()} variant="glass" size="small">
								Try Again
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full">
			<div className="space-y-4 sm:space-y-6 mobile-nav-safe-bottom">
				<div className="space-y-8">
					{availableNames.length > 0 && (
						<div className="grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
							{availableNames.map((nameItem) => (
								<NameCard
									key={nameItem.id}
									nameItem={nameItem}
									isSelected={selectedIds.has(nameItem.id)}
									catImage={catImageById.get(nameItem.id) ?? ""}
									prefersReducedMotion={prefersReducedMotion}
									isAdmin={isAdmin}
									isTogglingHidden={togglingHidden.has(nameItem.id)}
									isTogglingLocked={togglingLocked.has(nameItem.id)}
									onToggleName={handleToggleName}
									onOpenLightbox={handleOpenLightbox}
									onRequestAdminAction={requestAdminAction}
								/>
							))}
						</div>
					)}
				</div>
			</div>

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
				<div className="flex flex-col">
					<p className="text-sm text-muted-foreground">{confirmDescription}</p>

					<div className="mt-6 flex items-center justify-end gap-3">
						<Button
							type="button"
							variant="ghost"
							onClick={cancelAdminAction}
							disabled={isPendingActionBusy}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="danger"
							onClick={() => void confirmAdminAction()}
							loading={isPendingActionBusy}
							className="bg-red-600 hover:bg-red-500"
						>
							{confirmLabel}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
