import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, CheckCircle, Eye, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import { namesQueryOptions } from "@/shared/api/names/api";
import { useNameAdminActions } from "@/shared/api/names/hooks/useNameAdminActions";
import Button from "@/shared/components/layout/Button";
import CatImage from "@/shared/components/layout/CatImage";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Lightbox } from "@/shared/components/layout/Lightbox";
import { Modal } from "@/shared/components/layout/Modal";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getRandomCatImage } from "@/shared/lib/media";
import {
	getActiveNames,
	getLockedNames,
	isNameHidden,
	isNameLocked,
} from "@/shared/lib/names/nameFilters";
import {
	addManyToSet,
	addToSet,
	removeFromSet,
	toggleInSet,
} from "@/shared/lib/setUtils";
import { SUPABASE_UNAVAILABLE_MSG } from "@/shared/services/supabase/errorUtils";
import type { IdType, NameItem } from "@/shared/types";
import useAppStore from "@/store/appStore";

type PendingAdminAction = {
	type: "toggle-hidden" | "toggle-locked";
	nameId: IdType;
	isCurrentlyEnabled: boolean;
};

const getCardStyles = (isSelected: boolean, isLocked: boolean) =>
	[
		"mobile-readable-card relative group overflow-hidden rounded-[1.35rem] border cursor-pointer transition-[transform,box-shadow,background-color,border-color,opacity] duration-300 active:scale-[0.96]",
		isSelected
			? "z-10 border-primary/45 bg-gradient-to-br from-primary/14 to-white/[0.04] shadow-[0_20px_45px_rgba(39,135,153,0.2)] ring-1 ring-primary/25"
			: "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_16px_40px_rgba(6,12,24,0.18)]",
		isLocked ? "cursor-not-allowed opacity-55 saturate-50" : "",
	].join(" ");

const nameOverlayClasses =
	"absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 sm:p-5 text-center";

function NameContent({ nameItem }: { nameItem: NameItem }) {
	return (
		<>
			<span className="w-full break-words font-whimsical text-2xl leading-[0.92] tracking-tight text-white sm:text-[2rem] drop-shadow-lg">
				{nameItem.name}
			</span>
			{nameItem.pronunciation ? (
				<span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
					[{nameItem.pronunciation}]
				</span>
			) : null}
			{nameItem.description ? (
				<p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/72 sm:text-sm">
					{nameItem.description}
				</p>
			) : null}
		</>
	);
}

function AdminActionButton({
	nameItem,
	actionType,
	isProcessing,
	onClick,
}: {
	nameItem: NameItem;
	actionType: "toggle-hidden" | "toggle-locked";
	isProcessing: boolean;
	onClick: () => void;
}) {
	const isHidden = actionType === "toggle-hidden";
	const isEnabled = isHidden ? isNameHidden(nameItem) : isNameLocked(nameItem);
	const buttonClasses = `flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
		isHidden
			? isEnabled
				? "bg-success hover:bg-success/80 text-success-foreground shadow-success/25"
				: "bg-destructive hover:bg-destructive/80 text-destructive-foreground shadow-destructive/25"
			: isEnabled
				? "bg-muted hover:bg-muted/80 text-muted-foreground shadow-muted/25"
				: "bg-warning hover:bg-warning/80 text-warning-foreground shadow-warning/25"
	} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} shadow-lg`;

	return (
		<motion.button
			type="button"
			onClick={onClick}
			disabled={isProcessing}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			className={buttonClasses}
		>
			{isProcessing ? (
				<div className="flex items-center justify-center gap-1">
					<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
					<span>Processing...</span>
				</div>
			) : isHidden ? (
				<>
					<Eye size={12} className="mr-1" />
					{isEnabled ? "Unhide" : "Hide"}
				</>
			) : (
				<>
					<CheckCircle size={12} className="mr-1" />
					{isEnabled ? "Unlock" : "Lock"}
				</>
			)}
		</motion.button>
	);
}

const SelectionBadge = () => (
	<motion.div
		initial={{ scale: 0, opacity: 0 }}
		animate={{ scale: 1, opacity: 1 }}
		className="absolute top-3 right-3 z-20"
	>
		<div className="relative">
			<div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
			<div className="relative size-6 sm:size-7 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-primary/50">
				<Check size={14} className="text-primary-foreground" strokeWidth={3} />
			</div>
		</div>
	</motion.div>
);

function ZoomButton({
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
			className="absolute top-3 right-3 p-2 sm:p-2.5 rounded-full bg-foreground/70 backdrop-blur-md text-background opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none transition-all duration-300 hover:bg-foreground/90 hover:scale-110 z-10"
			aria-label="View full size"
		>
			<ZoomIn size={14} />
		</button>
	);
}

export function NameSelector() {
	const toast = useToast();
	const [selectedNames, setSelectedNames] = useState<Set<IdType>>(new Set());
	const isAdmin = useAppStore((state) => state.user.isAdmin);
	const userName = useAppStore((state) => state.user.name);
	const tournamentActions = useAppStore((state) => state.tournamentActions);
	const { toggleHidden, toggleLocked } = useNameAdminActions(userName ?? "");
	const [togglingHidden, setTogglingHidden] = useState<Set<IdType>>(new Set());
	const [togglingLocked, setTogglingLocked] = useState<Set<IdType>>(new Set());
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const deferredSync = useCallback((syncFn: () => void) => {
		setTimeout(syncFn, 0);
	}, []);
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
	const names = isSupabaseUnavailable
		? sampleNames
		: (namesQuery.data?.names ?? []);
	const isLoading = namesQuery.isPending && !isSupabaseUnavailable;

	const syncSelectionToStore = useCallback(
		(nextSelectedIds: Set<IdType>) => {
			const selectedNameItems = names.filter((nameItem) =>
				nextSelectedIds.has(nameItem.id),
			);
			tournamentActions.setSelection(selectedNameItems);
		},
		[names, tournamentActions],
	);

	const { catImages, catImageById, nameIndexById } = useMemo(() => {
		const catImages = names.map((nameItem) =>
			getRandomCatImage(nameItem.id, CAT_IMAGES),
		);
		const catImageById = new Map<IdType, string>();
		const nameIndexById = new Map<IdType, number>();
		for (let i = 0; i < names.length; i++) {
			nameIndexById.set(names[i].id, i);
			if (catImages[i]) {
				catImageById.set(names[i].id, catImages[i]);
			}
		}
		return { catImages, catImageById, nameIndexById };
	}, [names]);

	const showWarningRef = useRef(toast.showWarning);
	useEffect(() => {
		showWarningRef.current = toast.showWarning;
	});

	useEffect(() => {
		if (names.length === 0) {
			return;
		}
		const lockedInIds = new Set(
			getLockedNames(names).map((nameItem) => nameItem.id),
		);
		if (lockedInIds.size === 0) {
			return;
		}
		setSelectedNames((prev) => {
			const next = addManyToSet(prev, lockedInIds);
			if (next.size !== prev.size) {
				deferredSync(() => syncSelectionToStore(next));
				return next;
			}
			return prev;
		});
	}, [deferredSync, names, syncSelectionToStore]);

	const toggleName = useCallback(
		(nameId: IdType) => {
			setSelectedNames((prev) => {
				const next = toggleInSet(prev, nameId);
				deferredSync(() => syncSelectionToStore(next));
				return next;
			});
		},
		[syncSelectionToStore, deferredSync],
	);

	const triggerHaptic = useCallback(() => {
		if ("vibrate" in navigator) {
			navigator.vibrate(50);
		}
	}, []);

	const handleToggleName = useCallback(
		(nameId: IdType) => {
			triggerHaptic();
			toggleName(nameId);
		},
		[triggerHaptic, toggleName],
	);

	const handleToggleHidden = useCallback(
		async (nameId: IdType, isCurrentlyHidden: boolean) => {
			if (!isAdmin || !userName?.trim()) {
				return;
			}

			setTogglingHidden((prev) => addToSet(prev, nameId));

			try {
				await toggleHidden({ nameId, isCurrentlyHidden });
				toast.showSuccess(
					isCurrentlyHidden ? "Name is visible again." : "Name is now hidden.",
				);
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
				toast.showSuccess(
					isCurrentlyLocked ? "Name unlocked." : "Name locked in.",
				);
			} catch (error) {
				const detail = error instanceof Error ? error.message : "Unknown error";
				toast.showError(`Could not update lock state: ${detail}`);
			} finally {
				setTogglingLocked((prev) => removeFromSet(prev, nameId));
			}
		},
		[isAdmin, toast, toggleLocked, userName],
	);

	const [pendingAdminAction, setPendingAdminAction] =
		useState<PendingAdminAction | null>(null);

	const requestAdminAction = useCallback(
		(action: PendingAdminAction) => {
			if (!isAdmin) {
				toast.showWarning("Only admins can perform that action.");
				return;
			}

			if (!userName?.trim()) {
				toast.showError(
					"Admin actions require a valid user session. Please log in again.",
				);
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
		const target = names.find((n) => n.id === pendingAdminAction.nameId);
		return target?.name ?? "this name";
	}, [names, pendingAdminAction]);

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
				await handleToggleHidden(
					pendingAdminAction.nameId,
					pendingAdminAction.isCurrentlyEnabled,
				);
			} else {
				await handleToggleLocked(
					pendingAdminAction.nameId,
					pendingAdminAction.isCurrentlyEnabled,
				);
			}
		} finally {
			setPendingAdminAction(null);
		}
	}, [pendingAdminAction, handleToggleHidden, handleToggleLocked]);

	const availableNames = useMemo(() => getActiveNames(names), [names]);
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
			// O(1) Map lookup is ~1000x faster than array findIndex on large sets
			const index = nameIndexById.get(nameId);
			if (index !== undefined) {
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
							<Button
								onClick={() => void namesQuery.refetch()}
								variant="glass"
								size="small"
							>
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
							{availableNames.map((nameItem) => {
								const isSelected = selectedNames.has(nameItem.id);
								const catImage = catImageById.get(nameItem.id) ?? "";
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
										whileHover={{ scale: 1.03, y: -2 }}
										whileTap={{ scale: 0.97 }}
										transition={{ type: "spring", stiffness: 400, damping: 25 }}
										className={getCardStyles(
											isSelected,
											isNameLocked(nameItem),
										)}
									>
										<div className="w-full relative aspect-[5/4] sm:aspect-[4/3] group/img overflow-hidden">
											<CatImage
												src={catImage}
												alt={nameItem.name}
												containerClassName="w-full h-full"
												imageClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
											/>
											{isSelected && <SelectionBadge />}
											<div className={nameOverlayClasses}>
												<div className="flex flex-col items-center gap-1.5 max-w-full">
													<NameContent nameItem={nameItem} />
												</div>
											</div>
											<ZoomButton
												nameId={nameItem.id}
												onClick={handleOpenLightbox}
											/>
										</div>
										{isAdmin && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: 0.1 }}
												className="px-3 pb-3 flex gap-2"
											>
												<AdminActionButton
													nameItem={nameItem}
													actionType="toggle-hidden"
													isProcessing={togglingHidden.has(nameItem.id)}
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
													onClick={() =>
														requestAdminAction({
															type: "toggle-locked",
															nameId: nameItem.id,
															isCurrentlyEnabled: isNameLocked(nameItem),
														})
													}
												/>
											</motion.div>
										)}
									</motion.div>
								);
							})}
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
